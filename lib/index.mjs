import { createRequire } from "node:module";
import { X509Certificate, createHash, createPrivateKey, createPublicKey, randomBytes, timingSafeEqual } from "node:crypto";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import z from "@deepseek-ai/schemastery";
import { connect, createServer, isIP } from "node:net";
import { chmod, copyFile, lstat, mkdir, mkdtemp, opendir, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { execFile, spawn } from "node:child_process";
import { createSocket } from "node:dgram";
import { homedir, hostname, networkInterfaces, tmpdir } from "node:os";
import { createServer as createServer$1, request } from "node:http";
import { createServer as createServer$2 } from "node:https";
import { Transform, finished } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { createGzip, gzip } from "node:zlib";
import Bonjour from "bonjour-service";
import * as QRCode from "qrcode";
import { Logger, Service } from "@deepseek-ai/cordis";
import { boundContextSummary, createUserMessage } from "@deepseek-ai/dsh-llm/message";
import { lookup } from "node:dns/promises";
import { createWriteStream } from "node:fs";
import { generate } from "selfsigned";
//#region src/access.ts
/** Stable error categories converted to deliberately terse HTTP responses. */
var AccessError = class extends Error {
	status;
	code;
	constructor(status, code) {
		super(code);
		this.status = status;
		this.code = code;
		this.name = "AccessError";
	}
};
/** Fixed-window limiter whose attacker-controlled key table is itself bounded. */
var BoundedRateLimiter = class {
	limit;
	windowMs;
	maximumKeys;
	buckets = /* @__PURE__ */ new Map();
	constructor(limit, windowMs, maximumKeys) {
		this.limit = limit;
		this.windowMs = windowMs;
		this.maximumKeys = maximumKeys;
	}
	/** Consume one attempt; unknown keys fail closed when the bounded table is full. */
	take(key, now) {
		for (const [candidate, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(candidate);
		const current = this.buckets.get(key);
		if (current === void 0) {
			if (this.buckets.size >= this.maximumKeys) return false;
			this.buckets.set(key, {
				count: 1,
				resetAt: now + this.windowMs
			});
			return true;
		}
		if (current.count >= this.limit) return false;
		current.count += 1;
		return true;
	}
	/** Current table size, exposed for bounded-state assertions. */
	get size() {
		return this.buckets.size;
	}
};
function opaqueToken() {
	return randomBytes(32).toString("base64url");
}
function digest(value) {
	return createHash("sha256").update(value, "utf8").digest();
}
function digestHex(value) {
	return digest(value).toString("hex");
}
function matchesDigest(value, expected) {
	return timingSafeEqual(digest(value), expected);
}
function normalizeLabel(value) {
	const label = (value ?? "Mobile device").normalize("NFC").trim();
	if (label.length < 1 || label.length > 64 || /[\u0000-\u001f\u007f]/u.test(label)) throw new AccessError(400, "invalid_request");
	return label;
}
function publicDevice(device) {
	return Object.freeze({
		id: device.id,
		label: device.label,
		createdAt: device.createdAt,
		expiresAt: device.expiresAt,
		lastSeenAt: device.lastSeenAt,
		...device.revokedAt === void 0 ? {} : { revokedAt: device.revokedAt }
	});
}
/** Pairing, persistent-device, short-Session, revocation, and CSRF state machine. */
var AccessController = class {
	store;
	options;
	now;
	pairLimiter;
	devices = [];
	pairingWindow;
	sessions = /* @__PURE__ */ new Map();
	sessionEndedListeners = /* @__PURE__ */ new Set();
	mutation = Promise.resolve();
	initialized = false;
	closing = false;
	closeTask;
	constructor(store, options) {
		this.store = store;
		this.options = options;
		this.now = options.now ?? Date.now;
		this.pairLimiter = new BoundedRateLimiter(options.maxPairingAttempts, options.rateLimitWindowMs, options.maxRateLimitKeys);
	}
	/** Load and validate digest-only durable state before accepting traffic. */
	async initialize() {
		if (this.initialized || this.closing) throw new Error("access controller cannot be initialized again");
		const snapshot = await this.store.load();
		if (snapshot.devices.length > this.options.maxDevices) throw new Error("device state exceeds configured maxDevices");
		this.devices = [...snapshot.devices];
		this.initialized = true;
	}
	requireInitialized() {
		if (!this.initialized || this.closing) throw new Error("access controller is not available");
	}
	async exclusive(operation) {
		const prior = this.mutation;
		let release;
		this.mutation = new Promise((resolve) => {
			release = resolve;
		});
		await prior;
		try {
			return await operation();
		} finally {
			release();
		}
	}
	snapshot(devices) {
		return Object.freeze({
			version: 1,
			devices: Object.freeze([...devices])
		});
	}
	emitSessionEnded(session) {
		const authorization = Object.freeze({
			sessionKey: session.key,
			deviceId: session.deviceId,
			expiresAt: session.expiresAt
		});
		for (const listener of this.sessionEndedListeners) listener(authorization);
	}
	removeSession(key) {
		const session = this.sessions.get(key);
		if (session === void 0) return;
		this.sessions.delete(key);
		this.emitSessionEnded(session);
	}
	pruneSessions(now) {
		for (const [key, session] of this.sessions) if (session.expiresAt <= now) this.removeSession(key);
	}
	createSession(deviceId, now, deviceExpiresAt) {
		this.pruneSessions(now);
		if (this.sessions.size >= this.options.maxSessions) {
			const oldest = [...this.sessions.values()].sort((left, right) => left.createdAt - right.createdAt)[0];
			if (oldest !== void 0) this.removeSession(oldest.key);
		}
		const sessionToken = opaqueToken();
		const csrfToken = opaqueToken();
		const key = digestHex(sessionToken);
		const record = Object.freeze({
			key,
			deviceId,
			csrfDigest: digest(csrfToken),
			createdAt: now,
			expiresAt: Math.min(now + this.options.sessionTtlMs, deviceExpiresAt)
		});
		this.sessions.set(key, record);
		return Object.freeze({
			deviceId,
			sessionToken,
			csrfToken,
			sessionExpiresAt: record.expiresAt
		});
	}
	/** Open one short pairing window and return its one-time secret to a loopback caller only. */
	async openPairing(requestedTtlMs) {
		this.requireInitialized();
		return this.exclusive(async () => {
			const ttl = requestedTtlMs ?? this.options.pairingTtlMs;
			if (!Number.isSafeInteger(ttl) || ttl < 1e4 || ttl > this.options.pairingTtlMs) throw new AccessError(400, "invalid_request");
			const token = opaqueToken();
			const expiresAt = this.now() + ttl;
			this.pairingWindow = Object.freeze({
				digest: digest(token),
				expiresAt
			});
			return Object.freeze({
				token,
				expiresAt
			});
		});
	}
	/** Consume the pairing window exactly once and persist only the device-token digest. */
	async pair(sourceKey, token, label) {
		this.requireInitialized();
		const now = this.now();
		if (!this.pairLimiter.take(sourceKey, now)) throw new AccessError(429, "rate_limited");
		if (token.length > 512) throw new AccessError(401, "authentication_failed");
		return this.exclusive(async () => {
			const window = this.pairingWindow;
			if (window === void 0 || window.expiresAt <= now || !matchesDigest(token, window.digest)) {
				if (window !== void 0 && window.expiresAt <= now) this.pairingWindow = void 0;
				throw new AccessError(401, "authentication_failed");
			}
			this.pairingWindow = void 0;
			if (this.devices.filter((device) => device.revokedAt === void 0 && device.expiresAt > now).length >= this.options.maxDevices) throw new AccessError(409, "device_limit");
			const deviceToken = opaqueToken();
			const device = Object.freeze({
				id: randomBytes(16).toString("hex"),
				label: normalizeLabel(label),
				tokenDigest: digestHex(deviceToken),
				createdAt: now,
				expiresAt: now + this.options.deviceTtlMs,
				lastSeenAt: now
			});
			const next = [...this.devices.filter((candidate) => candidate.revokedAt === void 0 && candidate.expiresAt > now), device];
			await this.store.save(this.snapshot(next));
			this.devices = next;
			const session = this.createSession(device.id, now, device.expiresAt);
			return Object.freeze({
				...session,
				deviceToken,
				deviceExpiresAt: device.expiresAt
			});
		});
	}
	/** Exchange a valid persistent device credential for a new short Session. */
	async renew(deviceToken) {
		this.requireInitialized();
		if (deviceToken.length > 512) throw new AccessError(401, "authentication_failed");
		return this.exclusive(async () => {
			const now = this.now();
			const tokenDigest = digest(deviceToken);
			const index = this.devices.findIndex((device) => timingSafeEqual(Buffer.from(device.tokenDigest, "hex"), tokenDigest));
			const device = this.devices[index];
			if (device === void 0 || device.revokedAt !== void 0 || device.expiresAt <= now) throw new AccessError(401, "authentication_failed");
			const updated = Object.freeze({
				...device,
				lastSeenAt: now
			});
			const next = [...this.devices];
			next[index] = updated;
			await this.store.save(this.snapshot(next));
			this.devices = next;
			return this.createSession(device.id, now, device.expiresAt);
		});
	}
	/** Resolve a short Session Cookie without revealing whether device or Session failed. */
	authorizeSession(sessionToken) {
		this.requireInitialized();
		if (sessionToken.length > 512) throw new AccessError(401, "authentication_failed");
		const now = this.now();
		this.pruneSessions(now);
		const key = digestHex(sessionToken);
		const session = this.sessions.get(key);
		const device = session === void 0 ? void 0 : this.devices.find((candidate) => candidate.id === session.deviceId);
		if (session === void 0 || device === void 0 || device.revokedAt !== void 0 || device.expiresAt <= now) {
			if (session !== void 0) this.removeSession(session.key);
			throw new AccessError(401, "authentication_failed");
		}
		return Object.freeze({
			sessionKey: key,
			deviceId: session.deviceId,
			expiresAt: session.expiresAt
		});
	}
	/** Require the Session-bound anti-CSRF value for an authenticated mutation. */
	assertCsrf(authorization, csrfToken) {
		const session = this.sessions.get(authorization.sessionKey);
		if (session === void 0 || csrfToken === void 0 || csrfToken.length > 512 || !matchesDigest(csrfToken, session.csrfDigest)) throw new AccessError(403, "forbidden");
	}
	/** End one short Session and notify the gateway to abort its attached work. */
	logout(authorization) {
		this.removeSession(authorization.sessionKey);
	}
	/** Persist revocation, then end every Session owned by that device. */
	async revokeDevice(deviceId) {
		this.requireInitialized();
		return this.exclusive(async () => {
			const index = this.devices.findIndex((device) => device.id === deviceId);
			const device = this.devices[index];
			if (device === void 0 || device.revokedAt !== void 0) return false;
			const next = [...this.devices];
			next[index] = Object.freeze({
				...device,
				revokedAt: this.now()
			});
			await this.store.save(this.snapshot(next));
			this.devices = next;
			for (const [key, session] of this.sessions) if (session.deviceId === deviceId) this.removeSession(key);
			return true;
		});
	}
	/** Remove every persistent credential and terminate every active Session. */
	async resetDevices() {
		this.requireInitialized();
		await this.exclusive(async () => {
			await this.store.save(this.snapshot([]));
			this.devices = [];
			for (const key of [...this.sessions.keys()]) this.removeSession(key);
			this.pairingWindow = void 0;
		});
	}
	/** Safe metadata for the loopback administration surface. */
	listDevices() {
		this.requireInitialized();
		return Object.freeze(this.devices.map(publicDevice));
	}
	/** Pairing status without exposing the one-time secret. */
	pairingStatus() {
		this.requireInitialized();
		const window = this.pairingWindow;
		if (window === void 0 || window.expiresAt <= this.now()) {
			this.pairingWindow = void 0;
			return Object.freeze({ open: false });
		}
		return Object.freeze({
			open: true,
			expiresAt: window.expiresAt
		});
	}
	/** Subscribe gateway resources to Session logout, expiry, eviction, and device revocation. */
	onSessionEnded(listener) {
		this.sessionEndedListeners.add(listener);
		return () => {
			this.sessionEndedListeners.delete(listener);
		};
	}
	/** Stop new operations, drain durable mutations, then clear volatile credentials. */
	close() {
		if (this.closeTask !== void 0) return this.closeTask;
		this.closing = true;
		this.closeTask = this.finishClose();
		return this.closeTask;
	}
	async finishClose() {
		await this.mutation;
		this.pairingWindow = void 0;
		for (const key of [...this.sessions.keys()]) this.removeSession(key);
		this.sessionEndedListeners.clear();
		this.initialized = false;
	}
	/** Bounded volatile-state metrics for tests and local status. */
	metrics() {
		return Object.freeze({
			sessions: this.sessions.size,
			rateLimitKeys: this.pairLimiter.size
		});
	}
};
//#endregion
//#region src/network.ts
function parseIpv4(address) {
	const parts = address.split(".");
	if (parts.length !== 4) throw new Error(`invalid IPv4 address ${JSON.stringify(address)}`);
	let value = 0n;
	for (const part of parts) {
		if (!/^\d{1,3}$/u.test(part)) throw new Error(`invalid IPv4 address ${JSON.stringify(address)}`);
		const octet = Number(part);
		if (octet > 255) throw new Error(`invalid IPv4 address ${JSON.stringify(address)}`);
		value = value << 8n | BigInt(octet);
	}
	return value;
}
function parseIpv6Part(part, address) {
	if (part.includes(".")) {
		const ipv4 = parseIpv4(part);
		return [Number(ipv4 >> 16n & 65535n), Number(ipv4 & 65535n)];
	}
	if (!/^[\da-f]{1,4}$/iu.test(part)) throw new Error(`invalid IPv6 address ${JSON.stringify(address)}`);
	return [Number.parseInt(part, 16)];
}
function parseIpv6(address) {
	const withoutZone = address.split("%", 1)[0] ?? address;
	if (withoutZone.split("::").length > 2) throw new Error(`invalid IPv6 address ${JSON.stringify(address)}`);
	const [leftText, rightText] = withoutZone.split("::");
	const left = leftText === "" ? [] : leftText.split(":").flatMap((part) => parseIpv6Part(part, address));
	const right = rightText === void 0 || rightText === "" ? [] : rightText.split(":").flatMap((part) => parseIpv6Part(part, address));
	const omitted = 8 - left.length - right.length;
	if (rightText === void 0 ? omitted !== 0 : omitted < 1) throw new Error(`invalid IPv6 address ${JSON.stringify(address)}`);
	const groups = [
		...left,
		...Array.from({ length: omitted }, () => 0),
		...right
	];
	if (groups.length !== 8) throw new Error(`invalid IPv6 address ${JSON.stringify(address)}`);
	return groups.reduce((value, group) => value << 16n | BigInt(group), 0n);
}
function mappedIpv4(address) {
	return /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/iu.exec(address)?.[1];
}
function parseIp(address) {
	const unwrapped = address.startsWith("[") && address.endsWith("]") ? address.slice(1, -1) : address;
	const mapped = mappedIpv4(unwrapped);
	if (mapped !== void 0) return {
		bits: 32,
		value: parseIpv4(mapped)
	};
	const version = isIP(unwrapped.split("%", 1)[0] ?? unwrapped);
	if (version === 4) return {
		bits: 32,
		value: parseIpv4(unwrapped)
	};
	if (version === 6) return {
		bits: 128,
		value: parseIpv6(unwrapped)
	};
	throw new Error(`invalid IP address ${JSON.stringify(address)}`);
}
/** Parse and canonicalize one IPv4 or IPv6 CIDR. */
function parseCidr(source) {
	const slash = source.lastIndexOf("/");
	if (slash <= 0 || slash === source.length - 1) throw new Error(`invalid CIDR ${JSON.stringify(source)}`);
	const parsed = parseIp(source.slice(0, slash));
	const prefixText = source.slice(slash + 1);
	if (!/^\d{1,3}$/u.test(prefixText)) throw new Error(`invalid CIDR ${JSON.stringify(source)}`);
	const prefix = Number(prefixText);
	if (prefix > parsed.bits) throw new Error(`invalid CIDR ${JSON.stringify(source)}`);
	const hostBits = BigInt(parsed.bits - prefix);
	const mask = hostBits === BigInt(parsed.bits) ? 0n : (1n << BigInt(parsed.bits)) - 1n ^ (1n << hostBits) - 1n;
	const network = parsed.value & mask;
	if (network !== parsed.value) throw new Error(`CIDR ${JSON.stringify(source)} has host bits set`);
	return Object.freeze({
		bits: parsed.bits,
		network,
		prefix,
		source
	});
}
/** Whether a directly connected socket address belongs to at least one allowed CIDR. */
function addressAllowed(address, cidrs) {
	if (address === void 0) return false;
	let parsed;
	try {
		parsed = parseIp(address);
	} catch {
		return false;
	}
	return cidrs.some((cidr) => {
		if (cidr.bits !== parsed.bits) return false;
		const hostBits = BigInt(cidr.bits - cidr.prefix);
		const mask = hostBits === BigInt(cidr.bits) ? 0n : (1n << BigInt(cidr.bits)) - 1n ^ (1n << hostBits) - 1n;
		return (parsed.value & mask) === cidr.network;
	});
}
/** Whether an IP literal is loopback and therefore eligible for HTTP-only development. */
function isLoopbackAddress(address) {
	try {
		const parsed = parseIp(address);
		if (parsed.bits === 32) return parsed.value >> 24n === 127n;
		return parsed.value === 1n;
	} catch {
		return false;
	}
}
/**
* IPv4 ranges that are never a public VPS endpoint (IANA special-purpose,
* private, shared, loopback, link-local, documentation, benchmark, multicast,
* and reserved space). Kept in sync with Android `RemoteHostPolicy`.
*/
const NON_ROUTABLE_IPV4_RANGES = Object.freeze([
	[0n, 8],
	[167772160n, 8],
	[1681915904n, 10],
	[2130706432n, 8],
	[2851995648n, 16],
	[2886729728n, 12],
	[3221225472n, 24],
	[3221225984n, 24],
	[3223307264n, 24],
	[3224682752n, 24],
	[3227017984n, 24],
	[3232235520n, 16],
	[3232706560n, 24],
	[3323068416n, 15],
	[3325256704n, 24],
	[3405803776n, 24],
	[3758096384n, 4],
	[4026531840n, 4]
]);
function parseStrictIpv4Octets(address) {
	const parts = address.split(".");
	if (parts.length !== 4) return void 0;
	const octets = [];
	for (const part of parts) {
		if (!/^(?:0|[1-9][0-9]{0,2})$/u.test(part)) return void 0;
		const octet = Number(part);
		if (octet > 255) return void 0;
		octets.push(octet);
	}
	return octets;
}
/**
* Whether a dotted-quad IPv4 literal is globally routable and therefore usable
* as a public VPS / remote HTTPS endpoint. Rejects documentation addresses such
* as 203.0.113.10 alongside private, shared, and reserved space.
*/
function isGloballyRoutableIpv4(address) {
	const octets = parseStrictIpv4Octets(address);
	if (octets === void 0) return false;
	const value = BigInt(octets[0]) << 24n | BigInt(octets[1]) << 16n | BigInt(octets[2]) << 8n | BigInt(octets[3]);
	return !NON_ROUTABLE_IPV4_RANGES.some(([network, prefix]) => {
		if (prefix === 0) return true;
		const hostBits = BigInt(32 - prefix);
		const mask = (1n << 32n) - 1n ^ (1n << hostBits) - 1n;
		return (value & mask) === network;
	});
}
/** Parse a bare host or host:port authority without accepting URL components. */
function parseAuthority(source) {
	if (source.trim() !== source || source.length === 0 || /[/?#@\\]/u.test(source)) throw new Error(`invalid public authority ${JSON.stringify(source)}`);
	let url;
	try {
		url = new URL(`https://${source}`);
	} catch {
		throw new Error(`invalid public authority ${JSON.stringify(source)}`);
	}
	if (url.username !== "" || url.password !== "" || url.pathname !== "/" || url.search !== "" || url.hash !== "") throw new Error(`invalid public authority ${JSON.stringify(source)}`);
	const explicitPort = /\]:\d+$/u.test(source) || !source.startsWith("[") && /:\d+$/u.test(source);
	const hostname = url.hostname.toLowerCase();
	const port = explicitPort ? Number(url.port === "" ? 443 : url.port) : void 0;
	if (port !== void 0 && (!Number.isInteger(port) || port < 1 || port > 65535)) throw new Error(`invalid public authority ${JSON.stringify(source)}`);
	return port === void 0 ? Object.freeze({ hostname }) : Object.freeze({
		hostname,
		port
	});
}
function formatHostname(hostname) {
	return hostname.includes(":") && !hostname.startsWith("[") ? `[${hostname}]` : hostname;
}
/** Resolve an authority against the actual listener port. */
function resolveAuthority(spec, listenerPort) {
	return `${formatHostname(spec.hostname)}:${String(spec.port ?? listenerPort)}`;
}
/** Exact Host/Origin/CIDR policy for the directly exposed listener. */
var RequestTrustPolicy = class {
	cidrs;
	authorities;
	origins;
	scheme;
	constructor(specs, listenerPort, cidrs, tls) {
		this.cidrs = cidrs;
		this.scheme = tls ? "https" : "http";
		this.authorities = new Set(specs.map((spec) => resolveAuthority(spec, listenerPort).toLowerCase()));
		this.origins = new Set([...this.authorities].map((authority) => new URL(`${this.scheme}://${authority}`).origin.toLowerCase()));
	}
	/** Validate the exact Host header after WHATWG authority normalization. */
	acceptsHost(header) {
		return this.canonicalHost(header) !== void 0;
	}
	/** Return the canonical accepted Host authority, otherwise undefined. */
	canonicalHost(header) {
		if (header === void 0 || /[/?#@\\]/u.test(header)) return void 0;
		let normalized;
		try {
			const parsed = new URL(`${this.scheme}://${header}`);
			if (parsed.pathname !== "/" || parsed.username !== "" || parsed.password !== "") return void 0;
			normalized = resolveAuthority({
				hostname: parsed.hostname,
				port: Number(parsed.port || (this.scheme === "https" ? "443" : "80"))
			}, 80).toLowerCase();
		} catch {
			return;
		}
		return this.authorities.has(normalized) ? normalized : void 0;
	}
	/** Validate an exact same-scheme browser Origin. */
	acceptsOrigin(header) {
		return this.canonicalOrigin(header) !== void 0;
	}
	/** Return the canonical accepted Origin, otherwise undefined. */
	canonicalOrigin(header) {
		if (header === void 0) return void 0;
		let normalized;
		for (const part of header.split(",")) {
			const trimmed = part.trim();
			if (trimmed === "undefined") continue;
			let candidate;
			try {
				const parsed = new URL(trimmed);
				if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "" || parsed.username !== "" || parsed.password !== "") return;
				candidate = parsed.origin.toLowerCase();
			} catch {
				return;
			}
			if (!this.origins.has(candidate) || normalized !== void 0) return void 0;
			normalized = candidate;
		}
		return normalized;
	}
};
//#endregion
//#region src/config.ts
/** Loader-facing defaults; {@link parseGatewayConfig} enforces cross-field security rules. */
const Config = z.object({
	setupFile: z.string().hidden(),
	publicOrigin: z.string(),
	listenHost: z.string(),
	listenPort: z.natural().max(65535),
	upstreamOrigin: z.string(),
	publicAuthorities: z.array(String).default(void 0),
	allowedCidrs: z.array(String).default(void 0),
	stateFile: String,
	controlFile: z.string().hidden().required(),
	customCssFile: z.string().hidden(),
	customScriptFile: z.string().hidden(),
	mobileLayoutFile: z.string().hidden(),
	instanceId: z.string().hidden(),
	pairingCaFile: z.string().hidden(),
	initiallyEnabled: z.boolean().hidden().required(),
	tls: z.object({
		mode: z.union([z.const("provided"), z.const("disabled")]),
		certFile: z.string(),
		keyFile: z.string(),
		caFile: z.string()
	}),
	pairingTtlMs: z.natural(),
	deviceTtlMs: z.natural(),
	sessionTtlMs: z.natural(),
	maxDevices: z.natural(),
	maxSessions: z.natural(),
	maxConnections: z.natural(),
	maxActiveRequests: z.natural(),
	maxWebSockets: z.natural(),
	maxBodyBytes: z.natural(),
	upstreamTimeoutMs: z.natural(),
	rateLimitWindowMs: z.natural(),
	maxPairingAttempts: z.natural(),
	maxRateLimitKeys: z.natural()
});
function integer(value, name, fallback, minimum, maximum) {
	const resolved = value ?? fallback;
	if (typeof resolved !== "number" || !Number.isSafeInteger(resolved) || resolved < minimum || resolved > maximum) throw new Error(`${name} must be an integer from ${String(minimum)} through ${String(maximum)}`);
	return resolved;
}
function stringArray(value, name) {
	if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string")) throw new Error(`${name} must be a non-empty string array`);
	return value;
}
function absoluteFile(value, name) {
	if (typeof value !== "string" || value.length === 0 || !isAbsolute(value)) throw new Error(`${name} must be an absolute file path`);
	return resolve(value);
}
/** Resolve the hidden runtime-control file independently from gateway configuration. */
function parseControlFile(value) {
	return absoluteFile(value, "controlFile");
}
function parseUpstream(value) {
	const source = value ?? "http://127.0.0.1:3080";
	if (typeof source !== "string") throw new Error("upstreamOrigin must be a string");
	let url;
	try {
		url = new URL(source);
	} catch {
		throw new Error("upstreamOrigin must be an HTTP loopback origin");
	}
	if (url.protocol !== "http:" || !isLoopbackAddress(url.hostname) || url.username !== "" || url.password !== "" || url.pathname !== "/" || url.search !== "" || url.hash !== "" || url.port === "") throw new Error("upstreamOrigin must be an HTTP loopback origin with an explicit port and no path or credentials");
	return url;
}
function parsePublicOrigin$1(value) {
	if (value === void 0) return void 0;
	if (typeof value !== "string" || value.length === 0 || value.trim() !== value) throw new Error("publicOrigin must be an HTTPS origin");
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error("publicOrigin must be an HTTPS origin");
	}
	if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.pathname !== "/" || url.search !== "" || url.hash !== "") throw new Error("publicOrigin must be an HTTPS origin with no path or credentials");
	if (url.hostname === "0.0.0.0" || url.hostname === "[::]") throw new Error("publicOrigin must name a reachable host");
	return Object.freeze({
		authority: parseAuthority(url.host),
		port: Number(url.port || "443")
	});
}
function parseTls(value, listenHost) {
	const mode = value?.mode ?? "provided";
	if (mode === "disabled") {
		if (!isLoopbackAddress(listenHost)) throw new Error("TLS may be disabled only on an IP loopback listener");
		return Object.freeze({ mode });
	}
	return Object.freeze({
		mode,
		certFile: absoluteFile(value?.certFile, "tls.certFile"),
		keyFile: absoluteFile(value?.keyFile, "tls.keyFile"),
		...value?.caFile === void 0 ? {} : { caFile: absoluteFile(value.caFile, "tls.caFile") }
	});
}
/** Parse configuration and reject unsafe topology, credential, and resource combinations. */
function parseGatewayConfig(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error("mobile-access config must be an object");
	const value = raw;
	const publicOrigin = parsePublicOrigin$1(value.publicOrigin);
	if (publicOrigin !== void 0 && value.listenPort !== void 0) throw new Error("publicOrigin cannot be combined with listenPort");
	if (publicOrigin !== void 0 && value.publicAuthorities !== void 0) throw new Error("publicOrigin cannot be combined with publicAuthorities");
	const listenHost = value.listenHost ?? (publicOrigin === void 0 ? "127.0.0.1" : "0.0.0.0");
	if (isIP(listenHost) === 0) throw new Error("listenHost must be an IP literal");
	const listenPort = publicOrigin?.port ?? integer(value.listenPort, "listenPort", 3443, 0, 65535);
	const upstreamOrigin = parseUpstream(value.upstreamOrigin);
	const tls = parseTls(value.tls, listenHost);
	if (publicOrigin !== void 0 && tls.mode !== "provided") throw new Error("publicOrigin requires TLS");
	let authorities;
	if (publicOrigin !== void 0) authorities = [publicOrigin.authority];
	else {
		let authoritySources = value.publicAuthorities;
		if (authoritySources === void 0 || authoritySources.length === 0) {
			if (!isLoopbackAddress(listenHost)) throw new Error("publicAuthorities is required for a non-loopback listener");
			authoritySources = [listenHost];
		}
		authorities = authoritySources.map(parseAuthority);
	}
	for (const authority of authorities) {
		if (listenPort === 0 && authority.port !== void 0) throw new Error("explicit public authority ports require a non-zero listenPort");
		if (authority.port !== void 0 && listenPort !== 0 && authority.port !== listenPort) throw new Error("every explicit public authority port must equal listenPort");
	}
	if (new Set(authorities.map((entry) => `${entry.hostname}:${String(entry.port ?? listenPort)}`)).size !== authorities.length) throw new Error("publicAuthorities must not contain duplicates");
	const allowedCidrs = stringArray(value.allowedCidrs ?? (isLoopbackAddress(listenHost) ? ["127.0.0.0/8", "::1/128"] : void 0), "allowedCidrs").map(parseCidr);
	if (new Set(allowedCidrs.map((entry) => `${String(entry.bits)}:${entry.network.toString(16)}:${String(entry.prefix)}`)).size !== allowedCidrs.length) throw new Error("allowedCidrs must not contain duplicates");
	const deviceTtlMs = integer(value.deviceTtlMs, "deviceTtlMs", 7776e6, 6e4, 316224e5);
	const sessionTtlMs = integer(value.sessionTtlMs, "sessionTtlMs", 288e5, 3e4, 864e5);
	if (sessionTtlMs > deviceTtlMs) throw new Error("sessionTtlMs must not exceed deviceTtlMs");
	return Object.freeze({
		listenHost,
		listenPort,
		upstreamOrigin,
		authorities: Object.freeze(authorities),
		allowedCidrs: Object.freeze(allowedCidrs),
		stateFile: absoluteFile(value.stateFile, "stateFile"),
		extensionsDir: join(dirname(absoluteFile(value.stateFile, "stateFile")), "extensions"),
		customCssFile: value.customCssFile === void 0 ? join(dirname(absoluteFile(value.stateFile, "stateFile")), "mobile.css") : absoluteFile(value.customCssFile, "customCssFile"),
		customScriptFile: value.customScriptFile === void 0 ? join(dirname(absoluteFile(value.stateFile, "stateFile")), "mobile.js") : absoluteFile(value.customScriptFile, "customScriptFile"),
		mobileLayoutFile: value.mobileLayoutFile === void 0 ? fileURLToPath(new URL("./mobile-layout.js", import.meta.url)) : absoluteFile(value.mobileLayoutFile, "mobileLayoutFile"),
		instanceId: value.instanceId === void 0 ? createHash("sha256").update(absoluteFile(value.stateFile, "stateFile")).digest("hex") : /^[a-f\d]{64}$/u.test(value.instanceId) ? value.instanceId : (() => {
			throw new Error("instanceId must be a lowercase SHA-256 value");
		})(),
		...value.pairingCaFile === void 0 ? {} : { pairingCaFile: absoluteFile(value.pairingCaFile, "pairingCaFile") },
		tls,
		publicTls: tls.mode === "provided",
		discovery: true,
		pairingTtlMs: integer(value.pairingTtlMs, "pairingTtlMs", 12e4, 1e4, 6e5),
		deviceTtlMs,
		sessionTtlMs,
		maxDevices: integer(value.maxDevices, "maxDevices", 32, 1, 256),
		maxSessions: integer(value.maxSessions, "maxSessions", 64, 1, 1024),
		maxConnections: integer(value.maxConnections, "maxConnections", 64, 1, 1024),
		maxActiveRequests: integer(value.maxActiveRequests, "maxActiveRequests", 32, 1, 1024),
		maxWebSockets: integer(value.maxWebSockets, "maxWebSockets", 16, 1, 256),
		maxBodyBytes: integer(value.maxBodyBytes, "maxBodyBytes", 167772160, 1024, 268435456),
		upstreamTimeoutMs: integer(value.upstreamTimeoutMs, "upstreamTimeoutMs", 3e4, 1e3, 3e5),
		rateLimitWindowMs: integer(value.rateLimitWindowMs, "rateLimitWindowMs", 6e4, 1e3, 36e5),
		maxPairingAttempts: integer(value.maxPairingAttempts, "maxPairingAttempts", 8, 1, 100),
		maxRateLimitKeys: integer(value.maxRateLimitKeys, "maxRateLimitKeys", 256, 1, 4096)
	});
}
//#endregion
//#region src/exec-file.ts
/** Capture both output streams even when a desktop host wraps execFile without Node's promisify metadata. */
function execFileText(file, args, options = {}) {
	return new Promise((resolve, reject) => {
		execFile(file, [...args], {
			windowsHide: true,
			...options,
			encoding: "utf8"
		}, (error, stdout, stderr) => {
			if (error !== null) {
				reject(error);
				return;
			}
			if (typeof stdout !== "string" || typeof stderr !== "string") {
				reject(/* @__PURE__ */ new Error("subprocess returned invalid text output"));
				return;
			}
			resolve({
				stdout,
				stderr
			});
		});
	});
}
//#endregion
//#region src/private-file.ts
let userSidTask;
async function currentWindowsUserSid() {
	userSidTask ??= execFileText("whoami.exe", [
		"/user",
		"/fo",
		"csv",
		"/nh"
	], {
		encoding: "utf8",
		windowsHide: true,
		timeout: 1e4
	}).then(({ stdout }) => {
		const match = /,"(S-\d(?:-\d+)+)"\s*$/u.exec(stdout.trim());
		if (match?.[1] === void 0) throw new Error("unable to resolve the current Windows user SID");
		return match[1];
	}).catch((error) => {
		userSidTask = void 0;
		throw error;
	});
	return userSidTask;
}
/** Restrict a sensitive regular file to the current user and Windows administrators. */
async function restrictPrivateFile(file, mode = 384) {
	await chmod(file, mode);
	if (process.platform !== "win32") return;
	await execFileText("icacls.exe", [
		file,
		"/inheritance:r",
		"/grant:r",
		`*${await currentWindowsUserSid()}:(F)`,
		"*S-1-5-18:(F)",
		"*S-1-5-32-544:(F)",
		"/remove:g",
		"*S-1-1-0",
		"*S-1-5-11",
		"*S-1-5-32-545"
	], {
		encoding: "utf8",
		windowsHide: true,
		timeout: 1e4
	});
}
//#endregion
//#region src/control.ts
/** Keeps one runtime aligned with a changing network selection. */
var FollowingMobileAccessRuntime = class {
	select;
	onRefreshError;
	runtime;
	key;
	queue = Promise.resolve();
	closed = false;
	timer;
	constructor(select, onRefreshError) {
		this.select = select;
		this.onRefreshError = onRefreshError;
	}
	/** Start the current selection and optionally poll for later changes. */
	async initialize(refreshIntervalMs) {
		await this.refresh();
		if (refreshIntervalMs === void 0) return;
		this.timer = setInterval(() => {
			this.refresh().catch(this.onRefreshError);
		}, refreshIntervalMs);
		this.timer.unref();
	}
	/** Reconcile the active runtime with the latest selection. */
	refresh() {
		return this.enqueue(async () => {
			if (this.closed) return;
			const selection = await this.select();
			if (this.closed || this.runtime !== void 0 && this.key === selection.key) return;
			const previous = this.runtime;
			this.runtime = void 0;
			this.key = void 0;
			if (previous !== void 0) await previous.close();
			this.runtime = await selection.start();
			this.key = selection.key;
		});
	}
	/** Stop polling and close the most recently selected runtime. */
	close() {
		if (this.closed) return this.queue;
		this.closed = true;
		if (this.timer !== void 0) clearInterval(this.timer);
		return this.enqueue(async () => {
			const runtime = this.runtime;
			this.runtime = void 0;
			this.key = void 0;
			if (runtime !== void 0) await runtime.close();
		});
	}
	enqueue(operation) {
		const run = this.queue.then(operation, operation);
		this.queue = run.then(() => {}, () => {});
		return run;
	}
};
/** Validate control state loaded across the filesystem boundary. */
function parseMobileAccessControlState(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("mobile-access control state must be an object");
	const record = value;
	if (record.version !== 1 || typeof record.enabled !== "boolean" || Reflect.ownKeys(record).some((key) => key !== "version" && key !== "enabled")) throw new Error("mobile-access control state has an unsupported format");
	return Object.freeze({
		version: 1,
		enabled: record.enabled
	});
}
/** Atomic JSON store whose absent-file state comes from the installation-time default. */
var JsonMobileAccessControlStore = class {
	file;
	initiallyEnabled;
	constructor(file, initiallyEnabled) {
		this.file = file;
		this.initiallyEnabled = initiallyEnabled;
	}
	async load() {
		let stat;
		try {
			stat = await lstat(this.file);
		} catch (error) {
			if (error.code === "ENOENT") return Object.freeze({
				version: 1,
				enabled: this.initiallyEnabled
			});
			throw error;
		}
		if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) throw new Error("mobile-access control state must be a regular file no larger than 4 KiB");
		await restrictPrivateFile(this.file);
		let parsed;
		try {
			parsed = JSON.parse(await readFile(this.file, "utf8"));
		} catch (error) {
			throw new Error("mobile-access control state is not valid JSON", { cause: error });
		}
		return parseMobileAccessControlState(parsed);
	}
	async save(state) {
		const validated = parseMobileAccessControlState(state);
		const directory = dirname(this.file);
		await mkdir(directory, {
			recursive: true,
			mode: 448
		});
		try {
			const current = await lstat(this.file);
			if (!current.isFile() || current.isSymbolicLink()) throw new Error("mobile-access control state target must remain a regular file");
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		const temporary = join(directory, `.${basename(this.file)}.${randomBytes(12).toString("hex")}.tmp`);
		try {
			await writeFile(temporary, `${JSON.stringify(validated)}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 384
			});
			await rename(temporary, this.file);
			await restrictPrivateFile(this.file);
		} catch (error) {
			try {
				await rm(temporary, { force: true });
			} catch (cleanupError) {
				throw new AggregateError([error, cleanupError], "control state write and temporary cleanup both failed");
			}
			throw error;
		}
	}
};
/** Serialized persistent lifecycle for the gateway behind the always-loaded Cordis entry. */
var MobileAccessGatewayController = class {
	store;
	startRuntime;
	runtime;
	initialized = false;
	closing = false;
	queue = Promise.resolve();
	closeTask;
	constructor(store, startRuntime) {
		this.store = store;
		this.startRuntime = startRuntime;
	}
	/** Load the durable preference and start the first runtime when enabled. */
	initialize() {
		return this.enqueue(async () => {
			if (this.initialized) throw new Error("mobile-access control is already initialized");
			if (this.closing) throw new Error("mobile-access control is closing");
			if ((await this.store.load()).enabled) this.runtime = await this.startRuntime();
			this.initialized = true;
		});
	}
	/** Return the committed in-process runtime state. */
	isRunning() {
		return this.runtime !== void 0;
	}
	/** Start or stop the runtime and persist only a successfully committed transition. */
	setRunning(running) {
		if (this.closing) return Promise.reject(/* @__PURE__ */ new Error("mobile-access control is closing"));
		return this.enqueue(async () => {
			if (!this.initialized) throw new Error("mobile-access control is not initialized");
			if (this.isRunning() === running) return;
			if (running) await this.enable();
			else await this.disable();
		});
	}
	/** Stop the runtime after earlier transitions without changing the restart preference. */
	close() {
		if (this.closeTask !== void 0) return this.closeTask;
		this.closing = true;
		this.closeTask = this.enqueue(async () => {
			const runtime = this.runtime;
			if (runtime === void 0) return;
			await runtime.close();
			this.runtime = void 0;
		});
		return this.closeTask;
	}
	async enable() {
		const candidate = await this.startRuntime();
		try {
			await this.store.save({
				version: 1,
				enabled: true
			});
		} catch (error) {
			try {
				await candidate.close();
			} catch (rollbackError) {
				throw new AggregateError([error, rollbackError], "enabling mobile access failed and runtime rollback also failed");
			}
			throw error;
		}
		this.runtime = candidate;
	}
	async disable() {
		const previous = this.runtime;
		if (previous === void 0) return;
		await previous.close();
		try {
			await this.store.save({
				version: 1,
				enabled: false
			});
		} catch (error) {
			try {
				this.runtime = await this.startRuntime();
			} catch (rollbackError) {
				this.runtime = void 0;
				throw new AggregateError([error, rollbackError], "disabling mobile access failed and runtime rollback also failed");
			}
			throw error;
		}
		this.runtime = void 0;
	}
	enqueue(operation) {
		const run = this.queue.then(operation, operation);
		this.queue = run.then(() => {}, () => {});
		return run;
	}
};
//#endregion
//#region src/http-security.ts
const DEVICE_COOKIE = "dsh_ma_device";
const SESSION_COOKIE = "dsh_ma_session";
const CSRF_COOKIE = "dsh_ma_csrf";
const CSRF_HEADER = "x-dsh-mobile-csrf";
const LOCAL_ADMIN_PREFIX = "/api/mobile-access";
const AUTH_PREFIX = "/mobile-access";
const WS_PATHS = /* @__PURE__ */ new Set([
	"/api/events.mux",
	"/api/events.host",
	"/api/remote.mux",
	"/sidebar/ws/terminal"
]);
/** Terse request failure safe to expose without internal diagnostics. */
var HttpError = class extends Error {
	status;
	code;
	constructor(status, code) {
		super(code);
		this.status = status;
		this.code = code;
		this.name = "HttpError";
	}
};
/** Parse only origin-form request targets and reject ambiguous slash encodings. */
function parseRequestTarget(raw) {
	if (raw === void 0 || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f\u007f]/u.test(raw)) throw new HttpError(400, "bad_request");
	let parsed;
	let decodedPathname;
	try {
		parsed = new URL(raw, "http://gateway.invalid");
		decodedPathname = decodeURIComponent(parsed.pathname);
	} catch {
		throw new HttpError(400, "bad_request");
	}
	if (decodedPathname.includes("\\") || decodedPathname.startsWith("//") || /[\u0000-\u001f\u007f]/u.test(decodedPathname)) throw new HttpError(400, "bad_request");
	return Object.freeze({
		raw,
		pathname: parsed.pathname,
		decodedPathname,
		search: parsed.search
	});
}
/** Set the gateway-owned browser protections and non-cacheability. */
function setSecurityHeaders(response, tls) {
	response.setHeader("Cache-Control", "no-store");
	response.setHeader("Content-Security-Policy", [
		"default-src 'self'",
		"base-uri 'none'",
		"object-src 'none'",
		"frame-ancestors 'none'",
		"form-action 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		"connect-src 'self'",
		"worker-src 'self' blob:"
	].join("; "));
	response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
	response.setHeader("Referrer-Policy", "no-referrer");
	response.setHeader("X-Content-Type-Options", "nosniff");
	response.setHeader("X-Frame-Options", "DENY");
	response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
	if (tls) response.setHeader("Strict-Transport-Security", "max-age=31536000");
}
/** Send a bounded JSON response without reflecting request or upstream data. */
function sendJson(response, status, value, tls) {
	if (response.headersSent || response.destroyed) return;
	setSecurityHeaders(response, tls);
	const body = `${JSON.stringify(value)}\n`;
	response.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Content-Length": Buffer.byteLength(body)
	});
	response.end(body);
}
/** Send a generic failure containing only a stable category. */
function sendFailure(response, status, code, tls) {
	sendJson(response, status, { error: code }, tls);
}
/** Read and parse one bounded JSON object. */
async function readJsonObject(request, maximumBytes) {
	if (request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") throw new HttpError(415, "unsupported_media_type");
	const declared = request.headers["content-length"];
	if (declared !== void 0) {
		if (!/^\d+$/u.test(declared) || Number(declared) > maximumBytes) throw new HttpError(413, "payload_too_large");
	}
	const chunks = [];
	let total = 0;
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		total += buffer.length;
		if (total > maximumBytes) throw new HttpError(413, "payload_too_large");
		chunks.push(buffer);
	}
	let parsed;
	try {
		parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new HttpError(400, "bad_request");
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new HttpError(400, "bad_request");
	return parsed;
}
/** Strict cookie parser: malformed or duplicate names invalidate the whole header. */
function parseCookies(header) {
	if (header === void 0) return /* @__PURE__ */ new Map();
	if (header.length > 8192) return void 0;
	const cookies = /* @__PURE__ */ new Map();
	for (const part of header.split(";")) {
		const equals = part.indexOf("=");
		if (equals <= 0) return void 0;
		const name = part.slice(0, equals).trim();
		const value = part.slice(equals + 1).trim();
		if (!/^[!#$%&'*+\-.^_`|~\dA-Za-z]+$/u.test(name) || !/^[\w\-.~+/=]*$/u.test(value) || cookies.has(name)) return;
		cookies.set(name, value);
	}
	return cookies;
}
/** Serialize a host-only Cookie with no Domain attribute. */
function cookie(name, value, options) {
	const parts = [
		`${name}=${value}`,
		`Path=${options.path}`,
		`Max-Age=${String(Math.max(0, Math.floor(options.maxAgeSeconds)))}`,
		"SameSite=Strict",
		"Priority=High"
	];
	if (options.tls) parts.push("Secure");
	if (options.httpOnly) parts.push("HttpOnly");
	return parts.join("; ");
}
/** Enforce direct CIDR, exact Host, and browser same-origin facts. */
function assertExternalTrust(request, policy, requireOrigin) {
	if (!addressAllowed(request.socket.remoteAddress, policy.cidrs) || !policy.acceptsHost(request.headers.host)) throw new HttpError(403, "forbidden");
	const origin = request.headers.origin;
	if (origin !== void 0 && !policy.acceptsOrigin(origin)) throw new HttpError(403, "forbidden");
	const site = request.headers["sec-fetch-site"];
	if (site !== void 0 && site !== "same-origin" && site !== "same-site" && site !== "cross-site" && site !== "none") throw new HttpError(403, "forbidden");
	if (requireOrigin && !policy.acceptsOrigin(origin)) throw new HttpError(403, "forbidden");
}
function localAuthority(header) {
	if (header === void 0 || /[/?#@\\]/u.test(header)) return void 0;
	try {
		const url = new URL(`http://${header}`);
		if (url.pathname !== "/" || url.username !== "" || url.password !== "") return void 0;
		return {
			hostname: url.hostname,
			authority: url.host.toLowerCase()
		};
	} catch {
		return;
	}
}
/** Protect the inner management route from non-loopback and DNS-rebinding callers. */
function assertLocalAdminTrust(request, requireBrowserOrigin) {
	if (request.socket.remoteAddress === void 0 || !isLoopbackAddress(request.socket.remoteAddress)) throw new HttpError(403, "forbidden");
	const host = localAuthority(request.headers.host);
	if (host === void 0 || host.hostname !== "localhost" && !isLoopbackAddress(host.hostname)) throw new HttpError(403, "forbidden");
	const site = request.headers["sec-fetch-site"];
	if (site !== void 0 && site !== "same-origin" && site !== "none") throw new HttpError(403, "forbidden");
	const origin = request.headers.origin;
	if (origin !== void 0) try {
		const parsed = new URL(origin);
		if (parsed.host.toLowerCase() !== host.authority || parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new HttpError(403, "forbidden");
	} catch (error) {
		if (error instanceof HttpError) throw error;
		throw new HttpError(403, "forbidden");
	}
	if (requireBrowserOrigin && site !== void 0 && (origin === void 0 || site !== "same-origin")) throw new HttpError(403, "forbidden");
}
//#endregion
//#region src/version.ts
const manifest = createRequire(import.meta.url)("../package.json");
/** Version of the installed DSH Mobile plugin package. */
const DSH_MOBILE_VERSION = typeof manifest.version === "string" ? manifest.version : "unknown";
/** Oldest Android App release supported by this plugin generation. */
const MINIMUM_ANDROID_APP_VERSION = "0.2.2";
//#endregion
//#region src/computer-images.ts
const MAX_ENTRIES = 500;
const MAX_IMAGE_BYTES = 20971520;
const IMAGE_TYPES = Object.freeze({
	".gif": "image/gif",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp"
});
/** Normalize an optional mobile-browser path without rebasing relative input. */
function resolveComputerImagePath(path) {
	if (path === null || path === "") return homedir();
	if (!isAbsolute(path) || path.includes("\0")) throw new HttpError(400, "bad_path");
	return resolve(path);
}
/** List folders and supported image files without following symbolic links. */
async function listComputerImages(path, signal) {
	signal?.throwIfAborted();
	const target = resolveComputerImagePath(path);
	const rows = [];
	let truncated = false;
	let directory;
	try {
		directory = await opendir(target);
		for await (const entry of directory) {
			signal?.throwIfAborted();
			if (entry.isSymbolicLink()) continue;
			const kind = entry.isDirectory() ? "directory" : IMAGE_TYPES[extname(entry.name).toLowerCase()] === void 0 ? void 0 : "image";
			if (kind === void 0) continue;
			if (rows.length === MAX_ENTRIES) {
				truncated = true;
				break;
			}
			rows.push({
				kind,
				name: entry.name,
				path: resolve(target, entry.name)
			});
		}
	} catch (error) {
		if (signal?.aborted) throw signal.reason;
		throw new HttpError(404, "directory_unavailable");
	} finally {
		await directory?.close().catch(() => void 0);
	}
	rows.sort((left, right) => left.kind === right.kind ? left.name.localeCompare(right.name) : left.kind === "directory" ? -1 : 1);
	const parent = dirname(target);
	return Object.freeze({
		path: target,
		...parent === target ? {} : { parent },
		entries: Object.freeze(rows),
		truncated
	});
}
/** Read one bounded regular image file selected by an authenticated device. */
async function readComputerImage(path, signal) {
	signal?.throwIfAborted();
	const target = resolveComputerImagePath(path);
	const contentType = IMAGE_TYPES[extname(target).toLowerCase()];
	if (contentType === void 0) throw new HttpError(415, "unsupported_file_type");
	let info;
	try {
		info = await lstat(target);
	} catch {
		throw new HttpError(404, "file_unavailable");
	}
	if (!info.isFile() || info.isSymbolicLink()) throw new HttpError(404, "file_unavailable");
	if (info.size > MAX_IMAGE_BYTES) throw new HttpError(413, "file_too_large");
	try {
		return {
			body: await readFile(target, { signal }),
			contentType,
			name: basename(target)
		};
	} catch (error) {
		if (signal?.aborted) throw signal.reason;
		throw new HttpError(404, "file_unavailable");
	}
}
//#endregion
//#region src/extensions.ts
/** Maximum sizes enforced at the local-extension filesystem boundary. */
const EXTENSION_LIMITS = Object.freeze({
	manifest: 65536,
	script: 1048576,
	css: 524288,
	asset: 8388608,
	assetFiles: 256,
	assetBytes: 33554432,
	assetDepth: 8
});
/** A misbehaving host activation must not wedge the local watcher forever. */
const HOST_ACTIVATION_TIMEOUT_MS = 5e3;
/** The previous Host outlives the hidden-page refresh interval and one timed refresh. */
const RETIRED_GENERATION_TTL_MS = 6e5;
/** Extension teardown is advisory and must never stop watcher progress. */
const HOST_TEARDOWN_TIMEOUT_MS = 2e3;
async function withActivationTimeout(promise, id, signal) {
	let timer;
	let onAbort;
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new MobileExtensionError("host_load_timeout", `extension ${id} activation timed out`, 500)), HOST_ACTIVATION_TIMEOUT_MS);
			}),
			new Promise((_, reject) => {
				const abort = () => {
					reject(new MobileExtensionError("host_activation_closed", `extension ${id} activation is closed`, 409));
				};
				if (signal.aborted) abort();
				else {
					onAbort = abort;
					signal.addEventListener("abort", abort, { once: true });
				}
			})
		]);
	} finally {
		if (timer !== void 0) clearTimeout(timer);
		if (onAbort !== void 0) signal.removeEventListener("abort", onAbort);
	}
}
/** A controlled business failure returned by an extension action or route. */
var MobileExtensionError = class extends Error {
	code;
	status;
	constructor(code, message, status = 400) {
		super(message);
		this.code = code;
		this.status = status;
		this.name = "MobileExtensionError";
	}
};
/** Validate user-facing extension text without allowing control characters. */
function text(value, field, maximum, required) {
	if (value === void 0 && !required) return void 0;
	if (typeof value !== "string" || required && value.length === 0 || value.length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) throw new MobileExtensionError("invalid_manifest", `${field} is invalid`);
	return value;
}
/** Validate a stable extension id. */
function assertExtensionId(value) {
	if (typeof value !== "string" || !/^[a-z][a-z0-9-]{0,63}$/u.test(value)) throw new MobileExtensionError("invalid_manifest", "extension id is invalid");
	return value;
}
/** Validate a manifest from JSON or a plugin definition. */
function parseExtensionManifest(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new MobileExtensionError("invalid_manifest", "extension.json must be an object");
	const record = value;
	if (record.schemaVersion !== 1) throw new MobileExtensionError("invalid_manifest", "unsupported extension schema");
	const id = assertExtensionId(record.id);
	const name = text(record.name, "name", 120, true);
	const version = text(record.version, "version", 64, true);
	const description = text(record.description, "description", 500, false);
	for (const key of Reflect.ownKeys(record)) if (![
		"schemaVersion",
		"id",
		"name",
		"version",
		"description"
	].includes(String(key))) throw new MobileExtensionError("invalid_manifest", "extension.json has unknown fields");
	return Object.freeze({
		schemaVersion: 1,
		id,
		name,
		version,
		...description === void 0 ? {} : { description }
	});
}
function normalizeRelativePath(value, field) {
	if (value.length === 0 || value.includes("\0") || isAbsolute(value)) throw new MobileExtensionError("invalid_extension_path", `${field} is invalid`);
	const normalized = value.replaceAll("\\", "/");
	if (normalized.split("/").some((part) => part === "" || part === "." || part === "..")) throw new MobileExtensionError("invalid_extension_path", `${field} escapes extension directory`);
	return normalized;
}
async function regularFile$2(path, maximum, field) {
	let info;
	try {
		info = await lstat(path);
	} catch (error) {
		if (error.code === "ENOENT") throw new MobileExtensionError("invalid_extension", `${field} is missing`);
		throw error;
	}
	if (!info.isFile() || info.isSymbolicLink() || info.size > maximum) throw new MobileExtensionError("invalid_extension", `${field} must be a regular file within its size limit`);
	return {
		path,
		size: info.size
	};
}
async function containedPath(root, relativePath, maximum, field) {
	const normalized = normalizeRelativePath(relativePath, field);
	const target = resolve(root, normalized);
	const rootReal = await realpath(root);
	const targetReal = await realpath(target);
	const relation = relative(rootReal, targetReal);
	if (relation === "" || relation.startsWith("..") || isAbsolute(relation)) throw new MobileExtensionError("invalid_extension_path", `${field} escapes extension directory`);
	return regularFile$2(targetReal, maximum, field);
}
async function optionalFile(root, name, maximum, field) {
	try {
		return (await containedPath(root, name, maximum, field)).path;
	} catch (error) {
		if (error.code === "ENOENT") return void 0;
		if (error instanceof MobileExtensionError && error.message.includes("is missing")) return void 0;
		throw error;
	}
}
async function optionalBytes(root, name, maximum, field) {
	const path = await optionalFile(root, name, maximum, field);
	return path === void 0 ? void 0 : readFile(path);
}
function assertRealPathWithin(rootReal, targetReal, field) {
	const relation = relative(rootReal, targetReal);
	if (relation === "" || relation.startsWith("..") || isAbsolute(relation)) throw new MobileExtensionError("invalid_extension_path", `${field} escapes extension directory`);
}
async function realExtensionRoot(directory) {
	const root = resolve(directory);
	const info = await lstat(root);
	if (!info.isDirectory() || info.isSymbolicLink()) throw new MobileExtensionError("invalid_extension", "extension directory must be real");
	return realpath(root);
}
async function assetSnapshot(extensionRootReal) {
	const assetsPath = join(extensionRootReal, "assets");
	let assetsInfo;
	try {
		assetsInfo = await lstat(assetsPath);
	} catch (error) {
		if (error.code === "ENOENT") return /* @__PURE__ */ new Map();
		throw error;
	}
	if (!assetsInfo.isDirectory() || assetsInfo.isSymbolicLink()) throw new MobileExtensionError("invalid_extension", "assets must be a real directory");
	const assetsReal = await realpath(assetsPath);
	assertRealPathWithin(extensionRootReal, assetsReal, "assets");
	const snapshots = /* @__PURE__ */ new Map();
	let totalBytes = 0;
	const visit = async (directoryReal, prefix, depth) => {
		if (depth > EXTENSION_LIMITS.assetDepth) throw new MobileExtensionError("invalid_extension", "asset tree exceeds its depth limit");
		assertRealPathWithin(extensionRootReal, directoryReal, "asset directory");
		const handle = await opendir(directoryReal);
		const entries = [];
		try {
			for await (const entry of handle) entries.push(entry);
		} finally {
			await handle.close().catch(() => void 0);
		}
		entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
		for (const entry of entries) {
			const path = join(directoryReal, entry.name);
			const info = await lstat(path);
			if (info.isSymbolicLink()) throw new MobileExtensionError("invalid_extension_path", "asset escapes extension directory");
			const targetReal = await realpath(path);
			assertRealPathWithin(extensionRootReal, targetReal, "asset");
			const key = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
			if (info.isDirectory()) {
				await visit(targetReal, key, depth + 1);
				continue;
			}
			if (!info.isFile() || info.size > EXTENSION_LIMITS.asset) throw new MobileExtensionError("invalid_extension", "asset must be a regular file within its size limit");
			const body = await readFile(targetReal);
			totalBytes += body.byteLength;
			if (snapshots.size >= EXTENSION_LIMITS.assetFiles || totalBytes > EXTENSION_LIMITS.assetBytes) throw new MobileExtensionError("invalid_extension", "asset tree exceeds its aggregate limit");
			snapshots.set(key, Object.freeze({
				body,
				digest: createHash("sha256").update(body).digest("hex"),
				name: entry.name
			}));
		}
	};
	await visit(assetsReal, "", 0);
	return snapshots;
}
async function extensionFingerprint(directory) {
	const root = await realExtensionRoot(directory);
	const manifestFile = await regularFile$2(join(root, "extension.json"), EXTENSION_LIMITS.manifest, "extension.json");
	const manifestBody = await readFile(manifestFile.path);
	const manifest = parseExtensionManifest(JSON.parse(manifestBody.toString("utf8")));
	if (manifest.id !== basename(root)) throw new MobileExtensionError("invalid_manifest", "extension id must match its directory name");
	const [host, script, style, assets] = await Promise.all([
		optionalBytes(root, "host.mjs", EXTENSION_LIMITS.script, "host.mjs"),
		optionalBytes(root, "mobile.js", EXTENSION_LIMITS.script, "mobile.js"),
		optionalBytes(root, "mobile.css", EXTENSION_LIMITS.css, "mobile.css"),
		assetSnapshot(root)
	]);
	const digest = createHash("sha256").update(`manifest:${manifestBody.byteLength}:`).update(createHash("sha256").update(manifestBody).digest());
	for (const [name, body] of [
		["host", host],
		["script", script],
		["style", style]
	]) {
		digest.update(`\0${name}:${body?.byteLength ?? -1}:`);
		if (body !== void 0) digest.update(createHash("sha256").update(body).digest());
	}
	for (const [name, asset] of assets) digest.update(`\0asset:${Buffer.byteLength(name)}:${name}:${asset.body.byteLength}:${asset.digest}`);
	return {
		manifest,
		digest: digest.digest("hex"),
		assets,
		...script === void 0 ? {} : { scriptBody: script },
		...style === void 0 ? {} : { styleBody: style }
	};
}
function routeKey(route) {
	const method = route.method.toUpperCase();
	const path = normalizeRoutePath(route.path);
	return `${method} ${route.kind ?? "exact"} ${path}`;
}
function normalizeRoutePath(value) {
	if (typeof value !== "string" || value.length === 0 || value.length > 256 || value.includes("?") || value.includes("#") || value.includes("\\") || value.includes("\0") || /[\u0000-\u001f\u007f]/u.test(value)) throw new MobileExtensionError("invalid_route", "extension route path is invalid");
	const normalizedInput = value.startsWith("/") ? value : `/${value}`;
	if (normalizedInput.split("/").some((part) => part === ".." || part === ".")) throw new MobileExtensionError("invalid_route", "extension route path is invalid");
	return normalizedInput === "/" ? "/" : normalizedInput.replace(/\/+$/u, "");
}
function validateDefinition(definition) {
	const manifest = parseExtensionManifest({
		schemaVersion: definition.schemaVersion,
		id: definition.id,
		name: definition.name,
		version: definition.version,
		...definition.description === void 0 ? {} : { description: definition.description }
	});
	const actionNames = /* @__PURE__ */ new Set();
	for (const [name, action] of Object.entries(definition.actions ?? {})) {
		if (!/^[a-z][a-z0-9-]{0,63}$/u.test(name) || action === null || typeof action !== "object" || typeof action.run !== "function" || actionNames.has(name)) throw new MobileExtensionError("invalid_action", `invalid action ${name}`);
		actionNames.add(name);
	}
	const routeNames = /* @__PURE__ */ new Set();
	const routes = (definition.routes ?? []).map((route) => {
		if (route === null || typeof route !== "object" || typeof route.handle !== "function") throw new MobileExtensionError("invalid_route", "invalid extension route");
		const method = route.method.toUpperCase();
		if (![
			"GET",
			"HEAD",
			"POST",
			"PUT",
			"PATCH",
			"DELETE"
		].includes(method)) throw new MobileExtensionError("invalid_route", "unsupported extension route method");
		const normalized = {
			...route,
			method,
			path: normalizeRoutePath(route.path)
		};
		const key = routeKey(normalized);
		if (routeNames.has(key)) throw new MobileExtensionError("duplicate_route", `duplicate route ${key}`);
		routeNames.add(key);
		return normalized;
	});
	return Object.freeze({
		...manifest,
		...definition.actions === void 0 ? {} : { actions: Object.freeze({ ...definition.actions }) },
		...routes.length === 0 ? {} : { routes: Object.freeze(routes) }
	});
}
function combineSignalLifetime(first, second) {
	if (first.aborted || second.aborted) {
		const aborted = new AbortController();
		aborted.abort(first.aborted ? first.reason : second.reason);
		return {
			signal: aborted.signal,
			cleanup: () => void 0
		};
	}
	const controller = new AbortController();
	const cleanup = () => {
		first.removeEventListener("abort", abortFirst);
		second.removeEventListener("abort", abortSecond);
	};
	const abortFirst = () => {
		cleanup();
		controller.abort(first.reason);
	};
	const abortSecond = () => {
		cleanup();
		controller.abort(second.reason);
	};
	first.addEventListener("abort", abortFirst, { once: true });
	second.addEventListener("abort", abortSecond, { once: true });
	return {
		signal: controller.signal,
		cleanup
	};
}
/** Host registry and service consumed by both npm plugins and local extensions. */
var MobileAccessService = class extends Service {
	registered = /* @__PURE__ */ new Map();
	local = /* @__PURE__ */ new Map();
	retired = /* @__PURE__ */ new Map();
	failures = /* @__PURE__ */ new Map();
	contentListeners = /* @__PURE__ */ new Set();
	contentHash = createHash("sha256").update("").digest("hex");
	localRoot;
	localContext;
	localTimer;
	localRefreshing;
	localRefreshAbort;
	localLifecycle = 0;
	localClosed = true;
	constructor(ctx) {
		super(ctx, "mobileAccess");
	}
	/** Register a normal Cordis extension and return an idempotent disposer. */
	registerExtension(definition) {
		const validated = validateDefinition(definition);
		if (this.registered.has(validated.id) || this.local.has(validated.id)) throw new Error(`mobile extension id already registered: ${validated.id}`);
		const dispose = () => {
			if (this.registered.get(validated.id)?.dispose === dispose) {
				this.registered.delete(validated.id);
				this.updateContentHash();
			}
		};
		this.registered.set(validated.id, {
			definition: validated,
			dispose
		});
		this.updateContentHash();
		return dispose;
	}
	/** Aggregate digest covering every registered and active local extension. */
	contentDigest() {
		return this.contentHash;
	}
	/** Subscribe to committed extension generation changes. */
	onContentChanged(listener) {
		this.contentListeners.add(listener);
		return () => {
			this.contentListeners.delete(listener);
		};
	}
	updateContentHash() {
		const parts = [...[...this.registered.values()].map((entry) => entry.definition.id), ...[...this.local.values()].map((active) => `${active.manifest.id}:${active.digest}`)];
		const next = createHash("sha256").update(parts.sort().join("|")).digest("hex");
		if (next === this.contentHash) return;
		this.contentHash = next;
		for (const listener of this.contentListeners) try {
			listener();
		} catch {}
	}
	/** Return the current client-facing manifest, deterministically sorted by id. */
	manifest() {
		const entries = /* @__PURE__ */ new Map();
		for (const { definition } of this.registered.values()) entries.set(definition.id, {
			schemaVersion: 1,
			id: definition.id,
			name: definition.name,
			version: definition.version,
			...definition.description === void 0 ? {} : { description: definition.description }
		});
		for (const active of this.local.values()) entries.set(active.manifest.id, {
			...active.manifest,
			generation: active.digest,
			...active.scriptBody === void 0 ? {} : { scriptUrl: `/mobile-access/extensions/${active.manifest.id}/mobile.js?generation=${active.digest}` },
			...active.styleBody === void 0 ? {} : { styleUrl: `/mobile-access/extensions/${active.manifest.id}/mobile.css?generation=${active.digest}` },
			assetsUrl: `/mobile-access/extensions/${active.manifest.id}/assets/`
		});
		return [...entries.values()].sort((left, right) => left.id.localeCompare(right.id));
	}
	/** Return loaded and failed local extension counts without exposing host errors. */
	status() {
		return Object.freeze({
			loaded: this.registered.size + this.local.size,
			failed: this.failures.size
		});
	}
	/** Locate one active extension. */
	extension(id, generation) {
		if (generation !== void 0) {
			const current = this.local.get(id);
			if (current?.digest === generation) return current;
			const previous = this.retired.get(id)?.active;
			return previous?.digest === generation ? previous : void 0;
		}
		return this.local.get(id) ?? this.registered.get(id)?.definition;
	}
	/** Return the active local generation signal for gateway cancellation wiring. */
	signal(id, generation) {
		const extension = this.extension(id, generation);
		return extension !== void 0 && "host" in extension ? extension.controller.signal : void 0;
	}
	/** Read a local client entry after validating that it remains inside its directory. */
	async readClientFile(id, kind, signal, generation) {
		signal?.throwIfAborted();
		const selected = this.extension(id, generation);
		const active = selected !== void 0 && "host" in selected ? selected : void 0;
		if (active === void 0) throw new MobileExtensionError("extension_generation_not_found", "extension generation not found", 404);
		const snapshot = kind === "script" ? active.scriptBody : active.styleBody;
		if (snapshot === void 0) throw new MobileExtensionError("extension_asset_not_found", "extension asset not found", 404);
		const body = Buffer.from(snapshot);
		return {
			body,
			digest: createHash("sha256").update(body).digest("hex")
		};
	}
	/** Read a generation-pinned static asset from its validated snapshot. */
	async readAsset(id, assetPath, signal, generation) {
		signal?.throwIfAborted();
		const selected = this.extension(id, generation);
		const active = selected !== void 0 && "host" in selected ? selected : void 0;
		if (active === void 0) throw new MobileExtensionError("extension_generation_not_found", "extension generation not found", 404);
		const normalized = normalizeRelativePath(assetPath, "asset");
		const asset = active.assets.get(normalized);
		if (asset === void 0) throw new MobileExtensionError("extension_asset_not_found", "extension asset not found", 404);
		return {
			body: Buffer.from(asset.body),
			digest: asset.digest,
			name: asset.name
		};
	}
	/** Invoke one action after parsing its input and binding the request lifetime. */
	async invoke(id, actionName, input, context, generation) {
		const extension = this.extension(id, generation);
		if (extension === void 0) throw new MobileExtensionError("extension_not_found", "extension not found", 404);
		const action = ("host" in extension ? extension.host : extension).actions?.[actionName];
		if (action === void 0) throw new MobileExtensionError("action_not_found", "action not found", 404);
		let parsed = input;
		try {
			parsed = action.input?.parse(input) ?? input;
		} catch {
			throw new MobileExtensionError("invalid_action_input", "action input is invalid", 400);
		}
		const lifetime = "host" in extension ? combineSignalLifetime(extension.controller.signal, context.signal) : void 0;
		const signal = lifetime?.signal ?? context.signal;
		try {
			return await action.run({
				...context,
				signal
			}, parsed);
		} catch (error) {
			if (error instanceof MobileExtensionError) throw error;
			throw new MobileExtensionError("extension_failed", "extension action failed", 500);
		} finally {
			lifetime?.cleanup();
		}
	}
	/** Match one route and invoke it with a generation-bound abort signal. */
	async route(id, method, pathname, request, generation) {
		const extension = this.extension(id, generation);
		if (extension === void 0) throw new MobileExtensionError("extension_not_found", "extension not found", 404);
		const route = ("host" in extension ? extension.host : extension).routes?.find((candidate) => {
			if (candidate.method !== method) return false;
			return (candidate.kind ?? "exact") === "exact" ? candidate.path === pathname : pathname === candidate.path || pathname.startsWith(`${candidate.path}/`);
		});
		if (route === void 0) throw new MobileExtensionError("route_not_found", "route not found", 404);
		const lifetime = "host" in extension ? combineSignalLifetime(extension.controller.signal, request.signal) : void 0;
		let releaseLifetime = true;
		try {
			const routeRequest = lifetime === void 0 ? request : {
				...request,
				signal: lifetime.signal
			};
			const result = await route.handle(routeRequest);
			if (result === null || typeof result !== "object" || typeof result.body !== "string" && !(result.body instanceof Uint8Array) && !isReadable(result.body)) throw new MobileExtensionError("invalid_route_response", "extension returned an invalid response", 500);
			if (lifetime !== void 0 && isReadable(result.body)) {
				releaseLifetime = false;
				releaseSignalLifetimeWhenStreamSettles(result.body, lifetime.cleanup);
			}
			return result;
		} catch (error) {
			if (error instanceof MobileExtensionError) throw error;
			throw new MobileExtensionError("extension_failed", "extension route failed", 500);
		} finally {
			if (releaseLifetime) lifetime?.cleanup();
		}
	}
	/** Start the local directory watcher; an absent directory is intentionally inert. */
	async startLocal(root, context) {
		const targetRoot = resolve(root);
		if (this.localRoot !== void 0 && resolve(this.localRoot) !== targetRoot) await this.stopLocal();
		if (this.localTimer !== void 0) clearInterval(this.localTimer);
		const lifecycle = ++this.localLifecycle;
		this.localRoot = targetRoot;
		this.localContext = context;
		this.localClosed = false;
		await mkdir(this.localRoot, { recursive: true });
		if (this.localClosed || this.localLifecycle !== lifecycle || this.localRoot !== targetRoot || this.localContext !== context) return;
		await this.refreshLocal();
		if (this.localClosed || this.localLifecycle !== lifecycle || this.localRoot !== targetRoot || this.localContext !== context) return;
		this.localTimer = setInterval(() => {
			this.refreshLocal();
		}, 2e3);
		this.localTimer.unref();
	}
	/** Stop the watcher and abort every local host generation. */
	async stopLocal() {
		this.localClosed = true;
		const lifecycle = ++this.localLifecycle;
		if (this.localTimer !== void 0) clearInterval(this.localTimer);
		this.localTimer = void 0;
		const refreshing = this.localRefreshing;
		this.localRefreshAbort?.abort();
		const previous = [...this.local.values(), ...[...this.retired.values()].map((entry) => entry.active)];
		this.local.clear();
		for (const entry of this.retired.values()) clearTimeout(entry.timer);
		this.retired.clear();
		this.failures.clear();
		this.updateContentHash();
		await Promise.allSettled([abortAndDisposeLocal(previous), ...refreshing === void 0 ? [] : [refreshing]]);
		if (this.localLifecycle !== lifecycle) return;
		const late = [...this.local.values(), ...[...this.retired.values()].map((entry) => entry.active)];
		this.local.clear();
		for (const entry of this.retired.values()) clearTimeout(entry.timer);
		this.retired.clear();
		this.failures.clear();
		this.updateContentHash();
		await abortAndDisposeLocal(late);
		if (this.localTimer !== void 0) clearInterval(this.localTimer);
		this.localTimer = void 0;
	}
	/** Refresh all local extensions atomically; failures keep the previous snapshot. */
	refreshLocal() {
		if (this.localRefreshing !== void 0) return this.localRefreshing;
		const controller = new AbortController();
		this.localRefreshAbort = controller;
		const refreshing = this.stageAndCommit(controller.signal).finally(() => {
			if (this.localRefreshing === refreshing) this.localRefreshing = void 0;
			if (this.localRefreshAbort === controller) this.localRefreshAbort = void 0;
		});
		this.localRefreshing = refreshing;
		return refreshing;
	}
	async stageAndCommit(signal) {
		if (this.localClosed || signal.aborted || this.localRoot === void 0 || this.localContext === void 0) return;
		let names = [];
		try {
			const directory = await opendir(this.localRoot);
			try {
				for await (const entry of directory) if (entry.isDirectory() && !entry.isSymbolicLink()) names.push(entry.name);
			} finally {
				await directory.close().catch(() => void 0);
			}
		} catch {
			return;
		}
		names.sort();
		const staged = [];
		const stagedFresh = [];
		let failingName = "local";
		try {
			for (const name of names) {
				signal.throwIfAborted();
				failingName = name;
				const directory = join(this.localRoot, name);
				const fingerprint = await extensionFingerprint(directory);
				const current = this.local.get(fingerprint.manifest.id);
				const retired = this.retired.get(fingerprint.manifest.id)?.active;
				const previous = current?.digest === fingerprint.digest ? current : retired?.digest === fingerprint.digest ? retired : void 0;
				if (previous?.digest === fingerprint.digest) staged.push(previous);
				else {
					const fresh = await loadLocalExtension(directory, this.localContext, fingerprint, signal);
					try {
						signal.throwIfAborted();
						if ((await extensionFingerprint(directory)).digest !== fingerprint.digest) throw new MobileExtensionError("extension_changed_during_activation", `extension ${fingerprint.manifest.id} changed during activation`, 409);
					} catch (error) {
						await abortAndDisposeLocal([fresh]);
						throw error;
					}
					staged.push(fresh);
					stagedFresh.push(fresh);
				}
			}
			if (this.localClosed || signal.aborted || this.localRoot === void 0 || this.localContext === void 0) {
				await abortAndDisposeLocal(stagedFresh);
				return;
			}
			const duplicate = /* @__PURE__ */ new Set();
			for (const entry of staged) {
				if (duplicate.has(entry.manifest.id) || this.registered.has(entry.manifest.id)) throw new MobileExtensionError("duplicate_extension", `duplicate extension id ${entry.manifest.id}`);
				duplicate.add(entry.manifest.id);
			}
			const previous = [...this.local.values()];
			for (const entry of staged) {
				const retired = this.retired.get(entry.manifest.id);
				if (retired?.active === entry) {
					clearTimeout(retired.timer);
					this.retired.delete(entry.manifest.id);
				}
			}
			const stagedIds = new Set(staged.map((entry) => entry.manifest.id));
			const removed = [];
			for (const entry of previous) {
				if (staged.includes(entry)) continue;
				if (stagedIds.has(entry.manifest.id)) {
					this.retire(entry);
					continue;
				}
				removed.push(entry);
				const retired = this.retired.get(entry.manifest.id);
				if (retired !== void 0) {
					clearTimeout(retired.timer);
					this.retired.delete(entry.manifest.id);
					removed.push(retired.active);
				}
			}
			this.local.clear();
			for (const entry of staged) this.local.set(entry.manifest.id, entry);
			for (const entry of staged) this.failures.delete(entry.manifest.id);
			for (const name of names) this.failures.delete(name);
			for (const failure of this.failures.keys()) if (failure !== "local" && !names.includes(failure)) this.failures.delete(failure);
			this.failures.delete("local");
			if (removed.length > 0) abortAndDisposeLocal(removed);
			this.updateContentHash();
		} catch (error) {
			await abortAndDisposeLocal(stagedFresh);
			if (this.localClosed || signal.aborted) return;
			const message = error instanceof Error ? error.message : String(error);
			this.failures.set(failingName, message);
			if (!(error instanceof MobileExtensionError)) this.ctx.logger.warn(error instanceof Error ? error : new Error(String(error)));
		}
	}
	retire(active) {
		const previous = this.retired.get(active.manifest.id);
		if (previous?.active === active) return;
		if (previous !== void 0) {
			clearTimeout(previous.timer);
			this.retired.delete(active.manifest.id);
			abortAndDisposeLocal([previous.active]);
		}
		const timer = setTimeout(() => {
			if (this.retired.get(active.manifest.id)?.active !== active) return;
			this.retired.delete(active.manifest.id);
			abortAndDisposeLocal([active]);
		}, RETIRED_GENERATION_TTL_MS);
		timer.unref();
		this.retired.set(active.manifest.id, {
			active,
			timer
		});
	}
};
function isReadable(value) {
	return value !== null && typeof value === "object" && typeof value.pipe === "function";
}
function releaseSignalLifetimeWhenStreamSettles(stream, cleanup) {
	let stopObserving;
	stopObserving = finished(stream, () => {
		stopObserving?.();
		cleanup();
	});
}
function invokeCleanups(cleanups) {
	const pending = [];
	for (const cleanup of [...cleanups].reverse()) try {
		pending.push(Promise.resolve(cleanup()));
	} catch {}
	return pending;
}
async function settleBounded(pending, timeoutMs) {
	if (pending.length === 0) return;
	let timer;
	await Promise.race([Promise.allSettled(pending), new Promise((resolveTimeout) => {
		timer = setTimeout(resolveTimeout, timeoutMs);
	})]);
	if (timer !== void 0) clearTimeout(timer);
}
async function abortAndDisposeLocal(entries) {
	const pending = [];
	for (const entry of entries) {
		entry.controller.abort();
		pending.push(...invokeCleanups(entry.cleanups));
	}
	await settleBounded(pending, HOST_TEARDOWN_TIMEOUT_MS);
}
async function loadLocalExtension(directory, context, known, parentSignal) {
	const root = await realExtensionRoot(directory);
	const manifestFile = await regularFile$2(join(root, "extension.json"), EXTENSION_LIMITS.manifest, "extension.json");
	const manifest = known?.manifest ?? parseExtensionManifest(JSON.parse(await readFile(manifestFile.path, "utf8")));
	if (manifest.id !== basename(root)) throw new MobileExtensionError("invalid_manifest", "extension id must match its directory name");
	const scriptBody = known === void 0 ? await optionalFile(root, "mobile.js", EXTENSION_LIMITS.script, "mobile.js").then((path) => path === void 0 ? void 0 : readFile(path)) : known.scriptBody;
	const styleBody = known === void 0 ? await optionalFile(root, "mobile.css", EXTENSION_LIMITS.css, "mobile.css").then((path) => path === void 0 ? void 0 : readFile(path)) : known.styleBody;
	const assets = known?.assets ?? await assetSnapshot(root);
	const hostFile = await optionalFile(root, "host.mjs", EXTENSION_LIMITS.script, "host.mjs");
	const controller = new AbortController();
	const actions = {};
	const routes = [];
	const cleanups = [];
	const pendingEffects = [];
	let activationOpen = true;
	const onParentAbort = () => {
		controller.abort(parentSignal?.reason);
	};
	if (parentSignal?.aborted === true) onParentAbort();
	else parentSignal?.addEventListener("abort", onParentAbort, { once: true });
	const ensureActivationOpen = () => {
		if (!activationOpen || controller.signal.aborted) throw new MobileExtensionError("host_activation_closed", `extension ${manifest.id} activation is closed`, 409);
	};
	const api = {
		manifest,
		context,
		schema: z,
		signal: controller.signal,
		action(name, spec) {
			ensureActivationOpen();
			if (actions[name] !== void 0) throw new MobileExtensionError("duplicate_action", `duplicate action ${name}`);
			actions[name] = spec;
		},
		route(spec) {
			ensureActivationOpen();
			routes.push(spec);
		},
		effect(setup) {
			ensureActivationOpen();
			const result = setup();
			if (result instanceof Promise) pendingEffects.push(result.then(async (cleanup) => {
				if (typeof cleanup !== "function") return;
				if (activationOpen) cleanups.push(cleanup);
				else await cleanup();
			}));
			else if (typeof result === "function") {
				if (activationOpen) cleanups.push(result);
				else Promise.resolve(result()).catch(() => void 0);
			}
		}
	};
	try {
		const activate = async () => {
			controller.signal.throwIfAborted();
			if (hostFile !== void 0) {
				const digest = createHash("sha256").update(await readFile(hostFile)).digest("hex");
				controller.signal.throwIfAborted();
				let imported;
				try {
					imported = await import(`${pathToFileURL(hostFile).href}?dsh_generation=${digest}`);
				} catch {
					throw new MobileExtensionError("host_load_failed", `could not load ${manifest.id}/host.mjs`, 500);
				}
				controller.signal.throwIfAborted();
				if (imported.default !== void 0) await imported.default(api);
			}
			await Promise.all(pendingEffects);
		};
		await withActivationTimeout(activate(), manifest.id, controller.signal);
		const host = validateDefinition({
			...manifest,
			actions,
			routes
		});
		activationOpen = false;
		const digest = known?.digest ?? createHash("sha256").update(manifest.id).digest("hex");
		return Object.freeze({
			manifest,
			directory: root,
			...scriptBody === void 0 ? {} : { scriptBody },
			...styleBody === void 0 ? {} : { styleBody },
			assets,
			host,
			controller,
			cleanups: Object.freeze(cleanups),
			digest
		});
	} catch (error) {
		activationOpen = false;
		controller.abort();
		const cleanupPromises = invokeCleanups(cleanups.splice(0));
		await settleBounded([...pendingEffects, ...cleanupPromises], HOST_TEARDOWN_TIMEOUT_MS);
		throw error;
	} finally {
		parentSignal?.removeEventListener("abort", onParentAbort);
	}
}
/** Construct the service in a Cordis plugin without importing DSH internals. */
function createMobileAccessService(ctx) {
	return new MobileAccessService(ctx);
}
//#endregion
//#region src/gateway.ts
const MAX_CONTROL_BODY_BYTES = 16384;
const MAX_HEADER_BYTES = 16384;
const MOBILE_HISTORY_PAGE_MESSAGES = 10;
const SESSION_HISTORY_PATH = "/api/session.history";
const DISCOVERY_QUERY = Buffer.from("DSH_MOBILE_DISCOVER_V1", "ascii");
const DISCOVERY_PROTOCOL = 1;
const DISCOVERY_INTERVAL_MS = 3e3;
const MDNS_SERVICE_TYPE = "dsh-mobile";
const MOBILE_LAYOUT_MODULE = "@deepseek-ai/dsh-client-ui-layout";
const MOBILE_LAYOUT_PATH = `${AUTH_PREFIX}/mobile-layout.js`;
const MOBILE_BOOT_BATCH_PREFIX = `${AUTH_PREFIX}/mobile-boot/`;
const MAX_MOBILE_BOOT_BATCH_BYTES = 33554432;
const MAX_MOBILE_BOOT_ENTRY_BYTES = 8388608;
const MAX_MOBILE_BOOT_BATCHES = 8;
const MOBILE_BOOT_UPSTREAM_ATTEMPTS = 4;
const MOBILE_BOOT_RETRY_DELAY_MS = 150;
const TRANSIENT_UPSTREAM_ERROR_CODES = /* @__PURE__ */ new Set([
	"EAI_AGAIN",
	"ECONNABORTED",
	"ECONNREFUSED",
	"ECONNRESET",
	"EPIPE",
	"EHOSTUNREACH",
	"ENETDOWN",
	"ENETRESET",
	"ENETUNREACH",
	"ETIMEDOUT",
	"ERR_STREAM_PREMATURE_CLOSE"
]);
const UPSTREAM_AUTH_REFRESH_MARGIN_MS = 6e4;
const UPSTREAM_COOKIE_PAIR = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+=[\x21-\x3A\x3C-\x7E]*$/u;
const CUSTOM_STYLE_FALLBACK = "/* Add mobile overrides in the DSH home mobile-access/mobile.css file. */\n";
const CUSTOM_SCRIPT_FALLBACK = "window.dshMobile?.register(() => undefined)\n";
const EXTENSION_CHANGE_POLL_MS = 2e3;
const EXTENSION_EVENT_HEARTBEAT_MS = 15e3;
const MOBILE_CLIENT_MODULE = "dsh-mobile";
const CONNECTION_MODULE = "@deepseek-ai/dsh-client-connection";
const RUNTIME_MODULE = "@deepseek-ai/dsh-client-runtime";
const RENDERER_MODULE = "@deepseek-ai/dsh-client-ui-renderer";
const SIDEBAR_MODULE = "@deepseek-ai/dsh-client-ui-sidebar";
const SETTINGS_MODULE = "@deepseek-ai/dsh-client-ui-settings";
const API_GATEWAY_MODULE = "@deepseek-ai/dsh-api-gateway";
const API_REMOTES_MODULE = "@deepseek-ai/dsh-api-remotes";
const MOBILE_LAYOUT_DEPENDENCY_PROFILES = Object.freeze([Object.freeze({
	slots: RUNTIME_MODULE,
	dependencies: Object.freeze([RUNTIME_MODULE, "@deepseek-ai/dsh-client-ui-theme"])
}), Object.freeze({
	slots: RENDERER_MODULE,
	dependencies: Object.freeze([
		"@deepseek-ai/dsh-client-locale",
		RENDERER_MODULE,
		"@deepseek-ai/dsh-client-ui-session",
		"@deepseek-ai/dsh-client-ui-theme"
	])
})]);
const MOBILE_CSRF_FETCH_BOOTSTRAP = `(()=>{const nativeFetch=window.fetch.bind(window);window.fetch=(input,init)=>{const source=input instanceof Request?input:undefined;const method=String(init?.method??source?.method??'GET').toUpperCase();if(method==='GET'||method==='HEAD')return nativeFetch(input,init);const raw=typeof input==='string'?input:input instanceof URL?input.href:source?.url;if(raw===undefined||new URL(raw,location.href).origin!==location.origin)return nativeFetch(input,init);const headers=new Headers(init?.headers??source?.headers);if(!headers.has(${JSON.stringify(CSRF_HEADER)})){const prefix=${JSON.stringify(`${CSRF_COOKIE}=`)};const token=document.cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith(prefix))?.slice(prefix.length);if(token!==undefined)headers.set(${JSON.stringify(CSRF_HEADER)},token)}return nativeFetch(input,{...init,headers})};})();`;
const MOBILE_AUTHENTICATED_TRANSPORT_BOOTSTRAP = `(()=>{if(window.__DSH_TRANSPORT__!==undefined)throw new Error('DSH Mobile cannot replace an existing transport override');window.__DSH_TRANSPORT__={fetch:(input,init)=>window.fetch(input,init),ownsHost:true}})();`;
const PAIR_PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Pair DSH mobile access</title>
<main>
  <h1>Pair this device</h1>
  <form id="pair-form">
    <label>Pairing code <input id="pair-token" autocomplete="one-time-code" required></label>
    <label>Device name <input id="device-label" maxlength="64" autocomplete="off"></label>
    <button type="submit">Pair</button>
    <output id="pair-status"></output>
  </form>
</main>
<script src="/mobile-access/pair.js" defer><\/script>
</html>
`;
const gzipBuffer = promisify(gzip);
function ensureMobileViewport(html) {
	const match = /<meta\b(?=[^>]*\bname\s*=\s*["']viewport["'])[^>]*>/iu.exec(html);
	if (match === null) {
		const head = /<head\b[^>]*>/iu.exec(html);
		if (head?.index === void 0) return html;
		const position = head.index + head[0].length;
		return `${html.slice(0, position)}<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${html.slice(position)}`;
	}
	if (/\bviewport-fit\s*=\s*cover\b/iu.test(match[0])) return html;
	const content = /\bcontent\s*=\s*(["'])(.*?)\1/iu;
	const next = content.test(match[0]) ? match[0].replace(content, (_whole, quote, value) => `content=${quote}${value},viewport-fit=cover${quote}`) : match[0].replace(/\s*\/?>$/u, " content=\"width=device-width,initial-scale=1,viewport-fit=cover\">");
	return `${html.slice(0, match.index)}${next}${html.slice(match.index + match[0].length)}`;
}
function orderAuthenticatedSettings(entries, slotsProvider) {
	const mobile = entries.filter((entry) => entry !== null && typeof entry === "object" && entry.id === MOBILE_CLIENT_MODULE);
	const settings = entries.filter((entry) => entry !== null && typeof entry === "object" && entry.id === SETTINGS_MODULE);
	if (mobile.length === 0 || settings.length === 0) return false;
	if (mobile.length !== 1 || settings.length !== 1) throw new Error("upstream DSH mobile settings graph is ambiguous");
	if (!Array.isArray(mobile[0]?.inject) || !mobile[0].inject.includes(CONNECTION_MODULE) || !mobile[0].inject.includes(SIDEBAR_MODULE)) throw new Error("dsh-mobile client has unsupported dependencies");
	if (!Array.isArray(settings[0]?.inject)) throw new Error("upstream DSH settings module has unsupported dependencies");
	const remoteSettings = !settings[0].inject.includes(CONNECTION_MODULE);
	if (remoteSettings) {
		if (!settings[0].inject.includes(API_REMOTES_MODULE) || slotsProvider !== RENDERER_MODULE) throw new Error("upstream DSH settings module has unsupported dependencies");
		const remotes = entries.filter((entry) => entry !== null && typeof entry === "object" && entry.id === API_REMOTES_MODULE);
		const gateway = entries.filter((entry) => entry !== null && typeof entry === "object" && entry.id === API_GATEWAY_MODULE);
		if (remotes.length !== 1 || !Array.isArray(remotes[0]?.inject) || !remotes[0].inject.includes(API_GATEWAY_MODULE) || gateway.length !== 1 || !Array.isArray(gateway[0]?.inject) || !gateway[0].inject.includes(CONNECTION_MODULE)) throw new Error("upstream DSH settings Remote graph has unsupported dependencies");
		if (!gateway[0].inject.includes(MOBILE_CLIENT_MODULE)) gateway[0].inject = [...gateway[0].inject, MOBILE_CLIENT_MODULE];
	}
	mobile[0].inject = [CONNECTION_MODULE, slotsProvider];
	if (!settings[0].inject.includes(MOBILE_CLIENT_MODULE)) settings[0].inject = [...settings[0].inject, MOBILE_CLIENT_MODULE];
	return remoteSettings;
}
function revisionedMobileBatchPath(entries) {
	const key = createHash("sha256").update(DSH_MOBILE_VERSION).update(JSON.stringify(entries)).digest("hex");
	return {
		key,
		path: `${MOBILE_BOOT_BATCH_PREFIX}${key}.js`
	};
}
function rewriteMobileIndexWithBatch(html) {
	const assignment = /(?:window\.__DSH_BOOT__|globalThis\["__DSH_BOOT__"\])\s*=\s*/u.exec(html);
	if (assignment?.index === void 0) throw new Error("upstream DSH index has no boot manifest");
	const start = assignment.index;
	const valueStart = start + assignment[0].length;
	const scriptEnd = html.indexOf("<\/script>", valueStart);
	if (scriptEnd < 0) throw new Error("upstream DSH boot manifest script is incomplete");
	const source = html.slice(valueStart, scriptEnd).trim().replace(/;$/u, "");
	const parsed = JSON.parse(source);
	if (typeof parsed.rev !== "string" || !Array.isArray(parsed.entries)) throw new Error("upstream DSH boot manifest is malformed");
	const entries = parsed.entries;
	const layout = entries.filter((entry) => entry !== null && typeof entry === "object" && entry.id === MOBILE_LAYOUT_MODULE);
	if (layout.length !== 1 || typeof layout[0]?.url !== "string" || typeof layout[0].rev !== "string") throw new Error("upstream DSH boot manifest has no unique layout module");
	if (!Array.isArray(layout[0].inject)) throw new Error("upstream DSH layout module has unsupported dependencies");
	const dependencyProfile = MOBILE_LAYOUT_DEPENDENCY_PROFILES.find((profile) => profile.dependencies.every((dependency) => layout[0]?.inject?.includes(dependency)));
	if (dependencyProfile === void 0) throw new Error("upstream DSH layout module has unsupported dependencies");
	layout[0].url = MOBILE_LAYOUT_PATH;
	layout[0].rev = `dsh-mobile-layout-${DSH_MOBILE_VERSION}`;
	const remoteSettings = orderAuthenticatedSettings(entries, dependencyProfile.slots);
	let mobileBatch;
	if (parsed.batches !== void 0) {
		if (!Array.isArray(parsed.batches)) throw new Error("upstream DSH boot manifest batches are malformed");
		const batches = parsed.batches;
		const entryById = new Map(entries.map((entry) => [entry.id, entry]));
		if (entryById.size !== entries.length) throw new Error("upstream DSH boot manifest has duplicate entries");
		const layoutBatches = [];
		for (const batch of batches) {
			if (batch === null || typeof batch !== "object" || batch.phase !== "bootstrap" && batch.phase !== "application" || typeof batch.url !== "string" || typeof batch.rev !== "string" || !Array.isArray(batch.entries) || batch.entries.length === 0 || batch.entries.some((id) => typeof id !== "string" || !entryById.has(id))) throw new Error("upstream DSH boot manifest batches are malformed");
			if (batch.entries.includes(MOBILE_LAYOUT_MODULE)) layoutBatches.push(batch);
		}
		if (layoutBatches.length !== 1 || layoutBatches[0]?.phase !== "application") throw new Error("upstream DSH boot manifest has no unique application layout batch");
		const layoutBatch = layoutBatches[0];
		const planEntries = layoutBatch.entries.map((id) => {
			const entry = entryById.get(id);
			if (entry === void 0 || typeof entry.url !== "string" || typeof entry.rev !== "string") throw new Error("upstream DSH boot manifest batches are malformed");
			return Object.freeze({
				id,
				url: entry.url,
				rev: entry.rev
			});
		});
		const revision = revisionedMobileBatchPath(planEntries);
		layoutBatch.url = revision.path;
		layoutBatch.rev = revision.key;
		mobileBatch = Object.freeze({
			...revision,
			entries: Object.freeze(planEntries)
		});
		parsed.rev = createHash("sha256").update(JSON.stringify({
			entries,
			batches
		})).digest("hex").slice(0, 16);
	}
	const replacement = `${remoteSettings ? MOBILE_AUTHENTICATED_TRANSPORT_BOOTSTRAP : ""}${MOBILE_CSRF_FETCH_BOOTSTRAP}window.__DSH_MOBILE_FRONTEND__="dedicated";${assignment[0]}${JSON.stringify(parsed)};`;
	return Object.freeze({
		html: ensureMobileViewport(`${html.slice(0, start)}${replacement}${html.slice(scriptEnd)}`),
		...mobileBatch === void 0 ? {} : { batch: mobileBatch }
	});
}
/** Replace only DSH's layout client module while retaining its complete plugin graph. */
function rewriteMobileIndex(html) {
	return rewriteMobileIndexWithBatch(html).html;
}
const PAIR_SCRIPT = `(() => {
  const form = document.getElementById('pair-form')
  const token = document.getElementById('pair-token')
  const label = document.getElementById('device-label')
  const status = document.getElementById('pair-status')
  const fragment = new URLSearchParams(location.hash.slice(1))
  const supplied = fragment.get('token')
  history.replaceState(null, '', location.pathname)
  if (supplied) token.value = supplied
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    status.value = 'Pairing…'
    const response = await fetch('/mobile-access/auth/pair', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: token.value, label: label.value || undefined }),
    })
    if (!response.ok) {
      status.value = 'Pairing failed'
      return
    }
    location.replace('/')
  })
})()
`;
const LOGIN_PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Reconnect DSH mobile access</title>
<main>
  <h1>Reconnect this device</h1>
  <p id="login-progress">Restoring the secure Session…</p>
  <section id="login-failed" hidden>
    <p>This device is no longer paired. Open pairing on the computer, then pair it again.</p>
    <a href="/mobile-access/pair">Open pairing</a>
  </section>
</main>
<script src="/mobile-access/login.js" defer><\/script>
</html>
`;
const LOGIN_SCRIPT = `(() => {
  const candidate = new URL(location.href).searchParams.get('return')
  let returnPath = '/'
  if (candidate && candidate.startsWith('/')) {
    try {
      const resolved = new URL(candidate, location.origin)
      const pathname = decodeURIComponent(resolved.pathname)
      if (resolved.origin === location.origin && pathname !== '/mobile-access'
        && !pathname.startsWith('/mobile-access/') && !pathname.includes('\\\\')) {
        returnPath = resolved.pathname + resolved.search + resolved.hash
      }
    } catch {
      // Malformed untrusted return targets keep the safe root default.
    }
  }
  fetch('/mobile-access/auth/renew', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  }).then((response) => {
    if (response.ok) {
      location.replace(returnPath)
      return
    }
    document.getElementById('login-progress').hidden = true
    document.getElementById('login-failed').hidden = false
  }).catch(() => {
    document.getElementById('login-progress').textContent = 'The computer is unavailable.'
  })
})()
`;
var ByteLimitTransform = class extends Transform {
	maximum;
	total = 0;
	constructor(maximum) {
		super();
		this.maximum = maximum;
	}
	_transform(chunk, encoding, callback) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
		this.total += buffer.length;
		if (this.total > this.maximum) {
			callback(new HttpError(413, "payload_too_large"));
			return;
		}
		callback(null, buffer);
	}
};
function stripIpv6Brackets(hostname) {
	return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}
function parsePemCertificates(contents, source) {
	const text = contents.toString("utf8");
	const pattern = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/gu;
	const blocks = text.match(pattern) ?? [];
	if (blocks.length === 0 || text.replace(pattern, "").trim() !== "") throw new Error(`${source} must contain only PEM certificates`);
	return blocks.map((pem) => {
		let certificate;
		try {
			certificate = new X509Certificate(pem);
		} catch (error) {
			throw new Error(`${source} contains an invalid certificate`, { cause: error });
		}
		return Object.freeze({
			pem: `${pem}\n`,
			certificate
		});
	});
}
function validateServerChain(chain) {
	const now = Date.now();
	for (const [index, entry] of chain.entries()) {
		if (Date.parse(entry.certificate.validFrom) > now || Date.parse(entry.certificate.validTo) <= now) throw new Error("TLS certificate chain contains a certificate that is not currently valid");
		if (index === 0) continue;
		if (entry.certificate.subject === entry.certificate.issuer && entry.certificate.verify(entry.certificate.publicKey)) throw new Error("TLS server certificate chain must not include a self-signed root");
		const child = chain[index - 1].certificate;
		if (!entry.certificate.ca || !child.checkIssued(entry.certificate) || !child.verify(entry.certificate.publicKey)) throw new Error("TLS server certificate chain is not an ordered leaf-to-intermediate chain");
	}
}
async function tlsOptions(config) {
	if (config.tls.mode === "disabled") throw new Error("TLS options requested for a disabled listener");
	const [certFile, key, additionalChainFile] = await Promise.all([
		readFile(config.tls.certFile),
		readFile(config.tls.keyFile),
		config.tls.caFile === void 0 ? Promise.resolve(void 0) : readFile(config.tls.caFile)
	]);
	const chain = [...parsePemCertificates(certFile, "tls.certFile"), ...additionalChainFile === void 0 ? [] : parsePemCertificates(additionalChainFile, "tls.caFile")];
	validateServerChain(chain);
	const leaf = chain[0].certificate;
	for (const authority of config.authorities) {
		const hostname = stripIpv6Brackets(authority.hostname);
		if ((isIP(hostname) === 0 ? leaf.checkHost(hostname) : leaf.checkIP(hostname)) === void 0) throw new Error(`TLS certificate does not cover configured authority ${hostname}`);
	}
	return {
		cert: chain.map((entry) => entry.pem).join(""),
		key,
		requestCert: false,
		minVersion: "TLSv1.2",
		maxHeaderSize: MAX_HEADER_BYTES
	};
}
function websocketAccept(key) {
	return createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, "ascii").digest("base64");
}
function headerValue(headers, name) {
	const value = headers[name];
	return Array.isArray(value) ? void 0 : value;
}
function hasToken(header, token) {
	return header?.split(",").some((value) => value.trim().toLowerCase() === token) ?? false;
}
function rejectUpgrade(socket, status, code) {
	if (socket.destroyed) return;
	const body = `${JSON.stringify({ error: code })}\n`;
	socket.end([
		`HTTP/1.1 ${String(status)} ${status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Bad Request"}`,
		"Connection: close",
		"Cache-Control: no-store",
		"Content-Type: application/json; charset=utf-8",
		"Referrer-Policy: no-referrer",
		"X-Content-Type-Options: nosniff",
		`Content-Length: ${String(Buffer.byteLength(body))}`,
		"",
		body
	].join("\r\n"));
}
function sanitizeRequestHeaders(request, upstream) {
	const headers = { host: upstream.host };
	if (request.headers.origin !== void 0) headers.origin = upstream.origin;
	if (request.headers["sec-fetch-site"] !== void 0) headers["sec-fetch-site"] = "same-origin";
	for (const name of [
		"accept",
		"accept-encoding",
		"accept-language",
		"content-encoding",
		"content-length",
		"content-type",
		"if-match",
		"if-modified-since",
		"if-none-match",
		"if-unmodified-since",
		"range",
		"user-agent"
	]) {
		const value = request.headers[name];
		if (value !== void 0) headers[name] = value;
	}
	return headers;
}
const BLOCKED_RESPONSE_HEADERS = /* @__PURE__ */ new Set([
	"alt-svc",
	"cache-control",
	"connection",
	"content-security-policy",
	"content-security-policy-report-only",
	"cross-origin-embedder-policy",
	"cross-origin-opener-policy",
	"cross-origin-resource-policy",
	"expires",
	"keep-alive",
	"nel",
	"permissions-policy",
	"pragma",
	"proxy-authenticate",
	"referrer-policy",
	"report-to",
	"reporting-endpoints",
	"server",
	"set-cookie",
	"strict-transport-security",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"via",
	"x-content-type-options",
	"x-frame-options",
	"x-powered-by"
]);
function sanitizeResponseHeaders(headers, upstream) {
	const clean = {};
	for (const [name, value] of Object.entries(headers)) {
		const lower = name.toLowerCase();
		if (value === void 0 || BLOCKED_RESPONSE_HEADERS.has(lower) || lower.startsWith("access-control-")) continue;
		if (lower === "location" && typeof value === "string") {
			try {
				const location = new URL(value, upstream);
				clean.location = location.origin === upstream.origin ? `${location.pathname}${location.search}${location.hash}` : value;
			} catch {
				continue;
			}
			continue;
		}
		clean[lower] = value;
	}
	return clean;
}
function acceptsGzip(header) {
	if (header === void 0) return false;
	let wildcard;
	for (const entry of header.split(",")) {
		const [rawName, ...parameters] = entry.split(";");
		const name = rawName?.trim().toLowerCase();
		if (name === void 0 || name === "") continue;
		let quality = 1;
		for (const parameter of parameters) {
			const match = /^\s*q\s*=\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*$/iu.exec(parameter);
			if (match !== null) quality = Number(match[1]);
		}
		if (name === "gzip") return quality > 0;
		if (name === "*") wildcard = quality > 0;
	}
	return wildcard ?? false;
}
function isCompressibleContentType(value) {
	const contentType = Array.isArray(value) ? value[0] : value;
	if (contentType === void 0) return false;
	const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
	return mediaType.startsWith("text/") || /^(?:application\/(?:javascript|json|xml|x-javascript)|image\/svg\+xml)$/u.test(mediaType);
}
function shouldCompressResponse(request, response) {
	const pathname = request.url?.split("?", 1)[0] ?? "";
	return (request.method === "GET" && (pathname.startsWith("/plugins/") || pathname.startsWith("/assets/")) || request.method === "POST" && pathname === SESSION_HISTORY_PATH) && response.statusCode === 200 && request.headers.range === void 0 && response.headers["content-range"] === void 0 && response.headers["content-encoding"] === void 0 && acceptsGzip(request.headers["accept-encoding"]) && isCompressibleContentType(response.headers["content-type"]);
}
function revisionedStaticCacheControl(request) {
	if (request.method !== "GET" && request.method !== "HEAD") return void 0;
	let target;
	try {
		target = new URL(request.url ?? "/", "https://dsh-mobile.invalid");
	} catch {
		return;
	}
	const revision = target.searchParams.get("rev");
	const hasRevision = revision !== null && /^[a-z0-9_-]{4,128}$/iu.test(revision);
	const hashedAsset = /^\/assets\/.*-[a-z0-9_-]{8,}\.[a-z0-9]+$/iu.test(target.pathname);
	if (!(target.pathname.startsWith("/plugins/") && hasRevision) && !(target.pathname.startsWith("/assets/") && (hasRevision || hashedAsset))) return void 0;
	return "private, max-age=31536000, immutable";
}
function isJsonRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function mobileHistoryRequestBody(request, body) {
	if (request.method !== "POST" || request.url?.split("?", 1)[0] !== SESSION_HISTORY_PATH) return body;
	let parsed;
	try {
		parsed = JSON.parse(body.toString("utf8"));
	} catch {
		return body;
	}
	if (!isJsonRecord(parsed) || parsed.method !== "session.history" || !isJsonRecord(parsed.payload)) return body;
	const requested = parsed.payload.maxMessages;
	if (typeof requested === "number" && Number.isInteger(requested) && requested > 0 && requested <= MOBILE_HISTORY_PAGE_MESSAGES) return body;
	return Buffer.from(JSON.stringify({
		...parsed,
		payload: {
			...parsed.payload,
			maxMessages: MOBILE_HISTORY_PAGE_MESSAGES
		}
	}));
}
function addVaryAcceptEncoding(headers) {
	const existing = headers.vary;
	const values = (Array.isArray(existing) ? existing.map((value) => String(value)) : existing === void 0 ? [] : [String(existing)]).flatMap((value) => value.split(",").map((part) => part.trim()).filter(Boolean));
	if (!values.some((value) => value.toLowerCase() === "accept-encoding")) values.push("Accept-Encoding");
	headers.vary = values.join(", ");
}
function requestCookies(request) {
	const cookies = parseCookies(request.headers.cookie);
	if (cookies === void 0) throw new HttpError(401, "authentication_failed");
	return cookies;
}
function mapError(error) {
	if (error instanceof HttpError) return error;
	if (error instanceof AccessError) return new HttpError(error.status, error.code);
	if (error instanceof MobileExtensionError) return new HttpError(error.status, error.code);
	return new HttpError(500, "internal_error");
}
function requestAbortedError() {
	const error = /* @__PURE__ */ new Error("request aborted");
	error.name = "AbortError";
	return error;
}
function isTransientUpstreamError(error) {
	if (!(error instanceof Error)) return false;
	const code = error.code;
	return typeof code === "string" && TRANSIENT_UPSTREAM_ERROR_CODES.has(code);
}
function upstreamTimeoutError() {
	const error = /* @__PURE__ */ new Error("upstream timeout");
	error.code = "ETIMEDOUT";
	return error;
}
function waitForAbortableDelay(delayMs, signal) {
	if (signal.aborted) return Promise.reject(requestAbortedError());
	return new Promise((resolve, reject) => {
		const aborted = () => {
			clearTimeout(timer);
			reject(requestAbortedError());
		};
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", aborted);
			resolve();
		}, delayMs);
		signal.addEventListener("abort", aborted, { once: true });
	});
}
function waitForRequestTask(task, signal) {
	if (signal.aborted) return Promise.reject(requestAbortedError());
	return new Promise((resolve, reject) => {
		const aborted = () => {
			reject(requestAbortedError());
		};
		signal.addEventListener("abort", aborted, { once: true });
		task.then((value) => {
			signal.removeEventListener("abort", aborted);
			resolve(value);
		}, (error) => {
			signal.removeEventListener("abort", aborted);
			reject(error);
		});
	});
}
function discoveryDeviceName() {
	const value = hostname().trim().replaceAll(/[\u0000-\u001f\u007f]/gu, "");
	return (value === "" ? "DeepSeek Harness" : value).slice(0, 63);
}
function discoveryMdnsHost(instanceId) {
	const label = hostname().toLowerCase().replaceAll(/[^a-z0-9-]/gu, "-").replaceAll(/^-+|-+$/gu, "").slice(0, 40);
	return `${label === "" ? "dsh" : label}-${instanceId.slice(0, 8)}.local`;
}
function discoveryBroadcastTargets(cidrs) {
	const targets = /* @__PURE__ */ new Set(["255.255.255.255"]);
	for (const cidr of cidrs) {
		if (cidr.bits !== 32 || cidr.prefix >= 32) continue;
		const hostBits = BigInt(32 - cidr.prefix);
		const broadcast = cidr.network | (1n << hostBits) - 1n;
		targets.add([
			24n,
			16n,
			8n,
			0n
		].map((shift) => Number(broadcast >> shift & 255n)).join("."));
	}
	return [...targets];
}
function extensionTarget(pathname) {
	const prefix = `${AUTH_PREFIX}/extensions`;
	if (pathname === prefix || pathname === `${prefix}/` || pathname === `${prefix}/manifest`) return { kind: "manifest" };
	if (pathname === `${prefix}/events`) return { kind: "events" };
	if (!pathname.startsWith(`${prefix}/`)) return void 0;
	const parts = pathname.slice(prefix.length + 1).split("/");
	const id = parts.shift();
	if (id === void 0 || !/^[a-z][a-z0-9-]{0,63}$/u.test(id)) return void 0;
	const leaf = parts.shift();
	if (leaf === "mobile.js" && parts.length === 0) return {
		kind: "script",
		id
	};
	if (leaf === "mobile.css" && parts.length === 0) return {
		kind: "style",
		id
	};
	if (leaf === "assets" && parts.length > 0) return {
		kind: "asset",
		id,
		path: parts.join("/")
	};
	if (leaf === "actions" && parts.length === 1 && /^[a-z][a-z0-9-]{0,63}$/u.test(parts[0])) return {
		kind: "action",
		id,
		action: parts[0]
	};
	if (leaf === "routes") return {
		kind: "route",
		id,
		path: `/${parts.join("/")}`.replace(/\/{2,}/gu, "/")
	};
}
const EXTENSION_GENERATION_HEADER = "x-dsh-mobile-extension-generation";
function extensionGeneration(value) {
	if (value === void 0) return void 0;
	if (!/^[a-f\d]{64}$/u.test(value)) throw new HttpError(400, "invalid_extension_generation");
	return value;
}
function mobileBootBatchKey(pathname) {
	return new RegExp(`^${MOBILE_BOOT_BATCH_PREFIX.replaceAll("/", "\\/")}([a-f\\d]{64})\\.js$`, "u").exec(pathname)?.[1];
}
function assertBoundedContentLength(request, maximum) {
	const declared = request.headers["content-length"];
	if (declared !== void 0 && (!/^\d+$/u.test(declared) || Number(declared) > maximum)) throw new HttpError(413, "payload_too_large");
}
async function readBoundedBody(request, maximum) {
	assertBoundedContentLength(request, maximum);
	const chunks = [];
	let total = 0;
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		total += buffer.length;
		if (total > maximum) throw new HttpError(413, "payload_too_large");
		chunks.push(buffer);
	}
	return Buffer.concat(chunks);
}
function extensionRequestHeaders(headers) {
	const allowed = /* @__PURE__ */ new Set([
		"accept",
		"content-type",
		"content-length",
		"content-range",
		"range",
		"if-none-match",
		"if-modified-since"
	]);
	const output = {};
	for (const [name, value] of Object.entries(headers)) {
		if (!allowed.has(name) || typeof value !== "string") continue;
		output[name] = value;
	}
	return Object.freeze(output);
}
function extensionContentType(path) {
	return {
		".css": "text/css; charset=utf-8",
		".csv": "text/csv; charset=utf-8",
		".gif": "image/gif",
		".html": "text/html; charset=utf-8",
		".jpeg": "image/jpeg",
		".jpg": "image/jpeg",
		".js": "text/javascript; charset=utf-8",
		".json": "application/json; charset=utf-8",
		".png": "image/png",
		".svg": "image/svg+xml",
		".webp": "image/webp"
	}[extname(path).toLowerCase()] ?? "application/octet-stream";
}
/** Authenticated TLS edge in front of the ordinary loopback-only DSH Web server. */
var MobileAccessGateway = class {
	config;
	extensions;
	upstreamAuthenticatedUrl;
	extraWebSocketPaths;
	blockedUpgradeLog;
	access;
	listenerTlsEnabled;
	tlsEnabled;
	policy;
	server;
	discoverySocket;
	discoveryTimer;
	bonjour;
	pairingCaCertificate;
	listenerPort;
	connectedSockets = /* @__PURE__ */ new Set();
	activeRequests = /* @__PURE__ */ new Map();
	activeWebSockets = /* @__PURE__ */ new Map();
	mobileBootBatches = /* @__PURE__ */ new Map();
	extensionEventListeners = /* @__PURE__ */ new Set();
	extensionEventRevision = 0;
	taskEventListeners = /* @__PURE__ */ new Set();
	extensionChangeTimer;
	extensionChangeTask;
	legacyCustomDigest = "";
	upstreamCookie;
	upstreamCookieExpiresAt = 0;
	upstreamCookieTask;
	upstreamAuthRequest;
	nextOperationId = 1;
	closing = false;
	started = false;
	closeTask;
	removeSessionListener;
	removeExtensionContentListener;
	renewLimiter;
	constructor(config, store, extensions, upstreamAuthenticatedUrl, extraWebSocketPaths, blockedUpgradeLog) {
		this.config = config;
		this.extensions = extensions;
		this.upstreamAuthenticatedUrl = upstreamAuthenticatedUrl;
		this.extraWebSocketPaths = extraWebSocketPaths;
		this.blockedUpgradeLog = blockedUpgradeLog;
		this.listenerTlsEnabled = config.tls.mode === "provided";
		this.tlsEnabled = config.publicTls;
		this.access = new AccessController(store, {
			pairingTtlMs: config.pairingTtlMs,
			deviceTtlMs: config.deviceTtlMs,
			sessionTtlMs: config.sessionTtlMs,
			maxDevices: config.maxDevices,
			maxSessions: config.maxSessions,
			rateLimitWindowMs: config.rateLimitWindowMs,
			maxPairingAttempts: config.maxPairingAttempts,
			maxRateLimitKeys: config.maxRateLimitKeys
		});
		this.renewLimiter = new BoundedRateLimiter(Math.min(100, config.maxPairingAttempts * 4), config.rateLimitWindowMs, config.maxRateLimitKeys);
		this.removeSessionListener = this.access.onSessionEnded((authorization) => {
			this.abortSessionResources(authorization.sessionKey);
		});
		this.removeExtensionContentListener = this.extensions?.onContentChanged(() => {
			this.broadcastExtensionChange();
		}) ?? (() => void 0);
	}
	/** Initialize durable state, validate TLS, and bind the externally reachable listener. */
	async start() {
		if (this.started || this.server !== void 0) throw new Error("mobile-access gateway cannot be started twice");
		this.started = true;
		await this.access.initialize();
		try {
			if (this.config.pairingCaFile !== void 0) {
				const certificate = new X509Certificate(await readFile(this.config.pairingCaFile));
				const fingerprint = certificate.fingerprint256.replaceAll(":", "").toLowerCase();
				if (!certificate.ca || certificate.subject !== certificate.issuer || !certificate.verify(certificate.publicKey) || fingerprint !== this.config.instanceId) throw new Error("pairingCaFile must be the self-signed CA identified by instanceId");
				this.pairingCaCertificate = certificate.raw.toString("base64");
			}
			const handler = (request, response) => {
				this.handleExternalRequest(request, response).catch((error) => {
					const mapped = mapError(error);
					if (response.headersSent) response.destroy();
					else sendFailure(response, mapped.status, mapped.code, this.tlsEnabled);
				});
			};
			const server = this.listenerTlsEnabled ? createServer$2(await tlsOptions(this.config), handler) : createServer$1({ maxHeaderSize: MAX_HEADER_BYTES }, handler);
			this.server = server;
			server.maxHeadersCount = 64;
			server.maxConnections = this.config.maxConnections;
			server.headersTimeout = 1e4;
			server.requestTimeout = this.config.upstreamTimeoutMs;
			server.keepAliveTimeout = 5e3;
			server.on("connection", (socket) => {
				if (this.connectedSockets.size >= this.config.maxConnections) {
					socket.destroy();
					return;
				}
				this.connectedSockets.add(socket);
				socket.on("error", () => {
					socket.destroy();
				});
				socket.once("close", () => {
					this.connectedSockets.delete(socket);
				});
			});
			server.on("connect", (_request, socket) => {
				socket.destroy();
			});
			server.on("upgrade", (request, socket, head) => {
				this.handleUpgrade(request, socket, head).catch((error) => {
					const mapped = mapError(error);
					rejectUpgrade(socket, mapped.status, mapped.code);
				});
			});
			server.on("clientError", (_error, socket) => {
				rejectUpgrade(socket, 400, "bad_request");
			});
			await new Promise((resolve, reject) => {
				const failed = (error) => {
					reject(error);
				};
				server.once("error", failed);
				server.listen(this.config.listenPort, this.config.listenHost, () => {
					server.off("error", failed);
					resolve();
				});
			});
			const address = server.address();
			if (address === null || typeof address === "string") throw new Error("gateway listener has no TCP address");
			this.listenerPort = address.port;
			this.policy = new RequestTrustPolicy(this.config.authorities, address.port, this.config.allowedCidrs, this.tlsEnabled);
			if (this.config.discovery) await this.startDiscovery(address.port);
			await this.pollLegacyCustomChanges();
			this.extensionChangeTimer = setInterval(() => {
				this.pollLegacyCustomChanges();
			}, EXTENSION_CHANGE_POLL_MS);
			this.extensionChangeTimer.unref();
		} catch (error) {
			await this.closeFailedStart();
			throw error;
		}
	}
	async startDiscovery(port) {
		const socket = createSocket("udp4");
		this.discoverySocket = socket;
		const announcement = this.discoveryAnnouncement(port);
		socket.on("message", (message, remote) => {
			if (this.closing || !message.equals(DISCOVERY_QUERY) || !addressAllowed(remote.address, this.config.allowedCidrs)) return;
			socket.send(announcement, remote.port, remote.address, () => void 0);
		});
		await new Promise((resolve, reject) => {
			const failed = (error) => {
				reject(error);
			};
			socket.once("error", failed);
			const bindHost = isIP(this.config.listenHost) === 4 && isLoopbackAddress(this.config.listenHost) ? this.config.listenHost : "0.0.0.0";
			socket.bind(port, bindHost, () => {
				socket.off("error", failed);
				socket.setBroadcast(true);
				resolve();
			});
		});
		const announce = () => {
			for (const target of discoveryBroadcastTargets(this.config.allowedCidrs)) socket.send(announcement, port, target, () => void 0);
		};
		announce();
		this.discoveryTimer = setInterval(announce, DISCOVERY_INTERVAL_MS);
		this.discoveryTimer.unref();
		const deviceName = discoveryDeviceName();
		const bonjour = new Bonjour({ disableIPv6: true });
		this.bonjour = bonjour;
		bonjour.publish({
			name: `${deviceName} (${this.config.instanceId.slice(0, 8)})`,
			type: MDNS_SERVICE_TYPE,
			protocol: "tcp",
			port,
			host: discoveryMdnsHost(this.config.instanceId),
			disableIPv6: true,
			txt: {
				deviceName,
				origin: this.address().origin,
				instanceId: this.config.instanceId,
				protocol: String(DISCOVERY_PROTOCOL)
			}
		});
	}
	discoveryAnnouncement(port) {
		return Buffer.from(JSON.stringify({
			deviceName: discoveryDeviceName(),
			origin: this.address().origin,
			port,
			protocol: DISCOVERY_PROTOCOL,
			instanceId: this.config.instanceId
		}), "utf8");
	}
	async closeFailedStart() {
		if (this.extensionChangeTimer !== void 0) clearInterval(this.extensionChangeTimer);
		this.extensionChangeTimer = void 0;
		this.removeExtensionContentListener();
		if (this.discoveryTimer !== void 0) clearInterval(this.discoveryTimer);
		this.discoveryTimer = void 0;
		await this.closeBonjour();
		this.discoverySocket?.close();
		this.discoverySocket = void 0;
		for (const socket of this.connectedSockets) socket.destroy();
		const server = this.server;
		this.server = void 0;
		if (server?.listening === true) await new Promise((resolve) => {
			server.close(() => resolve());
		});
		await this.access.close();
	}
	async closeBonjour() {
		const bonjour = this.bonjour;
		this.bonjour = void 0;
		if (bonjour === void 0) return;
		await new Promise((resolve) => {
			bonjour.unpublishAll(() => {
				bonjour.destroy(() => resolve());
			});
		});
	}
	/** Actual bound address, available after start and safe for loopback status output. */
	address() {
		if (this.listenerPort === void 0 || this.policy === void 0) throw new Error("gateway is not listening");
		const origin = this.policy.origins.values().next().value;
		if (origin === void 0) throw new Error("gateway has no public authority");
		return Object.freeze({
			host: this.config.listenHost,
			port: this.listenerPort,
			origin
		});
	}
	requirePolicy() {
		if (this.policy === void 0 || this.closing) throw new HttpError(503, "unavailable");
		return this.policy;
	}
	authorize(request) {
		const sessionToken = requestCookies(request).get(SESSION_COOKIE);
		if (sessionToken === void 0) throw new HttpError(401, "authentication_failed");
		return this.access.authorizeSession(sessionToken);
	}
	requireCsrf(request, authorization) {
		const value = headerValue(request.headers, CSRF_HEADER);
		this.access.assertCsrf(authorization, value);
	}
	setSessionCookies(response, result, now) {
		const maxAge = (result.sessionExpiresAt - now) / 1e3;
		response.setHeader("Set-Cookie", [cookie(SESSION_COOKIE, result.sessionToken, {
			tls: this.tlsEnabled,
			httpOnly: true,
			path: "/",
			maxAgeSeconds: maxAge
		}), cookie(CSRF_COOKIE, result.csrfToken, {
			tls: this.tlsEnabled,
			httpOnly: false,
			path: "/",
			maxAgeSeconds: maxAge
		})]);
	}
	async handlePair(request, response) {
		const body = await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
		if (typeof body.token !== "string" || body.label !== void 0 && typeof body.label !== "string") throw new HttpError(400, "bad_request");
		const result = await this.access.pair(request.socket.remoteAddress ?? "unknown", body.token, body.label);
		const now = Date.now();
		this.setSessionCookies(response, result, now);
		const sessionCookies = response.getHeader("Set-Cookie");
		response.setHeader("Set-Cookie", [...sessionCookies, cookie(DEVICE_COOKIE, result.deviceToken, {
			tls: this.tlsEnabled,
			httpOnly: true,
			path: "/mobile-access/auth/renew",
			maxAgeSeconds: (result.deviceExpiresAt - now) / 1e3
		})]);
		sendJson(response, 201, {
			paired: true,
			deviceId: result.deviceId,
			csrfToken: result.csrfToken,
			sessionExpiresAt: result.sessionExpiresAt
		}, this.tlsEnabled);
	}
	async handleRenew(request, response) {
		if (!this.renewLimiter.take(request.socket.remoteAddress ?? "unknown", Date.now())) throw new HttpError(429, "rate_limited");
		await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
		const deviceToken = requestCookies(request).get(DEVICE_COOKIE);
		if (deviceToken === void 0) throw new HttpError(401, "authentication_failed");
		let result;
		try {
			result = await this.access.renew(deviceToken);
		} catch (error) {
			if (error instanceof AccessError && error.status === 401) response.setHeader("Set-Cookie", cookie(DEVICE_COOKIE, "", {
				tls: this.tlsEnabled,
				httpOnly: true,
				path: "/mobile-access/auth/renew",
				maxAgeSeconds: 0
			}));
			throw error;
		}
		this.setSessionCookies(response, result, Date.now());
		sendJson(response, 200, {
			renewed: true,
			deviceId: result.deviceId,
			csrfToken: result.csrfToken,
			sessionExpiresAt: result.sessionExpiresAt
		}, this.tlsEnabled);
	}
	async handleNativePair(request, response) {
		const body = await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
		if (typeof body.token !== "string" || body.label !== void 0 && typeof body.label !== "string") throw new HttpError(400, "bad_request");
		const result = await this.access.pair(request.socket.remoteAddress ?? "unknown", body.token, body.label);
		sendJson(response, 201, {
			instanceId: this.config.instanceId,
			deviceId: result.deviceId,
			deviceToken: result.deviceToken,
			deviceExpiresAt: result.deviceExpiresAt,
			sessionToken: result.sessionToken,
			csrfToken: result.csrfToken,
			sessionExpiresAt: result.sessionExpiresAt
		}, this.tlsEnabled);
	}
	async handleNativeRenew(request, response) {
		if (!this.renewLimiter.take(request.socket.remoteAddress ?? "unknown", Date.now())) throw new HttpError(429, "rate_limited");
		const body = await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
		if (typeof body.deviceToken !== "string") throw new HttpError(400, "bad_request");
		const result = await this.access.renew(body.deviceToken);
		sendJson(response, 200, {
			instanceId: this.config.instanceId,
			deviceId: result.deviceId,
			sessionToken: result.sessionToken,
			csrfToken: result.csrfToken,
			sessionExpiresAt: result.sessionExpiresAt
		}, this.tlsEnabled);
	}
	async handleLogout(request, response) {
		await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
		const authorization = this.authorize(request);
		this.requireCsrf(request, authorization);
		this.access.logout(authorization);
		response.setHeader("Set-Cookie", [cookie(SESSION_COOKIE, "", {
			tls: this.tlsEnabled,
			httpOnly: true,
			path: "/",
			maxAgeSeconds: 0
		}), cookie(CSRF_COOKIE, "", {
			tls: this.tlsEnabled,
			httpOnly: false,
			path: "/",
			maxAgeSeconds: 0
		})]);
		sendJson(response, 200, { loggedOut: true }, this.tlsEnabled);
	}
	async handleExternalRequest(request, response) {
		const target = parseRequestTarget(request.url);
		const policy = this.requirePolicy();
		const isMutation = request.method !== "GET" && request.method !== "HEAD";
		assertExternalTrust(request, policy, isMutation);
		if (target.decodedPathname === "/api/mobile-access" || target.decodedPathname.startsWith(`/api/mobile-access/`)) throw new HttpError(404, "not_found");
		if (request.method === "TRACE" || request.method === "CONNECT") throw new HttpError(405, "method_not_allowed");
		if (target.search === "" && request.method === "GET" && target.decodedPathname === `/mobile-access/health`) {
			sendJson(response, 200, { ok: true }, this.tlsEnabled);
			return;
		}
		if (target.search === "" && request.method === "GET" && target.decodedPathname === `/mobile-access/metadata`) {
			sendJson(response, 200, {
				version: 1,
				pluginVersion: DSH_MOBILE_VERSION,
				minimumAndroidAppVersion: MINIMUM_ANDROID_APP_VERSION,
				discoveryProtocol: DISCOVERY_PROTOCOL
			}, this.tlsEnabled);
			return;
		}
		if (target.search === "" && request.method === "GET" && target.decodedPathname === `/mobile-access/discovery`) {
			sendJson(response, 200, {
				deviceName: discoveryDeviceName(),
				origin: this.address().origin,
				port: this.address().port,
				protocol: DISCOVERY_PROTOCOL,
				instanceId: this.config.instanceId
			}, this.tlsEnabled);
			return;
		}
		if (target.search === "" && request.method === "GET" && target.decodedPathname === `/mobile-access/ca.cer`) {
			if (this.pairingCaCertificate === void 0) throw new HttpError(404, "not_found");
			const body = Buffer.from(this.pairingCaCertificate, "base64");
			setSecurityHeaders(response, this.tlsEnabled);
			response.writeHead(200, {
				"Content-Type": "application/pkix-cert",
				"Content-Length": body.length,
				"Cache-Control": "no-store"
			});
			response.end(body);
			return;
		}
		if (target.search === "" && request.method === "GET" && (target.decodedPathname === `/mobile-access/pair` || target.decodedPathname === `/mobile-access/pair.js`)) {
			if (!this.access.pairingStatus().open) throw new HttpError(404, "not_found");
			setSecurityHeaders(response, this.tlsEnabled);
			const body = target.decodedPathname.endsWith(".js") ? PAIR_SCRIPT : PAIR_PAGE;
			response.writeHead(200, {
				"Content-Type": target.decodedPathname.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8",
				"Content-Length": Buffer.byteLength(body)
			});
			response.end(body);
			return;
		}
		if (request.method === "GET" && (target.decodedPathname === `/mobile-access/login` || target.decodedPathname === `/mobile-access/login.js`)) {
			if (target.decodedPathname.endsWith(".js") && target.search !== "") throw new HttpError(400, "bad_request");
			setSecurityHeaders(response, this.tlsEnabled);
			const body = target.decodedPathname.endsWith(".js") ? LOGIN_SCRIPT : LOGIN_PAGE;
			response.writeHead(200, {
				"Content-Type": target.decodedPathname.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8",
				"Content-Length": Buffer.byteLength(body)
			});
			response.end(body);
			return;
		}
		if (target.search === "" && request.method === "POST" && target.decodedPathname === `/mobile-access/auth/pair`) {
			await this.handlePair(request, response);
			return;
		}
		if (target.search === "" && request.method === "POST" && target.decodedPathname === `/mobile-access/auth/renew`) {
			await this.handleRenew(request, response);
			return;
		}
		if (target.search === "" && request.method === "POST" && target.decodedPathname === `/mobile-access/auth/native-pair`) {
			await this.handleNativePair(request, response);
			return;
		}
		if (target.search === "" && request.method === "POST" && target.decodedPathname === `/mobile-access/auth/native-renew`) {
			await this.handleNativeRenew(request, response);
			return;
		}
		if (target.search === "" && request.method === "POST" && target.decodedPathname === `/mobile-access/auth/logout`) {
			await this.handleLogout(request, response);
			return;
		}
		const computerImages = request.method === "GET" && target.decodedPathname === `/mobile-access/computer-images`;
		const computerImage = request.method === "GET" && target.decodedPathname === `/mobile-access/computer-image`;
		const requestedExtension = extensionTarget(target.decodedPathname);
		const requestedMobileBootBatch = mobileBootBatchKey(target.decodedPathname);
		const customAsset = request.method === "GET" ? target.decodedPathname === `/mobile-access/custom.css` ? {
			file: this.config.customCssFile,
			contentType: "text/css; charset=utf-8",
			fallback: CUSTOM_STYLE_FALLBACK
		} : target.decodedPathname === `/mobile-access/custom.js` ? {
			file: this.config.customScriptFile,
			contentType: "text/javascript; charset=utf-8",
			fallback: CUSTOM_SCRIPT_FALLBACK
		} : target.decodedPathname === MOBILE_LAYOUT_PATH ? {
			file: this.config.mobileLayoutFile,
			contentType: "text/javascript; charset=utf-8",
			fallback: void 0
		} : void 0 : void 0;
		if (customAsset === void 0 && requestedMobileBootBatch === void 0 && !computerImages && !computerImage && extensionTarget(target.decodedPathname) === void 0 && (target.decodedPathname === "/mobile-access" || target.decodedPathname.startsWith(`/mobile-access/`))) throw new HttpError(404, "not_found");
		if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "POST" && requestedExtension?.kind !== "route") throw new HttpError(405, "method_not_allowed");
		let authorization;
		try {
			authorization = this.authorize(request);
		} catch (error) {
			const mapped = mapError(error);
			const acceptsHtml = request.headers.accept?.split(",").some((value) => value.trim().split(";", 1)[0] === "text/html") ?? false;
			const topLevel = request.method === "GET" && acceptsHtml && (request.headers["sec-fetch-dest"] === void 0 || request.headers["sec-fetch-dest"] === "document") && target.decodedPathname !== "/api" && !target.decodedPathname.startsWith("/api/");
			if (mapped.status === 401 && topLevel) {
				const returnPath = target.raw.length <= 2048 ? target.raw : "/";
				setSecurityHeaders(response, this.tlsEnabled);
				response.writeHead(302, {
					Location: `${AUTH_PREFIX}/login?return=${encodeURIComponent(returnPath)}`,
					"Content-Length": 0
				});
				response.end();
				return;
			}
			throw error;
		}
		if (isMutation) this.requireCsrf(request, authorization);
		const extension = requestedExtension;
		if (extension !== void 0) {
			await this.handleExtensionRequest(extension, target, request, response, authorization);
			return;
		}
		if (requestedMobileBootBatch !== void 0) {
			await this.serveMobileBootBatch(requestedMobileBootBatch, request, response, authorization);
			return;
		}
		if (customAsset !== void 0) {
			const operation = this.allocateRequest(authorization, response, {});
			try {
				let body;
				let mtime;
				try {
					body = await readFile(customAsset.file, { signal: operation.signal });
					try {
						mtime = (await stat(customAsset.file)).mtime;
					} catch {}
				} catch (error) {
					if (error.code !== "ENOENT") throw error;
					if (customAsset.fallback === void 0) throw new HttpError(503, "mobile_frontend_unavailable");
					body = Buffer.from(customAsset.fallback);
				}
				if (body.byteLength > 262144) throw new HttpError(413, "payload_too_large");
				const etag = createHash("sha256").update(body).digest("hex");
				const ifNoneMatch = headerValue(request.headers, "if-none-match");
				if (ifNoneMatch !== void 0 && ifNoneMatch === etag) {
					setSecurityHeaders(response, this.tlsEnabled);
					response.writeHead(304);
					response.end();
					return;
				}
				setSecurityHeaders(response, this.tlsEnabled);
				const responseHeaders = {
					"Content-Type": customAsset.contentType,
					"Content-Length": body.byteLength,
					"ETag": etag
				};
				if (mtime !== void 0) responseHeaders["Last-Modified"] = mtime.toUTCString();
				response.writeHead(200, responseHeaders);
				response.end(body);
				return;
			} finally {
				operation.release();
			}
		}
		if (computerImages) {
			const operation = this.allocateRequest(authorization, response, {});
			try {
				const query = new URL(target.raw, this.address().origin).searchParams;
				sendJson(response, 200, await listComputerImages(query.get("path"), operation.signal), this.tlsEnabled);
				return;
			} finally {
				operation.release();
			}
		}
		if (computerImage) {
			const operation = this.allocateRequest(authorization, response, {});
			try {
				const query = new URL(target.raw, this.address().origin).searchParams;
				const image = await readComputerImage(query.get("path"), operation.signal);
				setSecurityHeaders(response, this.tlsEnabled);
				response.writeHead(200, {
					"Content-Type": image.contentType,
					"Content-Length": image.body.byteLength,
					"Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(image.name)}`
				});
				response.end(image.body);
				return;
			} finally {
				operation.release();
			}
		}
		const stockFrontend = new URL(target.raw, this.address().origin).searchParams.get("frontend") === "stock";
		const acceptsHtml = request.headers.accept?.split(",").some((value) => value.trim().split(";", 1)[0] === "text/html") ?? false;
		if (request.method === "GET" && acceptsHtml && !stockFrontend) {
			await this.proxyMobileIndex(request, response, authorization);
			return;
		}
		if (stockFrontend && target.decodedPathname === "/") request.url = "/";
		await this.proxyHttp(request, response, authorization);
	}
	async handleExtensionRequest(targetInfo, target, request, response, authorization) {
		const extensions = this.extensions;
		if (extensions === void 0) throw new HttpError(404, "not_found");
		if (targetInfo.kind === "events") {
			if (request.method !== "GET" || target.search !== "") throw new HttpError(request.method === "GET" ? 400 : 405, request.method === "GET" ? "bad_request" : "method_not_allowed");
			this.openExtensionEventStream(request, response, authorization);
			return;
		}
		if (targetInfo.kind === "manifest") {
			if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "method_not_allowed");
			const operation = this.allocateRequest(authorization, response, {});
			try {
				operation.signal.throwIfAborted();
				const customRevision = async (file, fallback) => {
					let source;
					try {
						source = await readFile(file, { signal: operation.signal });
					} catch (error) {
						if (error.code !== "ENOENT") throw error;
						source = Buffer.from(fallback);
					}
					if (source.byteLength > 262144) throw new HttpError(413, "payload_too_large");
					return createHash("sha256").update(source).digest("hex");
				};
				const [scriptRevision, styleRevision] = await Promise.all([customRevision(this.config.customScriptFile, CUSTOM_SCRIPT_FALLBACK), customRevision(this.config.customCssFile, CUSTOM_STYLE_FALLBACK)]);
				const body = Buffer.from(JSON.stringify({
					protocol: 1,
					extensions: extensions.manifest(),
					legacy: {
						scriptRevision,
						styleRevision
					}
				}));
				const etag = createHash("sha256").update(body).update(extensions.contentDigest()).digest("hex");
				if (headerValue(request.headers, "if-none-match") === etag) {
					setSecurityHeaders(response, this.tlsEnabled);
					response.writeHead(304);
					response.end();
					return;
				}
				setSecurityHeaders(response, this.tlsEnabled);
				response.writeHead(200, {
					"Content-Type": "application/json; charset=utf-8",
					"Content-Length": body.byteLength,
					ETag: etag
				});
				if (request.method === "HEAD") response.end();
				else response.end(body);
				return;
			} finally {
				operation.release();
			}
		}
		if (targetInfo.kind === "script" || targetInfo.kind === "style" || targetInfo.kind === "asset") {
			if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "method_not_allowed");
			const generation = extensionGeneration(new URLSearchParams(target.search).get("generation") ?? void 0);
			const operation = this.allocateRequest(authorization, response, {});
			try {
				const file = targetInfo.kind === "script" ? await extensions.readClientFile(targetInfo.id, "script", operation.signal, generation) : targetInfo.kind === "style" ? await extensions.readClientFile(targetInfo.id, "style", operation.signal, generation) : await extensions.readAsset(targetInfo.id, targetInfo.path ?? "", operation.signal, generation);
				if (headerValue(request.headers, "if-none-match") === file.digest) {
					setSecurityHeaders(response, this.tlsEnabled);
					response.writeHead(304);
					response.end();
					return;
				}
				const contentType = targetInfo.kind === "script" ? "text/javascript; charset=utf-8" : targetInfo.kind === "style" ? "text/css; charset=utf-8" : extensionContentType(targetInfo.path ?? "");
				setSecurityHeaders(response, this.tlsEnabled);
				response.writeHead(200, {
					"Content-Type": contentType,
					"Content-Length": file.body.byteLength,
					ETag: file.digest
				});
				if (request.method === "HEAD") response.end();
				else response.end(file.body);
				return;
			} finally {
				operation.release();
			}
		}
		if (targetInfo.kind === "action") {
			if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
			const maximum = 1048576;
			assertBoundedContentLength(request, maximum);
			const generation = extensionGeneration(headerValue(request.headers, EXTENSION_GENERATION_HEADER));
			const operation = this.allocateRequest(authorization, response, {});
			const abort = new AbortController();
			response.once("close", () => {
				abort.abort();
			});
			const generationSignal = extensions.signal(targetInfo.id, generation);
			const onGenerationAbort = () => {
				abort.abort();
				if (!response.destroyed) response.destroy();
			};
			generationSignal?.addEventListener("abort", onGenerationAbort, { once: true });
			try {
				const body = await readJsonObject(request, maximum);
				const result = await extensions.invoke(targetInfo.id, targetInfo.action, body, {
					signal: abort.signal,
					deviceId: authorization.deviceId
				}, generation);
				let serialized;
				try {
					serialized = Buffer.from(JSON.stringify(result));
				} catch {
					throw new MobileExtensionError("extension_failed", "extension action failed", 500);
				}
				if (serialized.byteLength > 4194304) throw new MobileExtensionError("extension_result_too_large", "extension result is too large", 500);
				sendJson(response, 200, result, this.tlsEnabled);
			} finally {
				generationSignal?.removeEventListener("abort", onGenerationAbort);
				abort.abort();
				operation.release();
			}
			return;
		}
		if (targetInfo.kind === "route") {
			const method = request.method ?? "GET";
			if (![
				"GET",
				"HEAD",
				"POST",
				"PUT",
				"PATCH",
				"DELETE"
			].includes(method)) throw new HttpError(405, "method_not_allowed");
			const hasBody = method !== "GET" && method !== "HEAD";
			if (hasBody) assertBoundedContentLength(request, this.config.maxBodyBytes);
			const generation = extensionGeneration(headerValue(request.headers, EXTENSION_GENERATION_HEADER));
			const operation = this.allocateRequest(authorization, response, {});
			const abort = new AbortController();
			response.once("close", () => {
				abort.abort();
			});
			const generationSignal = extensions.signal(targetInfo.id, generation);
			const onGenerationAbort = () => {
				abort.abort();
				if (!response.destroyed) response.destroy();
			};
			generationSignal?.addEventListener("abort", onGenerationAbort, { once: true });
			try {
				const body = hasBody ? await readBoundedBody(request, this.config.maxBodyBytes) : Buffer.alloc(0);
				const parsed = new URL(target.raw, this.address().origin);
				const routeRequest = {
					method,
					pathname: targetInfo.path,
					query: parsed.searchParams,
					headers: extensionRequestHeaders(request.headers),
					body,
					signal: abort.signal,
					deviceId: authorization.deviceId
				};
				const result = await extensions.route(targetInfo.id, method, targetInfo.path, routeRequest, generation);
				await this.sendExtensionResponse(response, result, request.method === "HEAD");
			} finally {
				generationSignal?.removeEventListener("abort", onGenerationAbort);
				abort.abort();
				operation.release();
			}
		}
	}
	async sendExtensionResponse(response, result, head) {
		const status = result.status ?? 200;
		if (!Number.isSafeInteger(status) || status < 200 || status > 599) throw new MobileExtensionError("invalid_route_response", "extension returned an invalid HTTP status", 500);
		const contentType = result.contentType ?? "application/octet-stream";
		if (contentType.length > 1024 || !/^[\x20-\x7e]+$/u.test(contentType) || !/^[\w!#$&+.^-]+\/[\w!#$&+.^-]+(?:;[\x20-\x7e]*)?$/u.test(contentType)) throw new MobileExtensionError("invalid_route_response", "extension returned an invalid content type", 500);
		const safeHeaders = {};
		for (const [name, value] of Object.entries(result.headers ?? {})) {
			if (!/^(?:content-disposition|cache-control|etag)$/iu.test(name) || /[\r\n]/u.test(value)) continue;
			safeHeaders[name] = value;
		}
		setSecurityHeaders(response, this.tlsEnabled);
		if (typeof result.body === "string" || result.body instanceof Uint8Array) {
			const body = typeof result.body === "string" ? Buffer.from(result.body) : Buffer.from(result.body);
			if (body.byteLength > 4194304) throw new MobileExtensionError("extension_result_too_large", "extension response is too large", 500);
			response.writeHead(status, {
				...safeHeaders,
				"Content-Type": contentType,
				"Content-Length": body.byteLength
			});
			if (head) response.end();
			else response.end(body);
			return;
		}
		response.writeHead(status, {
			...safeHeaders,
			"Content-Type": contentType
		});
		if (head) {
			result.body.destroy();
			response.end();
			return;
		}
		await pipeline(result.body, new ByteLimitTransform(4194304), response);
	}
	/** Exchange DSH's process-local launch token for an authority-bound cookie kept inside this gateway. */
	async upstreamCookieHeader() {
		if (this.upstreamAuthenticatedUrl === void 0) return void 0;
		if (this.upstreamCookie !== void 0 && this.upstreamCookieExpiresAt > Date.now() + UPSTREAM_AUTH_REFRESH_MARGIN_MS) return this.upstreamCookie;
		if (this.upstreamCookieTask !== void 0) return this.upstreamCookieTask;
		const task = this.exchangeUpstreamCookie();
		this.upstreamCookieTask = task;
		try {
			return await task;
		} finally {
			if (this.upstreamCookieTask === task) this.upstreamCookieTask = void 0;
		}
	}
	async exchangeUpstreamCookie() {
		const authenticatedUrl = this.upstreamAuthenticatedUrl;
		if (authenticatedUrl === void 0) throw new HttpError(502, "upstream_unavailable");
		let target;
		try {
			target = new URL(authenticatedUrl);
		} catch {
			throw new HttpError(502, "upstream_unavailable");
		}
		if (target.origin !== this.config.upstreamOrigin.origin || target.pathname !== "/" || target.hash !== "" || target.search === "") throw new HttpError(502, "upstream_unavailable");
		try {
			const proxied = await new Promise((resolve, reject) => {
				const upstreamRequest = request({
					protocol: "http:",
					hostname: stripIpv6Brackets(this.config.upstreamOrigin.hostname),
					port: Number(this.config.upstreamOrigin.port),
					method: "GET",
					path: `${target.pathname}${target.search}`,
					headers: {
						host: this.config.upstreamOrigin.host,
						accept: "text/html",
						"accept-encoding": "identity"
					},
					agent: false
				});
				this.upstreamAuthRequest = upstreamRequest;
				upstreamRequest.setTimeout(this.config.upstreamTimeoutMs, () => {
					upstreamRequest.destroy(/* @__PURE__ */ new Error("upstream timeout"));
				});
				upstreamRequest.once("response", resolve);
				upstreamRequest.once("error", reject);
				upstreamRequest.end();
			});
			await new Promise((resolve, reject) => {
				proxied.once("end", resolve);
				proxied.once("error", reject);
				proxied.resume();
			});
			const setCookie = proxied.headers["set-cookie"]?.[0];
			const pair = setCookie?.split(";", 1)[0];
			const maxAgeText = setCookie === void 0 ? void 0 : /(?:^|;\s*)Max-Age=(\d+)(?:;|$)/iu.exec(setCookie)?.[1];
			const maxAgeSeconds = maxAgeText === void 0 ? NaN : Number(maxAgeText);
			const expiresAt = Date.now() + maxAgeSeconds * 1e3;
			if (proxied.statusCode !== 303 || pair === void 0 || pair.length > 4096 || !UPSTREAM_COOKIE_PAIR.test(pair) || !Number.isSafeInteger(expiresAt) || maxAgeSeconds <= 0) throw new HttpError(502, "upstream_unavailable");
			this.upstreamCookie = pair;
			this.upstreamCookieExpiresAt = expiresAt;
			return pair;
		} catch (error) {
			if (error instanceof HttpError) throw error;
			throw new HttpError(502, "upstream_unavailable");
		} finally {
			this.upstreamAuthRequest?.destroy();
			this.upstreamAuthRequest = void 0;
		}
	}
	async proxyMobileIndex(request$1, response, authorization) {
		const holder = {};
		const operation = this.allocateRequest(authorization, response, holder);
		try {
			const upstreamHeaders = sanitizeRequestHeaders(request$1, this.config.upstreamOrigin);
			const upstreamCookie = await this.upstreamCookieHeader();
			if (upstreamCookie !== void 0) upstreamHeaders.cookie = upstreamCookie;
			upstreamHeaders["accept-encoding"] = "identity";
			const proxied = await new Promise((resolve, reject) => {
				const upstreamRequest = request({
					protocol: "http:",
					hostname: stripIpv6Brackets(this.config.upstreamOrigin.hostname),
					port: Number(this.config.upstreamOrigin.port),
					method: "GET",
					path: "/",
					headers: upstreamHeaders,
					agent: false
				});
				holder.request = upstreamRequest;
				upstreamRequest.setTimeout(this.config.upstreamTimeoutMs, () => {
					upstreamRequest.destroy(/* @__PURE__ */ new Error("upstream timeout"));
				});
				upstreamRequest.once("response", resolve);
				upstreamRequest.once("error", reject);
				upstreamRequest.end();
			});
			if ((proxied.statusCode ?? 502) !== 200) throw new HttpError(502, "upstream_unavailable");
			const chunks = [];
			let bytes = 0;
			for await (const chunk of proxied) {
				const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
				bytes += buffer.byteLength;
				if (bytes > 4194304) throw new HttpError(502, "upstream_unavailable");
				chunks.push(buffer);
			}
			let body;
			try {
				const rewritten = rewriteMobileIndexWithBatch(Buffer.concat(chunks).toString("utf8"));
				if (rewritten.batch !== void 0) this.rememberMobileBootBatch(rewritten.batch);
				body = Buffer.from(rewritten.html);
			} catch {
				throw new HttpError(502, "upstream_unavailable");
			}
			const headers = sanitizeResponseHeaders(proxied.headers, this.config.upstreamOrigin);
			delete headers["content-length"];
			delete headers["content-encoding"];
			delete headers.etag;
			setSecurityHeaders(response, this.tlsEnabled);
			response.writeHead(200, {
				...headers,
				"Content-Type": "text/html; charset=utf-8",
				"Content-Length": body.byteLength
			});
			response.end(body);
		} catch (error) {
			holder.request?.destroy();
			if (error instanceof HttpError) throw error;
			if (response.headersSent) response.destroy();
			else throw new HttpError(502, "upstream_unavailable");
		} finally {
			operation.release();
		}
	}
	rememberMobileBootBatch(plan) {
		const existing = this.mobileBootBatches.get(plan.key);
		this.mobileBootBatches.delete(plan.key);
		this.mobileBootBatches.set(plan.key, existing ?? { plan });
		while (this.mobileBootBatches.size > MAX_MOBILE_BOOT_BATCHES) {
			const oldest = this.mobileBootBatches.keys().next().value;
			if (oldest === void 0) break;
			this.mobileBootBatches.get(oldest)?.assembly?.controller.abort();
			this.mobileBootBatches.delete(oldest);
		}
	}
	async serveMobileBootBatch(key, request, response, authorization) {
		if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "method_not_allowed");
		const stored = this.mobileBootBatches.get(key);
		if (stored === void 0) throw new HttpError(404, "not_found");
		const operation = this.allocateRequest(authorization, response, {});
		response.once("close", operation.abort);
		try {
			const layoutStat = await stat(this.config.mobileLayoutFile);
			if (stored.body === void 0 || stored.etag === void 0 || stored.layoutMtimeMs !== layoutStat.mtimeMs) {
				operation.signal.throwIfAborted();
				await waitForRequestTask((stored.assembly ?? this.startMobileBootBatchAssembly(stored, layoutStat.mtimeMs)).task, operation.signal);
			}
			const compressed = acceptsGzip(request.headers["accept-encoding"]);
			const assembled = stored.body;
			if (assembled === void 0) throw new HttpError(502, "upstream_unavailable");
			const body = compressed ? stored.gzipBody ??= await gzipBuffer(assembled) : assembled;
			const etag = compressed ? `${stored.etag}-gzip` : stored.etag;
			const headers = {
				"Content-Type": "text/javascript; charset=utf-8",
				"Content-Length": body.byteLength,
				"Cache-Control": "private, no-cache",
				ETag: etag
			};
			if (compressed) headers["Content-Encoding"] = "gzip";
			addVaryAcceptEncoding(headers);
			if (headerValue(request.headers, "if-none-match") === etag) {
				setSecurityHeaders(response, this.tlsEnabled);
				response.writeHead(304, {
					ETag: etag,
					"Cache-Control": "private, no-cache",
					Vary: String(headers.vary)
				});
				response.end();
				return;
			}
			setSecurityHeaders(response, this.tlsEnabled);
			response.writeHead(200, headers);
			if (request.method === "HEAD") response.end();
			else response.end(body);
		} catch (error) {
			if (error.code === "ENOENT") throw new HttpError(503, "mobile_frontend_unavailable");
			throw error;
		} finally {
			response.removeListener("close", operation.abort);
			operation.release();
		}
	}
	startMobileBootBatchAssembly(stored, layoutMtimeMs) {
		const controller = new AbortController();
		const task = (async () => {
			const body = await this.assembleMobileBootBatch(stored.plan, controller.signal);
			stored.body = body;
			delete stored.gzipBody;
			stored.etag = createHash("sha256").update(body).digest("hex");
			stored.layoutMtimeMs = layoutMtimeMs;
			return body;
		})();
		const assembly = Object.freeze({
			controller,
			task
		});
		stored.assembly = assembly;
		task.then(() => {
			if (stored.assembly === assembly) delete stored.assembly;
		}, () => {
			if (stored.assembly === assembly) delete stored.assembly;
		});
		return assembly;
	}
	async assembleMobileBootBatch(plan, signal) {
		const bodies = new Array(plan.entries.length);
		let cursor = 0;
		const worker = async () => {
			while (cursor < plan.entries.length) {
				const index = cursor++;
				const entry = plan.entries[index];
				bodies[index] = entry.id === MOBILE_LAYOUT_MODULE ? await readFile(this.config.mobileLayoutFile, { signal }) : await this.readUpstreamClientBundleWithRetry(entry.url, signal);
				if (bodies[index].byteLength > MAX_MOBILE_BOOT_ENTRY_BYTES) throw new HttpError(502, "upstream_unavailable");
			}
		};
		await Promise.all(Array.from({ length: Math.min(3, plan.entries.length) }, worker));
		if (bodies.reduce((bytes, body) => bytes + body.byteLength + 2, 0) > MAX_MOBILE_BOOT_BATCH_BYTES) throw new HttpError(502, "upstream_unavailable");
		return Buffer.concat(bodies.flatMap((body) => [body, Buffer.from("\n;\n")]));
	}
	/**
	* Read one upstream bundle, retrying transient connection failures.
	*
	* Assembling a batch fans out over every client entry, and the upstream
	* resets a fraction of those connections before sending a byte
	* (`read ECONNRESET`, recv=0) — randomly, on any entry, at any concurrency.
	* A single such reset used to fail the whole batch with 502
	* `upstream_unavailable`, surfacing in the browser as "bundle script
	* /mobile-access/mobile-boot/<hash>.js failed to load". Retrying recovers
	* every observed reset; a genuine upstream error still fails.
	*/
	async readUpstreamClientBundleWithRetry(source, signal) {
		for (let attempt = 1; attempt <= MOBILE_BOOT_UPSTREAM_ATTEMPTS; attempt++) {
			signal.throwIfAborted();
			try {
				return await this.readUpstreamClientBundle(source, signal);
			} catch (error) {
				if (signal.aborted) throw error;
				if (!isTransientUpstreamError(error)) throw error;
				if (attempt === MOBILE_BOOT_UPSTREAM_ATTEMPTS) throw new HttpError(502, "upstream_unavailable");
				await waitForAbortableDelay(MOBILE_BOOT_RETRY_DELAY_MS * attempt, signal);
			}
		}
		throw new HttpError(502, "upstream_unavailable");
	}
	async readUpstreamClientBundle(source, signal) {
		signal.throwIfAborted();
		if (!source.startsWith("/plugins/") || source.includes("#")) throw new HttpError(502, "upstream_unavailable");
		const target = new URL(source, this.config.upstreamOrigin);
		if (target.origin !== this.config.upstreamOrigin.origin) throw new HttpError(502, "upstream_unavailable");
		let upstreamRequest;
		const aborted = () => {
			upstreamRequest?.destroy(/* @__PURE__ */ new Error("request aborted"));
		};
		signal.addEventListener("abort", aborted, { once: true });
		try {
			const upstreamCookie = await this.upstreamCookieHeader();
			signal.throwIfAborted();
			const proxied = await new Promise((resolve, reject) => {
				upstreamRequest = request({
					protocol: "http:",
					hostname: stripIpv6Brackets(this.config.upstreamOrigin.hostname),
					port: Number(this.config.upstreamOrigin.port),
					method: "GET",
					path: `${target.pathname}${target.search}`,
					headers: {
						host: this.config.upstreamOrigin.host,
						accept: "text/javascript",
						"accept-encoding": "identity",
						...upstreamCookie === void 0 ? {} : { cookie: upstreamCookie }
					},
					agent: false
				});
				upstreamRequest.setTimeout(this.config.upstreamTimeoutMs, () => {
					upstreamRequest?.destroy(upstreamTimeoutError());
				});
				upstreamRequest.once("response", resolve);
				upstreamRequest.once("error", reject);
				upstreamRequest.end();
			});
			if ((proxied.statusCode ?? 502) !== 200) throw new HttpError(502, "upstream_unavailable");
			const chunks = [];
			let bytes = 0;
			for await (const chunk of proxied) {
				const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
				bytes += buffer.byteLength;
				if (bytes > MAX_MOBILE_BOOT_ENTRY_BYTES) throw new HttpError(502, "upstream_unavailable");
				chunks.push(buffer);
			}
			return Buffer.concat(chunks);
		} catch (error) {
			if (error instanceof HttpError) throw error;
			if (signal.aborted || isTransientUpstreamError(error)) throw error;
			throw new HttpError(502, "upstream_unavailable");
		} finally {
			signal.removeEventListener("abort", aborted);
			upstreamRequest?.destroy();
		}
	}
	allocateRequest(authorization, response, upstream) {
		if (this.activeRequests.size >= this.config.maxActiveRequests) throw new HttpError(429, "busy");
		const id = this.nextOperationId++;
		const controller = new AbortController();
		const abort = () => {
			controller.abort();
			upstream.request?.destroy();
			if (!response.destroyed) response.destroy();
		};
		const timer = setTimeout(abort, Math.max(1, authorization.expiresAt - Date.now()));
		timer.unref();
		this.activeRequests.set(id, Object.freeze({
			...authorization,
			abort,
			timer
		}));
		return {
			id,
			signal: controller.signal,
			abort,
			release: () => {
				const entry = this.activeRequests.get(id);
				if (entry !== void 0) clearTimeout(entry.timer);
				this.activeRequests.delete(id);
			}
		};
	}
	async proxyHttp(request$2, response, authorization) {
		const declared = request$2.headers["content-length"];
		if (declared !== void 0 && (!/^\d+$/u.test(declared) || Number(declared) > this.config.maxBodyBytes)) throw new HttpError(413, "payload_too_large");
		const holder = {};
		const operation = this.allocateRequest(authorization, response, holder);
		let bodyDone;
		try {
			const bufferedBody = request$2.method === "POST" && request$2.url?.split("?", 1)[0] === SESSION_HISTORY_PATH ? mobileHistoryRequestBody(request$2, await readBoundedBody(request$2, this.config.maxBodyBytes)) : void 0;
			const upstreamHeaders = sanitizeRequestHeaders(request$2, this.config.upstreamOrigin);
			const upstreamCookie = await this.upstreamCookieHeader();
			if (upstreamCookie !== void 0) upstreamHeaders.cookie = upstreamCookie;
			if (bufferedBody !== void 0) upstreamHeaders["content-length"] = String(bufferedBody.byteLength);
			const proxied = await new Promise((resolve, reject) => {
				const upstreamRequest = request({
					protocol: "http:",
					hostname: stripIpv6Brackets(this.config.upstreamOrigin.hostname),
					port: Number(this.config.upstreamOrigin.port),
					method: request$2.method,
					path: request$2.url,
					headers: upstreamHeaders,
					agent: false
				});
				holder.request = upstreamRequest;
				upstreamRequest.setTimeout(this.config.upstreamTimeoutMs, () => {
					upstreamRequest.destroy(/* @__PURE__ */ new Error("upstream timeout"));
				});
				upstreamRequest.once("response", resolve);
				upstreamRequest.once("error", reject);
				if (bufferedBody === void 0) bodyDone = pipeline(request$2, new ByteLimitTransform(this.config.maxBodyBytes), upstreamRequest);
				else {
					upstreamRequest.end(bufferedBody);
					bodyDone = Promise.resolve();
				}
				bodyDone.catch(reject);
			});
			setSecurityHeaders(response, this.tlsEnabled);
			const headers = sanitizeResponseHeaders(proxied.headers, this.config.upstreamOrigin);
			const cacheControl = revisionedStaticCacheControl(request$2);
			if (cacheControl !== void 0) headers["cache-control"] = cacheControl;
			const compressed = shouldCompressResponse(request$2, proxied);
			if (compressed) {
				delete headers["accept-ranges"];
				delete headers["content-length"];
				delete headers.etag;
				headers["content-encoding"] = "gzip";
				addVaryAcceptEncoding(headers);
			}
			response.writeHead(proxied.statusCode ?? 502, headers);
			await Promise.all([bodyDone, compressed ? pipeline(proxied, createGzip(), response) : pipeline(proxied, response)]);
		} catch (error) {
			holder.request?.destroy();
			await bodyDone?.catch(() => void 0);
			if (error instanceof HttpError) throw error;
			if (response.headersSent) response.destroy();
			else throw new HttpError(502, "upstream_unavailable");
		} finally {
			operation.release();
		}
	}
	abortSessionResources(sessionKey) {
		for (const request of this.activeRequests.values()) if (request.sessionKey === sessionKey) request.abort();
		for (const socket of this.activeWebSockets.values()) if (socket.sessionKey === sessionKey) {
			socket.client.destroy();
			socket.upstream.destroy();
		}
	}
	broadcastExtensionChange() {
		if (this.closing) return;
		this.extensionEventRevision += 1;
		for (const listener of this.extensionEventListeners) listener(this.extensionEventRevision);
	}
	/** Fan a completed task to every phone holding this gateway's event stream. */
	broadcastTaskEvent(event) {
		if (this.closing) return;
		const payload = JSON.stringify({
			sessionId: String(event.sessionId),
			turn: Number(event.turn) || 0
		});
		for (const listener of this.taskEventListeners) listener(payload);
	}
	pollLegacyCustomChanges() {
		if (this.extensionChangeTask !== void 0) return this.extensionChangeTask;
		const digestFile = async (path, fallback) => {
			try {
				const info = await stat(path);
				if (!info.isFile() || info.size > 262144) return `invalid:${String(info.size)}:${String(info.mtimeMs)}`;
				return createHash("sha256").update(await readFile(path)).digest("hex");
			} catch (error) {
				if (error.code === "ENOENT") return createHash("sha256").update(fallback).digest("hex");
				return `error:${String(error.code ?? "unknown")}`;
			}
		};
		const task = Promise.all([digestFile(this.config.customScriptFile, CUSTOM_SCRIPT_FALLBACK), digestFile(this.config.customCssFile, CUSTOM_STYLE_FALLBACK)]).then((parts) => {
			const next = createHash("sha256").update(parts.join("|")).digest("hex");
			if (this.legacyCustomDigest !== "" && next !== this.legacyCustomDigest) this.broadcastExtensionChange();
			this.legacyCustomDigest = next;
		}).finally(() => {
			if (this.extensionChangeTask === task) this.extensionChangeTask = void 0;
		});
		this.extensionChangeTask = task;
		return task;
	}
	openExtensionEventStream(request, response, authorization) {
		const operation = this.allocateRequest(authorization, response, {});
		let closed = false;
		let heartbeat;
		const close = () => {
			if (closed) return;
			closed = true;
			if (heartbeat !== void 0) clearInterval(heartbeat);
			this.extensionEventListeners.delete(send);
			this.taskEventListeners.delete(sendTask);
			request.removeListener("aborted", close);
			response.removeListener("close", close);
			operation.release();
		};
		const send = (revision) => {
			if (closed || response.destroyed || response.writableEnded) return;
			response.write(`id: ${String(revision)}\nevent: extensions-changed\ndata: {\"revision\":${String(revision)}}\n\n`);
		};
		const sendTask = (payload) => {
			if (closed || response.destroyed || response.writableEnded) return;
			response.write(`event: task-notify\ndata: ${payload}\n\n`);
		};
		setSecurityHeaders(response, this.tlsEnabled);
		response.writeHead(200, {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-store",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no"
		});
		response.write("retry: 2000\n: ready\n\n");
		this.extensionEventListeners.add(send);
		this.taskEventListeners.add(sendTask);
		heartbeat = setInterval(() => {
			if (!closed && !response.destroyed && !response.writableEnded) response.write(": heartbeat\n\n");
		}, EXTENSION_EVENT_HEARTBEAT_MS);
		heartbeat.unref();
		request.once("aborted", close);
		response.once("close", close);
	}
	async readUpgradeResponse(upstream, expectedAccept) {
		return new Promise((resolve, reject) => {
			let buffer = Buffer.alloc(0);
			const failed = (error) => {
				cleanup();
				reject(error);
			};
			const closed = () => {
				cleanup();
				reject(/* @__PURE__ */ new Error("upstream closed during WebSocket handshake"));
			};
			const data = (chunk) => {
				buffer = Buffer.concat([buffer, chunk]);
				const end = buffer.indexOf("\r\n\r\n");
				if (end < 0) {
					if (buffer.length >= MAX_HEADER_BYTES) failed(/* @__PURE__ */ new Error("upstream WebSocket headers are too large"));
					return;
				}
				if (end + 4 > MAX_HEADER_BYTES) {
					failed(/* @__PURE__ */ new Error("upstream WebSocket headers are too large"));
					return;
				}
				cleanup();
				const lines = buffer.subarray(0, end).toString("latin1").split("\r\n");
				if (lines.shift() !== "HTTP/1.1 101 Switching Protocols") {
					reject(/* @__PURE__ */ new Error("upstream refused WebSocket upgrade"));
					return;
				}
				const selected = /* @__PURE__ */ new Map();
				for (const line of lines) {
					const colon = line.indexOf(":");
					if (colon <= 0) {
						reject(/* @__PURE__ */ new Error("upstream returned malformed WebSocket headers"));
						return;
					}
					const name = line.slice(0, colon).trim().toLowerCase();
					const value = line.slice(colon + 1).trim();
					if (selected.has(name)) {
						reject(/* @__PURE__ */ new Error("upstream returned duplicate WebSocket headers"));
						return;
					}
					selected.set(name, value);
				}
				if (selected.get("upgrade")?.toLowerCase() !== "websocket" || !hasToken(selected.get("connection"), "upgrade") || selected.get("sec-websocket-accept") !== expectedAccept) {
					reject(/* @__PURE__ */ new Error("upstream returned an invalid WebSocket handshake"));
					return;
				}
				const output = [
					"HTTP/1.1 101 Switching Protocols",
					"Upgrade: websocket",
					"Connection: Upgrade",
					`Sec-WebSocket-Accept: ${expectedAccept}`
				];
				const protocol = selected.get("sec-websocket-protocol");
				const extensions = selected.get("sec-websocket-extensions");
				if (protocol !== void 0) output.push(`Sec-WebSocket-Protocol: ${protocol}`);
				if (extensions !== void 0) output.push(`Sec-WebSocket-Extensions: ${extensions}`);
				output.push("Referrer-Policy: no-referrer", "X-Content-Type-Options: nosniff", "", "");
				resolve({
					header: output.join("\r\n"),
					remainder: buffer.subarray(end + 4)
				});
			};
			const cleanup = () => {
				upstream.off("data", data);
				upstream.off("error", failed);
				upstream.off("close", closed);
			};
			upstream.on("data", data);
			upstream.once("error", failed);
			upstream.once("close", closed);
		});
	}
	/** Snapshot of rejected upgrade paths for the approval UI (newest first). */
	blockedUpgradePathReport() {
		return this.blockedUpgradeLog?.report() ?? [];
	}
	async handleUpgrade(request, client, head) {
		const target = parseRequestTarget(request.url);
		const policy = this.requirePolicy();
		assertExternalTrust(request, policy, false);
		if (!policy.acceptsOrigin(request.headers.origin)) throw new HttpError(403, "forbidden");
		if (!(WS_PATHS.has(target.decodedPathname) || (this.extraWebSocketPaths?.has(target.decodedPathname) ?? false))) {
			this.blockedUpgradeLog?.record(target.decodedPathname);
			throw new HttpError(404, "not_found");
		}
		if (request.method !== "GET" || headerValue(request.headers, "upgrade")?.toLowerCase() !== "websocket" || !hasToken(headerValue(request.headers, "connection"), "upgrade")) throw new HttpError(400, "bad_request");
		const key = headerValue(request.headers, "sec-websocket-key");
		if (key === void 0 || headerValue(request.headers, "sec-websocket-version") !== "13") throw new HttpError(400, "bad_request");
		let decodedKey;
		try {
			decodedKey = Buffer.from(key, "base64");
		} catch {
			throw new HttpError(400, "bad_request");
		}
		if (decodedKey.length !== 16 || decodedKey.toString("base64") !== key) throw new HttpError(400, "bad_request");
		const authorization = this.authorize(request);
		if (this.activeWebSockets.size >= this.config.maxWebSockets) throw new HttpError(429, "busy");
		const upstreamCookie = await this.upstreamCookieHeader();
		const upstream = connect({
			host: stripIpv6Brackets(this.config.upstreamOrigin.hostname),
			port: Number(this.config.upstreamOrigin.port)
		});
		client.pause();
		const id = this.nextOperationId++;
		const closeBoth = () => {
			client.destroy();
			upstream.destroy();
		};
		client.on("error", closeBoth);
		upstream.on("error", closeBoth);
		const timer = setTimeout(closeBoth, Math.max(1, authorization.expiresAt - Date.now()));
		timer.unref();
		const record = Object.freeze({
			...authorization,
			client,
			upstream,
			timer
		});
		this.activeWebSockets.set(id, record);
		const cleanup = () => {
			const active = this.activeWebSockets.get(id);
			if (active !== void 0) clearTimeout(active.timer);
			this.activeWebSockets.delete(id);
		};
		client.once("close", () => {
			upstream.destroy();
			cleanup();
		});
		upstream.once("close", () => {
			client.destroy();
			cleanup();
		});
		upstream.setTimeout(this.config.upstreamTimeoutMs, closeBoth);
		try {
			await new Promise((resolve, reject) => {
				const connected = () => {
					upstream.off("error", failed);
					resolve();
				};
				const failed = (error) => {
					upstream.off("connect", connected);
					reject(error);
				};
				upstream.once("connect", connected);
				upstream.once("error", failed);
			});
			const requestLines = [
				`GET ${target.raw} HTTP/1.1`,
				`Host: ${this.config.upstreamOrigin.host}`,
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Origin: ${this.config.upstreamOrigin.origin}`,
				"Sec-Fetch-Site: same-origin",
				`Sec-WebSocket-Key: ${key}`,
				"Sec-WebSocket-Version: 13"
			];
			if (upstreamCookie !== void 0) requestLines.push(`Cookie: ${upstreamCookie}`);
			const protocol = headerValue(request.headers, "sec-websocket-protocol");
			const extensions = headerValue(request.headers, "sec-websocket-extensions");
			if (protocol !== void 0) requestLines.push(`Sec-WebSocket-Protocol: ${protocol}`);
			if (extensions !== void 0) requestLines.push(`Sec-WebSocket-Extensions: ${extensions}`);
			requestLines.push("", "");
			upstream.write(requestLines.join("\r\n"));
			if (head.length > 0) upstream.write(head);
			const handshake = await this.readUpgradeResponse(upstream, websocketAccept(key));
			upstream.setTimeout(0);
			client.write(handshake.header);
			if (handshake.remainder.length > 0) client.write(handshake.remainder);
			upstream.pipe(client);
			client.pipe(upstream);
			client.resume();
		} catch (error) {
			closeBoth();
			if (error instanceof HttpError) throw error;
			throw new HttpError(502, "upstream_unavailable");
		}
	}
	/** Loopback-only DSH WebServer route for opening pairing and managing devices. */
	localAdminRoute(prefix = LOCAL_ADMIN_PREFIX) {
		return {
			kind: "prefix",
			path: prefix,
			handler: async (request, response) => {
				try {
					const target = parseRequestTarget(request.url);
					assertLocalAdminTrust(request, request.method === "POST");
					if (target.search !== "") throw new HttpError(400, "bad_request");
					if (request.method === "GET" && target.decodedPathname === `${prefix}/status`) {
						sendJson(response, 200, {
							gateway: this.address(),
							pairing: this.access.pairingStatus(),
							deviceCount: this.access.listDevices().length,
							resources: {
								connections: this.connectedSockets.size,
								activeRequests: this.activeRequests.size,
								webSockets: this.activeWebSockets.size
							}
						}, false);
						return;
					}
					if (request.method === "GET" && target.decodedPathname === `${prefix}/devices`) {
						sendJson(response, 200, { devices: this.access.listDevices() }, false);
						return;
					}
					if (request.method === "POST" && target.decodedPathname === `${prefix}/pairing/open`) {
						const body = await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
						if (body.ttlMs !== void 0 && typeof body.ttlMs !== "number") throw new HttpError(400, "bad_request");
						const opened = await this.access.openPairing(body.ttlMs);
						const pairUrl = `${this.address().origin}/mobile-access/pair#instance=${this.config.instanceId}&token=${opened.token}`;
						const appPairUrl = pairUrl;
						let qrSvg = "";
						try {
							qrSvg = await QRCode.toString(appPairUrl, {
								type: "svg",
								margin: 1
							});
						} catch {}
						sendJson(response, 201, {
							...opened,
							appKey: `dsh1.${this.config.instanceId}.${opened.token}`,
							pairUrl,
							appPairUrl,
							qrSvg
						}, false);
						return;
					}
					if (request.method === "POST" && target.decodedPathname === `${prefix}/devices/revoke`) {
						const body = await readJsonObject(request, MAX_CONTROL_BODY_BYTES);
						if (typeof body.deviceId !== "string" || !/^[a-f\d]{32}$/u.test(body.deviceId)) throw new HttpError(400, "bad_request");
						if (!await this.access.revokeDevice(body.deviceId)) throw new HttpError(404, "not_found");
						sendJson(response, 200, { revoked: true }, false);
						return;
					}
					if (request.method === "POST" && target.decodedPathname === `${prefix}/devices/reset`) {
						if ((await readJsonObject(request, MAX_CONTROL_BODY_BYTES)).confirm !== true) throw new HttpError(400, "bad_request");
						await this.access.resetDevices();
						sendJson(response, 200, { reset: true }, false);
						return;
					}
					throw new HttpError(404, "not_found");
				} catch (error) {
					const mapped = mapError(error);
					if (response.headersSent) response.destroy();
					else sendFailure(response, mapped.status, mapped.code, false);
				}
			}
		};
	}
	/** Close listeners and abort all accepted work before resolving teardown. */
	async close() {
		if (this.closeTask !== void 0) return this.closeTask;
		this.closeTask = this.performClose();
		return this.closeTask;
	}
	async performClose() {
		this.closing = true;
		if (this.extensionChangeTimer !== void 0) clearInterval(this.extensionChangeTimer);
		this.extensionChangeTimer = void 0;
		this.removeExtensionContentListener();
		this.upstreamAuthRequest?.destroy();
		this.upstreamAuthRequest = void 0;
		this.removeSessionListener();
		const accessClose = this.access.close();
		for (const stored of this.mobileBootBatches.values()) stored.assembly?.controller.abort();
		for (const request of this.activeRequests.values()) request.abort();
		for (const websocket of this.activeWebSockets.values()) {
			websocket.client.destroy();
			websocket.upstream.destroy();
		}
		for (const socket of this.connectedSockets) socket.destroy();
		if (this.discoveryTimer !== void 0) clearInterval(this.discoveryTimer);
		this.discoveryTimer = void 0;
		await this.closeBonjour();
		const discoverySocket = this.discoverySocket;
		this.discoverySocket = void 0;
		if (discoverySocket !== void 0) await new Promise((resolve) => {
			discoverySocket.close(() => resolve());
		});
		const server = this.server;
		this.server = void 0;
		if (server !== void 0 && server.listening) {
			server.closeAllConnections();
			await new Promise((resolve) => {
				server.close(() => resolve());
			});
		}
		await accessClose;
		this.activeRequests.clear();
		this.activeWebSockets.clear();
		this.connectedSockets.clear();
		this.policy = void 0;
		this.listenerPort = void 0;
	}
	/** Safe metadata helper for direct loopback integrations. */
	devices() {
		return this.access.listDevices();
	}
	/** Status shown by the loopback mobile-access control card. */
	extensionStatus() {
		return this.extensions?.status() ?? {
			loaded: 0,
			failed: 0
		};
	}
};
//#endregion
//#region src/storage.ts
function assertInteger(value, name) {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`device state ${name} must be a non-negative integer`);
}
function parseDevice(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("device state contains an invalid device");
	const record = value;
	if (typeof record.id !== "string" || !/^[a-f\d]{32}$/u.test(record.id)) throw new Error("device state contains an invalid id");
	if (typeof record.label !== "string" || record.label.length < 1 || record.label.length > 64 || /[\u0000-\u001f\u007f]/u.test(record.label)) throw new Error("device state contains an invalid label");
	if (typeof record.tokenDigest !== "string" || !/^[a-f\d]{64}$/u.test(record.tokenDigest)) throw new Error("device state contains an invalid credential digest");
	assertInteger(record.createdAt, "createdAt");
	assertInteger(record.expiresAt, "expiresAt");
	assertInteger(record.lastSeenAt, "lastSeenAt");
	if (record.revokedAt !== void 0) assertInteger(record.revokedAt, "revokedAt");
	if (record.expiresAt <= record.createdAt || record.lastSeenAt < record.createdAt) throw new Error("device state contains inconsistent timestamps");
	return Object.freeze({
		id: record.id,
		label: record.label,
		tokenDigest: record.tokenDigest,
		createdAt: record.createdAt,
		expiresAt: record.expiresAt,
		lastSeenAt: record.lastSeenAt,
		...record.revokedAt === void 0 ? {} : { revokedAt: record.revokedAt }
	});
}
/** Validate durable data before it can authorize a device. */
function parseDeviceSnapshot(value, maximumDevices = 256) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("device state must be an object");
	const snapshot = value;
	if (snapshot.version !== 1 || !Array.isArray(snapshot.devices) || snapshot.devices.length > maximumDevices) throw new Error("device state has an unsupported version or device count");
	const devices = snapshot.devices.map(parseDevice);
	if (new Set(devices.map((device) => device.id)).size !== devices.length || new Set(devices.map((device) => device.tokenDigest)).size !== devices.length) throw new Error("device state contains duplicate device identities");
	return Object.freeze({
		version: 1,
		devices: Object.freeze(devices)
	});
}
/** Atomic JSON implementation with symlink refusal and owner-only file creation. */
var JsonDeviceStore = class {
	file;
	maximumDevices;
	constructor(file, maximumDevices = 256) {
		this.file = file;
		this.maximumDevices = maximumDevices;
	}
	async load() {
		let stat;
		try {
			stat = await lstat(this.file);
		} catch (error) {
			if (error.code === "ENOENT") return Object.freeze({
				version: 1,
				devices: Object.freeze([])
			});
			throw error;
		}
		if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1048576) throw new Error("device state must be a regular file no larger than 1 MiB");
		await restrictPrivateFile(this.file);
		let parsed;
		try {
			parsed = JSON.parse(await readFile(this.file, "utf8"));
		} catch (error) {
			throw new Error("device state is not valid JSON", { cause: error });
		}
		return parseDeviceSnapshot(parsed, this.maximumDevices);
	}
	async save(snapshot) {
		const validated = parseDeviceSnapshot(snapshot, this.maximumDevices);
		const directory = dirname(this.file);
		await mkdir(directory, {
			recursive: true,
			mode: 448
		});
		try {
			const current = await lstat(this.file);
			if (!current.isFile() || current.isSymbolicLink()) throw new Error("device state target must remain a regular file");
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		const temporary = join(directory, `.${basename(this.file)}.${randomBytes(12).toString("hex")}.tmp`);
		try {
			await writeFile(temporary, `${JSON.stringify(validated)}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 384
			});
			await rename(temporary, this.file);
			await restrictPrivateFile(this.file);
		} catch (error) {
			try {
				await rm(temporary, { force: true });
			} catch (cleanupError) {
				throw new AggregateError([error, cleanupError], "device state write and temporary cleanup both failed");
			}
			throw error;
		}
	}
};
/** In-memory store useful for embedding and deterministic tests. */
var MemoryDeviceStore = class {
	snapshot;
	constructor(initial = {
		version: 1,
		devices: []
	}) {
		this.snapshot = parseDeviceSnapshot(initial);
	}
	async load() {
		return structuredClone(this.snapshot);
	}
	async save(snapshot) {
		this.snapshot = structuredClone(parseDeviceSnapshot(snapshot));
	}
	/** Return a defensive copy for assertions or administrative export. */
	inspect() {
		return structuredClone(this.snapshot);
	}
};
//#endregion
//#region src/frp-component.ts
const FRP_VERSION$1 = "0.70.1";
/** ChmlFrp ships a forked frp 0.51.2; its client reports this exact string for --version. */
const CHMLFRP_VERSION = "ChmlFrp-0.51.2_251023";
const MAX_ARCHIVE_ENTRIES = 128;
const MAX_ARCHIVE_LIST_BYTES = 262144;
const GITHUB_HOSTS = ["github.com", "githubusercontent.com"];
const CHMLFRP_HOSTS = ["uapis.cn"];
const releases = [
	{
		platform: "win32",
		arch: "x64",
		archiveName: "frp.zip",
		executableName: "frpc.exe",
		downloadBytes: 13924309,
		downloadSha256: "531f3cd3cc41c0b4f077b54fe6b7dd83c0ff727e7f0bf412a4c78fa279165de5",
		downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION$1}/frp_${FRP_VERSION$1}_windows_amd64.zip`,
		allowedDownloadHosts: GITHUB_HOSTS,
		nestedExecutable: true
	},
	{
		platform: "win32",
		arch: "arm64",
		archiveName: "frp.zip",
		executableName: "frpc.exe",
		downloadBytes: 12204751,
		downloadSha256: "74d3acaf0f03ee190dd0462f9b49861dca50b0559c5488af4b36572fc951fcca",
		downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION$1}/frp_${FRP_VERSION$1}_windows_arm64.zip`,
		allowedDownloadHosts: GITHUB_HOSTS,
		nestedExecutable: true
	},
	{
		platform: "linux",
		arch: "x64",
		archiveName: "frp.tar.gz",
		executableName: "frpc",
		downloadBytes: 13924042,
		downloadSha256: "333da23d1b9009d7c01638e9ba38cf4600f7d37d393f854e96ee1396adefa9a6",
		downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION$1}/frp_${FRP_VERSION$1}_linux_amd64.tar.gz`,
		allowedDownloadHosts: GITHUB_HOSTS,
		nestedExecutable: true
	},
	{
		platform: "linux",
		arch: "arm64",
		archiveName: "frp.tar.gz",
		executableName: "frpc",
		downloadBytes: 12371290,
		downloadSha256: "3990f396a9a490ee7f0e5f355287750ed41520064ed999eab443b5e9a78d773d",
		downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION$1}/frp_${FRP_VERSION$1}_linux_arm64.tar.gz`,
		allowedDownloadHosts: GITHUB_HOSTS,
		nestedExecutable: true
	},
	{
		platform: "darwin",
		arch: "x64",
		archiveName: "frp.tar.gz",
		executableName: "frpc",
		downloadBytes: 13951979,
		downloadSha256: "cbf69cf26e5553e914e97d37f5d4367fa30f5f531d073a889465af4719281e25",
		downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION$1}/frp_${FRP_VERSION$1}_darwin_amd64.tar.gz`,
		allowedDownloadHosts: GITHUB_HOSTS,
		nestedExecutable: true
	},
	{
		platform: "darwin",
		arch: "arm64",
		archiveName: "frp.tar.gz",
		executableName: "frpc",
		downloadBytes: 12670664,
		downloadSha256: "cfa733b5a261c1647edee3c1fc4133d2542989b28f5602e81d47fc821d25c55f",
		downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION$1}/frp_${FRP_VERSION$1}_darwin_arm64.tar.gz`,
		allowedDownloadHosts: GITHUB_HOSTS,
		nestedExecutable: true
	}
];
const CHMLFRP_ARTIFACT_BASE = "https://cf-v1.uapis.cn/download";
/**
* Pinned ChmlFrp client artifacts. Host, byte size and SHA-256 are recorded from
* the official download page and verified before anything is executed. The zips
* place `frpc.exe` at the archive root instead of nesting it, so these entries set
* `nestedExecutable: false`.
*
* NOTE: `CHMLFRP_VERSION` already carries the `ChmlFrp-` prefix, so the URL
* template must not repeat it.
*/
const chmlfrpReleases = [
	{
		platform: "win32",
		arch: "x64",
		archiveName: "chmlfrp.zip",
		executableName: "frpc.exe",
		downloadBytes: 5621859,
		downloadSha256: "cdbdec6be0300023c5107650197788f0ec417d4cfdea920ca4c148467102b7e6",
		downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_2_windows_amd64.zip`,
		allowedDownloadHosts: CHMLFRP_HOSTS,
		nestedExecutable: false
	},
	{
		platform: "win32",
		arch: "arm64",
		archiveName: "chmlfrp.zip",
		executableName: "frpc.exe",
		downloadBytes: 5067955,
		downloadSha256: "c0330afa4429924d071d60c4197a48bcd426526de8c2b09058be20295a657f7e",
		downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_2_windows_arm64.zip`,
		allowedDownloadHosts: CHMLFRP_HOSTS,
		nestedExecutable: false
	},
	{
		platform: "linux",
		arch: "x64",
		archiveName: "chmlfrp.tar.gz",
		executableName: "frpc",
		downloadBytes: 12063513,
		downloadSha256: "e1a83d0cf7b7bf69d04610f2c0ba952e8185e377a3ef889921def52f03b4e4a6",
		downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_linux_amd64.tar.gz`,
		allowedDownloadHosts: CHMLFRP_HOSTS,
		nestedExecutable: false
	},
	{
		platform: "linux",
		arch: "arm64",
		archiveName: "chmlfrp.tar.gz",
		executableName: "frpc",
		downloadBytes: 10922270,
		downloadSha256: "2e1973aafabc6b7b2371ecdc679d6a0931753a137bc0ccc5d8b5f2ca4b17a253",
		downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_linux_arm64.tar.gz`,
		allowedDownloadHosts: CHMLFRP_HOSTS,
		nestedExecutable: false
	},
	{
		platform: "darwin",
		arch: "x64",
		archiveName: "chmlfrp.tar.gz",
		executableName: "frpc",
		downloadBytes: 12579704,
		downloadSha256: "23229fc02104cceb0d1483fd3fa053f9dae8e8b0725a8df5e9f09094541bbe53",
		downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_darwin_amd64.tar.gz`,
		allowedDownloadHosts: CHMLFRP_HOSTS,
		nestedExecutable: false
	},
	{
		platform: "darwin",
		arch: "arm64",
		archiveName: "chmlfrp.tar.gz",
		executableName: "frpc",
		downloadBytes: 11997609,
		downloadSha256: "541319d1324df135e0f21cb93bcd5b1231e62be4b22a5ca4d9831d04c2476417",
		downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_darwin_arm64.tar.gz`,
		allowedDownloadHosts: CHMLFRP_HOSTS,
		nestedExecutable: false
	}
];
function indexReleases(entries) {
	return Object.freeze(Object.fromEntries(entries.map((release) => [`${release.platform}-${release.arch}`, Object.freeze(release)])));
}
/** Pinned official FRP release metadata for supported desktop targets. */
const FRP_COMPONENT_RELEASES = indexReleases(releases);
/** Pinned ChmlFrp client release metadata for supported desktop targets. */
const CHMLFRP_COMPONENT_RELEASES = indexReleases(chmlfrpReleases);
const VARIANT_PROFILES = Object.freeze({
	"self-hosted": Object.freeze({
		releases: FRP_COMPONENT_RELEASES,
		version: FRP_VERSION$1,
		releasePage: `https://github.com/fatedier/frp/releases/tag/v${FRP_VERSION$1}`,
		directory: FRP_VERSION$1,
		sourceFallbackUrl: "https://github.com/fatedier/frp/releases"
	}),
	"chmlfrp": Object.freeze({
		releases: CHMLFRP_COMPONENT_RELEASES,
		version: CHMLFRP_VERSION,
		releasePage: "https://panel.chmlfrp.net/tunnel/download",
		directory: CHMLFRP_VERSION,
		sourceFallbackUrl: `${CHMLFRP_ARTIFACT_BASE}/`
	})
});
function inside$1(parent, child) {
	const candidate = relative(parent, child);
	return candidate !== "" && !candidate.startsWith("..") && !isAbsolute(candidate);
}
async function regularFile$1(file) {
	try {
		const entry = await lstat(file);
		return entry.isFile() && !entry.isSymbolicLink();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
async function replaceDirectory(target, candidate) {
	const backup = `${target}.previous-${randomBytes(12).toString("hex")}`;
	let previous = false;
	try {
		try {
			await rename(target, backup);
			previous = true;
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		try {
			await rename(candidate, target);
		} catch (error) {
			if (previous) try {
				await rename(backup, target);
			} catch (restoreError) {
				throw new AggregateError([error, restoreError], "frp_component_replace_failed");
			}
			throw error;
		}
		if (previous) await rm(backup, {
			recursive: true,
			force: true
		});
	} finally {
		await rm(candidate, {
			recursive: true,
			force: true
		});
	}
}
function sha256$1(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}
async function runCapture(file, args) {
	return new Promise((resolveRun, reject) => {
		execFile(file, [...args], {
			windowsHide: true,
			timeout: 12e4,
			maxBuffer: MAX_ARCHIVE_LIST_BYTES,
			encoding: "utf8"
		}, (error, stdout) => {
			if (error === null) resolveRun(stdout);
			else reject(error);
		});
	});
}
function validatedArchiveEntry(rawEntry) {
	if (rawEntry.length === 0 || rawEntry.includes("\\") || rawEntry.includes("\0") || rawEntry.startsWith("/") || /^[a-zA-Z]:/u.test(rawEntry)) throw new Error("frp_archive_path_invalid");
	const segments = rawEntry.replace(/\/$/u, "").split("/");
	if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) throw new Error("frp_archive_path_invalid");
	return segments;
}
/** Select exactly one nested frpc executable from a safe archive listing. */
function selectFrpExecutableEntry(entries, executableName) {
	if (entries.length === 0 || entries.length > MAX_ARCHIVE_ENTRIES) throw new Error("frp_archive_entries_invalid");
	let executableEntry;
	for (const entry of entries) {
		const segments = validatedArchiveEntry(entry);
		if (segments.length >= 2 && segments.at(-1) === executableName) {
			if (executableEntry !== void 0) throw new Error("frp_archive_executable_ambiguous");
			executableEntry = entry.replace(/\/$/u, "");
		}
	}
	if (executableEntry === void 0) throw new Error("frp_archive_executable_missing");
	return executableEntry;
}
async function defaultExtractArtifact$1(archive, destination, executableName) {
	const tar = process.platform === "win32" ? "tar.exe" : "tar";
	const executableEntry = selectFrpExecutableEntry((await runCapture(tar, ["-tf", archive])).split(/\r?\n/u).filter((entry) => entry.length > 0), executableName);
	const unpacked = join(destination, "archive");
	await mkdir(unpacked, {
		recursive: true,
		mode: 448
	});
	await runCapture(tar, [
		"-xf",
		archive,
		"-C",
		unpacked,
		executableEntry
	]);
	const extracted = join(unpacked, ...validatedArchiveEntry(executableEntry));
	if (!await regularFile$1(extracted)) throw new Error("frp_archive_executable_invalid");
	await copyFile(extracted, join(destination, executableName));
}
/**
* Select the executable when the provider archive keeps it at the archive root.
* Validates every entry with the same path rules as the nested selector so a
* hostile archive cannot escape the staging directory.
*/
function selectRootExecutableEntry(entries, executableName) {
	if (entries.length === 0 || entries.length > MAX_ARCHIVE_ENTRIES) throw new Error("frp_archive_entries_invalid");
	let executableEntry;
	for (const entry of entries) {
		const segments = validatedArchiveEntry(entry);
		if (segments.length !== 1 || segments[0] !== executableName) continue;
		if (executableEntry !== void 0) throw new Error("frp_archive_executable_ambiguous");
		executableEntry = segments[0];
	}
	if (executableEntry === void 0) throw new Error("frp_archive_executable_missing");
	return executableEntry;
}
/** Extract a provider archive whose executable sits at the archive root. */
async function rootExtractArtifact(archive, destination, executableName) {
	const tar = process.platform === "win32" ? "tar.exe" : "tar";
	const executableEntry = selectRootExecutableEntry((await runCapture(tar, ["-tf", archive])).split(/\r?\n/u).filter((entry) => entry.length > 0), executableName);
	const unpacked = join(destination, "archive");
	await mkdir(unpacked, {
		recursive: true,
		mode: 448
	});
	await runCapture(tar, [
		"-xf",
		archive,
		"-C",
		unpacked,
		executableEntry
	]);
	const extracted = join(unpacked, executableEntry);
	if (!await regularFile$1(extracted)) throw new Error("frp_archive_executable_invalid");
	await copyFile(extracted, join(destination, executableName));
}
function hostAllowed(hostname, allowed) {
	return allowed.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}
async function defaultFetchArtifact$1(artifact, signal) {
	const response = await fetch(artifact.downloadUrl, {
		redirect: "follow",
		signal
	});
	if (!response.ok) throw new Error(`frp_download_http_${String(response.status)}`);
	const finalUrl = new URL(response.url);
	if (finalUrl.protocol !== "https:" || !hostAllowed(finalUrl.hostname, artifact.allowedDownloadHosts)) throw new Error("frp_download_origin_invalid");
	const lengthHeader = response.headers.get("content-length");
	const declaredLength = lengthHeader === null ? void 0 : Number(lengthHeader);
	if (declaredLength !== void 0 && (!Number.isFinite(declaredLength) || declaredLength !== artifact.downloadBytes)) throw new Error("frp_download_size_mismatch");
	if (response.body === null) throw new Error("frp_download_empty");
	const chunks = [];
	let received = 0;
	const reader = response.body.getReader();
	while (true) {
		const result = await reader.read();
		if (result.done) break;
		received += result.value.byteLength;
		if (received > artifact.downloadBytes) {
			await reader.cancel();
			throw new Error("frp_download_size_mismatch");
		}
		chunks.push(result.value);
	}
	if (received !== artifact.downloadBytes) throw new Error("frp_download_size_mismatch");
	const bytes = new Uint8Array(received);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}
async function defaultInspectExecutable(executable) {
	return (await runCapture(executable, ["--version"])).trim();
}
/** Owns one optional FRP client binary inside the DSH Mobile state directory. */
var FrpComponentManager = class {
	executable;
	componentRoot;
	componentStorage;
	logRoot;
	variant;
	profile;
	stagingRoot;
	artifact;
	fetchArtifact;
	extractArtifact;
	inspectExecutable;
	installed = false;
	installedBytes = 0;
	errorCode;
	queue = Promise.resolve();
	constructor(options) {
		const stateDirectory = resolve(options.stateDirectory);
		if (!isAbsolute(stateDirectory)) throw new Error("frp state directory must be absolute");
		const platform = options.platform ?? process.platform;
		const arch = options.arch ?? process.arch;
		this.variant = options.variant ?? "self-hosted";
		const profile = VARIANT_PROFILES[this.variant];
		this.profile = profile;
		this.artifact = profile.releases[`${platform}-${arch}`];
		this.componentRoot = join(stateDirectory, "components", "frp");
		this.componentStorage = join(this.componentRoot, profile.directory);
		this.executable = join(this.componentStorage, platform === "win32" ? "frpc.exe" : "frpc");
		this.logRoot = join(stateDirectory, "logs", "frp");
		this.stagingRoot = join(stateDirectory, "staging", "frp");
		for (const child of [
			this.componentRoot,
			this.componentStorage,
			this.logRoot,
			this.stagingRoot
		]) if (!inside$1(stateDirectory, child)) throw new Error("frp component path escaped its state directory");
		this.fetchArtifact = options.fetchArtifact ?? defaultFetchArtifact$1;
		this.extractArtifact = options.extractArtifact ?? (this.artifact?.nestedExecutable === false ? rootExtractArtifact : defaultExtractArtifact$1);
		this.inspectExecutable = options.inspectExecutable ?? defaultInspectExecutable;
	}
	/** Inspect the managed executable without relying on global FRP installations. */
	async initialize() {
		this.installed = await regularFile$1(this.executable);
		this.installedBytes = this.installed ? (await stat(this.executable)).size : 0;
		if (this.installed) try {
			if (await this.inspectExecutable(this.executable) !== this.profile.version) throw new Error("frp_component_version_mismatch");
			this.errorCode = void 0;
		} catch {
			this.installed = false;
			this.errorCode = "frp_component_invalid";
		}
	}
	/** Return component metadata without exposing configuration or credentials. */
	status() {
		return Object.freeze({
			variant: this.variant,
			supported: this.artifact !== void 0,
			installed: this.installed,
			version: this.profile.version,
			downloadBytes: this.artifact?.downloadBytes ?? 0,
			installedBytes: this.installedBytes,
			sourceUrl: this.artifact?.downloadUrl ?? this.profile.sourceFallbackUrl,
			releasePage: this.profile.releasePage,
			storagePath: this.componentRoot,
			...this.errorCode === void 0 ? {} : { errorCode: this.errorCode }
		});
	}
	/** Download, verify, and extract only the client after explicit confirmation. */
	install() {
		return this.enqueue(async () => {
			const artifact = this.artifact;
			if (artifact === void 0) throw new Error("frp_component_unsupported");
			await mkdir(this.stagingRoot, {
				recursive: true,
				mode: 448
			});
			const staging = await mkdtemp(join(this.stagingRoot, "install-"));
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => {
					controller.abort();
				}, 12e4);
				timeout.unref();
				let bytes;
				try {
					bytes = await this.fetchArtifact(artifact, controller.signal);
				} finally {
					clearTimeout(timeout);
				}
				if (bytes.byteLength !== artifact.downloadBytes) throw new Error("frp_download_size_mismatch");
				if (sha256$1(bytes) !== artifact.downloadSha256) throw new Error("frp_download_hash_mismatch");
				const archive = join(staging, artifact.archiveName);
				await writeFile(archive, bytes, {
					flag: "wx",
					mode: 384
				});
				await this.extractArtifact(archive, staging, artifact.executableName);
				const extracted = join(staging, artifact.executableName);
				if (!await regularFile$1(extracted)) throw new Error("frp_executable_missing");
				await chmod(extracted, 448);
				if (await this.inspectExecutable(extracted) !== this.profile.version) throw new Error("frp_component_version_mismatch");
				const candidate = join(this.componentRoot, `.install-${randomBytes(12).toString("hex")}`);
				await mkdir(candidate, {
					recursive: true,
					mode: 448
				});
				const candidateExecutable = join(candidate, artifact.executableName);
				await copyFile(extracted, candidateExecutable);
				await chmod(candidateExecutable, 448);
				await replaceDirectory(this.componentStorage, candidate);
				this.installed = true;
				this.installedBytes = (await stat(this.executable)).size;
				this.errorCode = void 0;
			} finally {
				await rm(staging, {
					recursive: true,
					force: true
				});
			}
		});
	}
	/** Remove this variant's executable plus its staging files. */
	purge() {
		return this.enqueue(async () => {
			await Promise.all([rm(this.componentStorage, {
				recursive: true,
				force: true
			}), rm(this.stagingRoot, {
				recursive: true,
				force: true
			})]);
			this.installed = false;
			this.installedBytes = 0;
			this.errorCode = void 0;
		});
	}
	enqueue(operation) {
		const task = this.queue.then(operation, operation);
		this.queue = task.then(() => void 0, () => void 0);
		return task.then(() => this.status());
	}
};
//#endregion
//#region src/websocket-paths.ts
/** Cap the admin-approved extra WebSocket upgrade paths (exact pathnames). */
const MAX_EXTRA_WEBSOCKET_PATHS = 16;
const MAX_WEBSOCKET_PATH_LENGTH = 256;
function fail(code) {
	throw new Error(code);
}
/**
* Validate one exact pathname for proxying. Query strings are matched at
* upgrade time, so only the pathname is stored. Rejects anything the
* gateway cannot match exactly.
*/
function validateWebSocketPath(value) {
	if (typeof value !== "string") fail("websocket_path_invalid");
	const path = value;
	if (path.length === 0 || path.length > 256) fail("websocket_path_invalid");
	if (!path.startsWith("/")) fail("websocket_path_invalid");
	if (/[\s\u0000-\u001f\u007f#?]/u.test(path)) fail("websocket_path_invalid");
	if (path.includes("..")) fail("websocket_path_invalid");
	return path;
}
/** Validate a whole replacement list all-or-nothing; duplicates collapse. */
function normalizeWebSocketPaths(value) {
	if (!Array.isArray(value)) fail("websocket_paths_invalid");
	if (value.length > 16) fail("websocket_paths_invalid");
	const seen = /* @__PURE__ */ new Set();
	for (const entry of value) {
		const path = validateWebSocketPath(entry);
		seen.add(path);
	}
	return [...seen];
}
/** Cap remembered rejected upgrade paths offered for one-click approval. */
const MAX_BLOCKED_UPGRADE_PATHS = 32;
/**
* In-memory log of rejected third-party upgrade paths, shared by every
* gateway instance so the approval UI sees attempts on any listener.
* Bounded and newest-first; a restart clears it (attempts reappear on
* the next blocked handshake).
*/
var BlockedUpgradePathLog = class {
	entries = /* @__PURE__ */ new Map();
	record(pathname) {
		const now = Date.now();
		const stats = this.entries.get(pathname);
		if (stats === void 0) {
			if (this.entries.size >= 32) {
				let oldest;
				for (const [path, entry] of this.entries) if (oldest === void 0 || entry.lastSeen < (this.entries.get(oldest)?.lastSeen ?? 0)) oldest = path;
				if (oldest !== void 0) this.entries.delete(oldest);
			}
			this.entries.set(pathname, {
				attempts: 1,
				firstSeen: now,
				lastSeen: now
			});
			return;
		}
		stats.attempts += 1;
		stats.lastSeen = now;
	}
	report() {
		return [...this.entries].map(([path, stats]) => ({
			path,
			...stats
		})).sort((a, b) => b.lastSeen - a.lastSeen);
	}
};
/** File-backed store shared by every gateway instance (LAN and remote). */
var WebSocketPathStore = class {
	file;
	paths = /* @__PURE__ */ new Set();
	loaded = false;
	constructor(file) {
		this.file = file;
	}
	/** Snapshot for the upgrade check. */
	has(pathname) {
		return this.paths.has(pathname);
	}
	list() {
		return [...this.paths];
	}
	async load() {
		if (!this.loaded) {
			try {
				const raw = JSON.parse(await readFile(this.file, "utf8"));
				this.paths = new Set(normalizeWebSocketPaths(raw.paths ?? []));
			} catch {
				this.paths = /* @__PURE__ */ new Set();
			}
			this.loaded = true;
		}
		return this.list();
	}
	/** Replace the whole list after validating; persists atomically. */
	async replace(paths) {
		const next = normalizeWebSocketPaths([...paths]);
		await mkdir(dirname(this.file), { recursive: true });
		await writeFile(this.file, `${JSON.stringify({ paths: next })}\n`, "utf8");
		this.paths = new Set(next);
		this.loaded = true;
		return this.list();
	}
};
//#endregion
//#region src/frp-template.ts
/** Loopback-only HTTP vhost port used between Caddy and frps. */
const FRP_VHOST_HTTP_PORT = 7080;
/** Caddy snippet owned entirely by DSH Mobile; the main Caddyfile only imports it. */
const FRP_CADDY_SNIPPET_PATH = "/etc/caddy/dsh-mobile-dsh.caddy";
/** First line of the owned snippet; also the legacy whole-file marker. */
const FRP_CADDY_SNIPPET_MARKER = "# Managed by DSH Mobile - snippet, safe to delete";
/** Exact line the main Caddyfile must contain (uncommented) for the site to load. */
const FRP_CADDY_IMPORT_LINE = `import ${FRP_CADDY_SNIPPET_PATH}`;
/** Directory holding the public-IPv4 certificates installed by certbot. */
const FRP_CADDY_IP_CERT_DIR = "/var/lib/caddy/dsh-mobile-certs";
function publicIpv4Address(value) {
	const parts = value.split(".");
	return parts.length === 4 && parts.every((part) => /^(?:0|[1-9][0-9]{0,2})$/u.test(part) && Number(part) <= 255);
}
function publicDnsHostname(value) {
	return value.length <= 253 && value.includes(".") && !/^[0-9.]+$/u.test(value) && !value.includes(":") && value.split(".").every((label) => label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label));
}
function parsePublicOrigin(publicOrigin) {
	let url;
	try {
		url = new URL(publicOrigin);
	} catch {
		throw new Error("frp_template_input_invalid");
	}
	if (url.protocol !== "https:" || url.port !== "" || url.pathname !== "/" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "" || !publicIpv4Address(url.hostname) && !publicDnsHostname(url.hostname)) throw new Error("frp_template_input_invalid");
	return url.hostname;
}
/** Build the Caddy site for one public host (without markers or import wiring). */
function createCaddySite(publicHost, certDir = FRP_CADDY_IP_CERT_DIR) {
	if (publicIpv4Address(publicHost)) return [
		"{",
		`  default_sni ${publicHost}`,
		"}",
		"",
		`http://${publicHost} {`,
		`  redir https://${publicHost}{uri} permanent`,
		"}",
		"",
		`https://${publicHost} {`,
		`  tls ${certDir}/fullchain.pem ${certDir}/privkey.pem`,
		`  reverse_proxy 127.0.0.1:${String(FRP_VHOST_HTTP_PORT)}`,
		"}",
		""
	].join("\n");
	if (!publicDnsHostname(publicHost)) throw new Error("frp_template_input_invalid");
	return [
		`${publicHost} {`,
		`  reverse_proxy 127.0.0.1:${String(FRP_VHOST_HTTP_PORT)}`,
		"}",
		""
	].join("\n");
}
/** Manual certbot steps for a public-IPv4 origin (Caddy cannot issue IP certificates itself). */
function manualIpCertificateGuide(publicHost) {
	return [
		"# Public-IPv4 manual HTTPS: Caddy cannot issue IP certificates by itself.",
		"# On the VPS (Ubuntu/Debian, port 80 reachable from the internet), run once as root:",
		"#   apt-get install -y python3-venv",
		"#   python3 -m venv /opt/dsh-mobile/certbot-venv",
		"#   /opt/dsh-mobile/certbot-venv/bin/pip install 'certbot==5.8.0'",
		"#   systemctl stop caddy || true",
		`#   /opt/dsh-mobile/certbot-venv/bin/certbot certonly --standalone --preferred-profile shortlived --ip-address ${publicHost} --agree-tos --register-unsafely-without-email --non-interactive --keep-until-expiring`,
		"#   install -d -m 0750 -o caddy -g caddy /var/lib/caddy/dsh-mobile-certs",
		`#   install -m 0640 -o caddy -g caddy /etc/letsencrypt/live/${publicHost}/fullchain.pem /var/lib/caddy/dsh-mobile-certs/fullchain.pem`,
		`#   install -m 0640 -o caddy -g caddy /etc/letsencrypt/live/${publicHost}/privkey.pem /var/lib/caddy/dsh-mobile-certs/privkey.pem`,
		"#   systemctl start caddy",
		"# The site below already references those paths. Certificates last about 6 days: re-run certonly before expiry.",
		"#"
	].join("\n");
}
/** Build the only supported frps config and Caddy snippet from validated user inputs. */
function createRestrictedFrpServerTemplate(serverPort, token, publicOrigin) {
	if (!Number.isSafeInteger(serverPort) || serverPort < 1 || serverPort > 65535 || token.length < 16 || token.length > 512 || /[\s\u0000-\u001f\u007f]/u.test(token)) throw new Error("frp_template_input_invalid");
	const publicHost = parsePublicOrigin(publicOrigin);
	const lines = [
		"# frps.toml — save as /etc/dsh-mobile/frps.toml, then start the frps service.",
		`bindPort = ${String(serverPort)}`,
		"proxyBindAddr = \"127.0.0.1\"",
		`vhostHTTPPort = ${String(FRP_VHOST_HTTP_PORT)}`,
		"auth.method = \"token\"",
		`auth.token = ${JSON.stringify(token)}`,
		"",
		`# Caddy — save the site below as ${FRP_CADDY_SNIPPET_PATH},`,
		"# then make sure your Caddyfile contains exactly this line at the TOP of the file",
		"# (create the file with just this line if needed; globals must precede sites):",
		`#   ${FRP_CADDY_IMPORT_LINE}`,
		"# finally run: caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy",
		"# Uninstall later removes only this snippet file and the import line; your own Caddy content is kept.",
		`${FRP_CADDY_SNIPPET_MARKER}`,
		createCaddySite(publicHost).trimEnd(),
		""
	];
	if (publicIpv4Address(publicHost)) lines.push(manualIpCertificateGuide(publicHost), "");
	return lines.join("\n");
}
//#endregion
//#region src/frp-config.ts
const MAX_SETTINGS_BYTES = 8192;
function hostname$1(value) {
	if (value.length > 253 || !value.includes(".")) return false;
	return value.split(".").every((label) => label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label));
}
/** Validate the FRP server hostname or IP address. */
function validateFrpServerAddress(value) {
	if (typeof value !== "string" || value !== value.trim() || value.length === 0 || value.length > 253 || /[\s\u0000-\u001f\u007f/\\@?#]/u.test(value)) throw new Error("frp_server_address_invalid");
	const normalized = value.toLowerCase().replace(/\.$/u, "");
	if (isIP(normalized) === 0 && !hostname$1(normalized)) throw new Error("frp_server_address_invalid");
	return normalized;
}
/** Validate the FRP control port. */
function validateFrpServerPort(value) {
	if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 65535) throw new Error("frp_server_port_invalid");
	return Number(value);
}
/**
* Validate a high-entropy FRP token before durable storage.
*
* The self-hosted frps token must stay high entropy (>= 16 chars). ChmlFrp uses a
* fixed platform-wide shared literal, so that transport passes a lower minimum.
*/
function validateFrpToken(value, minimumLength = 16) {
	if (typeof value !== "string" || value.length < minimumLength || value.length > 512 || /[\s\u0000-\u001f\u007f]/u.test(value)) throw new Error("frp_token_invalid");
	return value;
}
/**
* Validate the ChmlFrp per-tunnel `user` credential. The panel issues an opaque
* 24-character alphanumeric id; accept a conservative superset so panel changes
* do not break pairing while still rejecting anything shell- or INI-unsafe.
*/
function validateChmlFrpUser(value) {
	if (typeof value !== "string" || value.length < 6 || value.length > 64 || !/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("chmlfrp_user_invalid");
	return value;
}
/**
* Validate the public HTTPS origin used for pairing.
*
* A self-hosted VPS terminates TLS on 443 through Caddy, so a port is rejected.
* ChmlFrp maps the custom domain on its own edge and only ever exposes 443, but
* the settings may carry an explicit port from a future platform change, so the
* `allowPort` switch lets that transport opt in without weakening the VPS rule.
*/
function validateFrpPublicOrigin(value, allowPort = false) {
	if (typeof value !== "string" || value.length > 512) throw new Error("frp_public_origin_invalid");
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error("frp_public_origin_invalid");
	}
	const publicHost = url.hostname;
	if (url.protocol !== "https:" || !allowPort && url.port !== "" || url.pathname !== "/" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "" || isIP(publicHost) !== 4 && !hostname$1(publicHost)) throw new Error("frp_public_origin_invalid");
	if (allowPort && url.port !== "" && url.port !== "443") throw new Error("frp_public_origin_invalid");
	if (isIP(publicHost) === 4 && !isGloballyRoutableIpv4(publicHost)) throw new Error("frp_public_origin_invalid");
	return url.origin;
}
/** Parse self-hosted FRP settings at the loopback request and filesystem boundaries. */
function parseFrpSettings(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("frp_settings_invalid");
	const record = value;
	if (Reflect.ownKeys(record).some((key) => ![
		"version",
		"kind",
		"serverAddress",
		"serverPort",
		"token",
		"publicOrigin"
	].includes(String(key)))) throw new Error("frp_settings_invalid");
	if (record.version !== void 0 && record.version !== 1) throw new Error("frp_settings_invalid");
	if (record.kind !== void 0 && record.kind !== "self-hosted") throw new Error("frp_settings_invalid");
	return Object.freeze({
		version: 1,
		kind: "self-hosted",
		serverAddress: validateFrpServerAddress(record.serverAddress),
		serverPort: validateFrpServerPort(record.serverPort),
		token: validateFrpToken(record.token),
		publicOrigin: validateFrpPublicOrigin(record.publicOrigin)
	});
}
/** Parse ChmlFrp settings copied from the panel-generated frpc.ini. */
function parseChmlFrpSettings(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("chmlfrp_settings_invalid");
	const record = value;
	if (Reflect.ownKeys(record).some((key) => ![
		"version",
		"kind",
		"serverAddress",
		"serverPort",
		"user",
		"token",
		"publicOrigin"
	].includes(String(key)))) throw new Error("chmlfrp_settings_invalid");
	if (record.version !== void 0 && record.version !== 1) throw new Error("chmlfrp_settings_invalid");
	return Object.freeze({
		version: 1,
		kind: "chmlfrp",
		serverAddress: validateFrpServerAddress(record.serverAddress),
		serverPort: validateFrpServerPort(record.serverPort),
		user: validateChmlFrpUser(record.user),
		token: validateFrpToken(record.token, 1),
		publicOrigin: validateFrpPublicOrigin(record.publicOrigin, true)
	});
}
/** Parse either supported FRP transport, dispatching on `kind`. */
function parseFrpTransportSettings(value) {
	return (typeof value === "object" && value !== null && !Array.isArray(value) ? value.kind : void 0) === "chmlfrp" ? parseChmlFrpSettings(value) : parseFrpSettings(value);
}
/**
* Merge a partial VPS request body with the saved configuration so a blank
* field keeps its saved value ("已保存时可留空"). Every merged field is still
* validated; with nothing saved and nothing supplied the result reports a
* missing configuration instead of silently deploying blanks.
*/
function mergeSavedFrpSettings(partial, saved) {
	const merged = {
		serverAddress: partial.serverAddress === "" || partial.serverAddress === void 0 ? saved?.serverAddress : partial.serverAddress,
		serverPort: typeof partial.serverPort === "number" && Number.isSafeInteger(partial.serverPort) && partial.serverPort >= 1 ? partial.serverPort : saved?.serverPort,
		token: partial.token === "" || partial.token === void 0 ? saved?.token : partial.token,
		publicOrigin: partial.publicOrigin === "" || partial.publicOrigin === void 0 ? saved?.publicOrigin : partial.publicOrigin
	};
	if (merged.serverAddress === void 0 && merged.serverPort === void 0 && merged.token === void 0 && merged.publicOrigin === void 0) throw new Error("frp_config_missing");
	return parseFrpSettings(merged);
}
/** Merge a VPS target (address and control port) with the saved configuration. */
function mergeSavedFrpTarget(partial, saved) {
	const serverAddress = partial.serverAddress === "" || partial.serverAddress === void 0 ? saved?.serverAddress : partial.serverAddress;
	const serverPort = typeof partial.serverPort === "number" && Number.isSafeInteger(partial.serverPort) && partial.serverPort >= 1 ? partial.serverPort : saved?.serverPort;
	if (serverAddress === void 0 || serverPort === void 0) throw new Error("frp_config_missing");
	return Object.freeze({
		serverAddress: validateFrpServerAddress(serverAddress),
		serverPort: validateFrpServerPort(serverPort)
	});
}
/**
* Merge a partial ChmlFrp request body with the saved settings so a blank field
* keeps its saved value. ChmlFrp has no VPS deployment step, so this is the only
* write path for that transport.
*/
function mergeSavedChmlFrpSettings(partial, saved) {
	const merged = {
		kind: "chmlfrp",
		serverAddress: partial.serverAddress === "" || partial.serverAddress === void 0 ? saved?.serverAddress : partial.serverAddress,
		serverPort: typeof partial.serverPort === "number" && Number.isSafeInteger(partial.serverPort) && partial.serverPort >= 1 ? partial.serverPort : saved?.serverPort,
		user: partial.user === "" || partial.user === void 0 ? saved?.user : partial.user,
		token: partial.token === "" || partial.token === void 0 ? saved?.token : partial.token,
		publicOrigin: partial.publicOrigin === "" || partial.publicOrigin === void 0 ? saved?.publicOrigin : partial.publicOrigin
	};
	if (merged.serverAddress === void 0 && merged.serverPort === void 0 && merged.user === void 0 && merged.token === void 0 && merged.publicOrigin === void 0) throw new Error("frp_config_missing");
	return parseChmlFrpSettings(merged);
}
function tomlString(value) {
	return JSON.stringify(value);
}
/** Build the single-purpose frpc configuration for the current loopback gateway. */
function createFrpcToml(settings, localPort) {
	if (!Number.isSafeInteger(localPort) || localPort < 1 || localPort > 65535) throw new Error("frp_local_port_invalid");
	const hostnameValue = new URL(settings.publicOrigin).hostname;
	return [
		`serverAddr = ${tomlString(settings.serverAddress)}`,
		`serverPort = ${String(settings.serverPort)}`,
		"auth.method = \"token\"",
		`auth.token = ${tomlString(settings.token)}`,
		"transport.tls.enable = true",
		"",
		"[[proxies]]",
		"name = \"dsh-mobile\"",
		"type = \"http\"",
		"localIP = \"127.0.0.1\"",
		`localPort = ${String(localPort)}`,
		`customDomains = [${tomlString(hostnameValue)}]`,
		"transport.useEncryption = true",
		"transport.useCompression = true",
		""
	].join("\n");
}
/** Build the matching restricted frps and Caddy templates for one VPS. */
function createFrpServerTemplate(settings) {
	return createRestrictedFrpServerTemplate(settings.serverPort, settings.token, settings.publicOrigin);
}
/**
* Override `local_port` in a ChmlFrp INI with the port the gateway actually bound.
* The gateway picks an ephemeral port, so the panel's fixed `内网端口` cannot be
* used verbatim; every other line the panel generated is preserved untouched.
*/
function bindChmlFrpIniLocalPort(ini, localPort) {
	if (!Number.isSafeInteger(localPort) || localPort < 1 || localPort > 65535) throw new Error("frp_local_port_invalid");
	let replaced = false;
	const lines = ini.split("\n").map((line) => {
		if (/^\s*local_port\s*=/u.test(line)) {
			replaced = true;
			return `local_port = ${String(localPort)}`;
		}
		return line;
	});
	if (!replaced) throw new Error("chmlfrp_ini_invalid");
	return lines.join("\n");
}
/** Build the classic INI configuration consumed by the ChmlFrp client fork.
*
* ChmlFrp's client is a modified frp 0.51.2 that reads `frpc.ini`. It does not
* speak the upstream TOML schema, so the public origin's hostname becomes
* `custom_domains` and the tunnel type follows the panel's HTTPS mapping.
* `tls_enable` stays false: ChmlFrp terminates nothing, and the gateway behind
* the tunnel already serves TLS end to end.
*/
function createChmlFrpIni(settings, localPort) {
	if (!Number.isSafeInteger(localPort) || localPort < 1 || localPort > 65535) throw new Error("frp_local_port_invalid");
	const hostnameValue = new URL(settings.publicOrigin).hostname;
	return [
		"[common]",
		`server_addr = ${settings.serverAddress}`,
		`server_port = ${String(settings.serverPort)}`,
		"tls_enable = false",
		`user = ${settings.user}`,
		`token = ${settings.token}`,
		"",
		"[dsh_mobile]",
		"type = https",
		"local_ip = 127.0.0.1",
		`local_port = ${String(localPort)}`,
		`custom_domains = ${hostnameValue}`,
		""
	].join("\n");
}
/**
* Parse a ChmlFrp `frpc.ini` pasted from the panel.
*
* The panel is the source of truth for the shared platform token and the tunnel
* type, so accepting its INI verbatim avoids reimplementing ChmlFrp's private
* config API. Only the fields this plugin needs are read, and the pasted text
* is never written to disk.
*/
function parseChmlFrpIni(text, expectedOrigin) {
	if (typeof text !== "string" || text.length === 0 || text.length > 8192) throw new Error("chmlfrp_ini_invalid");
	const common = {};
	let section = "";
	let domains;
	for (const rawLine of text.split(/\r?\n/u)) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith(";") || line.startsWith("#")) continue;
		const header = /^\[([^\]]+)\]$/u.exec(line);
		if (header !== null) {
			const name = header[1];
			if (name === void 0) continue;
			section = name.trim().toLowerCase();
			continue;
		}
		const pair = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(line);
		if (pair === null) continue;
		const rawKey = pair[1];
		const rawValue = pair[2];
		if (rawKey === void 0 || rawValue === void 0) continue;
		const key = rawKey.toLowerCase();
		const value = rawValue.trim();
		if (section === "common") common[key] = value;
		else if (key === "custom_domains" && domains === void 0) domains = value;
	}
	const publicOrigin = expectedOrigin ?? (domains === void 0 ? void 0 : `https://${domains}`);
	return parseChmlFrpSettings({
		kind: "chmlfrp",
		serverAddress: common.server_addr,
		serverPort: common.server_port === void 0 ? void 0 : Number(common.server_port),
		user: common.user,
		token: common.token,
		publicOrigin
	});
}
async function atomicPrivateWrite(file, body) {
	const directory = dirname(file);
	await mkdir(directory, {
		recursive: true,
		mode: 448
	});
	try {
		const current = await lstat(file);
		if (!current.isFile() || current.isSymbolicLink()) throw new Error("frp_config_target_invalid");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const temporary = join(directory, `.${basename(file)}.${randomBytes(12).toString("hex")}.tmp`);
	try {
		await writeFile(temporary, body, {
			encoding: "utf8",
			flag: "wx",
			mode: 384
		});
		await rename(temporary, file);
		await restrictPrivateFile(file);
	} catch (error) {
		await rm(temporary, { force: true });
		throw error;
	}
}
/** Owns private FRP settings and generation-specific frpc configuration. */
var FrpConfigStore = class {
	stateRoot;
	settingsFile;
	/** Self-hosted TOML path; kept as the stable identifier for that transport. */
	runtimeConfigFile;
	/** ChmlFrp INI path. */
	runtimeIniFile;
	settingsValue;
	errorCode;
	constructor(stateDirectory) {
		if (!isAbsolute(stateDirectory)) throw new Error("frp config state directory must be absolute");
		this.stateRoot = resolve(stateDirectory);
		this.settingsFile = join(this.stateRoot, "settings.json");
		this.runtimeConfigFile = join(this.stateRoot, "frpc.toml");
		this.runtimeIniFile = join(this.stateRoot, "frpc.ini");
	}
	/** Load private settings while rejecting links, oversized files, and unknown fields. */
	async initialize() {
		let entry;
		try {
			entry = await lstat(this.settingsFile);
		} catch (error) {
			if (error.code === "ENOENT") return;
			throw error;
		}
		if (!entry.isFile() || entry.isSymbolicLink() || entry.size > MAX_SETTINGS_BYTES) {
			this.errorCode = "frp_config_invalid";
			return;
		}
		await restrictPrivateFile(this.settingsFile);
		try {
			this.settingsValue = parseFrpTransportSettings(JSON.parse(await readFile(this.settingsFile, "utf8")));
			this.errorCode = void 0;
		} catch {
			this.settingsValue = void 0;
			this.errorCode = "frp_config_invalid";
		}
	}
	/** Return configuration metadata without exposing the FRP token. */
	status() {
		const settings = this.settingsValue;
		return Object.freeze({
			configured: settings !== void 0,
			...settings === void 0 ? {} : {
				kind: settings.kind,
				serverAddress: settings.serverAddress,
				serverPort: settings.serverPort,
				publicOrigin: settings.publicOrigin
			},
			vhostHttpPort: FRP_VHOST_HTTP_PORT,
			storagePath: this.stateRoot,
			...this.errorCode === void 0 ? {} : { errorCode: this.errorCode }
		});
	}
	/** Return private settings only to the provider lifecycle. */
	settings() {
		return this.settingsValue;
	}
	/** Narrow the saved settings to the self-hosted transport, when that is what is stored. */
	selfHostedSettings() {
		const settings = this.settingsValue;
		return settings?.kind === "self-hosted" ? settings : void 0;
	}
	/** Narrow the saved settings to ChmlFrp, when that is what is stored. */
	chmlFrpSettings() {
		const settings = this.settingsValue;
		return settings?.kind === "chmlfrp" ? settings : void 0;
	}
	/** Atomically replace private FRP settings with either transport. */
	async configure(value) {
		const settings = parseFrpTransportSettings(value);
		await atomicPrivateWrite(this.settingsFile, `${JSON.stringify(settings)}\n`);
		await Promise.all([rm(this.runtimeConfigFile, { force: true }), rm(this.runtimeIniFile, { force: true })]);
		this.settingsValue = settings;
		this.errorCode = void 0;
		return this.status();
	}
	/**
	* Materialize the private generation-specific client configuration and return
	* the file the client should be launched with.
	*/
	async writeRuntimeConfig(localPort) {
		const settings = this.settingsValue;
		if (settings === void 0) throw new Error("frp_config_missing");
		if (settings.kind === "chmlfrp") {
			await atomicPrivateWrite(this.runtimeIniFile, bindChmlFrpIniLocalPort(createChmlFrpIni(settings, localPort), localPort));
			return this.runtimeIniFile;
		}
		await atomicPrivateWrite(this.runtimeConfigFile, createFrpcToml(settings, localPort));
		return this.runtimeConfigFile;
	}
	/** Remove only configuration files owned by the FRP provider. */
	async purge() {
		await rm(this.stateRoot, {
			recursive: true,
			force: true
		});
		this.settingsValue = void 0;
		this.errorCode = void 0;
		return this.status();
	}
	/** Remove every generated client configuration owned by this store. */
	async removeRuntimeConfig() {
		await Promise.all([rm(this.runtimeConfigFile, { force: true }), rm(this.runtimeIniFile, { force: true })]);
	}
};
Object.freeze([
	"tailscale",
	"cpolar",
	"frp",
	"chmlfrp"
]);
/** Resolve the controller that owns a panel choice. */
function controllerForChoice(choice) {
	return choice === "chmlfrp" ? "frp" : choice;
}
const REMOTE_PROVIDERS = [
	"tailscale",
	"cpolar",
	"frp"
];
function isProviderChoice(value) {
	return value === "tailscale" || value === "cpolar" || value === "frp" || value === "chmlfrp";
}
function aggregateErrors(errors, message) {
	if (errors.length === 0) return void 0;
	if (errors.length === 1 && errors[0] instanceof Error) return errors[0];
	return new AggregateError(errors, message);
}
/** Settle independent remote cleanup work before reporting any collected failure. */
async function settleRemoteResources(steps, message = "remote resource cleanup failed") {
	const failure = aggregateErrors((await Promise.allSettled(steps.map(async (step) => step()))).filter((result) => result.status === "rejected").map((result) => result.reason), message);
	if (failure !== void 0) throw failure;
}
/**
* Serialize all provider mutations and preserve the single-provider invariant.
* Operations read the selected controller only after reaching the front of the queue.
*/
var RemoteProviderCoordinator = class {
	controllers;
	store;
	selectedValue;
	queue = Promise.resolve();
	constructor(selected, controllers, store) {
		this.controllers = controllers;
		this.store = store;
		this.selectedValue = selected;
	}
	/** Return the durable provider choice currently selected by the desktop UI. */
	get selected() {
		return this.selectedValue;
	}
	/** Return the controller backing a choice (ChmlFrp shares the FRP controller). */
	controllerFor(choice) {
		return this.controllers[controllerForChoice(choice)];
	}
	/** Return the controller selected when this method is called. */
	controller() {
		return this.controllerFor(this.selectedValue);
	}
	/** Run a provider-owned mutation after all earlier provider work settles. */
	mutate(operation) {
		return this.enqueue(() => operation(this.controller()));
	}
	/** Disable the previous provider, persist the new selection, and retain rollback on write failure. */
	select(provider) {
		return this.enqueue(async () => {
			if (provider === this.selectedValue) return;
			const previous = this.controllerFor(this.selectedValue);
			const restore = previous.status().enabled;
			if (restore) await previous.setEnabled(false);
			try {
				await this.store.save({
					version: 1,
					provider
				});
				this.selectedValue = provider;
			} catch (error) {
				if (restore) try {
					await previous.setEnabled(true);
				} catch (restoreError) {
					throw new AggregateError([error, restoreError], "remote provider selection rollback failed");
				}
				throw error;
			}
		});
	}
	enqueue(operation) {
		const task = this.queue.then(() => this.runAndEnforce(operation), () => this.runAndEnforce(operation));
		this.queue = task.then(() => void 0, () => void 0);
		return task;
	}
	async runAndEnforce(operation) {
		let value;
		let operationError;
		try {
			value = await operation();
		} catch (error) {
			operationError = error;
		}
		const affected = controllerForChoice(this.selectedValue);
		const results = await Promise.allSettled(REMOTE_PROVIDERS.filter((provider) => provider !== affected).map((provider) => this.controllers[provider].setEnabled(false)));
		const failure = aggregateErrors([...operationError === void 0 ? [] : [operationError], ...results.filter((result) => result.status === "rejected").map((result) => result.reason)], "remote provider operation failed");
		if (failure !== void 0) throw failure;
		return value;
	}
};
/** Stop an owned provider process and do not report completion before its close event. */
async function terminateRemoteProcess(child, gracefulTimeoutMs = 1500, forcedTimeoutMs = 1500) {
	if (child.exitCode !== null || child.signalCode !== null) return;
	await new Promise((resolveClose, rejectClose) => {
		let gracefulTimer;
		let forcedTimer;
		let settled = false;
		const finish = (error) => {
			if (settled) return;
			settled = true;
			if (gracefulTimer !== void 0) clearTimeout(gracefulTimer);
			if (forcedTimer !== void 0) clearTimeout(forcedTimer);
			child.off("close", onClose);
			if (error === void 0) resolveClose();
			else rejectClose(error);
		};
		const onClose = () => {
			finish();
		};
		child.once("close", onClose);
		try {
			child.kill("SIGTERM");
		} catch (error) {
			finish(error instanceof Error ? error : new Error(String(error)));
			return;
		}
		if (settled) return;
		gracefulTimer = setTimeout(() => {
			try {
				if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
			} catch (error) {
				finish(error instanceof Error ? error : new Error(String(error)));
				return;
			}
			if (settled) return;
			forcedTimer = setTimeout(() => {
				finish(/* @__PURE__ */ new Error("remote_process_stop_timeout"));
			}, forcedTimeoutMs);
			forcedTimer.unref();
		}, gracefulTimeoutMs);
		gracefulTimer.unref();
	});
}
/** Validate the provider selection loaded across the filesystem boundary. */
function parseRemoteProviderState(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("remote provider state must be an object");
	const record = value;
	if (record.version !== 1 || !isProviderChoice(record.provider) || Reflect.ownKeys(record).some((key) => key !== "version" && key !== "provider")) throw new Error("remote provider state has an unsupported format");
	return Object.freeze({
		version: 1,
		provider: record.provider
	});
}
/** Atomic selection store whose absent-file state uses the configured default. */
var JsonRemoteProviderStore = class {
	file;
	defaultProvider;
	constructor(file, defaultProvider) {
		this.file = file;
		this.defaultProvider = defaultProvider;
	}
	async load() {
		let stat;
		try {
			stat = await lstat(this.file);
		} catch (error) {
			if (error.code === "ENOENT") return Object.freeze({
				version: 1,
				provider: this.defaultProvider
			});
			throw error;
		}
		if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) throw new Error("remote provider state must be a regular file no larger than 4 KiB");
		await restrictPrivateFile(this.file);
		let parsed;
		try {
			parsed = JSON.parse(await readFile(this.file, "utf8"));
		} catch (error) {
			throw new Error("remote provider state is not valid JSON", { cause: error });
		}
		return parseRemoteProviderState(parsed);
	}
	async save(state) {
		const validated = parseRemoteProviderState(state);
		const directory = dirname(this.file);
		await mkdir(directory, {
			recursive: true,
			mode: 448
		});
		try {
			const current = await lstat(this.file);
			if (!current.isFile() || current.isSymbolicLink()) throw new Error("remote provider state target must remain a regular file");
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		const temporary = join(directory, `.${basename(this.file)}.${randomBytes(12).toString("hex")}.tmp`);
		try {
			await writeFile(temporary, `${JSON.stringify(validated)}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 384
			});
			await rename(temporary, this.file);
			await restrictPrivateFile(this.file);
		} catch (error) {
			await rm(temporary, { force: true });
			throw error;
		}
	}
};
/** Resolve the first-run provider without letting environment values bypass validation. */
function configuredRemoteProvider(environment) {
	const value = environment.DSH_MOBILE_REMOTE_PROVIDER ?? "tailscale";
	if (value === "tailscale" || value === "cpolar" || value === "frp" || value === "chmlfrp") return value;
	throw new Error("DSH_MOBILE_REMOTE_PROVIDER must be tailscale, cpolar, frp, or chmlfrp");
}
//#endregion
//#region src/frp.ts
const START_TIMEOUT_MS$1 = 45e3;
const DISCOVERY_REQUEST_TIMEOUT_MS = 5e3;
const DISCOVERY_RETRY_MS = 1e3;
const MAX_DISCOVERY_BYTES = 16384;
const VHOST_PROBE_TIMEOUT_MS = 1500;
function publicStatus$2(status) {
	return Object.freeze({
		enabled: status.enabled,
		state: status.state,
		...status.origin === void 0 ? {} : { origin: status.origin },
		...status.errorCode === void 0 ? {} : { errorCode: status.errorCode }
	});
}
async function defaultVerifyConfig(executable, configFile) {
	await new Promise((resolveRun, reject) => {
		execFile(executable, [
			"verify",
			"-c",
			configFile
		], {
			windowsHide: true,
			timeout: 3e4,
			maxBuffer: 65536
		}, (error) => {
			if (error === null) resolveRun();
			else reject(error);
		});
	});
}
function defaultLaunchClient(executable, configFile) {
	return spawn(executable, ["-c", configFile], {
		shell: false,
		stdio: [
			"pipe",
			"pipe",
			"pipe"
		],
		windowsHide: true
	});
}
async function defaultProbeVhostExposure(serverAddress, port) {
	return new Promise((resolveProbe) => {
		const socket = connect({
			host: serverAddress,
			port
		});
		let finished = false;
		let received = "";
		const finish = (exposed) => {
			if (finished) return;
			finished = true;
			clearTimeout(timer);
			socket.destroy();
			resolveProbe(exposed);
		};
		const timer = setTimeout(() => {
			finish(false);
		}, VHOST_PROBE_TIMEOUT_MS);
		timer.unref();
		socket.once("connect", () => {
			socket.write("GET /dsh-mobile-exposure-probe HTTP/1.1\r\nHost: invalid.example\r\nConnection: close\r\n\r\n");
		});
		socket.on("data", (chunk) => {
			received = `${received}${chunk.toString("latin1")}`.slice(0, 32);
			if (/^HTTP\/1\.[01] [1-5][0-9]{2}/u.test(received)) finish(true);
		});
		socket.once("close", () => {
			finish(false);
		});
		socket.once("error", () => {
			finish(false);
		});
	});
}
async function boundedResponseBytes(response) {
	if (response.body === null) throw new Error("frp_discovery_invalid");
	const declaredLength = Number(response.headers.get("content-length"));
	if (Number.isFinite(declaredLength) && declaredLength > MAX_DISCOVERY_BYTES) throw new Error("frp_discovery_invalid");
	const reader = response.body.getReader();
	const chunks = [];
	let received = 0;
	while (true) {
		const result = await reader.read();
		if (result.done) break;
		received += result.value.byteLength;
		if (received > MAX_DISCOVERY_BYTES) {
			await reader.cancel();
			throw new Error("frp_discovery_invalid");
		}
		chunks.push(result.value);
	}
	const bytes = new Uint8Array(received);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}
async function defaultProbeDiscovery(origin, expectedInstanceId, signal) {
	const requestController = new AbortController();
	const abort = () => {
		requestController.abort();
	};
	signal.addEventListener("abort", abort, { once: true });
	const timeout = setTimeout(abort, DISCOVERY_REQUEST_TIMEOUT_MS);
	timeout.unref();
	try {
		const response = await fetch(`${origin}/mobile-access/discovery`, {
			method: "GET",
			redirect: "error",
			cache: "no-store",
			signal: requestController.signal,
			headers: { accept: "application/json" }
		});
		if (!response.ok) return false;
		let value;
		try {
			value = JSON.parse(new TextDecoder().decode(await boundedResponseBytes(response)));
		} catch {
			throw new Error("frp_discovery_invalid");
		}
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("frp_discovery_invalid");
		const actual = value.instanceId;
		if (typeof actual !== "string") throw new Error("frp_discovery_invalid");
		if (actual !== expectedInstanceId) throw new Error("frp_discovery_mismatch");
		return true;
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener("abort", abort);
	}
}
/** Owns frpc, its generation-specific configuration, and the remote gateway. */
var FrpController = class {
	options;
	enabled = false;
	initialized = false;
	disposed = false;
	child;
	gatewayValue;
	generation = 0;
	latest = publicStatus$2({
		enabled: false,
		state: "off"
	});
	queue = Promise.resolve();
	startupAbort;
	constructor(options) {
		this.options = options;
		if (!/^[a-f0-9]{64}$/u.test(options.instanceId)) throw new Error("FRP instance ID is invalid");
	}
	/** Restore the remembered FRP switch without changing LAN or other providers. */
	async initialize() {
		const state = await this.options.store.load();
		this.enabled = state.enabled;
		this.initialized = true;
		if (this.enabled) await this.start();
		else this.publish({
			enabled: false,
			state: "off"
		});
	}
	/** Return the active FRP-backed DSH gateway. */
	gateway() {
		return this.gatewayValue;
	}
	/** Return state safe for the desktop control UI. */
	status() {
		return publicStatus$2(this.latest);
	}
	/** Enable or disable FRP without changing LAN or another provider. */
	async setEnabled(enabled) {
		if (!this.initialized || this.disposed) throw new Error("FRP controller is unavailable");
		await this.enqueue(async () => {
			if (this.enabled === enabled && (enabled === false || this.child !== void 0)) return;
			if (!enabled) await this.stop();
			this.enabled = enabled;
			await this.options.store.save({
				version: 1,
				enabled
			});
			if (enabled) await this.start();
			else this.publish({
				enabled: false,
				state: "off"
			});
		});
		return this.status();
	}
	/** Restart FRP while retaining its private server settings and devices. */
	async reconnect() {
		if (!this.initialized || this.disposed) throw new Error("FRP controller is unavailable");
		await this.enqueue(async () => {
			if (!this.enabled) {
				this.enabled = true;
				await this.options.store.save({
					version: 1,
					enabled: true
				});
			}
			await this.stop();
			await this.start();
		});
		return this.status();
	}
	/** Disable FRP without deleting its explicitly managed component or settings. */
	async reset() {
		if (!this.initialized || this.disposed) throw new Error("FRP controller is unavailable");
		await this.enqueue(async () => {
			await this.stop();
			this.enabled = false;
			await this.options.store.save({
				version: 1,
				enabled: false
			});
			this.publish({
				enabled: false,
				state: "off"
			});
		});
		return this.status();
	}
	/** Stop all FRP resources without changing the remembered switch. */
	async close() {
		if (this.disposed) return;
		this.disposed = true;
		await this.enqueue(() => this.stop());
	}
	enqueue(operation) {
		const task = this.queue.then(operation, operation);
		this.queue = task.then(() => void 0, () => void 0);
		return task;
	}
	publish(status) {
		this.latest = publicStatus$2(status);
		try {
			this.options.onStatus?.(this.status());
		} catch {}
	}
	async start() {
		const generation = ++this.generation;
		const settings = this.options.config.settings();
		if (settings === void 0) {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "frp_config_missing"
			});
			return;
		}
		const family = settings.kind;
		let client;
		try {
			const resolve = this.options.resolveClient;
			if (this.options.executable !== void 0) client = { executable: this.options.executable };
			else if (resolve !== void 0) client = resolve(family);
			else throw new Error("frp_client_unresolved");
		} catch {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "frp_component_missing"
			});
			return;
		}
		const executable = client.executable;
		if (!isAbsolute(executable)) {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "frp_component_invalid"
			});
			return;
		}
		let executableEntry;
		try {
			executableEntry = await lstat(executable);
		} catch {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "frp_component_missing"
			});
			return;
		}
		if (!executableEntry.isFile() || executableEntry.isSymbolicLink()) {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "frp_component_invalid"
			});
			return;
		}
		this.publish({
			enabled: true,
			state: "starting",
			origin: settings.publicOrigin
		});
		if (family === "self-hosted") {
			let exposed;
			try {
				exposed = await (this.options.probeVhostExposure ?? defaultProbeVhostExposure)(settings.serverAddress, FRP_VHOST_HTTP_PORT);
			} catch {
				this.publish({
					enabled: true,
					state: "error",
					origin: settings.publicOrigin,
					errorCode: "frp_vhost_probe_failed"
				});
				return;
			}
			if (exposed) {
				this.publish({
					enabled: true,
					state: "error",
					origin: settings.publicOrigin,
					errorCode: "frp_vhost_publicly_reachable"
				});
				return;
			}
		}
		let gateway;
		try {
			gateway = await this.options.createGateway(settings.publicOrigin, family === "chmlfrp" ? client.listenerPort : void 0);
		} catch {
			this.publish({
				enabled: true,
				state: "error",
				origin: settings.publicOrigin,
				errorCode: "gateway_start_failed"
			});
			return;
		}
		if (generation !== this.generation || !this.enabled) {
			await gateway.close();
			return;
		}
		this.gatewayValue = gateway;
		let configFile;
		try {
			configFile = await this.options.config.writeRuntimeConfig(gateway.address().port);
			await (this.options.verifyConfig ?? defaultVerifyConfig)(executable, configFile);
		} catch {
			await this.failGeneration(generation, "frp_config_verify_failed");
			return;
		}
		if (generation !== this.generation || !this.enabled) return;
		let child;
		try {
			child = (this.options.launchClient ?? defaultLaunchClient)(executable, configFile);
		} catch {
			await this.failGeneration(generation, "frp_launch_failed");
			return;
		}
		this.child = child;
		child.stdout.resume();
		child.stderr.resume();
		child.once("error", () => {
			this.enqueue(() => this.failGeneration(generation, "frp_launch_failed"));
		});
		child.once("close", (code) => {
			if (generation !== this.generation || this.child !== child) return;
			this.child = void 0;
			if (this.enabled) this.enqueue(() => this.failGeneration(generation, code === 0 ? "frp_stopped" : "frp_exited"));
		});
		this.publish({
			enabled: true,
			state: "connecting",
			origin: settings.publicOrigin
		});
		const controller = new AbortController();
		this.startupAbort = controller;
		this.waitForDiscovery(generation, settings.publicOrigin, controller.signal);
	}
	async waitForDiscovery(generation, origin, signal) {
		const deadline = Date.now() + (this.options.startTimeoutMs ?? START_TIMEOUT_MS$1);
		const probe = this.options.probeDiscovery ?? defaultProbeDiscovery;
		while (!signal.aborted && Date.now() < deadline) {
			try {
				if (await probe(origin, this.options.instanceId, signal)) {
					await this.enqueue(async () => {
						if (generation !== this.generation || signal.aborted || !this.enabled) return;
						this.startupAbort = void 0;
						this.publish({
							enabled: true,
							state: "ready",
							origin
						});
					});
					return;
				}
			} catch (error) {
				if (signal.aborted) return;
				if (error instanceof Error && (error.message === "frp_discovery_mismatch" || error.message === "frp_discovery_invalid")) {
					await this.enqueue(() => this.failGeneration(generation, error.message));
					return;
				}
			}
			await new Promise((resolveWait) => {
				let finished = false;
				const finish = () => {
					if (finished) return;
					finished = true;
					clearTimeout(timer);
					signal.removeEventListener("abort", finish);
					resolveWait();
				};
				const timer = setTimeout(finish, this.options.retryIntervalMs ?? DISCOVERY_RETRY_MS);
				timer.unref();
				signal.addEventListener("abort", finish, { once: true });
			});
		}
		if (!signal.aborted) await this.enqueue(() => this.failGeneration(generation, "frp_start_timeout"));
	}
	async failGeneration(generation, code) {
		if (generation !== this.generation) return;
		await this.stopProcessAndGateway();
		if (this.enabled) this.publish({
			enabled: true,
			state: "error",
			errorCode: code
		});
	}
	async stop() {
		++this.generation;
		await this.stopProcessAndGateway();
	}
	async stopProcessAndGateway() {
		this.startupAbort?.abort();
		this.startupAbort = void 0;
		const child = this.child;
		this.child = void 0;
		const gateway = this.gatewayValue;
		this.gatewayValue = void 0;
		await settleRemoteResources([
			() => child !== void 0 && child.exitCode === null ? terminateRemoteProcess(child) : void 0,
			() => gateway?.close(),
			() => this.options.config.removeRuntimeConfig()
		], "FRP resource cleanup failed");
	}
};
//#endregion
//#region src/task-events.ts
const TASK_EVENT_DEBOUNCE_MS = 1e3;
function turnNumber(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
function turnData(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return {
		turn: 0,
		completed: false
	};
	const record = value;
	const reason = record.reason;
	const completed = typeof reason === "string" ? reason === "completed" : reason !== null && typeof reason === "object" && reason.kind === "completed";
	return {
		turn: turnNumber(record.turn),
		completed
	};
}
/**
* Subscribe to completed root turns. Subagent turns are skipped so one task
* announces once, and rapid turn boundaries collapse into a single event.
* Returns a disposer that also drops pending debounces.
*/
function watchTaskCompletions(ctx, options) {
	const debounceMs = options.debounceMs ?? 1e3;
	const pending = /* @__PURE__ */ new Map();
	const disposeListener = ctx.on("session/event", (session, event) => {
		if (event.type !== "turn/end") return;
		const { turn, completed } = turnData(event.data);
		if (!completed) return;
		if (session.header?.parentSession !== void 0 && session.header?.parentSession !== null) return;
		const sessionId = String(session.id);
		options.log?.("task-completed-observed", {
			sessionId,
			turn
		});
		const previous = pending.get(sessionId);
		if (previous !== void 0) clearTimeout(previous);
		pending.set(sessionId, setTimeout(() => {
			pending.delete(sessionId);
			options.log?.("task-completed-announced", {
				sessionId,
				turn
			});
			options.onTaskCompleted(Object.freeze({
				sessionId,
				turn
			}));
		}, debounceMs));
	});
	return () => {
		disposeListener();
		for (const timer of pending.values()) clearTimeout(timer);
		pending.clear();
	};
}
/** One subscription feeding every live gateway; gateways register on start. */
var TaskEventHub = class {
	sinks = /* @__PURE__ */ new Set();
	/** Register a sink; returns its disposer. */
	add(sink) {
		this.sinks.add(sink);
		return () => {
			this.sinks.delete(sink);
		};
	}
	/** Fan out to a snapshot so a failing sink cannot break its siblings. */
	broadcast(event) {
		for (const sink of [...this.sinks]) try {
			sink.broadcastTaskEvent(event);
		} catch {}
	}
	/** Visible for tests. */
	get size() {
		return this.sinks.size;
	}
};
//#endregion
//#region src/diagnostics.ts
const REMOTE_ERROR_GUIDANCE = Object.freeze({
	component_missing: "重新安装完整插件包。",
	funnel_permission_required: "继续完成 Tailscale Funnel 授权。",
	funnel_https_required: "继续完成 Tailscale HTTPS 授权。",
	funnel_start_failed: "重新打开授权页并允许 Funnel。",
	funnel_start_timeout: "检查网络后点击“重新连接”。",
	tailscale_dns_missing: "确认 Tailscale 登录仍有效后重新连接。",
	sidecar_launch_failed: "重新安装完整插件包后重试。",
	sidecar_stopped: "点击“重新连接”。",
	sidecar_exited: "点击“重新连接”；仍失败时复制诊断报告。",
	control_channel_failed: "点击“重新连接”。",
	cpolar_component_missing: "先安装 cpolar 官方组件。",
	cpolar_component_invalid: "彻底移除 cpolar 组件后重新安装。",
	cpolar_config_missing: "保存 cpolar Authtoken 后重试。",
	cpolar_config_invalid: "重新保存 cpolar Authtoken。",
	cpolar_start_timeout: "检查网络后点击“重新连接”。",
	cpolar_stopped: "点击“重新连接”。",
	cpolar_exited: "点击“重新连接”；仍失败时复制诊断报告。",
	frp_component_missing: "先安装 FRP 官方组件。",
	frp_component_invalid: "彻底清理 FRP 组件后重新安装。",
	frp_config_missing: "先保存自建 FRP 连接配置。",
	frp_config_verify_failed: "检查服务器地址、端口、Token 和公开域名。",
	frp_vhost_publicly_reachable: "将 frps 的 HTTP vhost 监听限制到 127.0.0.1。",
	frp_vhost_probe_failed: "确认 VPS 地址可解析后重新连接。",
	frp_launch_failed: "重新安装 FRP 官方组件后重试。",
	frp_start_timeout: "确认 frps、Caddy 和域名解析正常后重新连接。",
	frp_discovery_mismatch: "公开域名连接到了另一台电脑，请核对 Caddy 与 frps 配置。",
	frp_discovery_invalid: "公开域名返回了非 DSH Mobile 响应。",
	frp_stopped: "点击“重新连接”。",
	frp_exited: "检查 VPS 配置后重新连接；仍失败时复制诊断报告。",
	gateway_start_failed: "确认 DSH 正在运行后重新连接。"
});
function check(id, status, reason, label, detail, action, facts) {
	return Object.freeze({
		id,
		status,
		reason,
		...facts === void 0 ? {} : { facts: Object.freeze(facts) },
		label,
		detail,
		...action === void 0 ? {} : { action }
	});
}
function maskLanOrigin(origin) {
	if (origin === void 0) return "未分配";
	try {
		const url = new URL(origin);
		const octets = url.hostname.split(".");
		const host = octets.length === 4 ? `${octets[0]}.${octets[1]}.${octets[2]}.x` : "局域网地址";
		return `${url.protocol}//${host}${url.port === "" ? "" : `:${url.port}`}`;
	} catch {
		return "地址格式无效";
	}
}
function remoteSuffix(origin) {
	if (origin === void 0) return "未分配";
	try {
		const hostname = new URL(origin).hostname;
		if (hostname.endsWith(".ts.net")) return "*.ts.net";
		for (const suffix of [
			".cpolar.cn",
			".cpolar.io",
			".cpolar.top",
			".cpolar.com"
		]) if (hostname.endsWith(suffix)) return `*${suffix}`;
		return "公共 HTTPS 地址";
	} catch {
		return "地址格式无效";
	}
}
function defaultFirewallProbe(platform = process.platform) {
	return async (port) => {
		if (platform !== "win32") return { state: "not-applicable" };
		if (port === void 0) return { state: "unknown" };
		const script = [
			"$specs = @(@{ Name = 'DSH Mobile HTTPS'; Protocol = 'TCP' }, @{ Name = 'DSH Mobile Discovery'; Protocol = 'UDP' })",
			"$ready = $true",
			"$specs | ForEach-Object {",
			"  $spec = $_",
			"  $rule = Get-NetFirewallRule -DisplayName $spec.Name -ErrorAction SilentlyContinue | Where-Object { $_.Enabled -eq 'True' -and $_.Direction -eq 'Inbound' -and $_.Action -eq 'Allow' } | Select-Object -First 1",
			"  if ($null -eq $rule) { $ready = $false; return }",
			"  $filters = @($rule | Get-NetFirewallPortFilter -ErrorAction SilentlyContinue)",
			`  $matching = @($filters | Where-Object { $_.Protocol -eq $spec.Protocol -and ($_.LocalPort -eq 'Any' -or $_.LocalPort -eq '${String(port)}') })`,
			"  if ($matching.Count -eq 0) { $ready = $false }",
			"}",
			"if ($ready) { 'ready' } else { 'missing' }"
		].join("; ");
		try {
			return { state: (await execFileText("powershell.exe", [
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				script
			], {
				encoding: "utf8",
				timeout: 3e3,
				windowsHide: true
			})).stdout.trim() === "ready" ? "ready" : "missing" };
		} catch {
			return { state: "unknown" };
		}
	};
}
/** Allow remote relays enough time to answer without making diagnostics unbounded. */
function remoteDiagnosticTimeoutMs(origin) {
	const hostname = new URL(origin).hostname.toLowerCase();
	if (hostname.endsWith(".ts.net") || hostname.includes(".cpolar.")) return 1e4;
	return 1e4;
}
async function defaultRemoteProbe(origin) {
	if (origin === void 0) return { state: "not-applicable" };
	const hostname = new URL(origin).hostname;
	const started = performance.now();
	try {
		const response = await fetch(new URL("/mobile-access/health", origin), {
			cache: "no-store",
			redirect: "error",
			signal: AbortSignal.timeout(remoteDiagnosticTimeoutMs(origin))
		});
		const latencyMs = Math.max(0, Math.round(performance.now() - started));
		if (response.status === 429) return {
			state: "rate-limited",
			latencyMs
		};
		return response.ok ? {
			state: "ready",
			latencyMs
		} : {
			state: "unreachable",
			latencyMs
		};
	} catch {
		let fakeIp = false;
		try {
			fakeIp = (await lookup(hostname, { all: true })).some(({ address }) => {
				const [first, second] = address.split(".").map(Number);
				return first === 198 && (second === 18 || second === 19);
			});
		} catch {}
		return {
			state: "unreachable",
			...fakeIp ? { fakeIp: true } : {}
		};
	}
}
function reportLine(entry) {
	return `[${entry.status.toUpperCase()}] ${entry.label}: ${entry.detail}${entry.action === void 0 ? "" : ` ${entry.action}`}`;
}
/** Run bounded read-only checks and return a report safe to paste into an issue. */
async function collectConnectionDiagnostics(snapshot, probes = {}) {
	const checks = [];
	const remoteProbe = snapshot.remote.running && snapshot.remote.state === "ready" && snapshot.remote.origin !== void 0 ? (probes.remote ?? defaultRemoteProbe)(snapshot.remote.origin) : Promise.resolve({ state: "not-applicable" });
	const [firewall, remoteObservation] = await Promise.all([(probes.firewall ?? defaultFirewallProbe())(snapshot.lan.port), remoteProbe]);
	checks.push(check("versions", "ok", "versions-current", "版本兼容", `插件 ${DSH_MOBILE_VERSION}，DSH ${snapshot.dshVersion}，Android App 最低 ${MINIMUM_ANDROID_APP_VERSION}。`));
	if (snapshot.lan.networkError !== void 0) checks.push(check("network", "error", "network-unavailable", "局域网网卡", "已保存的网卡当前不可用。", "重新运行 dsh-mobile setup。"));
	else if (snapshot.lan.configuredInterface !== void 0) {
		const interfaceName = snapshot.lan.interfaceName ?? snapshot.lan.configuredInterface;
		checks.push(check("network", "ok", "network-interface", "局域网网卡", `正在跟随 ${interfaceName}。`, void 0, { interfaceName }));
	} else checks.push(check("network", "info", "network-fixed", "局域网网卡", "当前使用固定网络配置。"));
	if (snapshot.lan.running && snapshot.lan.origin !== void 0) {
		const endpointSuffix = maskLanOrigin(snapshot.lan.origin);
		checks.push(check("lan", "ok", "lan-ready", "局域网网关", `已监听 ${endpointSuffix}，配对入口可用。`, void 0, { endpointSuffix }));
	} else checks.push(check("lan", "info", "lan-off", "局域网网关", "当前未开启。", "需要手机直连时开启局域网访问。"));
	if (firewall.state === "ready") checks.push(check("firewall", "ok", "firewall-ready", "Windows 防火墙", "局域网 TCP 与发现规则已启用。"));
	else if (firewall.state === "missing") checks.push(check("firewall", "warning", "firewall-missing", "Windows 防火墙", "未找到完整的局域网放行规则。", "以管理员身份重新运行 dsh-mobile setup。"));
	else if (firewall.state === "unknown") checks.push(check("firewall", "info", "firewall-unknown", "Windows 防火墙", "系统未允许插件读取防火墙状态。", "若手机找不到电脑，以管理员身份重新运行 setup。"));
	if (!snapshot.remote.running || snapshot.remote.state === "off") checks.push(check("remote", "info", "remote-off", "远程通道", "当前未启用。", void 0, { provider: snapshot.remote.provider }));
	else if (snapshot.remote.state === "ready" && snapshot.remote.origin !== void 0) {
		const endpointSuffix = remoteSuffix(snapshot.remote.origin);
		const facts = {
			provider: snapshot.remote.provider,
			endpointSuffix,
			...remoteObservation.latencyMs === void 0 ? {} : { latencyMs: remoteObservation.latencyMs }
		};
		if (remoteObservation.state === "ready") checks.push(check("remote", "ok", "remote-ready", "远程通道", `${snapshot.remote.provider} 公共地址 ${endpointSuffix} 可达，往返约 ${String(remoteObservation.latencyMs ?? 0)} ms。`, void 0, facts));
		else if (remoteObservation.state === "rate-limited") checks.push(check("remote", "warning", "remote-rate-limited", "远程通道", "公共地址可达，但本次检查观察到服务限流。", "稍后重试；旧会话会按需加载以减少流量。", facts));
		else if (snapshot.remote.provider === "tailscale" && remoteObservation.fakeIp === true) checks.push(check("remote", "error", "remote-fake-ip", "远程通道", "Tailscale 地址被当前 VPN 或 DNS 代理接管，但 TLS 链路未建立。", "切换 VPN 节点或代理模式；仍失败时改用 cpolar。", facts));
		else checks.push(check("remote", "error", "remote-unreachable", "远程通道", "提供方显示已就绪，但公共地址暂不可达。", "点击“重新连接”；仍失败时检查提供方状态。", facts));
	} else if (snapshot.remote.state === "starting" || snapshot.remote.state === "connecting" || snapshot.remote.state === "needs-login") {
		const needsLogin = snapshot.remote.state === "needs-login";
		checks.push(check("remote", "warning", needsLogin ? "remote-needs-login" : "remote-connecting", "远程通道", needsLogin ? "等待完成 Tailscale 登录。" : "仍在建立连接。", needsLogin ? "返回远程页继续登录。" : "等待片刻后重新检查。", { provider: snapshot.remote.provider }));
	} else {
		const controllerCode = snapshot.remote.errorCode ?? snapshot.remote.state;
		checks.push(check("remote", "error", "remote-controller-error", "远程通道", `连接未建立（${controllerCode}）。`, REMOTE_ERROR_GUIDANCE[controllerCode] ?? "返回远程页点击“重新连接”。", {
			provider: snapshot.remote.provider,
			controllerCode
		}));
	}
	checks.push(check("phone-network", "info", "phone-network-unknown", "手机网络", "电脑无法判断路由器是否隔离了手机。", "局域网仍失败时，确认手机与电脑在同一网络，并关闭访客网络或 AP 隔离。"));
	const overall = checks.some((entry) => entry.status === "error") ? "error" : checks.some((entry) => entry.status === "warning") ? "attention" : "ok";
	const summary = overall === "ok" ? "连接基础检查正常。" : overall === "attention" ? "发现需要留意的项目。" : "发现会影响连接的问题。";
	const report = [
		"DSH Mobile 诊断报告",
		`生成时间: ${(/* @__PURE__ */ new Date()).toISOString()}`,
		`版本: plugin=${DSH_MOBILE_VERSION}; dsh=${snapshot.dshVersion}; min-app=${MINIMUM_ANDROID_APP_VERSION}`,
		`LAN: ${snapshot.lan.running ? "on" : "off"}; endpoint=${maskLanOrigin(snapshot.lan.origin)}`,
		`Remote: provider=${snapshot.remote.provider}; state=${snapshot.remote.state}; endpoint=${remoteSuffix(snapshot.remote.origin)}`,
		...checks.map(reportLine)
	].join("\n");
	return Object.freeze({
		version: 1,
		generatedAt: Date.now(),
		overall,
		versions: Object.freeze({
			plugin: DSH_MOBILE_VERSION,
			dsh: snapshot.dshVersion,
			minimumAndroidApp: MINIMUM_ANDROID_APP_VERSION
		}),
		summary,
		checks: Object.freeze(checks),
		report
	});
}
//#endregion
//#region src/mobile-guide.ts
/** Compose the guide with the current customization state injected. */
function buildMobileGuide(state) {
	const styleLine = state.hasCustomCss ? "存在（当前生效的自定义样式）" : "不存在（使用内置默认样式）";
	const scriptLine = state.hasCustomJs ? "存在（当前生效的自定义脚本）" : "不存在（无自定义脚本）";
	const extensionLines = state.extensions.length === 0 ? "（无）" : state.extensions.map((entry) => `- ${entry.id}（${entry.name} v${entry.version}）`).join("\n");
	const failureLine = state.failedExtensionCount > 0 ? `注意：${state.failedExtensionCount} 个扩展的电脑端 host 激活失败，如改动相关扩展请先检查其 host.mjs 与 extension.json。` : "";
	return `${`## 手机端当前状态（改名前必读，避免覆盖已有定制）

- 定制目录：${state.directory}（所有改动只允许在这里进行）
- mobile.css：${styleLine}
- mobile.js：${scriptLine}
- 已安装扩展：
${extensionLines}
${failureLine}

“恢复默认”操作说明：当用户要求恢复默认 / 还原初始外观时，删除 mobile.css 与 mobile.js 两个文件（删除后手机端自动回到内置默认外观，无需创建占位文件），并按需删除 extensions/ 下的扩展目录。\n\n`}${MOBILE_CUSTOMIZATION_GUIDE_BODY}`;
}
/**
* Static body of the customization guide. Kept separate from the injected
* state snapshot so the two concerns stay easy to edit independently.
*/
const MOBILE_CUSTOMIZATION_GUIDE_BODY = `你在为用户定制 DSH Mobile 的手机端。DSH Mobile 是一个把电脑上的 DeepSeek Harness 带到手机浏览器的插件，手机端界面和能力都来自本机文件。

所有改动只允许在 $DSH_HOME/mobile-access/ 目录内进行，绝不修改 DeepSeek Harness 的源码或其他目录。$DSH_HOME 是 DeepSeek Harness 的配置目录（通常为 ~/.dsh），先确认它的实际路径再操作。

手机端的能力分两层，按用户需求选择改动目标：

1. 界面与交互 —— 只改外观和交互，不需要碰电脑的文件或程序：
   - $DSH_HOME/mobile-access/mobile.css：手机端样式
   - $DSH_HOME/mobile-access/mobile.js：手机端脚本，用 window.dshMobile.register(({ root }) => { ... }) 把内容挂载到 root，返回清理函数
   - 保存后手机端几秒内自动应用，无需重启

2. 电脑端能力 —— 手机需要读电脑文件、执行命令或访问硬件时，创建扩展：
   - 目录：$DSH_HOME/mobile-access/extensions/<id>/，id 用小写字母数字和连字符（如 media-remote）
   - extension.json：{"schemaVersion":1,"id":"<id>","name":"显示名","version":"0.1.0","description":"说明"}
   - host.mjs：电脑端 Node.js 代码（可信本地代码，可读写文件、执行命令）。导出默认函数 (api) => { ... }，用 api.action('名称', { input, run }) 注册动作、api.route({ method, path, handle }) 注册路由、api.effect(fn) 注册清理
   - mobile.js：手机端脚本，用 window.dshMobile.define({ apiVersion:1, id:'<id>', activate(api) { ... } })，activate 返回清理函数
   - mobile.css：手机端样式（可选）
   - assets/：手机端静态资源（可选）
   - mobile.js 里用 api.host.invoke('动作名', 输入) 调 host.mjs 的 action，api.host.fetch('/路由路径') 调 route，api.host.assetUrl('相对路径') 生成与当前版本绑定的资源地址
   - 也可以先用命令生成模板：dsh plugin --profile web exec dsh-mobile extension create <id> --name "<名称>"，再在模板上改

安全约束：
- host.mjs 拥有电脑用户的完整权限，绝不能放入不可信代码，也不要让手机端无条件执行任意命令
- 所有改动只限 $DSH_HOME/mobile-access/，不要动 DeepSeek Harness 源码

完成前请自检：
- 改动涉及 mobile.js 或扩展的 mobile.js / host.mjs 时，先做语法检查再保存（如 node --check <file>），确保没有语法错误
- 创建或修改扩展后，确认 extension.json 的 schemaVersion 为 1、id 与目录名一致、且 id 只含小写字母数字和连字符
- 扩展的 host.mjs 若在完成前无法激活，先修正而不是留下损坏的扩展
- 完成后检查自己实际写入了哪些文件，向用户简要说明改了什么、手机端会有什么变化`;
//#endregion
//#region src/vps-deploy.ts
const FRP_VERSION = "0.70.1";
const SSH_TIMEOUT_MS = 3e5;
const LINUX_ARTIFACTS = Object.freeze({
	x64: Object.freeze({
		directory: `frp_${FRP_VERSION}_linux_amd64`,
		url: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz`,
		sha256: "333da23d1b9009d7c01638e9ba38cf4600f7d37d393f854e96ee1396adefa9a6"
	}),
	arm64: Object.freeze({
		directory: `frp_${FRP_VERSION}_linux_arm64`,
		url: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_arm64.tar.gz`,
		sha256: "3990f396a9a490ee7f0e5f355287750ed41520064ed999eab443b5e9a78d773d"
	})
});
var VpsSshError = class extends Error {
	stdout;
	stderr;
	constructor(message, stdout, stderr, options) {
		super(message, options);
		this.stdout = stdout;
		this.stderr = stderr;
	}
};
function shellQuote(value) {
	return `'${value.replaceAll("'", "'\\''")}'`;
}
/**
* Reject loopback, private, and other non-routable IPv4 literals as VPS SSH
* targets. A self-hosted deployment always addresses a public server; the
* shared frpc settings stay permissive so local loopback test rigs keep working.
*/
function assertPublicSshTarget(serverAddress) {
	if (isIP(serverAddress) === 4 && !isGloballyRoutableIpv4(serverAddress)) throw new Error("vps_server_not_public");
}
/**
* Validate a VPS address for every operation that opens a network connection
* to it (scan, deploy, cleanup). IPv6 is unsupported by the SSH flow and
* loopback/private targets are never valid VPS endpoints.
*/
function validateVpsServerTarget(serverAddress) {
	const address = validateFrpServerAddress(serverAddress);
	if (isIP(address) !== 0 && address.includes(":")) throw new Error("vps_ipv6_ssh_not_supported");
	assertPublicSshTarget(address);
	return address;
}
function validSshUser(value) {
	if (typeof value !== "string" || value.length < 1 || value.length > 64 || !/^[a-z_][a-z0-9_.-]*[$]?$/iu.test(value)) throw new Error("vps_ssh_user_invalid");
	return value;
}
function validSshPort(value) {
	if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 65535) throw new Error("vps_ssh_port_invalid");
	return Number(value);
}
function validSshKeyPath(value) {
	if (value === void 0 || value === "") return void 0;
	if (typeof value !== "string" || !isAbsolute(value) || value.length > 4096 || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error("vps_ssh_key_invalid");
	return resolve(value);
}
function parseVpsDeploymentInput(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("vps_deploy_input_invalid");
	const record = value;
	if (Reflect.ownKeys(record).some((key) => ![
		"sshUser",
		"sshPort",
		"sshKeyPath",
		"hostFingerprints"
	].includes(String(key)))) throw new Error("vps_deploy_input_invalid");
	const sshKeyPath = validSshKeyPath(record.sshKeyPath);
	return Object.freeze({
		sshUser: validSshUser(record.sshUser),
		sshPort: validSshPort(record.sshPort),
		...sshKeyPath === void 0 ? {} : { sshKeyPath },
		hostFingerprints: Object.freeze(parseVpsHostFingerprints(record.hostFingerprints))
	});
}
/** Validate user-confirmed SHA256 host-key fingerprints (`SHA256:…`). */
function parseVpsHostFingerprints(value) {
	if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new Error("vps_host_key_unconfirmed");
	const fingerprints = [];
	for (const entry of value) {
		if (typeof entry !== "string" || !/^SHA256:[A-Za-z0-9+/]{40,60}={0,2}$/u.test(entry) || entry.length > 96) throw new Error("vps_host_key_unconfirmed");
		fingerprints.push(entry);
	}
	return [...new Set(fingerprints)];
}
const SUPPORTED_HOST_KEY_TYPES = /* @__PURE__ */ new Set([
	"ssh-rsa",
	"ecdsa-sha2-nistp256",
	"ecdsa-sha2-nistp384",
	"ecdsa-sha2-nistp521",
	"ssh-ed25519"
]);
/** Format a raw host public key the way OpenSSH displays it (`SHA256:…` without padding). */
function fingerprintHostPublicKey(keyType, base64Key) {
	if (!SUPPORTED_HOST_KEY_TYPES.has(keyType)) throw new Error("vps_host_key_unsupported_type");
	if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(base64Key) || base64Key.length < 24 || base64Key.length > 1024) throw new Error("vps_host_key_invalid");
	const raw = Buffer.from(base64Key, "base64");
	if (raw.length < 16 || raw.length > 768) throw new Error("vps_host_key_invalid");
	return `SHA256:${createHash("sha256").update(raw).digest("base64").replace(/=+$/u, "")}`;
}
function parseKeyscanOutput(output) {
	const keys = [];
	for (const line of output.split(/\r?\n/u)) {
		const trimmed = line.trim();
		if (trimmed === "" || trimmed.startsWith("#")) continue;
		const match = /^(?:\S+\s+)?(ssh-rsa|ecdsa-sha2-nistp\d+|ssh-ed25519)\s+([A-Za-z0-9+/]+={0,2})(\s|$)/u.exec(trimmed);
		if (match?.[1] === void 0 || match[2] === void 0) throw new Error("vps_host_key_invalid");
		keys.push({
			keyType: match[1],
			base64Key: match[2]
		});
	}
	return keys;
}
/** Base SSH options shared by long deployment sessions. Keepalives survive NAT
*  middleboxes during minute-long apt/pip phases; host identity stays pinned. */
function sshSessionOptions(knownHostsFile) {
	return [
		"-o",
		"BatchMode=yes",
		"-o",
		"ConnectTimeout=15",
		"-o",
		"ServerAliveInterval=15",
		"-o",
		"ServerAliveCountMax=8",
		"-o",
		"StrictHostKeyChecking=yes",
		`-o UserKnownHostsFile=${knownHostsFile}`
	];
}
/** Lenient scan probe: garbage fails the whole fetch, comment-only output falls back. */
function tryParseKeyscanOutput(output) {
	try {
		return parseKeyscanOutput(output);
	} catch {
		return;
	}
}
async function gitBundledKeyscan() {
	if (process.platform !== "win32") return void 0;
	const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
	const candidate = join(programFiles, "Git", "usr", "bin", "ssh-keyscan.exe");
	try {
		if (!(await lstat(candidate)).isFile()) return void 0;
	} catch {
		return;
	}
	return candidate;
}
async function defaultRunKeyscan(input, serverAddress) {
	const keyscan = process.platform === "win32" ? "ssh-keyscan.exe" : "ssh-keyscan";
	const args = [
		"-T",
		"10",
		"-p",
		String(input.sshPort),
		"-t",
		"rsa,ecdsa,ed25519",
		serverAddress
	];
	const first = await runProcess(keyscan, args, void 0, 3e4).catch(() => void 0);
	if (first !== void 0 && tryParseKeyscanOutput(first.stdout)?.length) return first.stdout;
	const bundled = await gitBundledKeyscan();
	if (bundled !== void 0) {
		const second = await runProcess(bundled, args, void 0, 3e4).catch(() => void 0);
		if (second !== void 0 && tryParseKeyscanOutput(second.stdout)?.length) return second.stdout;
	}
	return first?.stdout ?? "";
}
/**
* Read the server's public host keys over an authenticated connection with a
* throwaway known_hosts file. Fallback for keyscan binaries that cannot
* negotiate with modern servers; output feeds the same confirm-and-pin pipeline.
*/
async function defaultRunSshFetch(input, serverAddress) {
	const ssh = process.platform === "win32" ? "ssh.exe" : "ssh";
	const sshUser = validSshUser(input.sshUser);
	const sshPort = validSshPort(input.sshPort);
	const sshKeyPath = validSshKeyPath(input.sshKeyPath);
	const { stdout } = await runProcess(ssh, [
		"-o",
		"BatchMode=yes",
		"-o",
		"ConnectTimeout=15",
		"-o",
		"StrictHostKeyChecking=no",
		`-o UserKnownHostsFile=${process.platform === "win32" ? "NUL" : "/dev/null"}`,
		...sshKeyPath === void 0 ? [] : ["-i", sshKeyPath],
		"-p",
		String(sshPort),
		`${sshUser}@${serverAddress}`,
		"cat /etc/ssh/ssh_host_*_key.pub"
	], void 0, 3e4).catch((error) => {
		throw new VpsSshError("vps_host_key_unavailable", "", error instanceof Error ? error.message : String(error));
	});
	const lines = [];
	for (const line of stdout.split(/\r?\n/u)) {
		const match = /^(ssh-rsa|ecdsa-sha2-nistp\d+|ssh-ed25519)\s+([A-Za-z0-9+/]+={0,2})(\s|$)/u.exec(line.trim());
		if (match?.[1] !== void 0 && match[2] !== void 0) lines.push(`${serverAddress} ${match[1]} ${match[2]}`);
	}
	return lines.length === 0 ? stdout : `${lines.join("\n")}\n`;
}
/**
* Scan host keys with keyscan first, then fall back to an authenticated read
* when the local keyscan binary cannot negotiate with the server. Both paths
* feed the same confirm-and-pin pipeline, so a fallback never weakens the
* user-confirmation gate.
*/
async function scanHostKeys(input, serverAddress, options) {
	const scanned = await (options.runKeyscan ?? defaultRunKeyscan)({
		sshUser: input.sshUser,
		sshPort: input.sshPort
	}, serverAddress).catch(() => "");
	if (tryParseKeyscanOutput(scanned)?.length) return scanned;
	options.log?.("host-keys-keyscan-empty", { serverAddress });
	const fetched = await (options.runSshFetch ?? defaultRunSshFetch)(input, serverAddress);
	if (tryParseKeyscanOutput(fetched)?.length) {
		options.log?.("host-keys-ssh-fallback", { serverAddress });
		return fetched;
	}
	throw new Error("vps_host_key_unavailable");
}
/**
* Fetch the server's current host keys and return them with OpenSSH-style
* fingerprints for the user to confirm out of band (for example against the
* VPS console) before any destructive or authenticated deployment step.
*/
async function fetchVpsHostKeys(serverAddress, input, options = {}) {
	const address = validateVpsServerTarget(serverAddress);
	const keys = parseKeyscanOutput(await scanHostKeys({
		sshUser: validSshUser(input.sshUser),
		sshPort: validSshPort(input.sshPort),
		sshKeyPath: input.sshKeyPath
	}, address, options));
	if (keys.length === 0) throw new Error("vps_host_key_unavailable");
	const seen = /* @__PURE__ */ new Set();
	const hostKeys = [];
	for (const key of keys) {
		const fingerprint = fingerprintHostPublicKey(key.keyType, key.base64Key);
		if (seen.has(fingerprint)) continue;
		seen.add(fingerprint);
		hostKeys.push(Object.freeze({
			keyType: key.keyType,
			fingerprint
		}));
	}
	options.log?.("host-keys-fetched", {
		serverAddress: address,
		keyTypes: hostKeys.length
	});
	return Object.freeze(hostKeys);
}
/**
* Verify that every host key the server currently presents was confirmed by the
* user, then return a pinned known_hosts body. Fails closed on rotation,
* replacement, or unexpected extra keys.
*/
function buildPinnedKnownHosts(serverAddress, sshPort, keyscanOutput, confirmedFingerprints) {
	const address = validateFrpServerAddress(serverAddress);
	const port = validSshPort(sshPort);
	const confirmed = new Set(parseVpsHostFingerprints([...confirmedFingerprints]));
	const keys = parseKeyscanOutput(keyscanOutput);
	if (keys.length === 0) throw new Error("vps_host_key_unavailable");
	const host = port === 22 ? address : `[${address}]:${port}`;
	const lines = [];
	for (const key of keys) {
		const fingerprint = fingerprintHostPublicKey(key.keyType, key.base64Key);
		if (!confirmed.has(fingerprint)) throw new Error("vps_host_key_mismatch");
		lines.push(`${host} ${key.keyType} ${key.base64Key}`);
	}
	return `${lines.join("\n")}\n`;
}
function safeOutput(value, token) {
	return (token === "" ? value : value.replaceAll(token, "<redacted>")).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, "").slice(0, 8192).trim();
}
function parseChecks(stdout, stderr, token) {
	const checks = [];
	for (const line of stdout.split(/\r?\n/u)) {
		const match = /^DSH_MOBILE_CHECK\s+([a-z0-9_-]+)\s+(ok|warning|error)\s+(.+)$/iu.exec(line);
		if (match !== null) checks.push(Object.freeze({
			id: match[1],
			status: match[2].toLowerCase(),
			detail: safeOutput(match[3], token)
		}));
	}
	if (checks.length === 0 && stderr.trim() !== "") checks.push(Object.freeze({
		id: "remote-command",
		status: "error",
		detail: safeOutput(stderr, token) || "VPS 返回了未分类错误。"
	}));
	return Object.freeze(checks);
}
/**
* One-line failure detail for transport-level failures: prefer the failed
* remote check, otherwise use the last stderr line (a `set -eu` abort has no
* check line) instead of dumping the whole transcript into the UI.
*/
function failureDetail(stdout, stderr, token) {
	const failed = parseChecks(`${stdout}\n${stderr}`, "", token).find((check) => check.status === "error");
	if (failed !== void 0) return failed.detail;
	for (const stream of [stderr, stdout]) {
		const lines = stream.split(/\r?\n/u).map((line) => line.trim()).filter((line) => line !== "");
		const last = lines[lines.length - 1];
		if (last !== void 0) return safeOutput(last, token);
	}
	return "";
}
function deploymentScript(settings) {
	const amd64 = LINUX_ARTIFACTS.x64;
	const arm64 = LINUX_ARTIFACTS.arm64;
	const config = [
		"bindAddr = \"0.0.0.0\"",
		`bindPort = ${String(settings.serverPort)}`,
		"proxyBindAddr = \"127.0.0.1\"",
		"vhostHTTPPort = 7080",
		"auth.method = \"token\"",
		`auth.token = ${JSON.stringify(settings.token)}`,
		""
	].join("\n");
	const publicHost = new URL(settings.publicOrigin).hostname;
	const publicIp = isGloballyRoutableIpv4(publicHost);
	const caddySite = createCaddySite(publicHost);
	const caddySnippet = `${FRP_CADDY_SNIPPET_MARKER}\n${caddySite.trimEnd()}\n`;
	const ipCertificateSetup = publicIp ? `
export DEBIAN_FRONTEND=noninteractive
apt-get install -y python3-venv
if [ ! -x /opt/dsh-mobile/certbot-venv/bin/certbot ]; then
  python3 -m venv /opt/dsh-mobile/certbot-venv
  /opt/dsh-mobile/certbot-venv/bin/pip install --disable-pip-version-check 'certbot==5.8.0'
fi
systemctl stop caddy.service || true
if ! /opt/dsh-mobile/certbot-venv/bin/certbot certonly --standalone --preferred-profile shortlived --ip-address ${publicHost} --agree-tos --register-unsafely-without-email --non-interactive --keep-until-expiring; then
  systemctl start caddy.service || true
  fail "公网 IP HTTPS 证书申请失败；请确认 80/tcp 可从公网访问。"
fi
install -d -m 0750 -o caddy -g caddy /var/lib/caddy/dsh-mobile-certs
install -m 0640 -o caddy -g caddy /etc/letsencrypt/live/${publicHost}/fullchain.pem /var/lib/caddy/dsh-mobile-certs/fullchain.pem
install -m 0640 -o caddy -g caddy /etc/letsencrypt/live/${publicHost}/privkey.pem /var/lib/caddy/dsh-mobile-certs/privkey.pem
cat > /usr/local/sbin/dsh-mobile-cert-renew <<'DSH_MOBILE_CERT_RENEW'
#!/bin/sh
set -eu
systemctl stop caddy.service
trap 'systemctl start caddy.service' EXIT
/opt/dsh-mobile/certbot-venv/bin/certbot renew --cert-name ${publicHost} --preferred-profile shortlived --non-interactive
install -d -m 0750 -o caddy -g caddy /var/lib/caddy/dsh-mobile-certs
install -m 0640 -o caddy -g caddy /etc/letsencrypt/live/${publicHost}/fullchain.pem /var/lib/caddy/dsh-mobile-certs/fullchain.pem
install -m 0640 -o caddy -g caddy /etc/letsencrypt/live/${publicHost}/privkey.pem /var/lib/caddy/dsh-mobile-certs/privkey.pem
DSH_MOBILE_CERT_RENEW
chmod 0755 /usr/local/sbin/dsh-mobile-cert-renew
cat > /etc/systemd/system/dsh-mobile-cert-renew.service <<'DSH_MOBILE_CERT_SERVICE'
[Unit]
Description=Renew DSH Mobile public IP TLS certificate
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/dsh-mobile-cert-renew
DSH_MOBILE_CERT_SERVICE
cat > /etc/systemd/system/dsh-mobile-cert-renew.timer <<'DSH_MOBILE_CERT_TIMER'
[Unit]
Description=Daily DSH Mobile public IP TLS certificate renewal check

[Timer]
OnCalendar=daily
RandomizedDelaySec=2h
Persistent=true
Unit=dsh-mobile-cert-renew.service

[Install]
WantedBy=timers.target
DSH_MOBILE_CERT_TIMER
check certificate ok "Let's Encrypt 公网 IP 证书已安装并启用每日自动续期。"
` : "";
	return `#!/bin/sh
set -eu
umask 077

fail() { echo "DSH_MOBILE_CHECK remote-command error $1" >&2; exit 1; }
check() { echo "DSH_MOBILE_CHECK $1 $2 $3"; }

# Serialize concurrent deploys: two writers racing sed -i on the Caddyfile
# can duplicate the import line and break validation. Uninstall takes the
# same lock, so deploy and cleanup also exclude each other.
if command -v flock >/dev/null 2>&1; then
  exec 9>/tmp/dsh-mobile-deploy.lock
  flock -n 9 || fail "已有部署或清理正在进行，请稍后再试。"
fi

[ "$(id -u)" = "0" ] || fail "请使用 root SSH 账号。"
command -v systemctl >/dev/null 2>&1 || fail "VPS 不支持 systemd。"
command -v tar >/dev/null 2>&1 || fail "VPS 缺少 tar。"
command -v curl >/dev/null 2>&1 || fail "VPS 缺少 curl。"
command -v sha256sum >/dev/null 2>&1 || fail "VPS 缺少 sha256sum。"
command -v useradd >/dev/null 2>&1 || fail "VPS 缺少 useradd。"

if [ -r /etc/os-release ]; then . /etc/os-release; else fail "无法识别 VPS 系统。"; fi
case "\${ID:-}" in
  debian|ubuntu) ;;
  *) fail "首版 VPS 部署只支持 Debian/Ubuntu。" ;;
esac
check os ok "\${PRETTY_NAME:-Debian/Ubuntu}"

if command -v ss >/dev/null 2>&1 && ss -ltnH | awk '{print $4}' | grep -Eq '(^|:)${String(settings.serverPort)}$'; then
  systemctl is-active --quiet dsh-mobile-frps.service || fail "端口 ${String(settings.serverPort)} 已被占用。"
fi

if ! command -v caddy >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  # A previous interrupted run may have left these files unreadable because
  # the deployment uses umask 077. APT reads repositories as the _apt user.
  chmod 0644 /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
  chmod 0644 /etc/apt/sources.list.d/caddy-stable.list 2>/dev/null || true
  apt-get update
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' -o /etc/apt/sources.list.d/caddy-stable.list
  chmod 0644 /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi
check caddy ok "Caddy 已安装。"

# The site lives in our own snippet file; the main Caddyfile only gains one
# import line, so existing user content is never rewritten or merged.
caddy_import='${FRP_CADDY_IMPORT_LINE}'
install -d -m 0755 /etc/caddy
caddyfile_ready=false
if [ ! -e /etc/caddy/Caddyfile ]; then
  printf '%s\n' "$caddy_import" > /etc/caddy/Caddyfile
  chmod 0644 /etc/caddy/Caddyfile
  caddyfile_ready=true
elif grep -Eq '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile; then
  # The snippet may carry global options (IP mode default_sni), which must
  # precede all site blocks after import inlining: rebuild the file with a
  # single import on top. Removal uses grep -v with the exact gate pattern
  # above (not sed -i, whose in-place delete proved unreliable here), and the
  # result is verified to carry exactly one import before replacing the file.
  {
    printf '%s\n' "$caddy_import"
    grep -Ev '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile || true
  } > /etc/caddy/Caddyfile.dsh-new
  [ "$(grep -Ec '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile.dsh-new)" = 1 ] \
    || fail "Caddyfile import 整理失败，未做任何修改。"
  cat /etc/caddy/Caddyfile.dsh-new > /etc/caddy/Caddyfile
  rm -f /etc/caddy/Caddyfile.dsh-new
  chmod 0644 /etc/caddy/Caddyfile
  caddyfile_ready=true
elif [ ! -s /etc/caddy/Caddyfile ]; then
  printf '%s\n' "$caddy_import" > /etc/caddy/Caddyfile
  chmod 0644 /etc/caddy/Caddyfile
  caddyfile_ready=true
elif grep -q '^# DSH Mobile removed its site' /etc/caddy/Caddyfile; then
  # Leftover placeholder from our own uninstall: drop only that line, then
  # ensure the import exists exactly once (same grep -v + count discipline).
  grep -Ev '^# DSH Mobile removed its site.*$' /etc/caddy/Caddyfile > /etc/caddy/Caddyfile.dsh-new || true
  grep -Eq '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile.dsh-new \
    || printf '%s\n' "$caddy_import" >> /etc/caddy/Caddyfile.dsh-new
  [ "$(grep -Ec '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile.dsh-new)" = 1 ] \
    || fail "Caddyfile import 整理失败，未做任何修改。"
  cat /etc/caddy/Caddyfile.dsh-new > /etc/caddy/Caddyfile
  rm -f /etc/caddy/Caddyfile.dsh-new
  chmod 0644 /etc/caddy/Caddyfile
  caddyfile_ready=true
else
  caddy_hash="$(sha256sum /etc/caddy/Caddyfile | awk '{print $1}')"
  if [ "$caddy_hash" = '66177d46fa761acb07208065db9b0274cb1b12c02ac43b9bfc9857b698b1ccfe' ]; then
    printf '%s\n' "$caddy_import" > /etc/caddy/Caddyfile
    chmod 0644 /etc/caddy/Caddyfile
    caddyfile_ready=true
  elif grep -q '^# Managed by DSH Mobile$' /etc/caddy/Caddyfile; then
    # Legacy whole-file layout: the entire file is ours by construction.
    printf '%s\n' "$caddy_import" > /etc/caddy/Caddyfile
    chmod 0644 /etc/caddy/Caddyfile
    caddyfile_ready=true
  elif grep -q '^:80[[:space:]]*{' /etc/caddy/Caddyfile \
    && grep -q 'root [*] /usr/share/caddy' /etc/caddy/Caddyfile \
    && grep -q '^[[:space:]]*file_server[[:space:]]*$' /etc/caddy/Caddyfile; then
    printf '%s\n' "$caddy_import" > /etc/caddy/Caddyfile
    chmod 0644 /etc/caddy/Caddyfile
    caddyfile_ready=true
  fi
fi
if [ "$caddyfile_ready" != true ]; then
  fail "已有 Caddyfile，请先备份，然后加一行 ${FRP_CADDY_IMPORT_LINE}，或手动合并站点。"
fi

${ipCertificateSetup}

arch="$(uname -m)"
case "$arch" in
  x86_64|amd64) url=${shellQuote(amd64.url)}; expected=${shellQuote(amd64.sha256)}; directory=${shellQuote(amd64.directory)} ;;
  aarch64|arm64) url=${shellQuote(arm64.url)}; expected=${shellQuote(arm64.sha256)}; directory=${shellQuote(arm64.directory)} ;;
  *) fail "只支持 Linux x86_64 和 arm64。" ;;
esac

tmp="$(mktemp -d /tmp/dsh-mobile-frp.XXXXXX)"
cleanup() { rm -rf "$tmp"; [ -z "\${DSH_MOBILE_FRP_ARCHIVE:-}" ] || rm -f "$DSH_MOBILE_FRP_ARCHIVE"; }
trap cleanup EXIT HUP INT TERM
archive="$tmp/frp.tar.gz"
if [ -n "\${DSH_MOBILE_FRP_ARCHIVE:-}" ]; then
  [ -f "$DSH_MOBILE_FRP_ARCHIVE" ] || fail "上传的 frps 安装包不存在。"
  cp "$DSH_MOBILE_FRP_ARCHIVE" "$archive"
else
  curl --fail --location --proto '=https' --tlsv1.2 --output "$archive" "$url"
fi
actual="$(sha256sum "$archive" | awk '{print $1}')"
[ "$actual" = "$expected" ] || fail "frps 下载校验失败。"
tar -xzf "$archive" -C "$tmp" "$directory/frps"

install -d -m 0755 /usr/local/libexec/dsh-mobile/frp/${FRP_VERSION}
install -m 0755 "$tmp/$directory/frps" /usr/local/libexec/dsh-mobile/frp/${FRP_VERSION}/frps
# The account must exist before anything references its group below.
dsh_mobile_created=false
if ! id -u dsh-mobile >/dev/null 2>&1; then
  useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin --no-create-home dsh-mobile
  dsh_mobile_created=true
fi
install -d -m 0750 -o root -g dsh-mobile /etc/dsh-mobile
if [ "$dsh_mobile_created" = true ]; then
  # Ownership record: uninstall removes the account only when this deployment created it.
  touch /etc/dsh-mobile/.owns-account
  check account ok "已创建 dsh-mobile 系统用户。"
else
  check account ok "复用已有的 dsh-mobile 系统用户（卸载时将保留）。"
fi
cat > /etc/dsh-mobile/frps.toml <<'DSH_MOBILE_FRPS_CONFIG'
${config}DSH_MOBILE_FRPS_CONFIG
chown root:dsh-mobile /etc/dsh-mobile/frps.toml
chmod 0640 /etc/dsh-mobile/frps.toml

cat > /etc/systemd/system/dsh-mobile-frps.service <<'DSH_MOBILE_FRPS_UNIT'
[Unit]
Description=DSH Mobile self-hosted FRP server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=dsh-mobile
Group=dsh-mobile
ExecStart=/usr/local/libexec/dsh-mobile/frp/${FRP_VERSION}/frps -c /etc/dsh-mobile/frps.toml
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
DSH_MOBILE_FRPS_UNIT

cat > ${FRP_CADDY_SNIPPET_PATH} <<'DSH_MOBILE_CADDY_SNIPPET'
${caddySnippet}DSH_MOBILE_CADDY_SNIPPET
chmod 0644 ${FRP_CADDY_SNIPPET_PATH}
caddy validate --config /etc/caddy/Caddyfile
systemctl daemon-reload
# Restart (not just start) so a redeploy over a running previous generation
# actually picks up the new frps token and config instead of keeping the old
# process alive with stale credentials.
systemctl enable dsh-mobile-frps.service
systemctl restart dsh-mobile-frps.service
systemctl enable --now caddy.service
${publicIp ? "systemctl enable --now dsh-mobile-cert-renew.timer" : ""}
systemctl reload caddy.service || systemctl restart caddy.service

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q '^Status: active'; then
  ufw allow ${String(settings.serverPort)}/tcp comment 'DSH Mobile FRP control' >/dev/null
  ufw allow 80/tcp comment 'DSH Mobile HTTPS redirect' >/dev/null
  ufw allow 443/tcp comment 'DSH Mobile HTTPS' >/dev/null
  check firewall ok "UFW 已放行 FRP 控制端口和 HTTPS。"
else
  check firewall warning "未修改系统防火墙；请确认 ${String(settings.serverPort)}/tcp、80/tcp、443/tcp 已放行。"
fi

systemctl is-active --quiet dsh-mobile-frps.service || fail "frps 服务启动失败。"
systemctl is-active --quiet caddy.service || fail "Caddy 服务启动失败。"
check frps ok "frps ${FRP_VERSION} 已启动，7080 仅绑定回环地址。"
check caddy ok "Caddy 已加载 ${publicHost}。"
echo DSH_MOBILE_DEPLOYMENT_OK
`;
}
async function runProcess(command, args, stdin, timeoutMs = SSH_TIMEOUT_MS) {
	return new Promise((resolveRun, rejectRun) => {
		const child = spawn(command, args, {
			windowsHide: true,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		});
		let stdout = "";
		let stderr = "";
		const append = (current, chunk) => `${current}${chunk.toString("utf8")}`.slice(-98304);
		const timer = setTimeout(() => {
			child.kill();
			rejectRun(new VpsSshError("vps_ssh_timeout", stdout, stderr));
		}, timeoutMs);
		timer.unref();
		child.stdout.on("data", (chunk) => {
			stdout = append(stdout, Buffer.from(chunk));
		});
		child.stderr.on("data", (chunk) => {
			stderr = append(stderr, Buffer.from(chunk));
		});
		child.once("error", (error) => {
			clearTimeout(timer);
			rejectRun(new VpsSshError("vps_ssh_unavailable", stdout, stderr, { cause: error }));
		});
		child.once("close", (code) => {
			clearTimeout(timer);
			if (code !== 0) rejectRun(new VpsSshError(stderr.includes("Permission denied") ? "vps_ssh_auth_failed" : "vps_deploy_failed", stdout, stderr));
			else resolveRun({
				stdout,
				stderr
			});
		});
		child.stdin.end(stdin, "utf8");
	});
}
async function downloadArtifact(artifact, file) {
	await runProcess(process.platform === "win32" ? "curl.exe" : "curl", [
		...process.platform === "win32" ? ["--ipv4"] : [],
		"--fail",
		"--location",
		"--silent",
		"--show-error",
		"--connect-timeout",
		"15",
		"--max-time",
		"180",
		"--proto",
		"=https",
		"--tlsv1.2",
		"--output",
		file,
		artifact.url
	], void 0, 2e5);
	const bytes = await readFile(file);
	if (createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) throw new Error("vps_download_hash_mismatch");
	return bytes.byteLength;
}
async function defaultRunSsh(input, serverAddress, script, knownHostsFile, log) {
	const ssh = process.platform === "win32" ? "ssh.exe" : "ssh";
	const scp = process.platform === "win32" ? "scp.exe" : "scp";
	const common = sshSessionOptions(knownHostsFile);
	if (input.sshKeyPath !== void 0) common.push("-i", input.sshKeyPath);
	const target = `${input.sshUser}@${serverAddress}`;
	const architecture = (await runProcess(ssh, [
		...common,
		"-p",
		String(input.sshPort),
		target,
		"uname -m"
	])).stdout.trim();
	const artifact = architecture === "x86_64" || architecture === "amd64" ? LINUX_ARTIFACTS.x64 : architecture === "aarch64" || architecture === "arm64" ? LINUX_ARTIFACTS.arm64 : void 0;
	if (artifact === void 0) throw new Error("vps_arch_unsupported");
	log?.("architecture", { architecture });
	const localDirectory = await mkdtemp(join(tmpdir(), "dsh-mobile-frp-"));
	const localArchive = join(localDirectory, "frp.tar.gz");
	const remoteArchive = `/tmp/dsh-mobile-frp-${randomBytes(12).toString("hex")}.tar.gz`;
	try {
		log?.("download-start", {
			source: "local",
			architecture
		});
		const bytes = await downloadArtifact(artifact, localArchive);
		log?.("download-complete", {
			source: "local",
			bytes
		});
		const scpResult = await runProcess(scp, [
			...common,
			"-P",
			String(input.sshPort),
			localArchive,
			`${target}:${remoteArchive}`
		]);
		log?.("upload-complete", {
			bytes,
			stderrBytes: Buffer.byteLength(scpResult.stderr)
		});
		const remoteCommand = input.sshUser === "root" ? `env DSH_MOBILE_FRP_ARCHIVE=${shellQuote(remoteArchive)} sh -s` : `sudo -n env DSH_MOBILE_FRP_ARCHIVE=${shellQuote(remoteArchive)} sh -s`;
		return await runProcess(ssh, [
			...common,
			"-p",
			String(input.sshPort),
			target,
			remoteCommand
		], script);
	} finally {
		await rm(localDirectory, {
			recursive: true,
			force: true
		});
	}
}
async function deployVps(settings, input, options = {}) {
	const serverPort = validateFrpServerPort(settings.serverPort);
	const token = validateFrpToken(settings.token);
	const publicOrigin = validateFrpPublicOrigin(settings.publicOrigin);
	const serverAddress = validateVpsServerTarget(settings.serverAddress);
	const parsedInput = parseVpsDeploymentInput(input);
	if (parsedInput.sshKeyPath !== void 0) {
		const entry = await lstat(parsedInput.sshKeyPath).catch(() => void 0);
		if (entry === void 0 || !entry.isFile() || entry.isSymbolicLink()) throw new Error("vps_ssh_key_invalid");
	}
	const keyscanOutput = await scanHostKeys({
		sshUser: parsedInput.sshUser,
		sshPort: parsedInput.sshPort,
		sshKeyPath: parsedInput.sshKeyPath
	}, serverAddress, options);
	const knownHostsBody = buildPinnedKnownHosts(serverAddress, parsedInput.sshPort, keyscanOutput, parsedInput.hostFingerprints);
	options.log?.("host-keys-verified", { serverAddress });
	const runSsh = options.runSsh ?? (async (sshInput, host, scriptBody) => {
		const workDirectory = await mkdtemp(join(tmpdir(), "dsh-mobile-known-hosts-"));
		try {
			const knownHostsFile = join(workDirectory, "known_hosts");
			await writeFile(knownHostsFile, knownHostsBody, {
				encoding: "utf8",
				mode: 384
			});
			return await defaultRunSsh(sshInput, host, scriptBody, knownHostsFile, options.log);
		} finally {
			await rm(workDirectory, {
				recursive: true,
				force: true
			});
		}
	});
	options.log?.("validated", {
		serverAddress,
		serverPort,
		publicOrigin,
		sshUser: parsedInput.sshUser,
		sshPort: parsedInput.sshPort,
		keyProvided: parsedInput.sshKeyPath !== void 0
	});
	let result;
	try {
		options.log?.("ssh-start", {
			serverAddress,
			sshPort: parsedInput.sshPort
		});
		result = await runSsh(parsedInput, serverAddress, deploymentScript({
			...settings,
			serverAddress,
			serverPort,
			token,
			publicOrigin
		}));
		options.log?.("ssh-complete", {
			stdoutBytes: Buffer.byteLength(result.stdout),
			stderrBytes: Buffer.byteLength(result.stderr)
		});
	} catch (error) {
		if (error instanceof VpsSshError) {
			const detail = failureDetail(error.stdout, error.stderr, token);
			options.log?.("ssh-failed", {
				code: error.message,
				detail: detail || "no remote output"
			});
			throw new Error(detail === "" ? error.message : `${error.message}:${detail}`, { cause: error });
		}
		options.log?.("ssh-failed", { code: error instanceof Error ? error.message : "unknown" });
		throw error;
	}
	const checks = parseChecks(result.stdout, result.stderr, token);
	for (const check of checks) options.log?.("remote-check", {
		id: check.id,
		status: check.status,
		detail: check.detail
	});
	if (!result.stdout.includes("DSH_MOBILE_DEPLOYMENT_OK")) {
		if (checks.length === 0) throw new Error("vps_deploy_failed");
		throw new Error(`vps_deploy_failed:${checks.map((check) => check.detail).join(" ")}`);
	}
	return Object.freeze({
		version: 1,
		deployed: true,
		serverAddress,
		publicOrigin,
		checks
	});
}
function validCertName(value) {
	if (value === void 0 || value === "") return void 0;
	if (typeof value !== "string" || value.length > 253 || !/^[a-z0-9.-]+$/u.test(value)) throw new Error("vps_cert_name_invalid");
	return value.toLowerCase();
}
/**
* Build a reviewable uninstall script that removes only DSH Mobile-owned
* server artifacts: its systemd units, config, binaries, venv, renew helper,
* managed Caddy site, owned UFW rules, and optionally its IP certificate.
* Existing non-DSH-Mobile Caddy content and firewall rules are never touched.
*/
function createVpsUninstallScript(input) {
	const serverPort = validateFrpServerPort(input.serverPort);
	const certName = validCertName(input.certName);
	return `#!/bin/sh
# DSH Mobile VPS uninstall. Review before running: only files, services, and
# firewall rules created by the DSH Mobile deployment are removed.
set -eu
umask 077

fail() { echo "DSH_MOBILE_CHECK remote-command error $1" >&2; exit 1; }
check() { echo "DSH_MOBILE_CHECK $1 $2 $3"; }

# Same lock as the deploy script: cleanup and deployment exclude each other
# so their Caddyfile surgeries never interleave.
if command -v flock >/dev/null 2>&1; then
  exec 9>/tmp/dsh-mobile-deploy.lock
  flock -n 9 || fail "已有部署或清理正在进行，请稍后再试。"
fi

[ "$(id -u)" = "0" ] || fail "请使用 root SSH 账号。"
command -v systemctl >/dev/null 2>&1 || fail "VPS 不支持 systemd。"

# Ownership is decided before deleting anything: only an account created by a
# DSH Mobile deployment (marker written at useradd time) may be removed below.
owns_account=false
if [ -f /etc/dsh-mobile/.owns-account ]; then owns_account=true; fi

systemctl disable --now dsh-mobile-cert-renew.timer >/dev/null 2>&1 || true
systemctl disable --now dsh-mobile-frps.service >/dev/null 2>&1 || true
rm -f /etc/systemd/system/dsh-mobile-frps.service
rm -f /etc/systemd/system/dsh-mobile-cert-renew.service
rm -f /etc/systemd/system/dsh-mobile-cert-renew.timer
systemctl daemon-reload
check services ok "已停止并删除 dsh-mobile-frps 服务与证书续期定时器。"
${certName === void 0 ? "" : `
if [ -x /opt/dsh-mobile/certbot-venv/bin/certbot ]; then
  /opt/dsh-mobile/certbot-venv/bin/certbot delete --cert-name ${shellQuote(certName)} --non-interactive || true
fi
`}
rm -rf /etc/dsh-mobile
rm -rf /usr/local/libexec/dsh-mobile
rm -rf /opt/dsh-mobile/certbot-venv
rm -f /usr/local/sbin/dsh-mobile-cert-renew
rm -rf /var/lib/caddy/dsh-mobile-certs
rm -f ${FRP_CADDY_SNIPPET_PATH}
check files ok "已删除 DSH Mobile 配置、二进制与证书文件。"

if grep -Eq '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile 2>/dev/null; then
  # Rebuild without our import line (grep -v with the gate pattern, verified
  # to remove every copy), keeping all user content byte-identical otherwise.
  grep -Ev '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile > /etc/caddy/Caddyfile.dsh-new || true
  if grep -Eq '^[[:space:]]*import[[:space:]]+/etc/caddy/dsh-mobile-dsh\.caddy([[:space:]]|$)' /etc/caddy/Caddyfile.dsh-new; then
    rm -f /etc/caddy/Caddyfile.dsh-new
    fail "Caddyfile import 移除失败，未做任何修改。"
  fi
  cat /etc/caddy/Caddyfile.dsh-new > /etc/caddy/Caddyfile
  rm -f /etc/caddy/Caddyfile.dsh-new
  if [ ! -s /etc/caddy/Caddyfile ]; then
    printf '# DSH Mobile removed its site; the remaining Caddyfile was empty.\n' > /etc/caddy/Caddyfile
    chmod 0644 /etc/caddy/Caddyfile
  fi
  if command -v caddy >/dev/null 2>&1; then
    caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy.service || systemctl restart caddy.service || true
  fi
  check caddy ok "已移除 DSH Mobile 站点引入；其余 Caddy 配置保持原样。"
elif [ -f /etc/caddy/Caddyfile ] && grep -q '^# Managed by DSH Mobile$' /etc/caddy/Caddyfile; then
  # Legacy whole-file layout (pre-snippet releases): the entire file is ours.
  printf '# DSH Mobile removed its site. Restore your own Caddyfile or reinstall the Caddy defaults.\\n' > /etc/caddy/Caddyfile
  chmod 0644 /etc/caddy/Caddyfile
  if command -v caddy >/dev/null 2>&1; then
    caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy.service || systemctl restart caddy.service || true
  fi
  check caddy ok "已清空旧版 DSH Mobile 管理的 Caddy 站点；请按需恢复自己的配置。"
else
  check caddy ok "Caddyfile 非 DSH Mobile 管理，保持原样。"
fi

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q '^Status: active'; then
  for rule in $(ufw status numbered 2>/dev/null | grep 'DSH Mobile' | sed -E 's/^\\[ *([0-9]+)\\].*/\\1/' | sort -rn); do
    yes | ufw delete "$rule" >/dev/null 2>&1 || true
  done
  check firewall ok "已删除带 DSH Mobile 标记的 UFW 规则（FRP 控制端口 ${String(serverPort)}、80、443）。"
else
  check firewall ok "UFW 未启用或无需调整。"
fi

if [ "$owns_account" = true ]; then
  if id dsh-mobile >/dev/null 2>&1; then
    if pgrep -u dsh-mobile >/dev/null 2>&1; then
      fail "dsh-mobile 用户仍有运行中的进程，已保留该用户；请先停止相关进程后重试。"
    fi
    userdel dsh-mobile || fail "删除 dsh-mobile 系统用户失败。"
    check account ok "已删除本次部署创建的 dsh-mobile 系统用户。"
  else
    check account ok "dsh-mobile 系统用户已不存在，无需删除。"
  fi
else
  check account ok "dsh-mobile 系统用户非本次部署创建，已保留。"
fi

echo DSH_MOBILE_UNINSTALL_OK
`;
}
async function runRemoteScript(input, serverAddress, script, environment, knownHostsFile, log) {
	const ssh = process.platform === "win32" ? "ssh.exe" : "ssh";
	const parsedInput = parseVpsDeploymentInput(input);
	const common = sshSessionOptions(knownHostsFile);
	if (parsedInput.sshKeyPath !== void 0) common.push("-i", parsedInput.sshKeyPath);
	const target = `${parsedInput.sshUser}@${serverAddress}`;
	const remoteCommand = parsedInput.sshUser === "root" ? "sh -s" : "sudo -n sh -s";
	const envPrefix = Object.entries(environment).map(([key, value]) => `${key}=${shellQuote(value)}`).join(" ");
	log?.("uninstall-ssh-start", { serverAddress });
	return await runProcess(ssh, [
		...common,
		"-p",
		String(parsedInput.sshPort),
		target,
		`${envPrefix} ${remoteCommand}`.trim()
	], script);
}
/** Remove DSH Mobile-owned server artifacts over a pinned SSH connection. */
async function uninstallVps(serverAddress, uninstall, input, options = {}) {
	const address = validateVpsServerTarget(serverAddress);
	const parsedInput = parseVpsDeploymentInput(input);
	const keyscanOutput = await scanHostKeys({
		sshUser: parsedInput.sshUser,
		sshPort: parsedInput.sshPort,
		sshKeyPath: parsedInput.sshKeyPath
	}, address, options);
	const knownHostsBody = buildPinnedKnownHosts(address, parsedInput.sshPort, keyscanOutput, parsedInput.hostFingerprints);
	options.log?.("host-keys-verified", { serverAddress: address });
	const script = createVpsUninstallScript(uninstall);
	options.log?.("uninstall-start", { serverAddress: address });
	const runRemote = options.runRemoteScript ?? (async (sshInput, host, scriptBody) => {
		const workDirectory = await mkdtemp(join(tmpdir(), "dsh-mobile-known-hosts-"));
		try {
			const knownHostsFile = join(workDirectory, "known_hosts");
			await writeFile(knownHostsFile, knownHostsBody, {
				encoding: "utf8",
				mode: 384
			});
			return await runRemoteScript(sshInput, host, scriptBody, {}, knownHostsFile, options.log);
		} finally {
			await rm(workDirectory, {
				recursive: true,
				force: true
			});
		}
	});
	let result;
	try {
		result = await runRemote(parsedInput, address, script);
	} catch (error) {
		if (error instanceof VpsSshError) {
			const detail = failureDetail(error.stdout, error.stderr, "");
			const code = error.message === "vps_deploy_failed" ? "vps_uninstall_failed" : error.message;
			options.log?.("uninstall-failed", {
				code,
				detail: detail || "no remote output"
			});
			throw new Error(detail === "" ? code : `${code}:${detail}`, { cause: error });
		}
		options.log?.("uninstall-failed", { code: error instanceof Error ? error.message : "unknown" });
		throw error;
	}
	const checks = parseChecks(result.stdout, result.stderr, "");
	for (const check of checks) options.log?.("remote-check", {
		id: check.id,
		status: check.status,
		detail: check.detail
	});
	if (!result.stdout.includes("DSH_MOBILE_UNINSTALL_OK")) {
		if (checks.length === 0) throw new Error("vps_uninstall_failed");
		throw new Error(`vps_uninstall_failed:${checks.map((check) => check.detail).join(" ")}`);
	}
	return Object.freeze({
		version: 1,
		removed: true,
		serverAddress: address,
		checks
	});
}
//#endregion
//#region src/funnel.ts
const MAX_PROTOCOL_LINE_BYTES = 16384;
const FUNNEL_START_TIMEOUT_MS = 45e3;
function publicStatus$1(status) {
	return Object.freeze({
		enabled: status.enabled,
		state: status.state,
		...status.origin === void 0 ? {} : { origin: status.origin },
		...status.loginUrl === void 0 ? {} : { loginUrl: status.loginUrl },
		...status.setupUrl === void 0 ? {} : { setupUrl: status.setupUrl },
		...status.errorCode === void 0 ? {} : { errorCode: status.errorCode }
	});
}
const FUNNEL_SETUP_URLS = /* @__PURE__ */ new Set(["https://tailscale.com/s/no-funnel", "https://tailscale.com/s/https"]);
function parseSetupUrl(value) {
	if (value === void 0) return void 0;
	if (typeof value !== "string" || value.length > 2048) throw new Error("invalid_sidecar_protocol");
	const url = new URL(value);
	const normalized = url.toString().replace(/\/$/u, "");
	const officialInteractive = url.protocol === "https:" && url.hostname === "login.tailscale.com" && url.port === "" && url.username === "" && url.password === "";
	if (!FUNNEL_SETUP_URLS.has(normalized) && !officialInteractive) throw new Error("invalid_sidecar_protocol");
	return officialInteractive ? url.toString() : normalized;
}
function parseOrigin(value) {
	if (typeof value !== "string" || value.length > 512) throw new Error("invalid_funnel_origin");
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error("invalid_funnel_origin");
	}
	if (url.protocol !== "https:" || !url.hostname.endsWith(".ts.net") || url.port !== "" || url.pathname !== "/" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "") throw new Error("invalid_funnel_origin");
	return url.origin;
}
/** Parse one sidecar protocol line while restricting every browser-opened URL. */
function parseFunnelEvent(line) {
	if (Buffer.byteLength(line, "utf8") === 0 || Buffer.byteLength(line, "utf8") > MAX_PROTOCOL_LINE_BYTES) throw new Error("invalid_sidecar_protocol");
	let value;
	try {
		value = JSON.parse(line);
	} catch {
		throw new Error("invalid_sidecar_protocol");
	}
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("invalid_sidecar_protocol");
	const record = value;
	if (record.version !== 1 || typeof record.type !== "string") throw new Error("invalid_sidecar_protocol");
	if (record.type === "login") {
		if (typeof record.url !== "string" || record.url.length > 2048) throw new Error("invalid_sidecar_protocol");
		const url = new URL(record.url);
		if (url.protocol !== "https:" || url.hostname !== "login.tailscale.com") throw new Error("invalid_sidecar_protocol");
		return Object.freeze({
			version: 1,
			type: "login",
			url: url.toString()
		});
	}
	if (record.type === "ready" || record.type === "serving") return Object.freeze({
		version: 1,
		type: record.type,
		origin: parseOrigin(record.origin)
	});
	if (record.type === "error") {
		if (typeof record.code !== "string" || !/^[a-z][a-z0-9_]{0,63}$/u.test(record.code)) throw new Error("invalid_sidecar_protocol");
		const setupUrl = parseSetupUrl(record.url);
		return Object.freeze({
			version: 1,
			type: "error",
			code: record.code,
			...setupUrl === void 0 ? {} : { url: setupUrl }
		});
	}
	throw new Error("invalid_sidecar_protocol");
}
function withoutProvisioningSecrets(environment) {
	const blocked = /* @__PURE__ */ new Set([
		"TS_AUTHKEY",
		"TAILSCALE_AUTHKEY",
		"TS_OAUTH_CLIENT_SECRET"
	]);
	return Object.fromEntries(Object.entries(environment).filter(([name]) => !blocked.has(name.toUpperCase())));
}
/** Owns the source-built tsnet sidecar, remote gateway, and persisted remote switch. */
var FunnelController = class {
	options;
	enabled = false;
	initialized = false;
	disposed = false;
	child;
	gatewayValue;
	generation = 0;
	buffer = "";
	latest = publicStatus$1({
		enabled: false,
		state: "off"
	});
	queue = Promise.resolve();
	startTimer;
	constructor(options) {
		this.options = options;
		if (!isAbsolute(options.executable) || !isAbsolute(options.stateDirectory)) throw new Error("Funnel paths must be absolute");
	}
	/** Restore the remote switch without coupling it to LAN availability. */
	async initialize() {
		const state = await this.options.store.load();
		this.enabled = state.enabled;
		this.initialized = true;
		if (this.enabled) await this.start();
		else this.publish({
			enabled: false,
			state: "off"
		});
	}
	/** Return the currently attached authenticated remote gateway. */
	gateway() {
		return this.gatewayValue;
	}
	/** Return state safe for the local desktop control UI. */
	status() {
		return publicStatus$1(this.latest);
	}
	/** Enable or disable Funnel without changing the LAN listener. */
	async setEnabled(enabled) {
		if (!this.initialized || this.disposed) throw new Error("Funnel controller is unavailable");
		await this.enqueue(async () => {
			if (this.enabled === enabled && (enabled === false || this.child !== void 0)) return;
			if (!enabled) await this.stop();
			this.enabled = enabled;
			await this.options.store.save({
				version: 1,
				enabled
			});
			if (enabled) await this.start();
			else this.publish({
				enabled: false,
				state: "off"
			});
		});
		return this.status();
	}
	/** Restart a failed or interrupted Funnel session while retaining sign-in state. */
	async reconnect() {
		if (!this.initialized || this.disposed) throw new Error("Funnel controller is unavailable");
		await this.enqueue(async () => {
			if (!this.enabled) {
				this.enabled = true;
				await this.options.store.save({
					version: 1,
					enabled: true
				});
			}
			await this.stop();
			await this.start();
		});
		return this.status();
	}
	/** Disable Funnel and remove only its private Tailscale node state. */
	async reset() {
		if (!this.initialized || this.disposed) throw new Error("Funnel controller is unavailable");
		await this.enqueue(async () => {
			await this.stop();
			this.enabled = false;
			await this.options.store.save({
				version: 1,
				enabled: false
			});
			await rm(resolve(this.options.stateDirectory), {
				recursive: true,
				force: true
			});
			this.publish({
				enabled: false,
				state: "off"
			});
		});
		return this.status();
	}
	/** Stop all remote resources without modifying the remembered switch. */
	async close() {
		if (this.disposed) return;
		this.disposed = true;
		await this.enqueue(() => this.stop());
	}
	enqueue(operation) {
		const task = this.queue.then(operation, operation);
		this.queue = task.then(() => void 0, () => void 0);
		return task;
	}
	publish(status) {
		this.latest = publicStatus$1(status);
		try {
			this.options.onStatus?.(this.status());
		} catch {}
	}
	async start() {
		const generation = ++this.generation;
		let entry;
		try {
			entry = await lstat(this.options.executable);
		} catch {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "component_missing"
			});
			return;
		}
		if (!entry.isFile() || entry.isSymbolicLink()) {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "component_invalid"
			});
			return;
		}
		this.buffer = "";
		this.publish({
			enabled: true,
			state: "starting"
		});
		const child = spawn(this.options.executable, [
			"--state-dir",
			resolve(this.options.stateDirectory),
			"--hostname",
			this.options.hostname
		], {
			env: withoutProvisioningSecrets(process.env),
			shell: false,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			],
			windowsHide: true
		});
		this.child = child;
		this.clearStartTimer();
		this.startTimer = setTimeout(() => {
			this.enqueue(() => this.failGeneration(generation, "funnel_start_timeout"));
		}, FUNNEL_START_TIMEOUT_MS);
		this.startTimer.unref();
		child.stderr.resume();
		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			this.consume(generation, String(chunk));
		});
		child.once("error", () => {
			this.enqueue(() => this.failGeneration(generation, "sidecar_launch_failed"));
		});
		child.once("close", (code) => {
			if (generation !== this.generation || this.child !== child) return;
			this.child = void 0;
			if (this.enabled) this.enqueue(() => this.failGeneration(generation, code === 0 ? "sidecar_stopped" : "sidecar_exited"));
		});
	}
	consume(generation, chunk) {
		if (generation !== this.generation) return;
		this.buffer += chunk;
		if (Buffer.byteLength(this.buffer, "utf8") > MAX_PROTOCOL_LINE_BYTES && !this.buffer.includes("\n")) {
			this.enqueue(() => this.failGeneration(generation, "invalid_sidecar_protocol"));
			return;
		}
		while (true) {
			const newline = this.buffer.indexOf("\n");
			if (newline < 0) return;
			const line = this.buffer.slice(0, newline).replace(/\r$/u, "");
			this.buffer = this.buffer.slice(newline + 1);
			let event;
			try {
				event = parseFunnelEvent(line);
			} catch {
				this.enqueue(() => this.failGeneration(generation, "invalid_sidecar_protocol"));
				return;
			}
			this.enqueue(() => this.handleEvent(generation, event));
		}
	}
	async handleEvent(generation, event) {
		if (generation !== this.generation || !this.enabled) return;
		this.clearStartTimer();
		if (event.type === "login") {
			this.publish({
				enabled: true,
				state: "needs-login",
				loginUrl: event.url
			});
			return;
		}
		if (event.type === "error") {
			await this.failGeneration(generation, event.code ?? "funnel_failed", event.url);
			return;
		}
		const origin = parseOrigin(event.origin);
		if (event.type === "ready") {
			let gateway;
			try {
				await this.gatewayValue?.close();
				this.gatewayValue = void 0;
				gateway = await this.options.createGateway(origin);
			} catch {
				await this.failGeneration(generation, "gateway_start_failed");
				return;
			}
			if (generation !== this.generation || !this.enabled) {
				await gateway.close();
				return;
			}
			this.gatewayValue = gateway;
			const address = gateway.address();
			const child = this.child;
			if (child === void 0) {
				await this.failGeneration(generation, "sidecar_stopped");
				return;
			}
			child.stdin.write(`${JSON.stringify({
				version: 1,
				type: "serve",
				target: `http://${address.host}:${String(address.port)}`
			})}\n`, (error) => {
				if (error !== null && error !== void 0) this.enqueue(() => this.failGeneration(generation, "control_channel_failed"));
			});
			this.publish({
				enabled: true,
				state: "connecting",
				origin
			});
			return;
		}
		this.publish({
			enabled: true,
			state: "ready",
			origin
		});
	}
	async failGeneration(generation, code, setupUrl) {
		if (generation !== this.generation) return;
		await this.stopProcessAndGateway();
		if (this.enabled) this.publish({
			enabled: true,
			state: "error",
			errorCode: code,
			...setupUrl === void 0 ? {} : { setupUrl }
		});
	}
	async stop() {
		++this.generation;
		await this.stopProcessAndGateway();
	}
	async stopProcessAndGateway() {
		this.clearStartTimer();
		const child = this.child;
		this.child = void 0;
		const gateway = this.gatewayValue;
		this.gatewayValue = void 0;
		await settleRemoteResources([async () => {
			child?.stdin.end();
			if (child !== void 0 && child.exitCode === null) await terminateRemoteProcess(child);
		}, () => gateway?.close()], "Funnel resource cleanup failed");
	}
	clearStartTimer() {
		if (this.startTimer === void 0) return;
		clearTimeout(this.startTimer);
		this.startTimer = void 0;
	}
};
/** Locate the current platform's bundled Funnel executable, with one local development override. */
function funnelExecutable(importMetaUrl, environment = process.env) {
	const override = environment.DSH_MOBILE_FUNNEL_SIDECAR;
	if (override !== void 0) {
		if (!isAbsolute(override)) throw new Error("DSH_MOBILE_FUNNEL_SIDECAR must be an absolute path");
		return resolve(override);
	}
	const suffix = process.platform === "win32" ? ".exe" : "";
	const file = `dsh-mobile-funnel-${process.platform}-${process.arch}${suffix}`;
	return resolve(fileURLToPath(new URL(`../bin/${file}`, importMetaUrl)));
}
//#endregion
//#region src/cpolar.ts
const MAX_LOG_BUFFER_BYTES = 65536;
const START_TIMEOUT_MS = 45e3;
const CPOLAR_HOST_SUFFIXES = Object.freeze([
	".cpolar.cn",
	".cpolar.io",
	".cpolar.top",
	".cpolar.com"
]);
function publicStatus(status) {
	return Object.freeze({
		enabled: status.enabled,
		state: status.state,
		...status.origin === void 0 ? {} : { origin: status.origin },
		...status.errorCode === void 0 ? {} : { errorCode: status.errorCode }
	});
}
function isCpolarHost(hostname) {
	return CPOLAR_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}
/** Extract a validated public HTTPS origin from one cpolar log line. */
function parseCpolarOrigin(line) {
	if (!line.includes("Tunnel established at ")) return void 0;
	const match = /Tunnel established at (https:\/\/[^"\s]+)/u.exec(line);
	if (match === null) return void 0;
	let url;
	try {
		url = new URL(match[1]);
	} catch {
		throw new Error("invalid_cpolar_origin");
	}
	if (url.protocol !== "https:" || url.port !== "" || !isCpolarHost(url.hostname) || url.pathname !== "/" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "") throw new Error("invalid_cpolar_origin");
	return url.origin;
}
async function reserveLoopbackPort() {
	const server = createServer((socket) => {
		socket.destroy();
	});
	await new Promise((resolveListen, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			server.off("error", reject);
			resolveListen();
		});
	});
	const address = server.address();
	if (address === null || typeof address === "string") {
		server.close();
		throw new Error("cpolar_port_reservation_failed");
	}
	let released = false;
	return {
		port: address.port,
		release: async () => {
			if (released) return;
			released = true;
			await new Promise((resolveClose) => {
				server.close(() => resolveClose());
			});
		}
	};
}
function spawnCpolarProcess(executable, args, environment) {
	return spawn(executable, [...args], {
		env: environment,
		shell: false,
		stdio: [
			"pipe",
			"pipe",
			"pipe"
		],
		windowsHide: true
	});
}
function withoutProxyEnvironment(environment) {
	const blocked = /* @__PURE__ */ new Set([
		"HTTP_PROXY",
		"HTTPS_PROXY",
		"ALL_PROXY",
		"NO_PROXY"
	]);
	return Object.fromEntries(Object.entries(environment).filter(([name]) => !blocked.has(name.toUpperCase())));
}
/** Owns an installed cpolar client and a provider-specific DSH remote gateway. */
var CpolarController = class {
	options;
	enabled = false;
	initialized = false;
	disposed = false;
	child;
	gatewayValue;
	reservation;
	generation = 0;
	buffer = "";
	latest = publicStatus({
		enabled: false,
		state: "off"
	});
	queue = Promise.resolve();
	startupTimer;
	constructor(options) {
		this.options = options;
		if (!isAbsolute(options.executable) || !isAbsolute(options.configFile)) throw new Error("cpolar paths must be absolute");
		if (options.region !== void 0 && !/^[a-z][a-z0-9_]{0,31}$/u.test(options.region)) throw new Error("cpolar region is invalid");
	}
	/** Restore the remembered cpolar switch independently from LAN and Funnel state. */
	async initialize() {
		const state = await this.options.store.load();
		this.enabled = state.enabled;
		this.initialized = true;
		if (this.enabled) await this.start();
		else this.publish({
			enabled: false,
			state: "off"
		});
	}
	/** Return the active cpolar-backed DSH gateway. */
	gateway() {
		return this.gatewayValue;
	}
	/** Return state safe for the desktop control UI. */
	status() {
		return publicStatus(this.latest);
	}
	/** Enable or disable cpolar without changing LAN or Tailscale state. */
	async setEnabled(enabled) {
		if (!this.initialized || this.disposed) throw new Error("cpolar controller is unavailable");
		await this.enqueue(async () => {
			if (this.enabled === enabled && (enabled === false || this.child !== void 0)) return;
			if (!enabled) await this.stop();
			this.enabled = enabled;
			await this.options.store.save({
				version: 1,
				enabled
			});
			if (enabled) await this.start();
			else this.publish({
				enabled: false,
				state: "off"
			});
		});
		return this.status();
	}
	/** Restart cpolar while retaining its account configuration and DSH device store. */
	async reconnect() {
		if (!this.initialized || this.disposed) throw new Error("cpolar controller is unavailable");
		await this.enqueue(async () => {
			if (!this.enabled) {
				this.enabled = true;
				await this.options.store.save({
					version: 1,
					enabled: true
				});
			}
			await this.stop();
			await this.start();
		});
		return this.status();
	}
	/** Disable cpolar without modifying the user's cpolar account or global tunnels. */
	async reset() {
		if (!this.initialized || this.disposed) throw new Error("cpolar controller is unavailable");
		await this.enqueue(async () => {
			await this.stop();
			this.enabled = false;
			await this.options.store.save({
				version: 1,
				enabled: false
			});
			this.publish({
				enabled: false,
				state: "off"
			});
		});
		return this.status();
	}
	/** Stop owned resources without changing the remembered switch. */
	async close() {
		if (this.disposed) return;
		this.disposed = true;
		await this.enqueue(() => this.stop());
	}
	enqueue(operation) {
		const task = this.queue.then(operation, operation);
		this.queue = task.then(() => void 0, () => void 0);
		return task;
	}
	publish(status) {
		this.latest = publicStatus(status);
		try {
			this.options.onStatus?.(this.status());
		} catch {}
	}
	async start() {
		const generation = ++this.generation;
		let executableEntry;
		try {
			executableEntry = await lstat(this.options.executable);
		} catch {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "cpolar_component_missing"
			});
			return;
		}
		if (!executableEntry.isFile() || executableEntry.isSymbolicLink()) {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "cpolar_component_invalid"
			});
			return;
		}
		let configEntry;
		try {
			configEntry = await lstat(this.options.configFile);
		} catch {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "cpolar_config_missing"
			});
			return;
		}
		if (!configEntry.isFile() || configEntry.isSymbolicLink()) {
			this.publish({
				enabled: true,
				state: "unavailable",
				errorCode: "cpolar_config_invalid"
			});
			return;
		}
		let reservation;
		try {
			reservation = await reserveLoopbackPort();
		} catch {
			this.publish({
				enabled: true,
				state: "error",
				errorCode: "cpolar_port_unavailable"
			});
			return;
		}
		this.reservation = reservation;
		this.buffer = "";
		this.publish({
			enabled: true,
			state: "starting"
		});
		const args = [
			"http",
			`-config=${resolve(this.options.configFile)}`,
			`-region=${this.options.region ?? "cn"}`,
			"-inspect-addr=false",
			"-redirect-https=true",
			"-log=stdout",
			"-log-level=INFO",
			String(reservation.port)
		];
		const child = (this.options.spawnProcess ?? spawnCpolarProcess)(this.options.executable, args, withoutProxyEnvironment(process.env));
		this.child = child;
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			this.consume(generation, String(chunk));
		});
		child.stderr.on("data", (chunk) => {
			this.consume(generation, String(chunk));
		});
		child.once("error", () => {
			this.enqueue(() => this.failGeneration(generation, "cpolar_launch_failed"));
		});
		child.once("close", (code) => {
			if (generation !== this.generation || this.child !== child) return;
			this.child = void 0;
			if (this.enabled) this.enqueue(() => this.failGeneration(generation, code === 0 ? "cpolar_stopped" : "cpolar_exited"));
		});
		this.startupTimer = setTimeout(() => {
			this.enqueue(() => this.failGeneration(generation, "cpolar_start_timeout"));
		}, START_TIMEOUT_MS);
		this.startupTimer.unref();
	}
	consume(generation, chunk) {
		if (generation !== this.generation) return;
		this.buffer += chunk;
		if (Buffer.byteLength(this.buffer, "utf8") > MAX_LOG_BUFFER_BYTES && !this.buffer.includes("\n")) {
			this.enqueue(() => this.failGeneration(generation, "cpolar_invalid_output"));
			return;
		}
		while (true) {
			const newline = this.buffer.indexOf("\n");
			if (newline < 0) return;
			const line = this.buffer.slice(0, newline).replace(/\r$/u, "");
			this.buffer = this.buffer.slice(newline + 1);
			let origin;
			try {
				origin = parseCpolarOrigin(line);
			} catch {
				this.enqueue(() => this.failGeneration(generation, "cpolar_invalid_origin"));
				return;
			}
			if (origin !== void 0) this.enqueue(() => this.attachGateway(generation, origin));
		}
	}
	async attachGateway(generation, origin) {
		if (generation !== this.generation || !this.enabled || this.disposed) return;
		const current = this.gatewayValue;
		if (current !== void 0) {
			if (current.address().origin === origin) return;
			await this.rotateGateway(generation, origin, current);
			return;
		}
		const reservation = this.reservation;
		if (reservation === void 0) return;
		this.publish({
			enabled: true,
			state: "connecting",
			origin
		});
		await reservation.release();
		if (this.reservation === reservation) this.reservation = void 0;
		let gateway;
		try {
			gateway = await this.options.createGateway(origin, reservation.port);
		} catch {
			await this.failGeneration(generation, "gateway_start_failed");
			return;
		}
		if (generation !== this.generation || !this.enabled || this.disposed || this.child === void 0) {
			await gateway.close();
			return;
		}
		this.gatewayValue = gateway;
		if (this.startupTimer !== void 0) clearTimeout(this.startupTimer);
		this.startupTimer = void 0;
		this.publish({
			enabled: true,
			state: "ready",
			origin
		});
	}
	/** Replace the gateway authority when cpolar rotates a temporary public origin. */
	async rotateGateway(generation, origin, current) {
		const listenPort = current.address().port;
		if (this.gatewayValue === current) this.gatewayValue = void 0;
		this.publish({
			enabled: true,
			state: "connecting",
			origin
		});
		try {
			await current.close();
		} catch {
			await this.failGeneration(generation, "gateway_start_failed");
			return;
		}
		if (generation !== this.generation || !this.enabled || this.disposed || this.child === void 0) return;
		let replacement;
		try {
			replacement = await this.options.createGateway(origin, listenPort);
		} catch {
			await this.failGeneration(generation, "gateway_start_failed");
			return;
		}
		if (generation !== this.generation || !this.enabled || this.disposed || this.child === void 0) {
			await replacement.close();
			return;
		}
		this.gatewayValue = replacement;
		this.publish({
			enabled: true,
			state: "ready",
			origin
		});
	}
	async failGeneration(generation, code) {
		if (generation !== this.generation) return;
		await this.stopProcessAndGateway();
		if (this.enabled) this.publish({
			enabled: true,
			state: "error",
			errorCode: code
		});
	}
	async stop() {
		++this.generation;
		await this.stopProcessAndGateway();
	}
	async stopProcessAndGateway() {
		if (this.startupTimer !== void 0) clearTimeout(this.startupTimer);
		this.startupTimer = void 0;
		const reservation = this.reservation;
		this.reservation = void 0;
		const child = this.child;
		this.child = void 0;
		const gateway = this.gatewayValue;
		this.gatewayValue = void 0;
		await settleRemoteResources([
			() => reservation?.release(),
			() => child !== void 0 && child.exitCode === null ? terminateRemoteProcess(child) : void 0,
			() => gateway?.close()
		], "cpolar resource cleanup failed");
	}
};
//#endregion
//#region src/cpolar-component.ts
/** Pinned cpolar Windows component fetched only after an explicit user action. */
const CPOLAR_COMPONENT_RELEASE = Object.freeze({
	version: "3.3.18",
	platform: "win32",
	arch: "x64",
	downloadUrl: "https://www.cpolar.com/static/downloads/releases/3.3.18/cpolar-stable-windows-amd64-setup.zip",
	downloadBytes: 7603505,
	downloadSha256: "fb8cf60289058ee26079f995d2eeea0b21768a742d90c93015afe96e83428830",
	executableBytes: 19637680,
	executableSha256: "b2d865ee505e842d22ceca5493a872efa893a79b079a7a8ee2bd3aa5343a5c41",
	downloadPage: "https://www.cpolar.com/download",
	signupUrl: "https://dashboard.cpolar.com/signup",
	dashboardUrl: "https://dashboard.cpolar.com/auth",
	termsUrl: "https://www.cpolar.com/tos"
});
function inside(parent, child) {
	const candidate = relative(parent, child);
	return candidate !== "" && !candidate.startsWith("..") && !isAbsolute(candidate);
}
async function sha256(file) {
	return createHash("sha256").update(await readFile(file)).digest("hex");
}
async function regularFile(file, expectedBytes) {
	try {
		const stat = await lstat(file);
		return stat.isFile() && !stat.isSymbolicLink() && (expectedBytes === void 0 || stat.size === expectedBytes);
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
async function run(file, args) {
	await new Promise((resolveRun, reject) => {
		execFile(file, [...args], {
			windowsHide: true,
			timeout: 12e4
		}, (error) => {
			if (error === null) resolveRun();
			else reject(error);
		});
	});
}
async function defaultFetchArtifact(url, signal) {
	const response = await fetch(url, {
		redirect: "error",
		signal
	});
	if (!response.ok) throw new Error(`cpolar_download_http_${String(response.status)}`);
	const length = Number(response.headers.get("content-length"));
	if (Number.isFinite(length) && length !== CPOLAR_COMPONENT_RELEASE.downloadBytes) throw new Error("cpolar_download_size_mismatch");
	const bytes = new Uint8Array(await response.arrayBuffer());
	if (bytes.byteLength !== CPOLAR_COMPONENT_RELEASE.downloadBytes) throw new Error("cpolar_download_size_mismatch");
	return bytes;
}
async function defaultExtractArtifact(archive, destination) {
	if (process.platform !== "win32") throw new Error("cpolar_component_unsupported");
	const unpacked = join(destination, "archive");
	const administrative = join(destination, "administrative");
	await mkdir(unpacked, {
		recursive: true,
		mode: 448
	});
	await mkdir(administrative, {
		recursive: true,
		mode: 448
	});
	await run("tar.exe", [
		"-xf",
		archive,
		"-C",
		unpacked
	]);
	const msiRelative = (await readdir(unpacked, { recursive: true })).find((entry) => entry.toLowerCase().endsWith(".msi"));
	if (msiRelative === void 0) throw new Error("cpolar_installer_missing");
	await run("msiexec.exe", [
		"/a",
		join(unpacked, msiRelative),
		"/qn",
		`TARGETDIR=${administrative}`
	]);
	const executableRelative = (await readdir(administrative, { recursive: true })).find((entry) => basename(entry).toLowerCase() === "cpolar.exe");
	if (executableRelative === void 0) throw new Error("cpolar_executable_missing");
	await copyFile(join(administrative, executableRelative), join(destination, "cpolar.exe"));
}
/** Validate a cpolar Authtoken before it crosses the durable-file boundary. */
function validateCpolarAuthtoken(value) {
	if (typeof value !== "string" || value.length < 20 || value.length > 512 || /[\s\u0000-\u001f\u007f]/u.test(value)) throw new Error("cpolar_authtoken_invalid");
	return value;
}
/** Owns the optional cpolar binary and account configuration inside DSH Mobile state. */
var CpolarComponentManager = class {
	executable;
	configFile;
	componentRoot;
	componentStorage;
	stateRoot;
	logRoot;
	stagingRoot;
	platform;
	arch;
	fetchArtifact;
	extractArtifact;
	installed = false;
	configured = false;
	errorCode;
	queue = Promise.resolve();
	constructor(options) {
		const stateDirectory = resolve(options.stateDirectory);
		if (!isAbsolute(stateDirectory)) throw new Error("cpolar state directory must be absolute");
		this.platform = options.platform ?? process.platform;
		this.arch = options.arch ?? process.arch;
		this.componentRoot = join(stateDirectory, "components", "cpolar");
		this.componentStorage = join(this.componentRoot, CPOLAR_COMPONENT_RELEASE.version);
		this.executable = join(this.componentStorage, "cpolar.exe");
		this.stateRoot = join(stateDirectory, "state", "cpolar");
		this.configFile = join(this.stateRoot, "cpolar.yml");
		this.logRoot = join(stateDirectory, "logs", "cpolar");
		this.stagingRoot = join(stateDirectory, "staging", "cpolar");
		for (const child of [
			this.componentRoot,
			this.componentStorage,
			this.stateRoot,
			this.logRoot,
			this.stagingRoot
		]) if (!inside(stateDirectory, child)) throw new Error("cpolar component path escaped its state directory");
		this.fetchArtifact = options.fetchArtifact ?? defaultFetchArtifact;
		this.extractArtifact = options.extractArtifact ?? defaultExtractArtifact;
	}
	/** Inspect the managed binary and configuration without using global cpolar state. */
	async initialize() {
		this.installed = await regularFile(this.executable, CPOLAR_COMPONENT_RELEASE.executableBytes);
		if (this.installed && await sha256(this.executable) !== CPOLAR_COMPONENT_RELEASE.executableSha256) {
			this.installed = false;
			this.errorCode = "cpolar_component_invalid";
		}
		this.configured = await regularFile(this.configFile);
		if (this.configured) await restrictPrivateFile(this.configFile);
	}
	/** Return a safe status that never includes the account token. */
	status() {
		return Object.freeze({
			supported: this.platform === CPOLAR_COMPONENT_RELEASE.platform && this.arch === CPOLAR_COMPONENT_RELEASE.arch,
			installed: this.installed,
			configured: this.configured,
			version: CPOLAR_COMPONENT_RELEASE.version,
			downloadBytes: CPOLAR_COMPONENT_RELEASE.downloadBytes,
			installedBytes: CPOLAR_COMPONENT_RELEASE.executableBytes,
			sourceUrl: CPOLAR_COMPONENT_RELEASE.downloadUrl,
			downloadPage: CPOLAR_COMPONENT_RELEASE.downloadPage,
			signupUrl: CPOLAR_COMPONENT_RELEASE.signupUrl,
			dashboardUrl: CPOLAR_COMPONENT_RELEASE.dashboardUrl,
			termsUrl: CPOLAR_COMPONENT_RELEASE.termsUrl,
			storagePath: this.componentRoot,
			...this.errorCode === void 0 ? {} : { errorCode: this.errorCode }
		});
	}
	/** Download, verify, and administratively extract cpolar after explicit confirmation. */
	install() {
		return this.enqueue(async () => {
			if (this.platform !== CPOLAR_COMPONENT_RELEASE.platform || this.arch !== CPOLAR_COMPONENT_RELEASE.arch) throw new Error("cpolar_component_unsupported");
			await mkdir(this.stagingRoot, {
				recursive: true,
				mode: 448
			});
			const staging = await mkdtemp(join(this.stagingRoot, "install-"));
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => {
					controller.abort();
				}, 12e4);
				timeout.unref();
				let bytes;
				try {
					bytes = await this.fetchArtifact(CPOLAR_COMPONENT_RELEASE.downloadUrl, controller.signal);
				} finally {
					clearTimeout(timeout);
				}
				if (createHash("sha256").update(bytes).digest("hex") !== CPOLAR_COMPONENT_RELEASE.downloadSha256) throw new Error("cpolar_download_hash_mismatch");
				const archive = join(staging, "cpolar.zip");
				await writeFile(archive, bytes, {
					flag: "wx",
					mode: 384
				});
				await this.extractArtifact(archive, staging);
				const extracted = join(staging, "cpolar.exe");
				if (!await regularFile(extracted, CPOLAR_COMPONENT_RELEASE.executableBytes) || await sha256(extracted) !== CPOLAR_COMPONENT_RELEASE.executableSha256) throw new Error("cpolar_executable_hash_mismatch");
				const candidate = join(this.componentRoot, `.install-${randomBytes(12).toString("hex")}`);
				await mkdir(candidate, {
					recursive: true,
					mode: 448
				});
				await copyFile(extracted, join(candidate, "cpolar.exe"));
				await chmod(join(candidate, "cpolar.exe"), 448);
				await rm(this.componentStorage, {
					recursive: true,
					force: true
				});
				await rename(candidate, this.componentStorage);
				this.installed = true;
				this.errorCode = void 0;
			} finally {
				await rm(staging, {
					recursive: true,
					force: true
				});
			}
		});
	}
	/** Store only the cpolar token in a private, self-update-disabled configuration. */
	configure(authtoken) {
		return this.enqueue(async () => {
			const token = validateCpolarAuthtoken(authtoken);
			await mkdir(this.stateRoot, {
				recursive: true,
				mode: 448
			});
			const temporary = join(this.stateRoot, `.cpolar.${randomBytes(12).toString("hex")}.tmp`);
			const body = `authtoken: ${JSON.stringify(token)}\nconsole_ui: false\nupdate: false\ninspect_db_size: -1\n`;
			try {
				await writeFile(temporary, body, {
					encoding: "utf8",
					flag: "wx",
					mode: 384
				});
				await rename(temporary, this.configFile);
				await restrictPrivateFile(this.configFile);
			} catch (error) {
				await rm(temporary, { force: true });
				throw error;
			}
			this.configured = true;
			this.errorCode = void 0;
		});
	}
	/** Remove every cpolar file owned by DSH Mobile without touching global state. */
	purge() {
		return this.enqueue(async () => {
			await Promise.all([
				rm(this.componentRoot, {
					recursive: true,
					force: true
				}),
				rm(this.stateRoot, {
					recursive: true,
					force: true
				}),
				rm(this.logRoot, {
					recursive: true,
					force: true
				}),
				rm(this.stagingRoot, {
					recursive: true,
					force: true
				})
			]);
			this.installed = false;
			this.configured = false;
			this.errorCode = void 0;
		});
	}
	enqueue(operation) {
		const task = this.queue.then(operation, operation);
		this.queue = task.then(() => void 0, () => void 0);
		return task.then(() => this.status());
	}
};
//#endregion
//#region src/release-update.ts
const PACKAGE_NAME = "dsh-mobile";
const NPM_LATEST_URL = "https://registry.npmjs.org/dsh-mobile/latest";
const GITHUB_LATEST_URL = "https://github.com/saya-ch/dsh-mobile/releases/latest";
const GITHUB_API_LATEST_URL = "https://api.github.com/repos/saya-ch/dsh-mobile/releases/latest";
const GITHUB_RELEASES_URL = "https://github.com/saya-ch/dsh-mobile/releases";
const RELEASE_NOTES_MAX_CHARS = 4e3;
const STATUS_CACHE_MS = 6e5;
const REQUEST_TIMEOUT_MS = 8e3;
const UPDATE_TIMEOUT_MS = 12e4;
const UPDATE_TERMINATION_GRACE_MS = 1500;
const NUMERIC_VERSION_IDENTIFIER = "(?:0|[1-9]\\d*)";
const WILDCARD_VERSION_IDENTIFIER = "(?:[xX*])";
const RANGE_VERSION = `(?:${`${NUMERIC_VERSION_IDENTIFIER}\\.${NUMERIC_VERSION_IDENTIFIER}\\.${NUMERIC_VERSION_IDENTIFIER}(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?`}|${`(?:${WILDCARD_VERSION_IDENTIFIER}|${NUMERIC_VERSION_IDENTIFIER}(?:\\.(?:${WILDCARD_VERSION_IDENTIFIER}|${NUMERIC_VERSION_IDENTIFIER}(?:\\.(?:${WILDCARD_VERSION_IDENTIFIER}|${NUMERIC_VERSION_IDENTIFIER}))?))?)`})`;
const COMPARATOR = new RegExp(`^(?:<=|>=|<|>|=|~|\\^)?${RANGE_VERSION}$`, "u");
const HYPHEN_RANGE = new RegExp(`^${RANGE_VERSION} +[-] +${RANGE_VERSION}$`, "u");
const DIST_TAG = /^[A-Za-z][A-Za-z0-9._-]{0,127}$/u;
function parseSemver(value) {
	const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u.exec(value);
	if (match === null) return void 0;
	const core = [
		Number(match[1]),
		Number(match[2]),
		Number(match[3])
	];
	if (core.some((part) => !Number.isSafeInteger(part))) return void 0;
	const prerelease = match[4] === void 0 ? [] : match[4].split(".").map((part) => /^\d+$/u.test(part) ? Number(part) : part);
	if (prerelease.some((part) => typeof part === "number" && !Number.isSafeInteger(part))) return void 0;
	return Object.freeze({
		core,
		prerelease: Object.freeze(prerelease)
	});
}
/** Compare two strict SemVer strings, including prerelease precedence. */
function comparePluginVersions(left, right) {
	const a = parseSemver(left);
	const b = parseSemver(right);
	if (a === void 0 || b === void 0) return void 0;
	for (let index = 0; index < a.core.length; index += 1) {
		const difference = a.core[index] - b.core[index];
		if (difference !== 0) return Math.sign(difference);
	}
	if (a.prerelease.length === 0 || b.prerelease.length === 0) return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length === 0 ? 1 : -1;
	const length = Math.max(a.prerelease.length, b.prerelease.length);
	for (let index = 0; index < length; index += 1) {
		const leftPart = a.prerelease[index];
		const rightPart = b.prerelease[index];
		if (leftPart === void 0 || rightPart === void 0) return leftPart === void 0 ? -1 : 1;
		if (leftPart === rightPart) continue;
		if (typeof leftPart === "number" && typeof rightPart === "number") return Math.sign(leftPart - rightPart);
		if (typeof leftPart === "number") return -1;
		if (typeof rightPart === "number") return 1;
		return leftPart < rightPart ? -1 : 1;
	}
	return 0;
}
function isComparatorSet(value) {
	if (HYPHEN_RANGE.test(value)) return true;
	const comparators = value.replace(/(<=|>=|<|>|=|~|\^) +/gu, "$1").split(/ +/u);
	return comparators.length > 0 && comparators.every((comparator) => COMPARATOR.test(comparator));
}
function isNpmVersionRange(value) {
	if (!/^[0-9xX*<>=~^|.+\- ]+$/u.test(value)) return false;
	const alternatives = value.split(/ *\|\| */u);
	return alternatives.length > 0 && alternatives.every((alternative) => alternative !== "" && isComparatorSet(alternative));
}
/** Return whether pnpm may safely replace this profile dependency from an npm version, range, or tag. */
function isRegistryPluginSpec(value) {
	if (typeof value !== "string" || value.trim() !== value || value === "" || /[\u0000-\u001f\u007f]/u.test(value)) return false;
	if (/\.(?:tgz|tar(?:\.gz)?)$/iu.test(value)) return false;
	return parseSemver(value) !== void 0 || isNpmVersionRange(value) || DIST_TAG.test(value);
}
/** Resolve the DSH profile named by the current launcher arguments. */
function launchedProfileName(argv) {
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === "--profile") {
			const candidate = argv[index + 1];
			if (candidate !== void 0 && /^[\w.-]+$/u.test(candidate)) return candidate;
		}
		const match = /^--profile=([\w.-]+)$/u.exec(argv[index] ?? "");
		if (match?.[1] !== void 0) return match[1];
	}
	return "web";
}
/** Resolve the launcher-owned Desktop profile, or the CLI profile outside Desktop. */
function releaseProfileDirectory(ctx, dshHome, argv) {
	const desktopProfiles = ctx.get("desktopProfiles");
	const desktopDirectory = desktopProfiles?.current?.dir;
	if (typeof desktopDirectory === "string" && isAbsolute(desktopDirectory)) return desktopDirectory;
	if (desktopProfiles !== void 0 || ctx.get("desktopRuntime") !== void 0) return void 0;
	return join(dshHome, "profiles", launchedProfileName(argv));
}
async function profileDependencySpec(profileDirectory) {
	try {
		const value = JSON.parse(await readFile(join(profileDirectory, "package.json"), "utf8")).dependencies?.[PACKAGE_NAME];
		return typeof value === "string" ? value : void 0;
	} catch {
		return;
	}
}
async function fetchNpmVersion(fetcher) {
	const response = await fetcher(NPM_LATEST_URL, {
		headers: {
			accept: "application/json",
			"user-agent": "dsh-mobile-release-check"
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	if (!response.ok) return void 0;
	const payload = await response.json();
	return typeof payload.version === "string" && parseSemver(payload.version) !== void 0 ? payload.version : void 0;
}
function githubReleaseVersion(location, responseUrl) {
	let url;
	try {
		url = new URL(location ?? responseUrl, GITHUB_LATEST_URL);
	} catch {
		return;
	}
	if (url.origin !== "https://github.com" || url.username !== "" || url.password !== "" || url.search !== "" || url.hash !== "") return void 0;
	if (!url.pathname.startsWith("/saya-ch/dsh-mobile/releases/tag/v")) return void 0;
	let version;
	try {
		version = decodeURIComponent(url.pathname.slice(34));
	} catch {
		return;
	}
	return parseSemver(version) === void 0 ? void 0 : version;
}
function androidReleaseDownloadUrl(version) {
	if (version === void 0) return GITHUB_RELEASES_URL;
	const tag = `v${version}`;
	return `https://github.com/saya-ch/dsh-mobile/releases/download/${encodeURIComponent(tag)}/dsh-mobile-android-${encodeURIComponent(tag)}.apk`;
}
async function fetchAndroidVersion(fetcher) {
	const response = await fetcher(GITHUB_LATEST_URL, {
		method: "GET",
		redirect: "manual",
		headers: {
			accept: "text/html",
			"user-agent": "dsh-mobile-release-check"
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	return githubReleaseVersion(response.headers.get("location"), response.url);
}
/** Best-effort body of the latest GitHub release, trimmed to a bounded size. */
async function fetchReleaseNotes(fetcher) {
	const response = await fetcher(GITHUB_API_LATEST_URL, {
		headers: {
			accept: "application/vnd.github+json",
			"user-agent": "dsh-mobile-release-check"
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	if (!response.ok) return void 0;
	const payload = await response.json();
	if (typeof payload.body !== "string") return void 0;
	const notes = payload.body.trim();
	return notes === "" ? void 0 : notes.slice(0, RELEASE_NOTES_MAX_CHARS);
}
async function readProfileInstalledVersion(profileDirectory) {
	try {
		const manifestPath = createRequire(join(profileDirectory, "package.json")).resolve(`${PACKAGE_NAME}/package.json`);
		const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
		return typeof manifest.version === "string" ? manifest.version : void 0;
	} catch {
		return;
	}
}
function childCompletion(child) {
	return new Promise((resolveCompletion, rejectCompletion) => {
		child.once("error", rejectCompletion);
		child.once("close", (code, signal) => {
			resolveCompletion({
				code,
				signal
			});
		});
	});
}
function createDeadline(timeoutMs) {
	let timer;
	return {
		promise: new Promise((resolveTimeout) => {
			timer = setTimeout(resolveTimeout, timeoutMs);
			timer.unref();
		}),
		cancel: () => {
			if (timer !== void 0) clearTimeout(timer);
			timer = void 0;
		}
	};
}
async function taskkillProcessTree(pid) {
	if ((await childCompletion(spawn("taskkill.exe", [
		"/PID",
		String(pid),
		"/T",
		"/F"
	], {
		shell: false,
		windowsHide: true,
		stdio: "ignore"
	}))).code !== 0) throw new Error("plugin_update_tree_termination_failed");
}
async function completionWithin(completion, timeoutMs) {
	let timer;
	try {
		return await Promise.race([completion.then(() => true, () => true), new Promise((resolveTimeout) => {
			timer = setTimeout(() => {
				resolveTimeout(false);
			}, timeoutMs);
			timer.unref();
		})]);
	} finally {
		if (timer !== void 0) clearTimeout(timer);
	}
}
function processMissing(error) {
	return error.code === "ESRCH";
}
async function terminateProcessTree(child, completion, platform) {
	if (child.exitCode !== null || child.signalCode !== null) return;
	const pid = child.pid;
	if (pid === void 0) {
		child.kill("SIGKILL");
		if (!await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) throw new Error("plugin_update_tree_termination_timeout");
		return;
	}
	if (platform === "win32") {
		try {
			await taskkillProcessTree(pid);
		} catch (error) {
			if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
			if (!await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) throw new AggregateError([error, /* @__PURE__ */ new Error("plugin_update_tree_termination_timeout")], "plugin update tree termination failed");
			throw error;
		}
		if (!await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) {
			if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
			if (!await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) throw new Error("plugin_update_tree_termination_timeout");
		}
		return;
	}
	try {
		process.kill(-pid, "SIGTERM");
	} catch (error) {
		if (!processMissing(error)) throw error;
		if (!await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) throw new Error("plugin_update_tree_termination_timeout");
		return;
	}
	if (await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) return;
	try {
		process.kill(-pid, "SIGKILL");
	} catch (error) {
		if (!processMissing(error)) throw error;
	}
	if (!await completionWithin(completion, UPDATE_TERMINATION_GRACE_MS)) throw new Error("plugin_update_tree_termination_timeout");
}
function startUpdateProcess(request) {
	const child = spawn(request.command, [...request.args], {
		cwd: request.cwd,
		detached: request.detached,
		shell: request.shell,
		windowsHide: true,
		stdio: [
			"ignore",
			"ignore",
			"pipe"
		]
	});
	const completion = childCompletion(child);
	return {
		completion,
		...child.stderr === null ? {} : { stderr: child.stderr },
		terminateTree: async () => terminateProcessTree(child, completion, request.platform)
	};
}
function updateFailure(cause) {
	return cause === void 0 ? /* @__PURE__ */ new Error("plugin_update_failed") : new Error("plugin_update_failed", { cause });
}
async function runPnpmUpdate(profileDirectory, version, runtime = {}) {
	if (parseSemver(version) === void 0) throw new Error("plugin_update_unavailable");
	const platform = runtime.platform ?? process.platform;
	const packageSpec = `${PACKAGE_NAME}@${version}`;
	const managed = (runtime.start ?? startUpdateProcess)({
		command: platform === "win32" ? runtime.windowsCommandInterpreter ?? process.env.ComSpec ?? "cmd.exe" : "pnpm",
		args: platform === "win32" ? [
			"/d",
			"/s",
			"/c",
			"pnpm.cmd",
			"add",
			packageSpec
		] : ["add", packageSpec],
		cwd: profileDirectory,
		detached: platform !== "win32",
		platform,
		shell: false
	});
	let diagnostics = "";
	managed.stderr?.on("data", (chunk) => {
		if (diagnostics.length < 4096) diagnostics += Buffer.from(chunk).toString("utf8").slice(0, 4096 - diagnostics.length);
	});
	const completion = managed.completion.then((result) => ({
		kind: "exit",
		result
	}), (error) => ({
		kind: "error",
		error
	}));
	const deadline = (runtime.deadline ?? createDeadline)(runtime.timeoutMs ?? UPDATE_TIMEOUT_MS);
	const first = await Promise.race([completion, deadline.promise.then(() => ({ kind: "timeout" }))]);
	deadline.cancel();
	if (first.kind === "error") throw updateFailure(first.error);
	if (first.kind === "exit") {
		if (first.result.code === 0) return;
		const detail = diagnostics.trim() || `pnpm exited with ${first.result.signal ?? String(first.result.code)}`;
		throw updateFailure(new Error(detail));
	}
	let terminationError;
	try {
		await managed.terminateTree();
	} catch (error) {
		terminationError = error;
	}
	if (terminationError !== void 0) throw updateFailure(terminationError);
	const stopped = await completion;
	if (stopped.kind === "error") throw updateFailure(stopped.error);
	throw updateFailure(/* @__PURE__ */ new Error("plugin update timed out"));
}
/** Cached npm/GitHub release lookup and guarded profile-local package update. */
var PluginReleaseManager = class {
	profileDirectory;
	installedVersion;
	fetcher;
	runner;
	installedVersionReader;
	now;
	cache;
	activeUpdate;
	constructor(options) {
		this.profileDirectory = options.profileDirectory;
		this.installedVersion = options.installedVersion ?? DSH_MOBILE_VERSION;
		this.fetcher = options.fetch ?? globalThis.fetch;
		this.runner = options.runUpdate ?? ((profileDirectory, version) => runPnpmUpdate(profileDirectory, version, options.updateProcess));
		this.installedVersionReader = options.readInstalledVersion ?? readProfileInstalledVersion;
		this.now = options.now ?? Date.now;
	}
	/** Read cached release metadata and suppress external lookup failures. */
	async status(force = false) {
		if (!force && this.cache !== void 0 && this.cache.expiresAt > this.now()) return this.cache.status;
		const updateSupported = isRegistryPluginSpec(this.profileDirectory === void 0 ? void 0 : await profileDependencySpec(this.profileDirectory));
		const [npmResult, androidResult, notesResult] = await Promise.allSettled([
			fetchNpmVersion(this.fetcher),
			fetchAndroidVersion(this.fetcher),
			fetchReleaseNotes(this.fetcher)
		]);
		const latestVersion = npmResult.status === "fulfilled" ? npmResult.value : void 0;
		const androidVersion = androidResult.status === "fulfilled" ? androidResult.value : void 0;
		const releaseNotes = notesResult.status === "fulfilled" ? notesResult.value : void 0;
		const comparison = latestVersion === void 0 ? void 0 : comparePluginVersions(latestVersion, this.installedVersion);
		const status = Object.freeze({
			installedVersion: this.installedVersion,
			...latestVersion === void 0 ? {} : { latestVersion },
			updateAvailable: updateSupported && comparison === 1,
			updateSupported,
			...androidVersion === void 0 ? {} : { androidVersion },
			androidDownloadUrl: androidReleaseDownloadUrl(androidVersion),
			...releaseNotes === void 0 ? {} : { releaseNotes }
		});
		this.cache = {
			expiresAt: this.now() + STATUS_CACHE_MS,
			status
		};
		return status;
	}
	/** Install the latest npm release into the active profile, then require a DSH restart. */
	async update() {
		if (this.activeUpdate !== void 0) return this.activeUpdate;
		this.activeUpdate = this.updateOnce();
		try {
			return await this.activeUpdate;
		} finally {
			this.activeUpdate = void 0;
		}
	}
	async updateOnce() {
		const profileDirectory = this.profileDirectory;
		if (profileDirectory === void 0) throw new Error("plugin_update_unsupported");
		const status = await this.status(true);
		if (!status.updateSupported) throw new Error("plugin_update_unsupported");
		if (!status.updateAvailable || status.latestVersion === void 0) throw new Error("plugin_update_unavailable");
		await this.runner(profileDirectory, status.latestVersion);
		const installed = await this.installedVersionReader(profileDirectory);
		if (installed !== status.latestVersion) throw new Error("plugin_update_failed");
		this.cache = void 0;
		return Object.freeze({
			installedVersion: installed,
			restartRequired: true
		});
	}
};
//#endregion
//#region src/file-logger.ts
const MAX_LOG_BYTES = 5242880;
/** Install a plugin-scoped Cordis exporter backed by a private UTF-8 log file. */
async function installMobileFileLogger(ctx, stateDirectory) {
	const directory = join(stateDirectory, "logs");
	const file = join(directory, "dsh-mobile.log");
	const previous = `${file}.1`;
	await mkdir(directory, {
		recursive: true,
		mode: 448
	});
	const entry = await lstat(file).catch(() => void 0);
	if (entry !== void 0 && entry.isFile() && !entry.isSymbolicLink() && entry.size >= MAX_LOG_BYTES) {
		await rm(previous, { force: true });
		await rename(file, previous);
	}
	const stream = createWriteStream(file, {
		flags: "a",
		encoding: "utf8",
		mode: 384
	});
	const exporter = {
		colors: false,
		maxLength: 16384,
		levels: {
			default: -1,
			"dsh-mobile": 3
		},
		export(message) {
			if (message.name !== "dsh-mobile") return;
			const record = {
				timestamp: new Date(message.ts).toISOString(),
				level: message.type,
				logger: message.name,
				message: Logger.format(exporter, message)
			};
			stream.write(`${JSON.stringify(record)}\n`);
		}
	};
	ctx.logger.exporter(exporter);
	ctx.effect(() => () => {
		stream.end();
	}, "dsh-mobile file logger");
	return file;
}
//#endregion
//#region src/managed-setup.ts
const VIRTUAL_INTERFACE_MARKERS = [
	"bridge",
	"docker",
	"hyper-v",
	"mihomo",
	"radmin",
	"tailscale",
	"tap",
	"tun",
	"utun",
	"vbox",
	"veth",
	"virtual",
	"vmware",
	"vpn",
	"vethernet",
	"wsl",
	"zerotier"
];
function requiredString(value, name) {
	if (typeof value !== "string" || value.length === 0) throw new Error(`${name} must be a non-empty string`);
	return value;
}
/** Validate the durable managed setup before it controls network and filesystem operations. */
function parseManagedSetup(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("mobile setup file must be an object");
	const record = value;
	if (record.version !== 2 || Reflect.ownKeys(record).some((key) => typeof key !== "string" || ![
		"version",
		"networkInterface",
		"listenPort",
		"upstreamOrigin",
		"tls"
	].includes(key))) throw new Error("mobile setup file has an unsupported format");
	if (!Number.isSafeInteger(record.listenPort) || record.listenPort < 1024 || record.listenPort > 65535) throw new Error("mobile setup listenPort must be from 1024 through 65535");
	if (typeof record.tls !== "object" || record.tls === null || Array.isArray(record.tls)) throw new Error("mobile setup tls must be an object");
	const tls = record.tls;
	if (tls.mode !== "managed" || Reflect.ownKeys(tls).some((key) => typeof key !== "string" || ![
		"mode",
		"caCertFile",
		"caKeyFile",
		"certFile",
		"keyFile"
	].includes(key))) throw new Error("mobile setup tls has an unsupported format");
	return Object.freeze({
		version: 2,
		networkInterface: requiredString(record.networkInterface, "mobile setup networkInterface"),
		listenPort: record.listenPort,
		upstreamOrigin: requiredString(record.upstreamOrigin, "mobile setup upstreamOrigin"),
		tls: Object.freeze({
			mode: "managed",
			caCertFile: requiredString(tls.caCertFile, "mobile setup tls.caCertFile"),
			caKeyFile: requiredString(tls.caKeyFile, "mobile setup tls.caKeyFile"),
			certFile: requiredString(tls.certFile, "mobile setup tls.certFile"),
			keyFile: requiredString(tls.keyFile, "mobile setup tls.keyFile")
		})
	});
}
function privateIpv4(value) {
	const parts = value.split(".").map(Number);
	return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) && (parts[0] === 10 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 192 && parts[1] === 168);
}
function networkCidr(address, cidr) {
	const prefix = Number(cidr.slice(cidr.lastIndexOf("/") + 1));
	const network = (address.split(".").reduce((total, part) => (total << 8 | Number(part)) >>> 0, 0) & (prefix === 0 ? 0 : 4294967295 << 32 - prefix >>> 0)) >>> 0;
	return `${[
		24,
		16,
		8,
		0
	].map((shift) => network >>> shift & 255).join(".")}/${String(prefix)}`;
}
/** List current private IPv4 candidates with their interface identity. */
function availableLanNetworks(table = networkInterfaces()) {
	const candidates = Object.entries(table).flatMap(([name, entries]) => (entries ?? []).filter((entry) => entry.family === "IPv4" && !entry.internal && privateIpv4(entry.address) && entry.cidr !== null).map((entry) => ({
		name,
		address: entry.address,
		cidr: networkCidr(entry.address, entry.cidr)
	})));
	return [...new Map(candidates.map((entry) => [`${entry.name}\0${entry.address}`, entry])).values()];
}
function likelyVirtualInterface(name) {
	const normalized = name.toLowerCase().replaceAll(/[^a-z0-9]+/gu, " ");
	return VIRTUAL_INTERFACE_MARKERS.some((marker) => normalized.includes(marker.replaceAll("-", " "))) || /^(?:br|wg)\d*\b/u.test(normalized);
}
/** Select an active LAN, optionally by address or by a previously saved interface name. */
function selectLanNetwork(requestedAddress, requestedInterface, table, preferredInterfaces = []) {
	const candidates = availableLanNetworks(table);
	if (requestedAddress !== void 0) {
		const match = candidates.find((candidate) => candidate.address === requestedAddress);
		if (match === void 0) throw new Error(`--address ${requestedAddress} is not an active private LAN address`);
		return match;
	}
	if (requestedInterface !== void 0) {
		const matches = candidates.filter((candidate) => candidate.name === requestedInterface);
		if (matches.length === 1) return matches[0];
		if (matches.length === 0) throw new Error(`saved LAN interface ${JSON.stringify(requestedInterface)} is not connected`);
		throw new Error(`saved LAN interface ${JSON.stringify(requestedInterface)} has more than one private IPv4 address`);
	}
	if (candidates.length === 1) return candidates[0];
	if (candidates.length === 0) throw new Error("no active private LAN address was found; connect to Wi-Fi or Ethernet");
	for (const name of preferredInterfaces) {
		const matches = candidates.filter((candidate) => candidate.name === name);
		if (matches.length === 1) return matches[0];
	}
	const physicalCandidates = candidates.filter((candidate) => !likelyVirtualInterface(candidate.name));
	if (physicalCandidates.length === 1) return physicalCandidates[0];
	throw new Error(`more than one LAN address is active; rerun with --address and one of: ${candidates.map((entry) => `${entry.name}=${entry.address}`).join(", ")}`);
}
function assertMatchingCa(certPem, keyPem) {
	const certificate = new X509Certificate(certPem);
	if (!certificate.ca || certificate.subject !== certificate.issuer || !certificate.verify(certificate.publicKey)) throw new Error("managed TLS CA must be a self-signed CA certificate");
	const privatePublic = createPublicKey(createPrivateKey(keyPem)).export({
		format: "der",
		type: "spki"
	});
	const certificatePublic = certificate.publicKey.export({
		format: "der",
		type: "spki"
	});
	if (!privatePublic.equals(certificatePublic)) throw new Error("managed TLS CA certificate and key do not match");
	if (Date.parse(certificate.validFrom) > Date.now() || Date.parse(certificate.validTo) <= Date.now()) throw new Error("managed TLS CA certificate is not currently valid");
	return certificate;
}
async function atomicWrite(file, contents) {
	const directory = dirname(file);
	await mkdir(directory, {
		recursive: true,
		mode: 448
	});
	const temporary = join(directory, `.${basename(file)}.${process.pid}.tmp`);
	await writeFile(temporary, contents, { mode: 384 });
	await rename(temporary, file);
	await restrictPrivateFile(file);
}
/** Sign and atomically install a server leaf for the interface's current address. */
async function refreshManagedServerCertificate(setup, address) {
	await Promise.all([restrictPrivateFile(setup.tls.caCertFile), restrictPrivateFile(setup.tls.caKeyFile)]);
	const [caCert, caKey] = await Promise.all([readFile(setup.tls.caCertFile, "utf8"), readFile(setup.tls.caKeyFile, "utf8")]);
	assertMatchingCa(caCert, caKey);
	const now = /* @__PURE__ */ new Date();
	const notAfter = new Date(now);
	notAfter.setDate(notAfter.getDate() + 397);
	const server = await generate([{
		name: "commonName",
		value: "DeepSeek Harness Mobile"
	}], {
		keyType: "ec",
		curve: "P-256",
		algorithm: "sha256",
		notBeforeDate: /* @__PURE__ */ new Date(now.getTime() - 3e5),
		notAfterDate: notAfter,
		ca: {
			cert: caCert,
			key: caKey
		},
		extensions: [
			{
				name: "basicConstraints",
				cA: false,
				critical: true
			},
			{
				name: "keyUsage",
				digitalSignature: true,
				critical: true
			},
			{
				name: "extKeyUsage",
				serverAuth: true
			},
			{
				name: "subjectAltName",
				altNames: [{
					type: 7,
					ip: address
				}]
			}
		]
	});
	await Promise.all([atomicWrite(setup.tls.certFile, server.cert), atomicWrite(setup.tls.keyFile, server.private)]);
}
/** Resolve the saved interface to the ordinary gateway config consumed by the Host plugin. */
async function materializeManagedSetup(setup, table) {
	const network = selectLanNetwork(void 0, setup.networkInterface, table);
	await refreshManagedServerCertificate(setup, network.address);
	const ca = new X509Certificate(await readFile(setup.tls.caCertFile, "utf8"));
	return {
		publicOrigin: `https://${network.address}:${String(setup.listenPort)}`,
		listenHost: network.address,
		allowedCidrs: [network.cidr],
		instanceId: ca.fingerprint256.replaceAll(":", "").toLowerCase(),
		pairingCaFile: setup.tls.caCertFile,
		tls: {
			mode: "provided",
			certFile: setup.tls.certFile,
			keyFile: setup.tls.keyFile
		}
	};
}
//#endregion
//#region src/plugin.ts
/** Stable Cordis plugin name. */
const name = "dsh-mobile";
/** The stock WebServer serves the control card; Connection authenticates the loopback DSH origin. */
const inject = [
	"webServer",
	"commands",
	"connection"
];
/** Run cleanup steps in ownership order and report every failure after all steps settle. */
async function settleCleanupSteps(steps) {
	const errors = [];
	for (const step of steps) try {
		await step();
	} catch (error) {
		errors.push(error);
	}
	if (errors.length === 1 && errors[0] instanceof Error) throw errors[0];
	if (errors.length > 0) throw new AggregateError(errors, "DSH Mobile cleanup failed");
}
/**
* Resolve the DSH launch-token URL the gateway exchanges for its upstream cookie.
*
* A layer that disables DSH browser authentication — dsh-lan-access with
* `noAuth: true` replaces `authenticatedUrl` with one returning the bare origin
* — produces a URL with no query string, so it cannot carry a launch token. That
* is a legitimate "this upstream needs no browser auth" signal: report no URL and
* the gateway proxies without a cookie instead of failing every route with
* `upstream_unavailable`. A token-bearing URL keeps the existing exchange, and a
* connection service that is absent or returns a malformed URL keeps failing
* closed. Only parsing is guarded: a connection service that throws still fails
* plugin activation loudly rather than silently proxying without authentication.
*/
function upstreamAuthenticatedUrl(ctx, upstreamOrigin) {
	const connection = ctx.connection;
	if (typeof connection?.authenticatedUrl !== "function") return void 0;
	const authenticatedUrl = connection.authenticatedUrl(upstreamOrigin.origin);
	try {
		return new URL(authenticatedUrl).search === "" ? void 0 : authenticatedUrl;
	} catch {
		return;
	}
}
function installedDshVersion() {
	try {
		const manifest = createRequire(import.meta.url)("@deepseek-ai/dsh-host-webserver/package.json");
		if (manifest === null || typeof manifest !== "object") return "unknown";
		const version = manifest.version;
		return typeof version === "string" && version !== "" ? version : "unknown";
	} catch {
		return "unknown";
	}
}
function mapAdminError(error) {
	if (error instanceof HttpError) return error;
	const code = error.code;
	if (error instanceof Error && error.message.includes("spawn UNKNOWN")) return new HttpError(409, "frp_component_launch_failed");
	if (code === "EADDRNOTAVAIL") return new HttpError(409, "network_address_changed");
	if (code === "EADDRINUSE") return new HttpError(409, "listen_port_in_use");
	if (error instanceof Error && error.message.startsWith("saved LAN interface ")) return new HttpError(409, "network_interface_unavailable");
	if (error instanceof Error && error.message === "cpolar_authtoken_invalid") return new HttpError(400, "cpolar_authtoken_invalid");
	if (error instanceof Error && error.message.startsWith("cpolar_")) return new HttpError(409, error.message);
	if (error instanceof Error && [
		"frp_server_address_invalid",
		"frp_server_port_invalid",
		"frp_token_invalid",
		"frp_public_origin_invalid",
		"frp_settings_invalid"
	].includes(error.message)) return new HttpError(400, error.message);
	if (error instanceof Error && error.message.startsWith("frp_")) return new HttpError(409, error.message);
	if (error instanceof Error && error.message.startsWith("vps_")) return new HttpError(409, error.message);
	if (error instanceof Error && error.message === "plugin_update_failed") return new HttpError(500, error.message);
	if (error instanceof Error && error.message.startsWith("plugin_update_")) return new HttpError(409, error.message);
	return new HttpError(500, "internal_error");
}
const SETUP_KEYS = /* @__PURE__ */ new Set([
	"version",
	"publicOrigin",
	"listenHost",
	"listenPort",
	"upstreamOrigin",
	"publicAuthorities",
	"allowedCidrs",
	"instanceId",
	"pairingCaFile",
	"tls"
]);
/** True when path names a regular file (not a directory or symlink). */
async function existsRegularFile(path) {
	try {
		const info = await lstat(path);
		return info.isFile() && !info.isSymbolicLink();
	} catch {
		return false;
	}
}
function withoutSetupKeys(config) {
	const merged = { ...config };
	for (const key of SETUP_KEYS) if (key !== "version") delete merged[key];
	return merged;
}
async function loadSetup(config) {
	if (config.setupFile === void 0) return {
		kind: "fixed",
		config
	};
	if (!isAbsolute(config.setupFile)) throw new Error("setupFile must be an absolute file path");
	let source;
	try {
		source = await readFile(resolve(config.setupFile), "utf8");
	} catch (error) {
		if (error.code === "ENOENT") return {
			kind: "fixed",
			config
		};
		throw error;
	}
	let parsed;
	try {
		parsed = JSON.parse(source);
	} catch (error) {
		throw new Error("mobile setup file is not valid JSON", { cause: error });
	}
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("mobile setup file must be an object");
	const record = parsed;
	if (record.version === 2) return {
		kind: "managed",
		config: withoutSetupKeys(config),
		setup: parseManagedSetup(record)
	};
	if (record.version !== 1 || Reflect.ownKeys(record).some((key) => typeof key !== "string" || !SETUP_KEYS.has(key))) throw new Error("mobile setup file has an unsupported format");
	const { version: _version, ...setup } = record;
	delete setup.upstreamOrigin;
	return {
		kind: "fixed",
		config: {
			...withoutSetupKeys(config),
			...setup
		}
	};
}
function loopbackTemplate(loaded, webServerPort) {
	const base = withoutSetupKeys(loaded.config);
	const activeUpstreamOrigin = `http://127.0.0.1:${String(webServerPort)}`;
	return parseGatewayConfig({
		...base,
		...loaded.kind === "managed" ? { upstreamOrigin: activeUpstreamOrigin } : { upstreamOrigin: loaded.config.upstreamOrigin ?? activeUpstreamOrigin },
		listenHost: "127.0.0.1",
		listenPort: 0,
		publicAuthorities: ["127.0.0.1"],
		allowedCidrs: ["127.0.0.0/8"],
		tls: { mode: "disabled" }
	});
}
async function stableInstanceId(loaded, template) {
	if (loaded.kind !== "managed") return loaded.config.instanceId ?? template.instanceId;
	return new X509Certificate(await readFile(loaded.setup.tls.caCertFile)).fingerprint256.replaceAll(":", "").toLowerCase();
}
/** Read and validate the optional gateway override file. */
async function readGatewayOverride(file) {
	let source;
	try {
		const entry = await lstat(file);
		if (!entry.isFile() || entry.isSymbolicLink() || entry.size > 8192) return void 0;
		source = await readFile(file, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") return void 0;
		throw error;
	}
	let parsed;
	try {
		parsed = JSON.parse(source);
	} catch {
		return;
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return void 0;
	const record = parsed;
	const tls = record.tls;
	if ((typeof tls === "object" && tls !== null ? tls.mode : void 0) !== "disabled") return void 0;
	const listenPort = record.listenPort;
	if (!Number.isSafeInteger(listenPort) || Number(listenPort) < 1 || Number(listenPort) > 65535) return void 0;
	let origin;
	try {
		origin = new URL(String(record.publicOrigin));
	} catch {
		return;
	}
	if (origin.protocol !== "https:" || origin.port !== "" || origin.pathname !== "/" || origin.search !== "" || origin.hash !== "" || origin.username !== "" || origin.password !== "") return;
	return Object.freeze({
		publicOrigin: origin.origin,
		listenPort: Number(listenPort)
	});
}
function remoteGatewayConfig(template, publicOrigin, stateFile, instanceId, listenPort = 0, override) {
	const origin = new URL(override?.publicOrigin ?? publicOrigin);
	if (origin.protocol !== "https:" || origin.username !== "" || origin.password !== "" || origin.pathname !== "/" || origin.search !== "" || origin.hash !== "") throw new Error("remote public origin must be an HTTPS origin");
	const publicAuthority = origin.port === "" ? `${origin.hostname}:443` : origin.host;
	const { pairingCaFile: _pairingCaFile, ...shared } = template;
	return Object.freeze({
		...shared,
		listenHost: "127.0.0.1",
		listenPort: override?.listenPort ?? listenPort,
		authorities: Object.freeze([parseAuthority(publicAuthority)]),
		allowedCidrs: Object.freeze([parseCidr("127.0.0.0/8")]),
		stateFile,
		instanceId,
		tls: Object.freeze({ mode: "disabled" }),
		publicTls: true,
		discovery: false
	});
}
function remoteControlPayload(provider, status, gateway, providerStatuses, cpolarComponent, frpComponent, frpConfiguration, chmlfrpComponent) {
	return {
		provider,
		running: status.enabled,
		state: status.state,
		...status.origin === void 0 ? {} : { origin: status.origin },
		...status.loginUrl === void 0 ? {} : { loginUrl: status.loginUrl },
		...status.setupUrl === void 0 ? {} : { setupUrl: status.setupUrl },
		...status.errorCode === void 0 ? {} : { errorCode: status.errorCode },
		...gateway === void 0 ? {} : { extensions: gateway.extensionStatus() },
		providers: {
			tailscale: {
				bundled: true,
				running: providerStatuses.tailscale.enabled,
				state: providerStatuses.tailscale.state
			},
			cpolar: {
				bundled: false,
				running: providerStatuses.cpolar.enabled,
				state: providerStatuses.cpolar.state,
				component: cpolarComponent
			},
			frp: {
				bundled: false,
				running: providerStatuses.frp.enabled,
				state: providerStatuses.frp.state,
				component: frpComponent,
				configuration: frpConfiguration
			},
			chmlfrp: {
				bundled: false,
				running: providerStatuses.frp.enabled && frpConfiguration.kind === "chmlfrp",
				state: providerStatuses.frp.state,
				component: chmlfrpComponent,
				configuration: frpConfiguration
			}
		}
	};
}
/** Mount the resident control route and its optional authenticated LAN gateway. */
async function apply(ctx, config) {
	const dshVersion = installedDshVersion();
	const loaded = await loadSetup(config);
	const mobileAccess = createMobileAccessService(ctx);
	const template = loopbackTemplate(loaded, ctx.webServer.port);
	const upstreamLoginUrl = upstreamAuthenticatedUrl(ctx, template.upstreamOrigin);
	const instanceId = await stableInstanceId(loaded, template);
	const stateDirectory = dirname(template.stateFile);
	const logFile = await installMobileFileLogger(ctx, stateDirectory);
	const logger = ctx.logger("dsh-mobile");
	logger.info("logging initialized file=%s", logFile);
	const taskEventHub = new TaskEventHub();
	const disposeTaskEvents = watchTaskCompletions(ctx, {
		onTaskCompleted: (event) => taskEventHub.broadcast(event),
		log(event, fields) {
			logger.info("task event=%s fields=%o", event, fields);
		}
	});
	const remoteDirectory = join(stateDirectory, "remote");
	const configuredDshHome = process.env.DSH_HOME?.trim();
	const releaseManager = new PluginReleaseManager({ profileDirectory: releaseProfileDirectory(ctx, configuredDshHome === void 0 || configuredDshHome === "" ? dirname(stateDirectory) : resolve(configuredDshHome), process.argv.slice(2)) });
	const remoteProviderStore = new JsonRemoteProviderStore(join(remoteDirectory, "provider.json"), configuredRemoteProvider(process.env));
	const initialRemoteProvider = (await remoteProviderStore.load()).provider;
	const cpolarComponent = new CpolarComponentManager({ stateDirectory });
	await cpolarComponent.initialize();
	const frpComponent = new FrpComponentManager({ stateDirectory });
	await frpComponent.initialize();
	const chmlfrpComponent = new FrpComponentManager({
		stateDirectory,
		variant: "chmlfrp"
	});
	await chmlfrpComponent.initialize();
	const frpConfig = new FrpConfigStore(join(remoteDirectory, "frp", "config"));
	await frpConfig.initialize();
	const unregisterBuiltin = mobileAccess.registerExtension({
		schemaVersion: 1,
		id: "computer-images",
		name: "Computer images",
		version: "1.0.0",
		description: "Authenticated computer-side image browser",
		routes: [{
			method: "GET",
			path: "list",
			async handle(request) {
				return {
					status: 200,
					contentType: "application/json; charset=utf-8",
					body: JSON.stringify(await listComputerImages(request.query.get("path")))
				};
			}
		}, {
			method: "GET",
			path: "image",
			async handle(request) {
				const image = await readComputerImage(request.query.get("path"));
				return {
					status: 200,
					contentType: image.contentType,
					headers: { "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(image.name)}` },
					body: image.body
				};
			}
		}]
	});
	const webSocketPaths = new WebSocketPathStore(join(stateDirectory, "websocket-paths.json"));
	await webSocketPaths.load();
	const blockedUpgradePaths = new BlockedUpgradePathLog();
	let lanGateway;
	const startGateway = async (candidateConfig) => {
		const resolved = parseGatewayConfig({
			...candidateConfig,
			upstreamOrigin: template.upstreamOrigin.origin
		});
		const candidate = new MobileAccessGateway(resolved, new JsonDeviceStore(resolved.stateFile, resolved.maxDevices), mobileAccess, upstreamLoginUrl, webSocketPaths, blockedUpgradePaths);
		await candidate.start();
		lanGateway = candidate;
		const removeTaskSink = taskEventHub.add(candidate);
		return { close: async () => {
			if (lanGateway === candidate) lanGateway = void 0;
			removeTaskSink();
			await candidate.close();
		} };
	};
	const startRuntime = async () => {
		if (loaded.kind === "fixed") return startGateway(loaded.config);
		const following = new FollowingMobileAccessRuntime(async () => {
			const network = selectLanNetwork(void 0, loaded.setup.networkInterface);
			return {
				key: `${network.name}\0${network.address}\0${network.cidr}`,
				start: async () => startGateway({
					...loaded.config,
					...await materializeManagedSetup(loaded.setup)
				})
			};
		}, (error) => {
			process.emitWarning(`DSH Mobile could not follow the current LAN address: ${error instanceof Error ? error.message : String(error)}`, { code: "DSH_MOBILE_NETWORK_REFRESH" });
		});
		await following.initialize(2e3);
		return following;
	};
	const lanController = new MobileAccessGatewayController(new JsonMobileAccessControlStore(parseControlFile(config.controlFile), config.initiallyEnabled), startRuntime);
	const remoteDeviceFile = join(remoteDirectory, "devices.json");
	const gatewayOverrideFile = join(remoteDirectory, "gateway.json");
	const legacyCpolarDeviceFile = join(remoteDirectory, "cpolar", "devices.json");
	if (initialRemoteProvider === "cpolar") try {
		await lstat(remoteDeviceFile);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		try {
			await copyFile(legacyCpolarDeviceFile, remoteDeviceFile);
		} catch (copyError) {
			if (copyError.code !== "ENOENT") throw copyError;
		}
	}
	const createRemoteGateway = async (publicOrigin, listenPort = 0) => {
		const override = await readGatewayOverride(gatewayOverrideFile);
		const resolved = remoteGatewayConfig(template, publicOrigin, remoteDeviceFile, instanceId, listenPort, override);
		const candidate = new MobileAccessGateway(resolved, new JsonDeviceStore(resolved.stateFile, resolved.maxDevices), mobileAccess, upstreamLoginUrl, webSocketPaths, blockedUpgradePaths);
		await candidate.start();
		return candidate;
	};
	const tailscaleStore = new JsonMobileAccessControlStore(join(remoteDirectory, "control.json"), false);
	const cpolarStore = new JsonMobileAccessControlStore(join(remoteDirectory, "cpolar", "control.json"), false);
	const frpStore = new JsonMobileAccessControlStore(join(remoteDirectory, "frp", "control.json"), false);
	const remoteControllers = {
		tailscale: new FunnelController({
			store: tailscaleStore,
			executable: funnelExecutable(import.meta.url),
			stateDirectory: join(remoteDirectory, "tailscale"),
			hostname: `dsh-${instanceId.slice(0, 12)}`,
			createGateway: createRemoteGateway
		}),
		cpolar: new CpolarController({
			store: cpolarStore,
			executable: cpolarComponent.executable,
			configFile: cpolarComponent.configFile,
			region: "cn",
			createGateway: createRemoteGateway
		}),
		frp: new FrpController({
			store: frpStore,
			resolveClient: (kind) => ({ executable: kind === "chmlfrp" ? chmlfrpComponent.executable : frpComponent.executable }),
			config: frpConfig,
			instanceId,
			createGateway: createRemoteGateway
		})
	};
	const remoteProviders = new RemoteProviderCoordinator(initialRemoteProvider, remoteControllers, remoteProviderStore);
	const remoteController = () => remoteProviders.controller();
	for (const provider of [
		"tailscale",
		"cpolar",
		"frp"
	]) {
		const controller = remoteControllers[provider];
		taskEventHub.add({ broadcastTaskEvent: (event) => {
			controller.gateway()?.broadcastTaskEvent(event);
		} });
	}
	const remotePayload = () => remoteControlPayload(remoteProviders.selected, remoteController().status(), remoteController().gateway(), {
		tailscale: remoteControllers.tailscale.status(),
		cpolar: remoteControllers.cpolar.status(),
		frp: remoteControllers.frp.status()
	}, cpolarComponent.status(), frpComponent.status(), frpConfig.status(), chmlfrpComponent.status());
	const lanPayload = () => ({
		running: lanController.isRunning(),
		origin: lanGateway?.address().origin,
		...lanGateway === void 0 ? {} : { extensions: lanGateway.extensionStatus() }
	});
	const diagnosticsPayload = async () => {
		let interfaceName;
		let networkError;
		if (loaded.kind === "managed") try {
			interfaceName = selectLanNetwork(void 0, loaded.setup.networkInterface).name;
		} catch {
			networkError = "network_interface_unavailable";
		}
		const remote = remoteController().status();
		return collectConnectionDiagnostics({
			dshVersion,
			lan: {
				running: lanController.isRunning(),
				...lanGateway === void 0 ? {} : {
					origin: lanGateway.address().origin,
					port: lanGateway.address().port
				},
				...loaded.kind === "managed" ? {
					configuredInterface: loaded.setup.networkInterface,
					port: loaded.setup.listenPort
				} : {},
				...interfaceName === void 0 ? {} : { interfaceName },
				...networkError === void 0 ? {} : { networkError }
			},
			remote: {
				provider: remoteProviders.selected,
				running: remote.enabled,
				state: remote.state,
				...remote.origin === void 0 ? {} : { origin: remote.origin },
				...remote.errorCode === void 0 ? {} : { errorCode: remote.errorCode }
			}
		});
	};
	const adminRoute = {
		kind: "prefix",
		path: LOCAL_ADMIN_PREFIX,
		handler: async (request, response) => {
			try {
				const target = parseRequestTarget(request.url);
				assertLocalAdminTrust(request, request.method === "POST");
				if (target.search !== "") throw new HttpError(400, "bad_request");
				const lanControl = target.decodedPathname === `/api/mobile-access/control` || target.decodedPathname === `/api/mobile-access/lan/control`;
				if (request.method === "GET" && lanControl) {
					sendJson(response, 200, lanPayload(), false);
					return;
				}
				if (request.method === "GET" && target.decodedPathname === `/api/mobile-access/diagnostics`) {
					sendJson(response, 200, await diagnosticsPayload(), false);
					return;
				}
				if (request.method === "GET" && target.decodedPathname === `/api/mobile-access/release`) {
					sendJson(response, 200, await releaseManager.status(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/release/update`) {
					await readJsonObject(request, 4096);
					sendJson(response, 200, await releaseManager.update(), false);
					return;
				}
				if (request.method === "POST" && lanControl) {
					const body = await readJsonObject(request, 4096);
					if (typeof body.running !== "boolean") throw new HttpError(400, "bad_request");
					await lanController.setRunning(body.running);
					sendJson(response, 200, lanPayload(), false);
					return;
				}
				if (request.method === "GET" && target.decodedPathname === `/api/mobile-access/remote/control`) {
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/provider`) {
					const body = await readJsonObject(request, 4096);
					if (body.provider !== "tailscale" && body.provider !== "cpolar" && body.provider !== "frp" && body.provider !== "chmlfrp") throw new HttpError(400, "bad_request");
					await remoteProviders.select(body.provider);
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/chmlfrp/configure`) {
					const body = await readJsonObject(request, 8192);
					const settings = parseChmlFrpIni(body.ini, typeof body.publicOrigin === "string" && body.publicOrigin !== "" ? body.publicOrigin : void 0);
					await remoteProviders.mutate(async () => {
						await frpConfig.configure(settings);
						if (remoteControllers.frp.status().enabled && remoteProviders.selected === "chmlfrp") await remoteControllers.frp.reconnect();
					});
					logger.info("chmlfrp configured host=%s port=%d origin=%s", settings.serverAddress, settings.serverPort, settings.publicOrigin);
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/chmlfrp/component/install`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					logger.info("chmlfrp client install started");
					try {
						await remoteProviders.mutate(async () => chmlfrpComponent.install());
						logger.info("chmlfrp client install completed");
					} catch (error) {
						logger.error("chmlfrp client install failed: %s", error instanceof Error ? error.stack ?? error.message : String(error));
						throw error;
					}
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/chmlfrp/component/purge`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					await remoteProviders.mutate(async () => {
						await chmlfrpComponent.purge();
					});
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/cpolar/component/install`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					await remoteProviders.mutate(async () => cpolarComponent.install());
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/cpolar/configure`) {
					const body = await readJsonObject(request, 4096);
					await remoteProviders.mutate(async () => cpolarComponent.configure(body.authtoken));
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/cpolar/component/purge`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					await remoteProviders.mutate(async () => {
						await remoteControllers.cpolar.setEnabled(false);
						await cpolarComponent.purge();
					});
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/component/install`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					logger.info("frpc component install started");
					try {
						await remoteProviders.mutate(async () => frpComponent.install());
						logger.info("frpc component install completed");
					} catch (error) {
						logger.error("frpc component install failed: %s", error instanceof Error ? error.stack ?? error.message : String(error));
						throw error;
					}
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/configure`) {
					const body = await readJsonObject(request, 4096);
					await remoteProviders.mutate(async () => {
						await frpConfig.configure(body);
						if (remoteControllers.frp.status().enabled) await remoteControllers.frp.reconnect();
					});
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "GET" && target.decodedPathname === `/api/mobile-access/remote/websocket-paths`) {
					sendJson(response, 200, { paths: webSocketPaths.list() }, false);
					return;
				}
				if (request.method === "GET" && target.decodedPathname === `/api/mobile-access/remote/websocket-paths/blocked`) {
					sendJson(response, 200, { blocked: blockedUpgradePaths.report() }, false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/websocket-paths`) {
					const body = await readJsonObject(request, 4096);
					if (!Array.isArray(body.paths)) throw new HttpError(400, "bad_request");
					const paths = await webSocketPaths.replace(body.paths);
					logger.info("websocket upgrade paths updated count=%d paths=%o", paths.length, paths);
					sendJson(response, 200, { paths }, false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/vps/host-keys`) {
					const body = await readJsonObject(request, 8192);
					const serverAddress = typeof body.serverAddress === "string" ? body.serverAddress : "";
					logger.info("vps host keys requested host=%s sshUser=%s sshPort=%d", serverAddress, String(body.sshUser), Number(body.sshPort));
					const hostKeys = await fetchVpsHostKeys(serverAddress, {
						sshUser: body.sshUser,
						sshPort: body.sshPort,
						...body.sshKeyPath === void 0 || body.sshKeyPath === "" ? {} : { sshKeyPath: body.sshKeyPath }
					}, { log(event, fields) {
						logger.info("vps host keys event=%s fields=%o", event, fields);
					} });
					for (const key of hostKeys) logger.info("vps host key host=%s type=%s fingerprint=%s", serverAddress, key.keyType, key.fingerprint);
					sendJson(response, 200, {
						...remotePayload(),
						vpsHostKeys: hostKeys
					}, false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/vps/deploy`) {
					const body = await readJsonObject(request, 8192);
					if (body.confirm !== true) throw new HttpError(400, "bad_request");
					logger.info("vps deploy requested host=%s port=%d sshUser=%s sshPort=%d keyProvided=%s fingerprints=%s", String(body.serverAddress), Number(body.serverPort), String(body.sshUser), Number(body.sshPort), body.sshKeyPath === void 0 ? "false" : "true", Array.isArray(body.hostFingerprints) ? String(body.hostFingerprints.length) : "none");
					const deployment = await remoteProviders.mutate(async () => {
						const settings = mergeSavedFrpSettings(body, frpConfig.selfHostedSettings());
						const result = await deployVps(settings, parseVpsDeploymentInput({
							sshUser: body.sshUser,
							sshPort: body.sshPort,
							...body.sshKeyPath === void 0 ? {} : { sshKeyPath: body.sshKeyPath },
							hostFingerprints: body.hostFingerprints
						}), { log(event, fields) {
							logger.info("vps deploy event=%s fields=%o", event, fields);
						} });
						await frpConfig.configure(settings);
						logger.info("vps deploy completed host=%s origin=%s checks=%d", settings.serverAddress, settings.publicOrigin, result.checks.length);
						return result;
					});
					sendJson(response, 200, {
						...remotePayload(),
						vpsDeployment: deployment
					}, false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/vps/uninstall-script`) {
					const body = await readJsonObject(request, 4096);
					const script = createVpsUninstallScript({
						serverPort: mergeSavedFrpTarget(body, frpConfig.selfHostedSettings()).serverPort,
						...body.certName === void 0 || body.certName === "" ? {} : { certName: body.certName }
					});
					sendJson(response, 200, {
						...remotePayload(),
						vpsUninstallScript: script
					}, false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/vps/uninstall`) {
					const body = await readJsonObject(request, 8192);
					if (body.confirm !== true) throw new HttpError(400, "bad_request");
					logger.info("vps uninstall requested host=%s sshUser=%s sshPort=%d", String(body.serverAddress), String(body.sshUser), Number(body.sshPort));
					const removal = await remoteProviders.mutate(async () => {
						const savedTarget = mergeSavedFrpTarget(body, frpConfig.selfHostedSettings());
						const result = await uninstallVps(savedTarget.serverAddress, {
							serverPort: savedTarget.serverPort,
							...body.certName === void 0 || body.certName === "" ? {} : { certName: body.certName }
						}, parseVpsDeploymentInput({
							sshUser: body.sshUser,
							sshPort: body.sshPort,
							...body.sshKeyPath === void 0 ? {} : { sshKeyPath: body.sshKeyPath },
							hostFingerprints: body.hostFingerprints
						}), { log(event, fields) {
							logger.info("vps uninstall event=%s fields=%o", event, fields);
						} });
						logger.info("vps uninstall completed host=%s checks=%d", result.serverAddress, result.checks.length);
						return result;
					});
					sendJson(response, 200, {
						...remotePayload(),
						vpsUninstall: removal
					}, false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/frp/component/purge`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					await remoteProviders.mutate(async () => {
						await remoteControllers.frp.setEnabled(false);
						await Promise.all([
							frpComponent.purge(),
							chmlfrpComponent.purge(),
							frpConfig.purge()
						]);
					});
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/control`) {
					const running = (await readJsonObject(request, 4096)).running;
					if (typeof running !== "boolean") throw new HttpError(400, "bad_request");
					await remoteProviders.mutate(async (controller) => controller.setEnabled(running));
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/reconnect`) {
					await readJsonObject(request, 4096);
					await remoteProviders.mutate(async (controller) => controller.reconnect());
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (request.method === "POST" && target.decodedPathname === `/api/mobile-access/remote/reset`) {
					if ((await readJsonObject(request, 4096)).confirm !== true) throw new HttpError(400, "bad_request");
					await remoteProviders.mutate(async (controller) => {
						await controller.reset();
						await rm(remoteDeviceFile, { force: true });
					});
					sendJson(response, 200, remotePayload(), false);
					return;
				}
				if (target.decodedPathname.startsWith(`/api/mobile-access/remote/`)) {
					const active = remoteController().gateway();
					if (active === void 0) throw new HttpError(409, "gateway_stopped");
					await active.localAdminRoute(`${LOCAL_ADMIN_PREFIX}/remote`).handler(request, response);
					return;
				}
				if (target.decodedPathname.startsWith(`/api/mobile-access/lan/`)) {
					const active = lanGateway;
					if (active === void 0) throw new HttpError(409, "gateway_stopped");
					await active.localAdminRoute(`${LOCAL_ADMIN_PREFIX}/lan`).handler(request, response);
					return;
				}
				const active = lanGateway;
				if (active === void 0) throw new HttpError(409, "gateway_stopped");
				await active.localAdminRoute().handler(request, response);
			} catch (error) {
				const mapped = mapAdminError(error);
				if (response.headersSent) response.destroy();
				else sendFailure(response, mapped.status, mapped.code, false);
			}
		}
	};
	await ctx.effect(async () => {
		const unregister = ctx.webServer.register(adminRoute);
		const disposeMobileCommand = ctx.commands.register({
			name: "mobile",
			description: "按需求修改 DSH Mobile 的手机端界面或添加电脑端能力",
			input: { hint: "<要做什么>" },
			handler: async ({ agent, rawInput }) => {
				const task = rawInput.trim();
				if (task === "") return {
					kind: "error",
					text: "请带上需求，例如：/mobile 把手机端改成深色主题"
				};
				const guide = buildMobileGuide({
					directory: stateDirectory,
					hasCustomCss: await existsRegularFile(template.customCssFile),
					hasCustomJs: await existsRegularFile(template.customScriptFile),
					extensions: mobileAccess.manifest().map((entry) => ({
						id: entry.id,
						name: entry.name,
						version: entry.version
					})),
					failedExtensionCount: mobileAccess.status().failed
				});
				agent.steer(createUserMessage({
					content: [{
						type: "text",
						text: `${guide}\n\n用户需求：${task}`
					}],
					source: {
						kind: "plugin",
						plugin: "dsh-mobile",
						form: "notice",
						summary: boundContextSummary(`/mobile ${task}`)
					}
				}));
				return {
					kind: "success",
					text: "已把需求交给 DSH 处理，改动会在手机端几秒内生效。"
				};
			}
		});
		try {
			await mobileAccess.startLocal(template.extensionsDir, ctx);
			await lanController.initialize();
			const stores = {
				tailscale: tailscaleStore,
				cpolar: cpolarStore,
				frp: frpStore
			};
			await Promise.all(Object.keys(stores).filter((provider) => provider !== remoteProviders.selected).map((provider) => stores[provider].save({
				version: 1,
				enabled: false
			})));
			for (const provider of [
				"tailscale",
				"cpolar",
				"frp"
			]) await remoteControllers[provider].initialize();
		} catch (error) {
			try {
				await settleCleanupSteps([
					unregister,
					disposeMobileCommand,
					disposeTaskEvents,
					async () => {
						const failures = (await Promise.allSettled(Object.values(remoteControllers).map((controller) => controller.close()))).filter((result) => result.status === "rejected").map((result) => result.reason);
						if (failures.length > 0) throw new AggregateError(failures, "remote provider cleanup failed");
					},
					() => lanController.close(),
					() => mobileAccess.stopLocal(),
					unregisterBuiltin
				]);
			} catch (cleanupError) {
				throw new AggregateError([error, cleanupError], "DSH Mobile initialization and cleanup failed");
			}
			throw error;
		}
		return async () => {
			await settleCleanupSteps([
				unregister,
				disposeMobileCommand,
				disposeTaskEvents,
				async () => {
					const failures = (await Promise.allSettled(Object.values(remoteControllers).map((controller) => controller.close()))).filter((result) => result.status === "rejected").map((result) => result.reason);
					if (failures.length > 0) throw new AggregateError(failures, "remote provider cleanup failed");
				},
				() => lanController.close(),
				() => mobileAccess.stopLocal(),
				unregisterBuiltin
			]);
		};
	}, "dsh-mobile: independent LAN and selectable remote providers with /mobile command");
}
//#endregion
export { AUTH_PREFIX, AccessController, AccessError, BlockedUpgradePathLog, BoundedRateLimiter, CHMLFRP_COMPONENT_RELEASES, CHMLFRP_VERSION, CSRF_COOKIE, CSRF_HEADER, Config, FRP_VHOST_HTTP_PORT as DEFAULT_VHOST_HTTP_PORT, FRP_VHOST_HTTP_PORT, DEVICE_COOKIE, EXTENSION_LIMITS, FRP_CADDY_IMPORT_LINE, FRP_CADDY_SNIPPET_MARKER, FRP_CADDY_SNIPPET_PATH, FRP_COMPONENT_RELEASES, FrpComponentManager, FrpConfigStore, FrpController, JsonDeviceStore, JsonMobileAccessControlStore, JsonRemoteProviderStore, LOCAL_ADMIN_PREFIX, MAX_BLOCKED_UPGRADE_PATHS, MAX_EXTRA_WEBSOCKET_PATHS, MAX_WEBSOCKET_PATH_LENGTH, MemoryDeviceStore, MobileAccessGateway, MobileAccessGatewayController, MobileAccessService, MobileExtensionError, RequestTrustPolicy, SESSION_COOKIE, TASK_EVENT_DEBOUNCE_MS, TaskEventHub, WS_PATHS, WebSocketPathStore, addressAllowed, apply, assertExtensionId, bindChmlFrpIniLocalPort, configuredRemoteProvider, createCaddySite, createChmlFrpIni, createFrpServerTemplate, createFrpcToml, createMobileAccessService, createRestrictedFrpServerTemplate, inject, isGloballyRoutableIpv4, isLoopbackAddress, mergeSavedChmlFrpSettings, mergeSavedFrpSettings, mergeSavedFrpTarget, name, normalizeWebSocketPaths, parseAuthority, parseChmlFrpIni, parseChmlFrpSettings, parseCidr, parseControlFile, parseDeviceSnapshot, parseExtensionManifest, parseFrpSettings, parseFrpTransportSettings, parseGatewayConfig, parseMobileAccessControlState, parseRemoteProviderState, resolveAuthority, rewriteMobileIndex, validateChmlFrpUser, validateFrpPublicOrigin, validateFrpServerAddress, validateFrpServerPort, validateFrpToken, validateWebSocketPath, watchTaskCompletions };

//# sourceMappingURL=index.mjs.map
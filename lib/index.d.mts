import z from "@deepseek-ai/schemastery";
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { Readable } from "node:stream";
import { Context, Service } from "@deepseek-ai/cordis";
import { WebRoute } from "@deepseek-ai/dsh-host-webserver";
//#region src/storage.d.ts
/** Persistent record containing only a digest of the long-lived device credential. */
interface StoredDevice {
  readonly id: string;
  readonly label: string;
  readonly tokenDigest: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly lastSeenAt: number;
  readonly revokedAt?: number;
}
/** Versioned device state. Raw device and Session credentials are never members. */
interface DeviceSnapshot {
  readonly version: 1;
  readonly devices: readonly StoredDevice[];
}
/** Persistence seam for device-token digests and revocation metadata. */
interface DeviceStore {
  load(): Promise<DeviceSnapshot>;
  save(snapshot: DeviceSnapshot): Promise<void>;
}
/** Validate durable data before it can authorize a device. */
declare function parseDeviceSnapshot(value: unknown, maximumDevices?: number): DeviceSnapshot;
/** Atomic JSON implementation with symlink refusal and owner-only file creation. */
declare class JsonDeviceStore implements DeviceStore {
  private readonly file;
  private readonly maximumDevices;
  constructor(file: string, maximumDevices?: number);
  load(): Promise<DeviceSnapshot>;
  save(snapshot: DeviceSnapshot): Promise<void>;
}
/** In-memory store useful for embedding and deterministic tests. */
declare class MemoryDeviceStore implements DeviceStore {
  private snapshot;
  constructor(initial?: DeviceSnapshot);
  load(): Promise<DeviceSnapshot>;
  save(snapshot: DeviceSnapshot): Promise<void>;
  /** Return a defensive copy for assertions or administrative export. */
  inspect(): DeviceSnapshot;
}
//#endregion
//#region src/access.d.ts
/** Stable error categories converted to deliberately terse HTTP responses. */
declare class AccessError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string);
}
/** Resource and lifetime controls for device authentication. */
interface AccessControllerOptions {
  readonly pairingTtlMs: number;
  readonly deviceTtlMs: number;
  readonly sessionTtlMs: number;
  readonly maxDevices: number;
  readonly maxSessions: number;
  readonly rateLimitWindowMs: number;
  readonly maxPairingAttempts: number;
  readonly maxRateLimitKeys: number;
  readonly now?: () => number;
}
/** Values issued once after pairing; only digests survive the response. */
interface PairingResult {
  readonly deviceId: string;
  readonly deviceToken: string;
  readonly deviceExpiresAt: number;
  readonly sessionToken: string;
  readonly csrfToken: string;
  readonly sessionExpiresAt: number;
}
/** Values issued after renewal with the persistent HttpOnly device Cookie. */
interface RenewalResult {
  readonly deviceId: string;
  readonly sessionToken: string;
  readonly csrfToken: string;
  readonly sessionExpiresAt: number;
}
/** Authenticated Session identity retained only inside the gateway. */
interface SessionAuthorization {
  readonly sessionKey: string;
  readonly deviceId: string;
  readonly expiresAt: number;
}
/** Safe device metadata returned by the loopback administration API. */
interface DeviceSummary {
  readonly id: string;
  readonly label: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly lastSeenAt: number;
  readonly revokedAt?: number;
}
/** Fixed-window limiter whose attacker-controlled key table is itself bounded. */
declare class BoundedRateLimiter {
  private readonly limit;
  private readonly windowMs;
  private readonly maximumKeys;
  private readonly buckets;
  constructor(limit: number, windowMs: number, maximumKeys: number);
  /** Consume one attempt; unknown keys fail closed when the bounded table is full. */
  take(key: string, now: number): boolean;
  /** Current table size, exposed for bounded-state assertions. */
  get size(): number;
}
/** Pairing, persistent-device, short-Session, revocation, and CSRF state machine. */
declare class AccessController {
  private readonly store;
  private readonly options;
  private readonly now;
  private readonly pairLimiter;
  private devices;
  private pairingWindow;
  private readonly sessions;
  private readonly sessionEndedListeners;
  private mutation;
  private initialized;
  private closing;
  private closeTask;
  constructor(store: DeviceStore, options: AccessControllerOptions);
  /** Load and validate digest-only durable state before accepting traffic. */
  initialize(): Promise<void>;
  private requireInitialized;
  private exclusive;
  private snapshot;
  private emitSessionEnded;
  private removeSession;
  private pruneSessions;
  private createSession;
  /** Open one short pairing window and return its one-time secret to a loopback caller only. */
  openPairing(requestedTtlMs?: number): Promise<{
    token: string;
    expiresAt: number;
  }>;
  /** Consume the pairing window exactly once and persist only the device-token digest. */
  pair(sourceKey: string, token: string, label?: string): Promise<PairingResult>;
  /** Exchange a valid persistent device credential for a new short Session. */
  renew(deviceToken: string): Promise<RenewalResult>;
  /** Resolve a short Session Cookie without revealing whether device or Session failed. */
  authorizeSession(sessionToken: string): SessionAuthorization;
  /** Require the Session-bound anti-CSRF value for an authenticated mutation. */
  assertCsrf(authorization: SessionAuthorization, csrfToken: string | undefined): void;
  /** End one short Session and notify the gateway to abort its attached work. */
  logout(authorization: SessionAuthorization): void;
  /** Persist revocation, then end every Session owned by that device. */
  revokeDevice(deviceId: string): Promise<boolean>;
  /** Remove every persistent credential and terminate every active Session. */
  resetDevices(): Promise<void>;
  /** Safe metadata for the loopback administration surface. */
  listDevices(): readonly DeviceSummary[];
  /** Pairing status without exposing the one-time secret. */
  pairingStatus(): {
    open: boolean;
    expiresAt?: number;
  };
  /** Subscribe gateway resources to Session logout, expiry, eviction, and device revocation. */
  onSessionEnded(listener: (authorization: SessionAuthorization) => void): () => void;
  /** Stop new operations, drain durable mutations, then clear volatile credentials. */
  close(): Promise<void>;
  private finishClose;
  /** Bounded volatile-state metrics for tests and local status. */
  metrics(): {
    sessions: number;
    rateLimitKeys: number;
  };
}
//#endregion
//#region src/network.d.ts
/** A parsed IP network used to authorize directly connected clients. */
interface ParsedCidr {
  readonly bits: 32 | 128;
  readonly network: bigint;
  readonly prefix: number;
  readonly source: string;
}
/** A normalized public authority. A missing port is filled from the bound listener. */
interface AuthoritySpec {
  readonly hostname: string;
  readonly port?: number;
}
/** Parse and canonicalize one IPv4 or IPv6 CIDR. */
declare function parseCidr(source: string): ParsedCidr;
/** Whether a directly connected socket address belongs to at least one allowed CIDR. */
declare function addressAllowed(address: string | undefined, cidrs: readonly ParsedCidr[]): boolean;
/** Whether an IP literal is loopback and therefore eligible for HTTP-only development. */
declare function isLoopbackAddress(address: string): boolean;
/**
 * Whether a dotted-quad IPv4 literal is globally routable and therefore usable
 * as a public VPS / remote HTTPS endpoint. Rejects documentation addresses such
 * as 203.0.113.10 alongside private, shared, and reserved space.
 */
declare function isGloballyRoutableIpv4(address: string): boolean;
/** Parse a bare host or host:port authority without accepting URL components. */
declare function parseAuthority(source: string): AuthoritySpec;
/** Resolve an authority against the actual listener port. */
declare function resolveAuthority(spec: AuthoritySpec, listenerPort: number): string;
/** Exact Host/Origin/CIDR policy for the directly exposed listener. */
declare class RequestTrustPolicy {
  readonly cidrs: readonly ParsedCidr[];
  readonly authorities: ReadonlySet<string>;
  readonly origins: ReadonlySet<string>;
  private readonly scheme;
  constructor(specs: readonly AuthoritySpec[], listenerPort: number, cidrs: readonly ParsedCidr[], tls: boolean);
  /** Validate the exact Host header after WHATWG authority normalization. */
  acceptsHost(header: string | undefined): boolean;
  /** Return the canonical accepted Host authority, otherwise undefined. */
  canonicalHost(header: string | undefined): string | undefined;
  /** Validate an exact same-scheme browser Origin. */
  acceptsOrigin(header: string | undefined): boolean;
  /** Return the canonical accepted Origin, otherwise undefined. */
  canonicalOrigin(header: string | undefined): string | undefined;
}
//#endregion
//#region src/config.d.ts
/** TLS source accepted by the LAN listener. */
interface ProvidedTlsConfig {
  readonly mode: 'provided';
  /** PEM server leaf followed by any intermediate certificate chain. */
  readonly certFile: string;
  readonly keyFile: string;
  /** Optional PEM intermediates appended after the chain in `certFile`; roots are rejected. */
  readonly caFile?: string;
}
/** HTTP is available only for an explicitly loopback-bound listener. */
interface DisabledTlsConfig {
  readonly mode: 'disabled';
}
type TlsConfig = ProvidedTlsConfig | DisabledTlsConfig;
/** Operator-facing plugin configuration. */
interface PluginConfig {
  /** Optional setup JSON written by the packaged CLI. */
  setupFile?: string;
  /** Preferred HTTPS origin used to derive the public authority and listener port. */
  publicOrigin?: string;
  listenHost?: string;
  listenPort?: number;
  upstreamOrigin?: string;
  publicAuthorities?: string[];
  allowedCidrs?: string[];
  stateFile: string;
  /** Internal persisted on/off preference managed by the DSH plugin card. */
  controlFile: string;
  /** Optional user stylesheet served to the authenticated mobile UI. */
  customCssFile?: string;
  /** Optional user script that mounts authenticated mobile-only Web features. */
  customScriptFile?: string;
  /** Internal dedicated mobile layout browser bundle. */
  mobileLayoutFile?: string;
  /** Stable public discovery identifier; it is not an authentication secret. */
  instanceId?: string;
  /** Managed CA certificate offered to the Android installer after fingerprint binding. */
  pairingCaFile?: string;
  /** First-run state used only while the control file does not exist. */
  initiallyEnabled: boolean;
  tls?: {
    mode?: 'provided' | 'disabled';
    certFile?: string;
    keyFile?: string;
    caFile?: string;
  };
  pairingTtlMs?: number;
  deviceTtlMs?: number;
  sessionTtlMs?: number;
  maxDevices?: number;
  maxSessions?: number;
  maxConnections?: number;
  maxActiveRequests?: number;
  maxWebSockets?: number;
  maxBodyBytes?: number;
  upstreamTimeoutMs?: number;
  rateLimitWindowMs?: number;
  maxPairingAttempts?: number;
  maxRateLimitKeys?: number;
}
/** Resolved, validated security and resource limits. */
interface ResolvedGatewayConfig {
  readonly listenHost: string;
  readonly listenPort: number;
  readonly upstreamOrigin: URL;
  readonly authorities: readonly AuthoritySpec[];
  readonly allowedCidrs: readonly ParsedCidr[];
  readonly stateFile: string;
  /** Local extension root adjacent to the mobile-access state file. */
  readonly extensionsDir: string;
  readonly customCssFile: string;
  readonly customScriptFile: string;
  readonly mobileLayoutFile: string;
  readonly instanceId: string;
  readonly pairingCaFile?: string;
  readonly tls: TlsConfig;
  /** Whether the public hop is HTTPS, even when a trusted loopback proxy terminates TLS. */
  readonly publicTls: boolean;
  /** LAN discovery is disabled for private proxy listeners such as Funnel ingress. */
  readonly discovery: boolean;
  readonly pairingTtlMs: number;
  readonly deviceTtlMs: number;
  readonly sessionTtlMs: number;
  readonly maxDevices: number;
  readonly maxSessions: number;
  readonly maxConnections: number;
  readonly maxActiveRequests: number;
  readonly maxWebSockets: number;
  readonly maxBodyBytes: number;
  readonly upstreamTimeoutMs: number;
  readonly rateLimitWindowMs: number;
  readonly maxPairingAttempts: number;
  readonly maxRateLimitKeys: number;
}
/** Loader-facing defaults; {@link parseGatewayConfig} enforces cross-field security rules. */
declare const Config: z<PluginConfig>;
/** Resolve the hidden runtime-control file independently from gateway configuration. */
declare function parseControlFile(value: unknown): string;
/** Parse configuration and reject unsafe topology, credential, and resource combinations. */
declare function parseGatewayConfig(raw: unknown): ResolvedGatewayConfig;
//#endregion
//#region src/control.d.ts
/** Versioned durable preference for the resident mobile-access runtime. */
interface MobileAccessControlState {
  readonly version: 1;
  readonly enabled: boolean;
}
/** Persistence seam for the runtime preference. */
interface MobileAccessControlStore {
  load(): Promise<MobileAccessControlState>;
  save(state: MobileAccessControlState): Promise<void>;
}
/** One started gateway runtime owned by the controller. */
interface MobileAccessRuntime {
  close(): Promise<void>;
}
/** Validate control state loaded across the filesystem boundary. */
declare function parseMobileAccessControlState(value: unknown): MobileAccessControlState;
/** Atomic JSON store whose absent-file state comes from the installation-time default. */
declare class JsonMobileAccessControlStore implements MobileAccessControlStore {
  private readonly file;
  private readonly initiallyEnabled;
  constructor(file: string, initiallyEnabled: boolean);
  load(): Promise<MobileAccessControlState>;
  save(state: MobileAccessControlState): Promise<void>;
}
/** Serialized persistent lifecycle for the gateway behind the always-loaded Cordis entry. */
declare class MobileAccessGatewayController {
  private readonly store;
  private readonly startRuntime;
  private runtime;
  private initialized;
  private closing;
  private queue;
  private closeTask;
  constructor(store: MobileAccessControlStore, startRuntime: () => Promise<MobileAccessRuntime>);
  /** Load the durable preference and start the first runtime when enabled. */
  initialize(): Promise<void>;
  /** Return the committed in-process runtime state. */
  isRunning(): boolean;
  /** Start or stop the runtime and persist only a successfully committed transition. */
  setRunning(running: boolean): Promise<void>;
  /** Stop the runtime after earlier transitions without changing the restart preference. */
  close(): Promise<void>;
  private enable;
  private disable;
  private enqueue;
}
//#endregion
//#region src/websocket-paths.d.ts
/** Cap the admin-approved extra WebSocket upgrade paths (exact pathnames). */
declare const MAX_EXTRA_WEBSOCKET_PATHS = 16;
declare const MAX_WEBSOCKET_PATH_LENGTH = 256;
/**
 * Validate one exact pathname for proxying. Query strings are matched at
 * upgrade time, so only the pathname is stored. Rejects anything the
 * gateway cannot match exactly.
 */
declare function validateWebSocketPath(value: unknown): string;
/** Validate a whole replacement list all-or-nothing; duplicates collapse. */
declare function normalizeWebSocketPaths(value: unknown): string[];
/** Cap remembered rejected upgrade paths offered for one-click approval. */
declare const MAX_BLOCKED_UPGRADE_PATHS = 32;
interface BlockedUpgradePathEntry {
  readonly path: string;
  readonly attempts: number;
  readonly firstSeen: number;
  readonly lastSeen: number;
}
/**
 * In-memory log of rejected third-party upgrade paths, shared by every
 * gateway instance so the approval UI sees attempts on any listener.
 * Bounded and newest-first; a restart clears it (attempts reappear on
 * the next blocked handshake).
 */
declare class BlockedUpgradePathLog {
  private readonly entries;
  record(pathname: string): void;
  report(): BlockedUpgradePathEntry[];
}
/** File-backed store shared by every gateway instance (LAN and remote). */
declare class WebSocketPathStore {
  private readonly file;
  private paths;
  private loaded;
  constructor(file: string);
  /** Snapshot for the upgrade check. */
  has(pathname: string): boolean;
  list(): string[];
  load(): Promise<string[]>;
  /** Replace the whole list after validating; persists atomically. */
  replace(paths: readonly string[]): Promise<string[]>;
}
//#endregion
//#region src/extensions.d.ts
/** Maximum sizes enforced at the local-extension filesystem boundary. */
declare const EXTENSION_LIMITS: Readonly<{
  manifest: number;
  script: number;
  css: number;
  asset: number;
  assetFiles: 256;
  assetBytes: number;
  assetDepth: 8;
}>;
/** A controlled business failure returned by an extension action or route. */
declare class MobileExtensionError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status?: number);
}
/** One host-side action exposed by an extension. */
interface MobileHostAction {
  readonly input?: {
    parse(value: unknown): unknown;
  };
  readonly run: (context: MobileActionContext, input: unknown) => unknown | Promise<unknown>;
}
/** Context supplied to a host action. */
interface MobileActionContext {
  readonly signal: AbortSignal;
  readonly deviceId: string;
}
/** Safe request values supplied to a host route. */
interface MobileRouteRequest {
  readonly method: string;
  readonly pathname: string;
  readonly query: Readonly<URLSearchParams>;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Uint8Array;
  readonly signal: AbortSignal;
  readonly deviceId: string;
}
/** Values an extension route may return; status is a final HTTP code from 200 through 599. */
interface MobileRouteResponse {
  readonly status?: number;
  readonly contentType?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body: string | Uint8Array | Readable;
}
/** One host-side route exposed by an extension. */
interface MobileHostRoute {
  readonly method: string;
  readonly path: string;
  readonly kind?: 'exact' | 'prefix';
  readonly handle: (request: MobileRouteRequest) => MobileRouteResponse | Promise<MobileRouteResponse>;
}
/** Metadata shared by local and npm-provided extensions. */
interface MobileExtensionManifest {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}
/** Definition registered by a normal Cordis plugin. */
interface MobileExtensionDefinition extends MobileExtensionManifest {
  readonly actions?: Readonly<Record<string, MobileHostAction>>;
  readonly routes?: readonly MobileHostRoute[];
}
declare module '@deepseek-ai/cordis' {
  interface Context {
    mobileAccess: MobileAccessService;
  }
}
/** A local extension manifest read from extension.json. */
interface LocalExtensionManifest extends MobileExtensionManifest {}
/** Public snapshot sent to the mobile browser. */
interface MobileExtensionClientEntry extends MobileExtensionManifest {
  readonly generation?: string;
  readonly scriptUrl?: string;
  readonly styleUrl?: string;
  readonly assetsUrl?: string;
}
interface LocalAssetSnapshot {
  readonly body: Buffer;
  readonly digest: string;
  readonly name: string;
}
/** Small status summary used by the desktop mobile-access card. */
interface MobileExtensionStatus {
  readonly loaded: number;
  readonly failed: number;
}
interface ActiveLocalExtension {
  readonly manifest: LocalExtensionManifest;
  readonly directory: string;
  readonly scriptBody?: Buffer;
  readonly styleBody?: Buffer;
  readonly assets: ReadonlyMap<string, LocalAssetSnapshot>;
  readonly host: MobileExtensionDefinition;
  readonly controller: AbortController;
  readonly cleanups: readonly (() => void | Promise<void>)[];
  readonly digest: string;
}
/** Validate a stable extension id. */
declare function assertExtensionId(value: unknown): string;
/** Validate a manifest from JSON or a plugin definition. */
declare function parseExtensionManifest(value: unknown): LocalExtensionManifest;
/** Host registry and service consumed by both npm plugins and local extensions. */
declare class MobileAccessService extends Service {
  private readonly registered;
  private readonly local;
  private readonly retired;
  private readonly failures;
  private readonly contentListeners;
  private contentHash;
  private localRoot;
  private localContext;
  private localTimer;
  private localRefreshing;
  private localRefreshAbort;
  private localLifecycle;
  private localClosed;
  constructor(ctx: Context);
  /** Register a normal Cordis extension and return an idempotent disposer. */
  registerExtension(definition: MobileExtensionDefinition): () => void;
  /** Aggregate digest covering every registered and active local extension. */
  contentDigest(): string;
  /** Subscribe to committed extension generation changes. */
  onContentChanged(listener: () => void): () => void;
  private updateContentHash;
  /** Return the current client-facing manifest, deterministically sorted by id. */
  manifest(): readonly MobileExtensionClientEntry[];
  /** Return loaded and failed local extension counts without exposing host errors. */
  status(): MobileExtensionStatus;
  /** Locate one active extension. */
  extension(id: string, generation?: string): MobileExtensionDefinition | ActiveLocalExtension | undefined;
  /** Return the active local generation signal for gateway cancellation wiring. */
  signal(id: string, generation?: string): AbortSignal | undefined;
  /** Read a local client entry after validating that it remains inside its directory. */
  readClientFile(id: string, kind: 'script' | 'style', signal?: AbortSignal, generation?: string): Promise<{
    readonly body: Buffer;
    readonly digest: string;
  }>;
  /** Read a generation-pinned static asset from its validated snapshot. */
  readAsset(id: string, assetPath: string, signal?: AbortSignal, generation?: string): Promise<{
    readonly body: Buffer;
    readonly digest: string;
    readonly name: string;
  }>;
  /** Invoke one action after parsing its input and binding the request lifetime. */
  invoke(id: string, actionName: string, input: unknown, context: MobileActionContext, generation?: string): Promise<unknown>;
  /** Match one route and invoke it with a generation-bound abort signal. */
  route(id: string, method: string, pathname: string, request: MobileRouteRequest, generation?: string): Promise<MobileRouteResponse>;
  /** Start the local directory watcher; an absent directory is intentionally inert. */
  startLocal(root: string, context: Context): Promise<void>;
  /** Stop the watcher and abort every local host generation. */
  stopLocal(): Promise<void>;
  /** Refresh all local extensions atomically; failures keep the previous snapshot. */
  refreshLocal(): Promise<void>;
  private stageAndCommit;
  private retire;
}
/** Construct the service in a Cordis plugin without importing DSH internals. */
declare function createMobileAccessService(ctx: Context): MobileAccessService;
//#endregion
//#region src/gateway.d.ts
/** Replace only DSH's layout client module while retaining its complete plugin graph. */
declare function rewriteMobileIndex(html: string): string;
/** Authenticated TLS edge in front of the ordinary loopback-only DSH Web server. */
declare class MobileAccessGateway {
  readonly config: ResolvedGatewayConfig;
  private readonly extensions?;
  private readonly upstreamAuthenticatedUrl?;
  private readonly extraWebSocketPaths?;
  private readonly blockedUpgradeLog?;
  readonly access: AccessController;
  private readonly listenerTlsEnabled;
  private readonly tlsEnabled;
  private policy;
  private server;
  private discoverySocket;
  private discoveryTimer;
  private bonjour;
  private pairingCaCertificate;
  private listenerPort;
  private readonly connectedSockets;
  private readonly activeRequests;
  private readonly activeWebSockets;
  private readonly mobileBootBatches;
  private readonly extensionEventListeners;
  private extensionEventRevision;
  private readonly taskEventListeners;
  private extensionChangeTimer;
  private extensionChangeTask;
  private legacyCustomDigest;
  private upstreamCookie;
  private upstreamCookieExpiresAt;
  private upstreamCookieTask;
  private upstreamAuthRequest;
  private nextOperationId;
  private closing;
  private started;
  private closeTask;
  private readonly removeSessionListener;
  private readonly removeExtensionContentListener;
  private readonly renewLimiter;
  constructor(config: ResolvedGatewayConfig, store: DeviceStore, extensions?: MobileAccessService | undefined, upstreamAuthenticatedUrl?: string | undefined, extraWebSocketPaths?: {
    has(pathname: string): boolean;
  } | undefined, blockedUpgradeLog?: BlockedUpgradePathLog | undefined);
  /** Initialize durable state, validate TLS, and bind the externally reachable listener. */
  start(): Promise<void>;
  private startDiscovery;
  private discoveryAnnouncement;
  private closeFailedStart;
  private closeBonjour;
  /** Actual bound address, available after start and safe for loopback status output. */
  address(): {
    host: string;
    port: number;
    origin: string;
  };
  private requirePolicy;
  private authorize;
  private requireCsrf;
  private setSessionCookies;
  private handlePair;
  private handleRenew;
  private handleNativePair;
  private handleNativeRenew;
  private handleLogout;
  private handleExternalRequest;
  private handleExtensionRequest;
  private sendExtensionResponse;
  /** Exchange DSH's process-local launch token for an authority-bound cookie kept inside this gateway. */
  private upstreamCookieHeader;
  private exchangeUpstreamCookie;
  private proxyMobileIndex;
  private rememberMobileBootBatch;
  private serveMobileBootBatch;
  private startMobileBootBatchAssembly;
  private assembleMobileBootBatch;
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
  private readUpstreamClientBundleWithRetry;
  private readUpstreamClientBundle;
  private allocateRequest;
  private proxyHttp;
  private abortSessionResources;
  private broadcastExtensionChange;
  /** Fan a completed task to every phone holding this gateway's event stream. */
  broadcastTaskEvent(event: {
    readonly sessionId: string;
    readonly turn: number;
  }): void;
  private pollLegacyCustomChanges;
  private openExtensionEventStream;
  private readUpgradeResponse;
  /** Snapshot of rejected upgrade paths for the approval UI (newest first). */
  blockedUpgradePathReport(): BlockedUpgradePathEntry[];
  private handleUpgrade;
  /** Loopback-only DSH WebServer route for opening pairing and managing devices. */
  localAdminRoute(prefix?: string): WebRoute;
  /** Close listeners and abort all accepted work before resolving teardown. */
  close(): Promise<void>;
  private performClose;
  /** Safe metadata helper for direct loopback integrations. */
  devices(): readonly DeviceSummary[];
  /** Status shown by the loopback mobile-access control card. */
  extensionStatus(): {
    readonly loaded: number;
    readonly failed: number;
  };
}
//#endregion
//#region src/http-security.d.ts
declare const DEVICE_COOKIE = "dsh_ma_device";
declare const SESSION_COOKIE = "dsh_ma_session";
declare const CSRF_COOKIE = "dsh_ma_csrf";
declare const CSRF_HEADER = "x-dsh-mobile-csrf";
declare const LOCAL_ADMIN_PREFIX = "/api/mobile-access";
declare const AUTH_PREFIX = "/mobile-access";
declare const WS_PATHS: Set<string>;
//#endregion
//#region src/frp-component.d.ts
/** ChmlFrp ships a forked frp 0.51.2; its client reports this exact string for --version. */
declare const CHMLFRP_VERSION = "ChmlFrp-0.51.2_251023";
/** Which FRP client family a managed component owns. */
type FrpComponentVariant = 'self-hosted' | 'chmlfrp';
interface FrpArtifact {
  readonly platform: NodeJS.Platform;
  readonly arch: string;
  readonly downloadUrl: string;
  readonly downloadBytes: number;
  readonly downloadSha256: string;
  readonly archiveName: string;
  readonly executableName: string;
  /** Hosts allowed as the final redirect target. */
  readonly allowedDownloadHosts: readonly string[];
  /** Some provider archives place the executable at the archive root. */
  readonly nestedExecutable: boolean;
}
/** Pinned official FRP release metadata for supported desktop targets. */
declare const FRP_COMPONENT_RELEASES: Readonly<Record<string, FrpArtifact>>;
/** Pinned ChmlFrp client release metadata for supported desktop targets. */
declare const CHMLFRP_COMPONENT_RELEASES: Readonly<Record<string, FrpArtifact>>;
/** Public, credential-free description of the managed FRP client. */
interface FrpComponentStatus {
  readonly variant: FrpComponentVariant;
  readonly supported: boolean;
  readonly installed: boolean;
  readonly version: string;
  readonly downloadBytes: number;
  readonly installedBytes: number;
  readonly sourceUrl: string;
  readonly releasePage: string;
  readonly storagePath: string;
  readonly errorCode?: string;
}
interface FrpComponentManagerOptions {
  readonly stateDirectory: string;
  readonly variant?: FrpComponentVariant;
  readonly platform?: NodeJS.Platform;
  readonly arch?: string;
  readonly fetchArtifact?: (artifact: FrpArtifact, signal: AbortSignal) => Promise<Uint8Array>;
  readonly extractArtifact?: (archive: string, destination: string, executableName: string) => Promise<void>;
  readonly inspectExecutable?: (executable: string) => Promise<string>;
}
/** Owns one optional FRP client binary inside the DSH Mobile state directory. */
declare class FrpComponentManager {
  readonly executable: string;
  readonly componentRoot: string;
  readonly componentStorage: string;
  readonly logRoot: string;
  readonly variant: FrpComponentVariant;
  private readonly profile;
  private readonly stagingRoot;
  private readonly artifact;
  private readonly fetchArtifact;
  private readonly extractArtifact;
  private readonly inspectExecutable;
  private installed;
  private installedBytes;
  private errorCode;
  private queue;
  constructor(options: FrpComponentManagerOptions);
  /** Inspect the managed executable without relying on global FRP installations. */
  initialize(): Promise<void>;
  /** Return component metadata without exposing configuration or credentials. */
  status(): FrpComponentStatus;
  /** Download, verify, and extract only the client after explicit confirmation. */
  install(): Promise<FrpComponentStatus>;
  /** Remove this variant's executable plus its staging files. */
  purge(): Promise<FrpComponentStatus>;
  private enqueue;
}
//#endregion
//#region src/frp-template.d.ts
/** Loopback-only HTTP vhost port used between Caddy and frps. */
declare const FRP_VHOST_HTTP_PORT = 7080;
/** Caddy snippet owned entirely by DSH Mobile; the main Caddyfile only imports it. */
declare const FRP_CADDY_SNIPPET_PATH = "/etc/caddy/dsh-mobile-dsh.caddy";
/** First line of the owned snippet; also the legacy whole-file marker. */
declare const FRP_CADDY_SNIPPET_MARKER = "# Managed by DSH Mobile - snippet, safe to delete";
/** Exact line the main Caddyfile must contain (uncommented) for the site to load. */
declare const FRP_CADDY_IMPORT_LINE = "import /etc/caddy/dsh-mobile-dsh.caddy";
/** Build the Caddy site for one public host (without markers or import wiring). */
declare function createCaddySite(publicHost: string, certDir?: string): string;
/** Build the only supported frps config and Caddy snippet from validated user inputs. */
declare function createRestrictedFrpServerTemplate(serverPort: number, token: string, publicOrigin: string): string;
//#endregion
//#region src/frp-config.d.ts
/**
 * Credentials and endpoints required by the restricted FRP provider.
 *
 * `kind` selects the transport dialect:
 *  - `self-hosted` addresses a private frps deployed by DSH Mobile (TOML, vhost + Caddy).
 *  - `chmlfrp` addresses the ChmlFrp shared platform, which runs a forked frps and a
 *    custom client that consumes the classic INI layout and authenticates with `user`
 *    (the per-tunnel account id) plus the shared platform `token`.
 */
interface FrpSettings {
  readonly version: 1;
  readonly kind: 'self-hosted';
  readonly serverAddress: string;
  readonly serverPort: number;
  readonly token: string;
  readonly publicOrigin: string;
}
/** ChmlFrp credentials copied from the panel's generated frpc.ini `[common]` block. */
interface ChmlFrpSettings {
  readonly version: 1;
  readonly kind: 'chmlfrp';
  readonly serverAddress: string;
  readonly serverPort: number;
  /** Per-user tunnel credential sent as `user` in the INI. */
  readonly user: string;
  readonly token: string;
  readonly publicOrigin: string;
}
/** Any settings the FRP provider can run. */
type FrpTransportSettings = FrpSettings | ChmlFrpSettings;
/** Safe FRP configuration fields returned to the desktop UI. */
interface FrpConfigurationStatus {
  readonly configured: boolean;
  readonly kind?: 'self-hosted' | 'chmlfrp';
  readonly serverAddress?: string;
  readonly serverPort?: number;
  readonly publicOrigin?: string;
  readonly vhostHttpPort: number;
  readonly storagePath: string;
  readonly errorCode?: string;
}
/** Validate the FRP server hostname or IP address. */
declare function validateFrpServerAddress(value: unknown): string;
/** Validate the FRP control port. */
declare function validateFrpServerPort(value: unknown): number;
/**
 * Validate a high-entropy FRP token before durable storage.
 *
 * The self-hosted frps token must stay high entropy (>= 16 chars). ChmlFrp uses a
 * fixed platform-wide shared literal, so that transport passes a lower minimum.
 */
declare function validateFrpToken(value: unknown, minimumLength?: number): string;
/**
 * Validate the ChmlFrp per-tunnel `user` credential. The panel issues an opaque
 * 24-character alphanumeric id; accept a conservative superset so panel changes
 * do not break pairing while still rejecting anything shell- or INI-unsafe.
 */
declare function validateChmlFrpUser(value: unknown): string;
/**
 * Validate the public HTTPS origin used for pairing.
 *
 * A self-hosted VPS terminates TLS on 443 through Caddy, so a port is rejected.
 * ChmlFrp maps the custom domain on its own edge and only ever exposes 443, but
 * the settings may carry an explicit port from a future platform change, so the
 * `allowPort` switch lets that transport opt in without weakening the VPS rule.
 */
declare function validateFrpPublicOrigin(value: unknown, allowPort?: boolean): string;
/** Parse self-hosted FRP settings at the loopback request and filesystem boundaries. */
declare function parseFrpSettings(value: unknown): FrpSettings;
/** Parse ChmlFrp settings copied from the panel-generated frpc.ini. */
declare function parseChmlFrpSettings(value: unknown): ChmlFrpSettings;
/** Parse either supported FRP transport, dispatching on `kind`. */
declare function parseFrpTransportSettings(value: unknown): FrpTransportSettings;
/**
 * Merge a partial VPS request body with the saved configuration so a blank
 * field keeps its saved value ("已保存时可留空"). Every merged field is still
 * validated; with nothing saved and nothing supplied the result reports a
 * missing configuration instead of silently deploying blanks.
 */
declare function mergeSavedFrpSettings(partial: Readonly<Record<string, unknown>>, saved: FrpSettings | undefined): FrpSettings;
/** Merge a VPS target (address and control port) with the saved configuration. */
declare function mergeSavedFrpTarget(partial: Readonly<Record<string, unknown>>, saved: FrpSettings | undefined): {
  readonly serverAddress: string;
  readonly serverPort: number;
};
/**
 * Merge a partial ChmlFrp request body with the saved settings so a blank field
 * keeps its saved value. ChmlFrp has no VPS deployment step, so this is the only
 * write path for that transport.
 */
declare function mergeSavedChmlFrpSettings(partial: Readonly<Record<string, unknown>>, saved: ChmlFrpSettings | undefined): ChmlFrpSettings;
/** Build the single-purpose frpc configuration for the current loopback gateway. */
declare function createFrpcToml(settings: FrpSettings, localPort: number): string;
/** Build the matching restricted frps and Caddy templates for one VPS. */
declare function createFrpServerTemplate(settings: FrpSettings): string;
/**
 * Override `local_port` in a ChmlFrp INI with the port the gateway actually bound.
 * The gateway picks an ephemeral port, so the panel's fixed `内网端口` cannot be
 * used verbatim; every other line the panel generated is preserved untouched.
 */
declare function bindChmlFrpIniLocalPort(ini: string, localPort: number): string;
/** Build the classic INI configuration consumed by the ChmlFrp client fork.
 *
 * ChmlFrp's client is a modified frp 0.51.2 that reads `frpc.ini`. It does not
 * speak the upstream TOML schema, so the public origin's hostname becomes
 * `custom_domains` and the tunnel type follows the panel's HTTPS mapping.
 * `tls_enable` stays false: ChmlFrp terminates nothing, and the gateway behind
 * the tunnel already serves TLS end to end.
 */
declare function createChmlFrpIni(settings: ChmlFrpSettings, localPort: number): string;
/**
 * Parse a ChmlFrp `frpc.ini` pasted from the panel.
 *
 * The panel is the source of truth for the shared platform token and the tunnel
 * type, so accepting its INI verbatim avoids reimplementing ChmlFrp's private
 * config API. Only the fields this plugin needs are read, and the pasted text
 * is never written to disk.
 */
declare function parseChmlFrpIni(text: unknown, expectedOrigin?: string): ChmlFrpSettings;
/** Owns private FRP settings and generation-specific frpc configuration. */
declare class FrpConfigStore {
  readonly stateRoot: string;
  readonly settingsFile: string;
  /** Self-hosted TOML path; kept as the stable identifier for that transport. */
  readonly runtimeConfigFile: string;
  /** ChmlFrp INI path. */
  readonly runtimeIniFile: string;
  private settingsValue;
  private errorCode;
  constructor(stateDirectory: string);
  /** Load private settings while rejecting links, oversized files, and unknown fields. */
  initialize(): Promise<void>;
  /** Return configuration metadata without exposing the FRP token. */
  status(): FrpConfigurationStatus;
  /** Return private settings only to the provider lifecycle. */
  settings(): FrpTransportSettings | undefined;
  /** Narrow the saved settings to the self-hosted transport, when that is what is stored. */
  selfHostedSettings(): FrpSettings | undefined;
  /** Narrow the saved settings to ChmlFrp, when that is what is stored. */
  chmlFrpSettings(): ChmlFrpSettings | undefined;
  /** Atomically replace private FRP settings with either transport. */
  configure(value: unknown): Promise<FrpConfigurationStatus>;
  /**
   * Materialize the private generation-specific client configuration and return
   * the file the client should be launched with.
   */
  writeRuntimeConfig(localPort: number): Promise<string>;
  /** Remove only configuration files owned by the FRP provider. */
  purge(): Promise<FrpConfigurationStatus>;
  /** Remove every generated client configuration owned by this store. */
  removeRuntimeConfig(): Promise<void>;
}
//#endregion
//#region src/remote.d.ts
/** Remote transports supported by the desktop plugin and Android client. */
type RemoteProvider = 'tailscale' | 'cpolar' | 'frp';
/** Remote transports selectable in the desktop panel. */
type RemoteProviderChoice = RemoteProvider | 'chmlfrp';
/** Common safe status returned by every remote provider controller. */
interface RemoteProviderStatus {
  readonly enabled: boolean;
  readonly state: string;
  readonly origin?: string;
  readonly loginUrl?: string;
  readonly setupUrl?: string;
  readonly errorCode?: string;
}
/** Lifecycle shared by selectable remote providers. */
interface RemoteProviderController {
  initialize(): Promise<void>;
  gateway(): MobileAccessGateway | undefined;
  status(): RemoteProviderStatus;
  setEnabled(enabled: boolean): Promise<RemoteProviderStatus>;
  reconnect(): Promise<RemoteProviderStatus>;
  reset(): Promise<RemoteProviderStatus>;
  close(): Promise<void>;
}
/** Durable selection for the single active remote transport. */
interface RemoteProviderState {
  readonly version: 1;
  readonly provider: RemoteProviderChoice;
}
/** Validate the provider selection loaded across the filesystem boundary. */
declare function parseRemoteProviderState(value: unknown): RemoteProviderState;
/** Atomic selection store whose absent-file state uses the configured default. */
declare class JsonRemoteProviderStore {
  private readonly file;
  private readonly defaultProvider;
  constructor(file: string, defaultProvider: RemoteProviderChoice);
  load(): Promise<RemoteProviderState>;
  save(state: RemoteProviderState): Promise<void>;
}
/** Resolve the first-run provider without letting environment values bypass validation. */
declare function configuredRemoteProvider(environment: NodeJS.ProcessEnv): RemoteProviderChoice;
//#endregion
//#region src/frp.d.ts
/** Product-facing states for the restricted self-hosted FRP transport. */
type FrpState = 'off' | 'unavailable' | 'starting' | 'connecting' | 'ready' | 'error';
/** Safe FRP state returned only through the loopback DSH control route. */
interface FrpStatus {
  readonly enabled: boolean;
  readonly state: FrpState;
  readonly origin?: string;
  readonly errorCode?: string;
}
/** Inputs for one FRP client process and authenticated DSH gateway. */
interface FrpControllerOptions {
  readonly store: MobileAccessControlStore;
  /**
   * Resolve the managed client for the currently saved transport. Both dialects
   * share this controller, so the executable and its file layout are chosen per
   * start from the saved `kind`. Callers that pin a single binary may omit this
   * and set `executable` instead.
   */
  readonly resolveClient?: (kind: 'self-hosted' | 'chmlfrp') => {
    readonly executable: string;
    /**
     * Gateway listener for the ChmlFrp transport. The panel maps the tunnel to a
     * fixed local port, so that transport must bind that exact port instead of
     * letting the OS choose one.
     */
    readonly listenerPort?: number;
  };
  readonly config: FrpConfigStore;
  readonly instanceId: string;
  /** Fixed client path; overrides `resolveClient` when a caller pins one binary. */
  readonly executable?: string;
  readonly createGateway: (origin: string, listenPort?: number) => Promise<MobileAccessGateway>;
  readonly onStatus?: (status: FrpStatus) => void;
  readonly verifyConfig?: (executable: string, configFile: string) => Promise<void>;
  readonly launchClient?: (executable: string, configFile: string) => ChildProcessWithoutNullStreams;
  readonly probeVhostExposure?: (serverAddress: string, port: number) => Promise<boolean>;
  readonly probeDiscovery?: (origin: string, expectedInstanceId: string, signal: AbortSignal) => Promise<boolean>;
  readonly startTimeoutMs?: number;
  readonly retryIntervalMs?: number;
}
/** Owns frpc, its generation-specific configuration, and the remote gateway. */
declare class FrpController implements RemoteProviderController {
  private readonly options;
  private enabled;
  private initialized;
  private disposed;
  private child;
  private gatewayValue;
  private generation;
  private latest;
  private queue;
  private startupAbort;
  constructor(options: FrpControllerOptions);
  /** Restore the remembered FRP switch without changing LAN or other providers. */
  initialize(): Promise<void>;
  /** Return the active FRP-backed DSH gateway. */
  gateway(): MobileAccessGateway | undefined;
  /** Return state safe for the desktop control UI. */
  status(): FrpStatus;
  /** Enable or disable FRP without changing LAN or another provider. */
  setEnabled(enabled: boolean): Promise<FrpStatus>;
  /** Restart FRP while retaining its private server settings and devices. */
  reconnect(): Promise<FrpStatus>;
  /** Disable FRP without deleting its explicitly managed component or settings. */
  reset(): Promise<FrpStatus>;
  /** Stop all FRP resources without changing the remembered switch. */
  close(): Promise<void>;
  private enqueue;
  private publish;
  private start;
  private waitForDiscovery;
  private failGeneration;
  private stop;
  private stopProcessAndGateway;
}
//#endregion
//#region src/task-events.d.ts
/**
 * Host-side task-completion fan-out for phone notifications.
 *
 * The exact moment a run ends is known only on the Host (the phone page can
 * merely infer it from UI state), so this module watches the public
 * `session/event` bus for completed root turns and hands them to a hub that
 * fans out to every live mobile gateway. Phones render the text locally, so
 * no user content crosses this boundary — only opaque session and turn ids.
 */
/** A completed root turn worth announcing on paired phones. */
interface TaskCompletionEvent {
  readonly sessionId: string;
  readonly turn: number;
}
/** Minimal session shape read off the `session/event` bus. */
interface TaskEventSession {
  readonly id: unknown;
  readonly header?: {
    readonly parentSession?: unknown;
  } | null | undefined;
}
/**
 * Minimal turn event shape read off the `session/event` bus. Fields stay
 * unknown here and are validated at runtime below so this module never
 * depends on the harness session packages.
 */
interface TaskTurnEvent {
  readonly type: string;
  readonly data?: unknown;
}
/** Structural slice of the Host context this module needs (keeps tests cordis-free). */
interface TaskEventContext {
  on(event: 'session/event', handler: (session: TaskEventSession, event: TaskTurnEvent) => void): () => void;
}
interface TaskEventWatcherOptions {
  /** Trailing debounce per session that merges turn-boundary bursts. */
  readonly debounceMs?: number;
  readonly onTaskCompleted: (event: TaskCompletionEvent) => void;
  readonly log?: (event: string, fields: Readonly<Record<string, string | number | boolean>>) => void;
}
declare const TASK_EVENT_DEBOUNCE_MS = 1000;
/**
 * Subscribe to completed root turns. Subagent turns are skipped so one task
 * announces once, and rapid turn boundaries collapse into a single event.
 * Returns a disposer that also drops pending debounces.
 */
declare function watchTaskCompletions(ctx: TaskEventContext, options: TaskEventWatcherOptions): () => void;
/** Receives fanned-out completion events (normally a mobile gateway). */
interface TaskEventSink {
  broadcastTaskEvent(event: TaskCompletionEvent): void;
}
/** One subscription feeding every live gateway; gateways register on start. */
declare class TaskEventHub {
  private readonly sinks;
  /** Register a sink; returns its disposer. */
  add(sink: TaskEventSink): () => void;
  /** Fan out to a snapshot so a failing sink cannot break its siblings. */
  broadcast(event: TaskCompletionEvent): void;
  /** Visible for tests. */
  get size(): number;
}
//#endregion
//#region src/plugin.d.ts
/** Stable Cordis plugin name. */
declare const name = "dsh-mobile";
/** The stock WebServer serves the control card; Connection authenticates the loopback DSH origin. */
declare const inject: string[];
/** Mount the resident control route and its optional authenticated LAN gateway. */
declare function apply(ctx: Context, config: PluginConfig): Promise<void>;
//#endregion
export { AUTH_PREFIX, AccessController, type AccessControllerOptions, AccessError, type AuthoritySpec, type BlockedUpgradePathEntry, BlockedUpgradePathLog, BoundedRateLimiter, CHMLFRP_COMPONENT_RELEASES, CHMLFRP_VERSION, CSRF_COOKIE, CSRF_HEADER, type ChmlFrpSettings, Config, FRP_VHOST_HTTP_PORT as DEFAULT_VHOST_HTTP_PORT, FRP_VHOST_HTTP_PORT, DEVICE_COOKIE, type DeviceSnapshot, type DeviceStore, type DeviceSummary, type DisabledTlsConfig, EXTENSION_LIMITS, FRP_CADDY_IMPORT_LINE, FRP_CADDY_SNIPPET_MARKER, FRP_CADDY_SNIPPET_PATH, FRP_COMPONENT_RELEASES, FrpComponentManager, type FrpComponentStatus, type FrpComponentVariant, FrpConfigStore, type FrpConfigurationStatus, FrpController, type FrpControllerOptions, type FrpSettings, type FrpState, type FrpStatus, type FrpTransportSettings, JsonDeviceStore, JsonMobileAccessControlStore, JsonRemoteProviderStore, LOCAL_ADMIN_PREFIX, type LocalExtensionManifest, MAX_BLOCKED_UPGRADE_PATHS, MAX_EXTRA_WEBSOCKET_PATHS, MAX_WEBSOCKET_PATH_LENGTH, MemoryDeviceStore, type MobileAccessControlState, type MobileAccessControlStore, MobileAccessGateway, MobileAccessGatewayController, type MobileAccessService as MobileAccessRegistry, MobileAccessService, type MobileAccessRuntime, type MobileActionContext, type MobileExtensionClientEntry, type MobileExtensionDefinition, MobileExtensionError, type MobileExtensionManifest, type MobileExtensionStatus, type MobileHostAction, type MobileHostRoute, type MobileRouteRequest, type MobileRouteResponse, type PairingResult, type ParsedCidr, type PluginConfig, type ProvidedTlsConfig, type RemoteProvider, type RemoteProviderController, type RemoteProviderState, type RemoteProviderStatus, type RenewalResult, RequestTrustPolicy, type ResolvedGatewayConfig, SESSION_COOKIE, type SessionAuthorization, type StoredDevice, TASK_EVENT_DEBOUNCE_MS, type TaskCompletionEvent, type TaskEventContext, TaskEventHub, type TaskEventSession, type TaskEventSink, type TaskEventWatcherOptions, type TaskTurnEvent, type TlsConfig, WS_PATHS, WebSocketPathStore, addressAllowed, apply, assertExtensionId, bindChmlFrpIniLocalPort, configuredRemoteProvider, createCaddySite, createChmlFrpIni, createFrpServerTemplate, createFrpcToml, createMobileAccessService, createRestrictedFrpServerTemplate, inject, isGloballyRoutableIpv4, isLoopbackAddress, mergeSavedChmlFrpSettings, mergeSavedFrpSettings, mergeSavedFrpTarget, name, normalizeWebSocketPaths, parseAuthority, parseChmlFrpIni, parseChmlFrpSettings, parseCidr, parseControlFile, parseDeviceSnapshot, parseExtensionManifest, parseFrpSettings, parseFrpTransportSettings, parseGatewayConfig, parseMobileAccessControlState, parseRemoteProviderState, resolveAuthority, rewriteMobileIndex, validateChmlFrpUser, validateFrpPublicOrigin, validateFrpServerAddress, validateFrpServerPort, validateFrpToken, validateWebSocketPath, watchTaskCompletions };
//# sourceMappingURL=index.d.mts.map
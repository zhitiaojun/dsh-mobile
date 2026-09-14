window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-layout",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region src/mobile-layout-messages.ts
		const MOBILE_LAYOUT_MESSAGES = Object.freeze({
			it: Object.freeze({
				closePanels: "Chiudi pannelli",
				workspaceNavigation: "Navigazione area di lavoro e sessioni"
			}),
			en: Object.freeze({
				closePanels: "Close panels",
				workspaceNavigation: "Workspace and session navigation"
			}),
			zh: Object.freeze({
				closePanels: "关闭浮层",
				workspaceNavigation: "工作区与会话导航"
			})
		});
		//#endregion
		//#region src/mobile-layout.ts
		/** Whether an optional service value supports the public right-Sidebar controls. */
		function isSidebarRightControl(value) {
			if (typeof value !== "object" || value === null) return false;
			const candidate = value;
			return typeof candidate.isExpanded === "function" && typeof candidate.toggleExpanded === "function";
		}
		/**
		* Viewport width at which the dedicated layout treats the sidebar as a
		* persistent desktop panel instead of an overlay drawer. Narrow screens
		* keep the overlay behavior byte-for-byte.
		*/
		const WIDE_LAYOUT_MIN_WIDTH_PX = 900;
		const RIGHTBAR_MIN_WIDTH_PX = 300;
		const RIGHTBAR_MAX_WIDTH_PX = 460;
		const RIGHTBAR_CENTER_MIN_WIDTH_PX = 400;
		const RIGHTBAR_DEFAULT_RATIO = .45;
		const SIDEBAR_EXPANDED_WIDTH_PX = 340;
		const SIDEBAR_COLLAPSED_WIDTH_PX = 56;
		function isWideViewportLayout(viewportWidth) {
			return viewportWidth >= 900;
		}
		/** Preserve a readable conversation width before turning a requested right track into a docked column. */
		function resolveMobileRightbarLayout(viewportWidth, sidebarOpen, track, fullscreen) {
			const overlayWidth = Math.min(viewportWidth * .94, RIGHTBAR_MAX_WIDTH_PX);
			if (!track || fullscreen || !isWideViewportLayout(viewportWidth) && sidebarOpen) return Object.freeze({
				docked: false,
				width: overlayWidth
			});
			const sidebarWidth = isWideViewportLayout(viewportWidth) && sidebarOpen ? SIDEBAR_EXPANDED_WIDTH_PX : SIDEBAR_COLLAPSED_WIDTH_PX;
			const available = Math.floor(viewportWidth - sidebarWidth - RIGHTBAR_CENTER_MIN_WIDTH_PX);
			if (available < RIGHTBAR_MIN_WIDTH_PX) return Object.freeze({
				docked: false,
				width: overlayWidth
			});
			const preferred = Math.min(RIGHTBAR_MAX_WIDTH_PX, Math.max(RIGHTBAR_MIN_WIDTH_PX, Math.round(viewportWidth * RIGHTBAR_DEFAULT_RATIO)));
			return Object.freeze({
				docked: true,
				width: Math.min(preferred, available)
			});
		}
		/** Whether an overlay drawer needs the modal scrim without dimming a docked desktop panel. */
		function isMobileScrimOpen(sidebarOpen, detailsModalOpen, wideViewport) {
			return !wideViewport && sidebarOpen || detailsModalOpen;
		}
		/**
		* Close the details drawer from its scrim, collapsing the DSH 0.1.5 right
		* Sidebar first when that optional service owns the visible content.
		*/
		function closeDetailsFromScrim(sidebarRight, closeDetails) {
			if (isSidebarRightControl(sidebarRight) && sidebarRight.isExpanded()) sidebarRight.toggleExpanded();
			closeDetails();
		}
		/** Reads the live viewport; unknown environments (SSR, tests) stay narrow. */
		function viewportIsWide() {
			if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
			return window.matchMedia(`(min-width: 900px)`).matches;
		}
		/** Resolve the supported language used by the dedicated mobile layout. */
		function resolveMobileLayoutLanguage(documentLanguage, browserLanguages) {
			return [documentLanguage, ...browserLanguages].map((value) => value.trim().toLowerCase().split(/[-_]/u)[0]).find((value) => value === "it" || value === "en" || value === "zh") ?? "en";
		}
		var MobileLayoutController = class {
			snapshot = Object.freeze({
				sidebarOpen: viewportIsWide(),
				detailsOpen: false,
				rightbarTrack: false,
				rightbarFullscreen: false,
				panelInfo: Object.freeze({ activePanelId: null })
			});
			listeners = /* @__PURE__ */ new Set();
			hasMainPanel;
			navigation = new AbortController();
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			getSnapshot = () => this.snapshot;
			toggleSidebar() {
				this.update({ sidebarOpen: !this.snapshot.sidebarOpen });
			}
			openDetails() {
				this.update({ detailsOpen: true });
			}
			closeDetails() {
				this.update({
					detailsOpen: false,
					rightbarTrack: false,
					rightbarFullscreen: false
				});
			}
			closeSidebar() {
				this.update({ sidebarOpen: false });
			}
			/**
			* Invalidate the previous navigation and hand back a fresh signal. The
			* workspace controller wraps this around "open a workspace" and "fork a
			* session" (dsh-client-ui-workspace) — the path behind the sidebar's
			* new-session button. Without it startSession throws inside a
			* `.catch(reason => console.warn('new session failed:', reason))`, so the
			* button silently did nothing.
			*/
			beginNavigation() {
				this.navigation.abort();
				this.navigation = new AbortController();
				return this.navigation.signal;
			}
			/** Invalidate pending navigations when this layout unloads. */
			dispose() {
				this.navigation.abort();
			}
			/** Bind panel validation to the live slot registry owned by this application. */
			bindMainPanelRegistry(hasMainPanel) {
				this.hasMainPanel = hasMainPanel;
				return () => {
					if (this.hasMainPanel === hasMainPanel) this.hasMainPanel = void 0;
				};
			}
			/** Preserve the native seat's distinction between a docked track and fullscreen. */
			openRightbar(track = true, fullscreen = false) {
				this.update({
					detailsOpen: true,
					rightbarTrack: track,
					rightbarFullscreen: fullscreen
				});
			}
			/** Hide the right panel. */
			closeRightbar() {
				this.closeDetails();
			}
			/**
			* Select the main panel rendered in the center column; null means the
			* conversation. Mirrors the official LayoutController so the `panelInfo`
			* root hook stays truthful.
			*/
			selectPanel(panelId) {
				if (panelId !== null && this.hasMainPanel?.(panelId) !== true) throw new Error(`layout.selectPanel: main panel "${panelId}" is not registered`);
				this.navigation.abort();
				if (this.snapshot.panelInfo.activePanelId === panelId) return;
				this.update({ panelInfo: Object.freeze({ activePanelId: panelId }) });
			}
			/** Drop a selected panel once no main-slot entry declares it. */
			retainMainPanels(panelIds) {
				const active = this.snapshot.panelInfo.activePanelId;
				if (active !== null && !panelIds.includes(active)) this.update({ panelInfo: Object.freeze({ activePanelId: null }) });
			}
			update(next) {
				const snapshot = Object.freeze({
					...this.snapshot,
					...next
				});
				if (snapshot.sidebarOpen === this.snapshot.sidebarOpen && snapshot.detailsOpen === this.snapshot.detailsOpen && snapshot.rightbarTrack === this.snapshot.rightbarTrack && snapshot.rightbarFullscreen === this.snapshot.rightbarFullscreen && snapshot.panelInfo === this.snapshot.panelInfo) return;
				this.snapshot = snapshot;
				for (const listener of this.listeners) listener();
			}
		};
		var ThemePresenter = class {
			appliedTokens = [];
			meta = document.createElement("meta");
			constructor() {
				this.meta.name = "theme-color";
			}
			apply(snapshot) {
				const scheme = snapshot.active.colorScheme;
				document.documentElement.style.colorScheme = scheme;
				document.body.toggleAttribute("data-ds-dark-theme", scheme === "dark");
				for (const name of this.appliedTokens) document.body.style.removeProperty(name);
				this.appliedTokens = [];
				for (const [name, value] of Object.entries(snapshot.active.tokens)) {
					document.body.style.setProperty(name, value);
					this.appliedTokens.push(name);
				}
				this.meta.content = getComputedStyle(document.body).backgroundColor;
				if (!this.meta.isConnected) document.head.append(this.meta);
			}
			dispose() {
				document.documentElement.style.removeProperty("color-scheme");
				document.body.removeAttribute("data-ds-dark-theme");
				for (const name of this.appliedTokens) document.body.style.removeProperty(name);
				this.meta.remove();
			}
		};
		const MOBILE_LAYOUT_STYLES = `
html,body,#root{width:100%;height:100%;overflow:hidden}
.dshm-shell{position:relative;display:grid;width:100%;height:100dvh;min-width:0;overflow:hidden;background:var(--dsw-alias-bg-base,#fff)}
.dshm-main{grid-area:1/1;position:relative;min-width:0;min-height:0;margin-right:0;overflow:hidden;transition:margin-right var(--ds-transition-duration-slow,190ms) var(--ds-ease-in-out,ease)}
.dshm-shell[data-rightbar-docked=true] .dshm-main{margin-right:var(--dshm-rightbar-width)}
.dshm-shell[data-rightbar-docked=true] .dshm-details{position:absolute;width:var(--dshm-rightbar-width);box-shadow:none;padding-top:0}
/* Draw above the native absolute panel without consuming its width or
   intercepting controls; only docked mode needs this column separator. */
.dshm-shell[data-rightbar-docked=true] .dshm-details::after{content:"";position:absolute;inset:0 auto 0 0;width:.5px;background:var(--dsw-alias-border-l4);z-index:11;pointer-events:none}
.dshm-main>*,.dshm-main>*>*{min-width:0}
.dshm-drawer{position:fixed;z-index:70;inset:0 auto 0 0;box-sizing:border-box;width:56px;max-width:100%;padding-top:env(safe-area-inset-top);overflow:hidden;background:var(--dsw-alias-bg-layer-1,#f8fafc);box-shadow:none;will-change:width;transition:width 240ms cubic-bezier(.22,1,.36,1),box-shadow 240ms ease}
.dshm-drawer[data-open=true]{width:min(88vw,340px);box-shadow:18px 0 46px rgb(15 23 42 / 18%)}
.dshm-drawer[data-open=false]{pointer-events:auto;visibility:visible}
.dshm-drawer>*{width:100%!important;height:100%!important;transform:translateX(-6px);opacity:.94;transition:transform 220ms cubic-bezier(.22,1,.36,1),opacity 160ms ease-out}
.dshm-drawer[data-open=true]>*{transform:translateX(0);opacity:1}
.dshm-drawer[data-open=false]>*{width:56px!important}
/* display:none also suppresses fixed descendants installed by the phone adapter. */
.dshm-drawer[data-right-modal=true]{display:none!important}
.dshm-details{position:fixed;z-index:80;inset:0 0 0 auto;box-sizing:border-box;width:min(94vw,460px);max-width:100%;padding-top:env(safe-area-inset-top);overflow:hidden;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:-18px 0 46px rgb(15 23 42 / 18%);transform:translateX(104%);transition:transform 190ms cubic-bezier(.22,1,.36,1)}
.dshm-details[data-open=true]{transform:translateX(0)}
.dshm-details[data-open=false]{pointer-events:none;visibility:hidden;transition:transform 190ms cubic-bezier(.22,1,.36,1),visibility 0s linear 190ms}
.dshm-scrim{position:fixed;z-index:65;inset:0;border:0;background:rgb(15 23 42 / 40%);opacity:0;pointer-events:none;transition:opacity 180ms ease-out}
.dshm-scrim[data-open=true]{opacity:1;pointer-events:auto}
.dshm-overlay{position:fixed;z-index:90;inset:0;pointer-events:none}.dshm-overlay>*{pointer-events:auto}
.dshm-shell header{min-width:0;padding-left:52px}
.dshm-shell textarea{font-size:16px}
.dshm-shell table{display:block;max-width:100%;overflow-x:auto}
.dshm-shell pre{max-width:100%;overflow-x:auto}
.dshm-shell img,.dshm-shell video,.dshm-shell canvas,.dshm-shell svg{max-width:100%}
.dshm-shell [data-disclosure-row]{min-width:0;max-width:100%}
.dshm-shell [data-disclosure-row]>*{min-width:0;overflow-wrap:anywhere}
.dshm-shell [data-context-fields]>*{min-width:0}
.dshm-shell [class*="_body"]{max-width:100%;overflow-wrap:anywhere}
@media(max-width:420px){.dshm-shell [data-context-fields]>*{display:grid;grid-template-columns:1fr!important;gap:4px}.dshm-shell [class*="_ioSection"]{grid-template-columns:1fr!important}}
@media(max-width:600px){
.dshm-shell [data-question-key],.dshm-shell [data-plan-review-key]{box-sizing:border-box;width:100%;height:auto!important;min-width:0;flex:none!important;align-self:flex-end;padding:6px max(10px,env(safe-area-inset-left)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-right))!important}
.dshm-shell [data-question-key]>section,.dshm-shell [data-plan-review-key]>section{width:100%;height:auto!important;min-height:0!important;max-width:none!important;max-height:min(68dvh,520px)!important;border-radius:16px!important}
.dshm-shell [data-question-scroll],.dshm-shell [data-plan-review-scroll]{flex:0 1 auto!important;min-height:0!important;max-height:min(42dvh,360px)!important;overscroll-behavior:contain;scroll-padding-bottom:12px}
.dshm-shell [data-question-key]>section>header{display:flex!important;visibility:visible!important;flex:none!important;gap:8px!important;padding:12px 8px 4px 14px!important}
.dshm-shell [data-question-key]>section>header h2{min-width:0;overflow-wrap:anywhere;font-size:16px!important;line-height:22px!important}
.dshm-shell [data-question-key]>section>header button{min-width:40px;min-height:40px}
.dshm-shell [data-question-key] [role=radio],.dshm-shell [data-question-key] [role=checkbox]{min-height:48px!important;touch-action:manipulation}
.dshm-shell [data-question-key]>section>footer{display:grid!important;grid-template-columns:auto minmax(0,1fr);align-items:center!important;flex:none!important;gap:6px 8px!important;margin-top:4px!important;padding:6px 10px 10px!important}
.dshm-shell [data-question-key]>section>footer>:last-child{grid-column:1/-1;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:8px!important}
.dshm-shell [data-question-key]>section>footer>:last-child button{width:100%;min-height:44px}
.dshm-shell [data-plan-review-key]>section>div:last-child{display:grid!important;grid-template-columns:1fr;gap:8px!important;padding:8px 12px 10px!important}
.dshm-shell [data-plan-review-key]>section>div:last-child>div:last-child{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:8px!important}
.dshm-shell [data-plan-review-key]>section>div:last-child>div:last-child>button:first-child{grid-column:1/-1}
.dshm-shell [data-plan-review-key]>section>div:last-child button{width:100%;min-height:44px}
}
@media(min-width:900px){
.dshm-shell{grid-template-columns:auto minmax(0,1fr)}
.dshm-main{grid-area:1/2}
.dshm-drawer{position:static;grid-area:1/1;box-shadow:none}
.dshm-drawer[data-open=true]{width:340px;box-shadow:none}
.dshm-drawer[data-open=false]{width:56px}
}
@media(prefers-reduced-motion:reduce){.dshm-drawer,.dshm-details,.dshm-scrim,.dshm-drawer>*,.dshm-main{transition:none!important}}
`;
		function MobileAppFrame(props) {
			const state = (0, react.useSyncExternalStore)(props.controller.subscribe, props.controller.getSnapshot);
			const suppressKeyboardUntil = (0, react.useRef)(0);
			const [viewportWidth, setViewportWidth] = (0, react.useState)(window.innerWidth);
			(0, react.useEffect)(() => {
				let frame;
				const resize = () => {
					if (frame !== void 0) return;
					frame = window.requestAnimationFrame(() => {
						frame = void 0;
						setViewportWidth(window.innerWidth);
					});
				};
				window.addEventListener("resize", resize);
				return () => {
					window.removeEventListener("resize", resize);
					if (frame !== void 0) window.cancelAnimationFrame(frame);
				};
			}, []);
			const wideViewport = isWideViewportLayout(viewportWidth);
			const rightbar = resolveMobileRightbarLayout(viewportWidth, state.sidebarOpen, state.rightbarTrack, state.rightbarFullscreen);
			const rightbarDocked = state.detailsOpen && rightbar.docked;
			const [documentLanguage, setDocumentLanguage] = (0, react.useState)(document.documentElement.lang);
			const language = resolveMobileLayoutLanguage(documentLanguage, navigator.languages.length > 0 ? navigator.languages : [navigator.language]);
			const messages = MOBILE_LAYOUT_MESSAGES[language];
			const scrimOpen = isMobileScrimOpen(state.sidebarOpen, state.detailsOpen && !rightbarDocked, wideViewport);
			const activeSessionId = props.useSessions((session) => {
				const current = session.current;
				return current !== void 0 && session.byId[current]?.blank === false ? current : void 0;
			});
			const hasSession = activeSessionId !== void 0;
			(0, react.useEffect)(() => {
				const observer = new MutationObserver(() => {
					setDocumentLanguage(document.documentElement.lang);
				});
				observer.observe(document.documentElement, {
					attributes: true,
					attributeFilter: ["lang"]
				});
				return () => {
					observer.disconnect();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (!hasSession) props.controller.closeDetails();
			}, [hasSession, props.controller]);
			const sessionTitle = props.useSessions((session) => session.current === void 0 ? void 0 : session.byId[session.current]?.title);
			(0, react.useEffect)(() => {
				const productTitle = document.title;
				if (sessionTitle !== void 0) document.title = `${sessionTitle} — ${productTitle}`;
				return () => {
					document.title = productTitle;
				};
			}, [sessionTitle]);
			(0, react.useEffect)(() => {
				const suppressAutofocus = (event) => {
					if (performance.now() >= suppressKeyboardUntil.current) return;
					const target = event.target;
					if (target instanceof HTMLElement && (target.matches("input,textarea") || target.isContentEditable)) target.blur();
				};
				const suppressBranchAutofocus = (event) => {
					if (!(event.target instanceof Element)) return;
					const branch = event.target.closest("button[aria-label*=\"分支\"],button[aria-label*=\"Branch\"],button[aria-label*=\"branch\"],button[aria-label*=\"Ramo\"],button[aria-label*=\"ramo\"]");
					if (branch === null || branch.hasAttribute("disabled") || branch.getAttribute("aria-disabled") === "true") return;
					suppressKeyboardUntil.current = performance.now() + 700;
					window.setTimeout(() => {
						const active = document.activeElement;
						if (active instanceof HTMLElement && (active.matches("input,textarea") || active.isContentEditable)) active.blur();
					}, 0);
				};
				const suppressCommandAutofocus = (event) => {
					if (!(event.target instanceof Element)) return;
					if (event.target.closest("button[aria-haspopup=\"listbox\"]") === null) return;
					suppressKeyboardUntil.current = performance.now() + 700;
					event.preventDefault();
					event.stopPropagation();
					window.setTimeout(() => {
						const active = document.activeElement;
						if (active instanceof HTMLElement && (active.matches("input,textarea") || active.isContentEditable)) active.blur();
					}, 0);
				};
				document.addEventListener("focusin", suppressAutofocus, true);
				document.addEventListener("click", suppressBranchAutofocus, true);
				document.addEventListener("mousedown", suppressCommandAutofocus, true);
				return () => {
					document.removeEventListener("focusin", suppressAutofocus, true);
					document.removeEventListener("click", suppressBranchAutofocus, true);
					document.removeEventListener("mousedown", suppressCommandAutofocus, true);
				};
			}, []);
			const closeDrawerAfterSessionAction = (event) => {
				if (viewportIsWide()) return;
				if (!(event.target instanceof Element)) return;
				const row = event.target.closest("[role=\"treeitem\"][aria-selected]");
				const action = event.target.closest("button,[role=\"button\"]");
				const startsSession = action?.matches("button[class*=\"_newSession\"],button[class*=\"_brand\"]") || /新建会话|新会话|new session|new conversation|nuova sessione|nuova conversazione/i.test(action?.getAttribute("aria-label") ?? "");
				if (row === null && !startsSession) return;
				if (row !== null && action !== null && action !== row) return;
				suppressKeyboardUntil.current = performance.now() + 500;
				window.setTimeout(() => {
					props.controller.closeSidebar();
					const active = document.activeElement;
					if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur();
				}, 0);
			};
			return (0, react.createElement)("div", {
				className: "dshm-shell",
				lang: language,
				"data-rightbar-docked": rightbarDocked,
				style: { "--dshm-rightbar-width": `${rightbar.width}px` }
			}, (0, react.createElement)("main", {
				className: "dshm-main",
				"data-dsh-mobile-session": activeSessionId,
				"data-pane": "conversation"
			}, props.renderSlot("main", {}, {
				entryKey: state.panelInfo.activePanelId ?? "conversation",
				fallback: props.renderSlot("conversation", {})
			})), (0, react.createElement)("button", {
				"aria-label": messages.closePanels,
				className: "dshm-scrim",
				"data-open": scrimOpen,
				"aria-hidden": !scrimOpen,
				onClick: () => {
					if (!scrimOpen) return;
					state.detailsOpen ? props.requestDetailsClose() : props.controller.closeSidebar();
				},
				tabIndex: scrimOpen ? 0 : -1,
				type: "button"
			}), (0, react.createElement)("aside", {
				"aria-label": messages.workspaceNavigation,
				className: "dshm-drawer",
				"data-pane": "sidebar",
				"data-open": state.sidebarOpen,
				"data-right-modal": state.detailsOpen && !rightbarDocked,
				...state.detailsOpen && !rightbarDocked ? {
					inert: "",
					"aria-hidden": true
				} : {},
				...state.sidebarOpen ? {} : { "data-sidebar-collapsed": "" },
				onClickCapture: closeDrawerAfterSessionAction
			}, props.renderSlot("sidebar", {
				collapsed: !state.sidebarOpen,
				width: state.sidebarOpen ? 340 : 56
			})), (0, react.createElement)("aside", {
				"aria-hidden": !state.detailsOpen,
				className: "dshm-details",
				"data-open": state.detailsOpen,
				...state.detailsOpen ? {} : { inert: "" }
			}, [hasSession ? props.renderSlot("details", {}) : void 0, props.renderSlot("rightbar", {
				width: rightbar.width,
				viewportWidth,
				canShow: true
			})]), (0, react.createElement)("div", {
				className: "dshm-overlay",
				"data-shell-overlay": true
			}, props.renderSlot("shell.overlay", {})));
		}
		let sharedController;
		/** Replace the desktop layout module on the authenticated mobile surface. */
		function apply(ctx) {
			sharedController ??= new MobileLayoutController();
			const controller = sharedController;
			ctx.effect(() => {
				const style = document.createElement("style");
				style.dataset.plugin = "dsh-mobile-layout";
				style.textContent = MOBILE_LAYOUT_STYLES;
				document.head.append(style);
				const disposeMainPanelRegistry = controller.bindMainPanelRegistry((id) => ctx.slots.entries("main").some((entry) => entry.options.key === id));
				const disposeService = ctx.reflect.provide("layout", controller);
				const disposePanelInfo = typeof ctx.slots.provideRoot === "function" ? ctx.slots.provideRoot({ hooks: { panelInfo: {
					getSnapshot: () => controller.getSnapshot().panelInfo,
					subscribe: (listener) => controller.subscribe(listener)
				} } }) : () => {};
				const disposeRoot = ctx.slots.register({
					name: "root",
					children: {
						sidebar: {
							kind: "single",
							scope: "root"
						},
						conversation: {
							kind: "single",
							scope: "session-maybe"
						},
						main: {
							kind: "keyed",
							scope: "root"
						},
						rightbar: {
							kind: "single",
							scope: "root"
						},
						details: {
							kind: "single",
							scope: "session"
						},
						"shell.overlay": {
							kind: "list",
							scope: "root"
						}
					}
				}, (props) => (0, react.createElement)(MobileAppFrame, {
					...props,
					controller,
					requestDetailsClose: () => {
						closeDetailsFromScrim(ctx.get("sidebarRight"), () => {
							controller.closeDetails();
						});
					}
				}));
				const retainMainPanels = () => {
					controller.retainMainPanels(ctx.slots.entries("main").flatMap((entry) => entry.options.key === void 0 ? [] : [entry.options.key]));
				};
				const disposePanels = ctx.slots.subscribe("main", retainMainPanels);
				retainMainPanels();
				return () => {
					controller.dispose();
					disposePanels();
					disposeRoot();
					disposePanelInfo();
					disposeService();
					disposeMainPanelRegistry();
					style.remove();
				};
			}, "dsh-mobile: dedicated root layout");
			ctx.effect(() => {
				const presenter = new ThemePresenter();
				presenter.apply(ctx.theme.getTheme());
				const off = ctx.on("theme/change", (snapshot) => {
					presenter.apply(snapshot);
				});
				return () => {
					off();
					presenter.dispose();
				};
			}, "dsh-mobile: theme presenter");
		}
		/** Preserve the official layout module's dependency ordering. */
		const inject = ["slots", "theme"];
		//#endregion
		exports.MOBILE_LAYOUT_MESSAGES = MOBILE_LAYOUT_MESSAGES;
		exports.MOBILE_LAYOUT_STYLES = MOBILE_LAYOUT_STYLES;
		exports.WIDE_LAYOUT_MIN_WIDTH_PX = WIDE_LAYOUT_MIN_WIDTH_PX;
		exports.apply = apply;
		exports.closeDetailsFromScrim = closeDetailsFromScrim;
		exports.inject = inject;
		exports.isMobileScrimOpen = isMobileScrimOpen;
		exports.isSidebarRightControl = isSidebarRightControl;
		exports.isWideViewportLayout = isWideViewportLayout;
		exports.resolveMobileLayoutLanguage = resolveMobileLayoutLanguage;
		exports.resolveMobileRightbarLayout = resolveMobileRightbarLayout;
		return module.exports;
	}
});

//# sourceMappingURL=mobile-layout.js.map
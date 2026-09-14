window.__ModuleLoader__.load({
	id: "dsh-mobile",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region src/client-messages.ts
		const MOBILE_CONTROL_MESSAGES = {
			en: {
				mobileAccess: "Mobile access",
				collapseMobileAccess: "Collapse Mobile access",
				downloadAndroid: "Download latest Android app",
				downloadAndroidVersion: "Download latest Android app · v{version}",
				downloadAndroidAria: "Download the latest Android app from GitHub Releases",
				downloadAndroidVersionAria: "Download Android app v{version} from GitHub Releases",
				updatePlugin: "Update plugin",
				updatePluginAria: "Update DSH Mobile to v{version}",
				updatingPlugin: "Updating…",
				pluginUpdatedRestart: "Updated to v{version}. Restart DSH to apply it.",
				pluginUpdateFailed: "Update failed: {error}",
				updateTo: "Update to v{version}",
				updateNotesHeading: "What’s new",
				updateNotice: "Restart DSH after installing. Existing apps and paired devices need no re-pairing; unsure about the desktop version? Check the README compatibility table.",
				updateNotesEmpty: "No release notes fetched — updating is still fine; full details on the GitHub Release page.",
				updateNow: "Update now",
				updateLater: "Not now",
				lan: "Local network",
				remote: "Remote",
				lanAccess: "Local network access",
				remoteAccess: "Remote access",
				browserAccess: "Browser access",
				remoteAddress: "Remote address",
				loadingStatus: "Loading status…",
				loadingRemoteStatus: "Loading remote status…",
				generateCopyKey: "Generate and copy key",
				copyPairLink: "Copy pairing link",
				managePairedDevices: "Manage paired devices",
				clearAllDevices: "Clear all devices",
				pairingQr: "Pairing QR code",
				remoteIntro: "Choose the remote channel that suits you. Switching or disabling remote access does not affect the local network.",
				chooseProvider: "Choose connection method",
				currentProvider: "Current connection",
				remoteStateOff: "Off",
				remoteStateConnecting: "Connecting",
				remoteStateAttention: "Needs attention",
				providerInfoAria: "View remote connection security and network information",
				providerGroupAria: "Remote connection method",
				providerSafeTitle: "You remain protected",
				providerSafeText: "Only paired devices can access DSH. cpolar is installed on demand and can be removed completely; Tailscale may be slow or unavailable on mainland China networks, where cpolar is recommended.",
				builtIn: "Built in",
				mainlandPreferred: "Preferred in mainland China",
				tailscaleDescription: "Wider coverage; mainland China networks may be unstable. The first connection requires login and Funnel authorization.",
				cpolarDescription: "Installs the official component on demand and is suitable for mainland China networks.",
				prepareCpolar: "Prepare cpolar",
				checkingComponent: "Checking component…",
				installOfficial: "Install official component",
				cpolarAccountNote: "Sign in to the cpolar website and copy the Authtoken. The token is stored only in the plugin private directory and is never shown on the page or in logs.",
				registerCpolar: "Register with cpolar",
				openDashboard: "Open dashboard to get token",
				tokenPlaceholder: "Paste cpolar Authtoken",
				saveConnect: "Save and connect",
				saving: "Saving…",
				componentDetails: "Component source and cleanup",
				componentDetailsText: "Downloaded from the official cpolar website and verified at a fixed version only after you choose Install. It does not add a system service, startup item, registry entry, or PATH entry.",
				pluginPrivateDirectory: "Plugin private directory",
				officialDownload: "Official download page",
				terms: "Terms of service",
				purgeCpolar: "Completely remove cpolar component and configuration",
				tailscaleHelp: "How to use Tailscale",
				tailscaleHelpText: "The runtime component is included with the plugin. The first connection opens the official Tailscale login and Funnel authorization pages; the plugin never accesses your account password.",
				funnelGuideAria: "Steps to enable Tailscale Funnel",
				funnelGuideTitle: "Remote access setup · Step 2",
				funnelGuideSummary: "Tailscale login is complete. Funnel must still be allowed for this computer; the official page also enables HTTPS.",
				funnelStep1: "Open the official Tailscale authorization page for this node.",
				funnelStep2: "Confirm Funnel; you do not need to sign in to DSH again.",
				funnelStep3: "Return to DSH; the plugin checks and connects automatically.",
				funnelGuideNote: "Requires an Owner, Admin, or Network admin account.",
				continueFunnel: "Continue Funnel authorization",
				retryNow: "Done, retry now",
				enableRemote: "Enable remote access",
				disableRemote: "Disable remote access",
				continueLogin: "Continue login",
				reconnect: "Reconnect",
				generateRemoteQr: "Generate remote pairing QR code",
				copyRemoteLink: "Copy remote pairing link",
				manageRemoteDevices: "Manage remote devices",
				resetRemoteLogin: "Sign out and clear remote login",
				resetRemoteDevices: "Disable and clear remote devices",
				lanOn: "Local network access is on.",
				lanOff: "Local network access is off.",
				enableLan: "Enable local network access",
				disableLan: "Disable local network access",
				extensionsLoaded: "Extensions: {loaded} loaded",
				extensionsFailed: "Extensions: {loaded} loaded, {failed} failed",
				keyGenerationFailed: "Could not generate a pairing key.",
				keyCopied: "Pairing key copied. Paste it into the Android app.",
				linkCopied: "Pairing link copied. Send it to the phone and paste it into the app or open it in a browser.",
				copySecret: "Copy {kind}: {value}",
				pairingKey: "pairing key",
				pairingLink: "pairing link",
				noDevices: "No paired devices.",
				noRemoteDevices: "No remote paired devices.",
				device: "Device",
				expires: "Expires {time}",
				revoke: "Revoke",
				confirmResetDevices: "Remove all paired devices? Connected devices will be disconnected immediately.",
				ready: "Ready",
				installed: "Installed",
				installWithSize: "Install official component · {size} MB",
				cpolarUnsupported: "Only Windows x64 is currently supported. You can still use the built-in Tailscale Funnel.",
				cpolarNotInstalled: "Not installed. A fixed version is downloaded from the official cpolar website only after you click the button below.",
				cpolarNeedsToken: "Official component {version} is verified. Save the account token to continue.",
				cpolarReady: "Official component {version} and the local account configuration are ready. Free temporary addresses may change after DSH or cpolar restarts; if the app cannot connect, scan the current remote QR code again.",
				remoteOff: "Remote access is disabled. Local network access is unaffected.",
				remoteUnavailableCpolar: "cpolar is not installed or its local account is not configured.",
				remoteUnavailableTailscale: "This computer is missing the Funnel runtime component. Reinstall the complete plugin package.",
				remoteStartingCpolar: "Connecting to a cpolar node…",
				remoteStartingTailscale: "Starting the secure Tailscale channel…",
				remoteNeedsLogin: "Complete a one-time Tailscale login in the browser. The plugin never reads your password.",
				remoteConnectingCpolar: "Public address allocated; starting the DSH authentication gateway…",
				remoteConnectingTailscale: "Login complete; creating the public HTTPS address…",
				remoteReady: "Remote access is ready. Only paired devices can access DSH.",
				remoteError: "The remote connection was not established. Reconnect; local network access still works.",
				funnelPermission: "Login is complete. Authorize Funnel to establish the remote connection automatically.",
				funnelHttps: "Login is complete. Authorize Funnel; the official page also enables HTTPS.",
				funnelStart: "Login is complete. Finish the initial Tailscale Funnel authorization.",
				tailscaleDnsMissing: "Tailscale has not provided a remote address. Reconnect and confirm login is complete.",
				gatewayStartFailed: "The remote gateway failed to start. Reconnect; local network access is unaffected.",
				controlChannelFailed: "The remote component connection was interrupted. Reconnect.",
				cpolarMissing: "The official cpolar component is not installed. Complete the preparation steps above.",
				cpolarInvalid: "cpolar component verification failed. Remove it completely and reinstall.",
				cpolarConfigMissing: "No cpolar account token is saved. Complete the preparation steps above.",
				cpolarConfigInvalid: "The local cpolar configuration is invalid. Save the account token again.",
				cpolarPortUnavailable: "Could not allocate a local remote-gateway port. Try again.",
				cpolarLaunchFailed: "The cpolar client failed to start.",
				cpolarTimeout: "Timed out connecting to a cpolar node. Reconnect.",
				cpolarStopped: "The cpolar connection stopped.",
				cpolarExited: "The cpolar connection exited unexpectedly. Reconnect.",
				cpolarOutputInvalid: "cpolar returned an unrecognized status.",
				cpolarOriginInvalid: "The public address returned by cpolar failed validation.",
				setupOpened: "The official Tailscale page is open. Return to DSH after enabling Funnel; reconnection is automatic.",
				switchProviderConfirm: "Switching connection method first disables the current remote channel. Local network access and paired devices are unaffected. Continue?",
				switchingCpolar: "Switching to cpolar…",
				switchingTailscale: "Switching to Tailscale Funnel…",
				installConfirm: "Download and verify a fixed version from the official cpolar website (about 7.3 MB) and extract it only to the DSH Mobile private directory? No system service, PATH/registry entry, or startup item is added.",
				downloading: "Downloading and verifying…",
				installingCpolar: "Installing the official cpolar component. Keep DSH running until it completes.",
				installFailed: "Component installation failed: {error}",
				invalidToken: "Paste the complete Authtoken from the cpolar dashboard.",
				configuredConnecting: "Account configuration saved; connecting through cpolar…",
				configureFailed: "Configuration failed: {error}",
				purgeConfirm: "Completely remove the cpolar component, token configuration, and runtime logs from the DSH Mobile private directory? Local network access, DSH data, and other system programs are unaffected.",
				purging: "Stopping the channel and removing cpolar files managed by DSH Mobile…",
				purgeFailed: "Cleanup failed: {error}",
				reconnectingCpolar: "Reconnecting to a cpolar node…",
				reconnectingTailscale: "Checking Tailscale settings and reconnecting…",
				remoteQrReady: "Remote pairing QR code generated. Scan it from “Remote access” in the app.",
				resetCpolarConfirm: "Disable the cpolar remote channel and remove all remote paired devices? Your cpolar account and other tunnels are unchanged.",
				resetTailscaleConfirm: "Sign out of Tailscale on this computer and remove all remote paired devices? Local network configuration is unchanged.",
				requestFailed: "Request failed: {error}",
				wsPathsTitle: "Third-party WebSocket paths",
				wsPathsIntro: "When an installed plugin cannot connect (say a sidebar terminal or a live panel), it is usually because its connection paths have not been approved yet. Everything that needs your attention is listed below — one click on “Allow” fixes it.",
				wsPathsPlaceholder: "/sidebar/ws/terminal",
				wsPathsAdd: "Allow path",
				wsPathsRemove: "Remove",
				wsPathsEmpty: "Nothing to configure right now. If a plugin cannot connect later, one-click options appear here.",
				wsPathsInvalid: "Enter an exact path starting with / (no query string).",
				wsPathsDetected: "A plugin connection was blocked — press Allow to let it through",
				wsPathsAllow: "Allow",
				wsPathsAllowAll: "Allow all",
				wsPathsGroupMeta: "{n} paths · blocked {m} times",
				wsPathsNewBlocked: "New blocked third-party connections — open diagnostics to review",
				wsPathsAdvancedToggle: "Add paths manually (advanced)",
				wsPathsAnnounce: "{n} plugin connections waiting to be approved",
				wsPathsAdvancedHint: "Manual entries are rarely necessary: use the buttons above. Only fill this in when you know the exact path."
			},
			it: {
				mobileAccess: "Accesso mobile",
				collapseMobileAccess: "Riduci Accesso mobile",
				downloadAndroid: "Scarica l’ultima app Android",
				downloadAndroidVersion: "Scarica l’ultima app Android · v{version}",
				downloadAndroidAria: "Scarica l’ultima app Android da GitHub Releases",
				downloadAndroidVersionAria: "Scarica l’app Android v{version} da GitHub Releases",
				updatePlugin: "Aggiorna plugin",
				updatePluginAria: "Aggiorna DSH Mobile alla v{version}",
				updatingPlugin: "Aggiornamento…",
				pluginUpdatedRestart: "Aggiornato alla v{version}. Riavvia DSH per applicarlo.",
				pluginUpdateFailed: "Aggiornamento non riuscito: {error}",
				updateTo: "Aggiorna alla v{version}",
				updateNotesHeading: "Novità",
				updateNotice: "Riavvia DSH dopo l’installazione. Le app esistenti e i dispositivi già associati non richiedono ri-associazione; in caso di dubbi sulla versione desktop, consulta la tabella di compatibilità nel README.",
				updateNotesEmpty: "Note di rilascio non recuperate — l’aggiornamento resta possibile; dettagli nella pagina Release su GitHub.",
				updateNow: "Aggiorna ora",
				updateLater: "Non ora",
				lan: "Rete locale",
				remote: "Remoto",
				lanAccess: "Accesso rete locale",
				remoteAccess: "Accesso remoto",
				browserAccess: "Accesso browser",
				remoteAddress: "Indirizzo remoto",
				loadingStatus: "Lettura stato…",
				loadingRemoteStatus: "Lettura stato remoto…",
				generateCopyKey: "Genera e copia chiave",
				copyPairLink: "Copia link di abbinamento",
				managePairedDevices: "Gestisci dispositivi abbinati",
				clearAllDevices: "Rimuovi tutti i dispositivi",
				pairingQr: "Codice QR di abbinamento",
				remoteIntro: "Scegli il canale remoto più adatto. Cambiare o disattivare l’accesso remoto non influisce sulla rete locale.",
				chooseProvider: "Scegli metodo di connessione",
				currentProvider: "Connessione attuale",
				remoteStateOff: "Disattivata",
				remoteStateConnecting: "Connessione",
				remoteStateAttention: "Da controllare",
				providerInfoAria: "Informazioni su sicurezza e rete della connessione remota",
				providerGroupAria: "Metodo di connessione remota",
				providerSafeTitle: "La protezione resta attiva",
				providerSafeText: "Solo i dispositivi abbinati possono accedere a DSH. cpolar viene installato su richiesta e può essere rimosso completamente; Tailscale può essere lento o non disponibile nelle reti della Cina continentale, dove è consigliato cpolar.",
				builtIn: "Integrato",
				mainlandPreferred: "Preferito in Cina continentale",
				tailscaleDescription: "Copertura più ampia; le reti della Cina continentale possono essere instabili. Il primo collegamento richiede accesso e autorizzazione Funnel.",
				cpolarDescription: "Installa su richiesta il componente ufficiale, adatto alle reti della Cina continentale.",
				prepareCpolar: "Prepara cpolar",
				checkingComponent: "Controllo componente…",
				installOfficial: "Installa componente ufficiale",
				cpolarAccountNote: "Accedi al sito cpolar e copia l’Authtoken. Il token resta solo nella directory privata del plugin e non viene mostrato nella pagina o nei log.",
				registerCpolar: "Registrati su cpolar",
				openDashboard: "Apri la dashboard per il token",
				tokenPlaceholder: "Incolla Authtoken cpolar",
				saveConnect: "Salva e connetti",
				saving: "Salvataggio…",
				componentDetails: "Origine e rimozione del componente",
				componentDetailsText: "Viene scaricato dal sito ufficiale cpolar e verificato a una versione fissa solo dopo aver scelto Installa. Non aggiunge servizi di sistema, avvio automatico, voci di registro o PATH.",
				pluginPrivateDirectory: "Directory privata del plugin",
				officialDownload: "Pagina download ufficiale",
				terms: "Termini di servizio",
				purgeCpolar: "Rimuovi completamente componente e configurazione cpolar",
				tailscaleHelp: "Guida a Tailscale",
				tailscaleHelpText: "Il componente runtime è incluso nel plugin. Il primo collegamento apre le pagine ufficiali di accesso Tailscale e autorizzazione Funnel; il plugin non accede mai alla password.",
				funnelGuideAria: "Passaggi per abilitare Tailscale Funnel",
				funnelGuideTitle: "Configurazione accesso remoto · Passaggio 2",
				funnelGuideSummary: "L’accesso Tailscale è completato. Devi ancora consentire Funnel per questo computer; la pagina ufficiale abilita anche HTTPS.",
				funnelStep1: "Apri la pagina ufficiale di autorizzazione Tailscale per questo nodo.",
				funnelStep2: "Conferma Funnel; non serve accedere di nuovo a DSH.",
				funnelStep3: "Torna in DSH; il plugin controlla e si connette automaticamente.",
				funnelGuideNote: "Richiede un account Owner, Admin o Network admin.",
				continueFunnel: "Continua autorizzazione Funnel",
				retryNow: "Fatto, riprova ora",
				enableRemote: "Attiva accesso remoto",
				disableRemote: "Disattiva accesso remoto",
				continueLogin: "Continua accesso",
				reconnect: "Riconnetti",
				generateRemoteQr: "Genera QR di abbinamento remoto",
				copyRemoteLink: "Copia link di abbinamento remoto",
				manageRemoteDevices: "Gestisci dispositivi remoti",
				resetRemoteLogin: "Esci e rimuovi accesso remoto",
				resetRemoteDevices: "Disattiva e rimuovi dispositivi remoti",
				lanOn: "Accesso dalla rete locale attivo.",
				lanOff: "Accesso dalla rete locale disattivato.",
				enableLan: "Attiva accesso rete locale",
				disableLan: "Disattiva accesso rete locale",
				extensionsLoaded: "Estensioni: {loaded} caricate",
				extensionsFailed: "Estensioni: {loaded} caricate, {failed} non riuscite",
				keyGenerationFailed: "Impossibile generare la chiave di abbinamento.",
				keyCopied: "Chiave di abbinamento copiata. Incollala nell’app Android.",
				linkCopied: "Link di abbinamento copiato. Invialo al telefono e incollalo nell’app oppure aprilo nel browser.",
				copySecret: "Copia {kind}: {value}",
				pairingKey: "chiave di abbinamento",
				pairingLink: "link di abbinamento",
				noDevices: "Nessun dispositivo abbinato.",
				noRemoteDevices: "Nessun dispositivo remoto abbinato.",
				device: "Dispositivo",
				expires: "Scade {time}",
				revoke: "Revoca",
				confirmResetDevices: "Rimuovere tutti i dispositivi abbinati? I dispositivi connessi verranno disconnessi subito.",
				ready: "Pronto",
				installed: "Installato",
				installWithSize: "Installa componente ufficiale · {size} MB",
				cpolarUnsupported: "Attualmente è supportato solo Windows x64. Puoi comunque usare Tailscale Funnel integrato.",
				cpolarNotInstalled: "Non installato. Una versione fissa viene scaricata dal sito ufficiale cpolar solo dopo aver premuto il pulsante.",
				cpolarNeedsToken: "Componente ufficiale {version} verificato. Salva il token account per continuare.",
				cpolarReady: "Componente ufficiale {version} e configurazione account locale pronti. Gli indirizzi temporanei gratuiti possono cambiare dopo il riavvio di DSH o cpolar; se l’app non si connette, scansiona di nuovo il QR remoto corrente.",
				remoteOff: "Accesso remoto disattivato. La rete locale non è interessata.",
				remoteUnavailableCpolar: "cpolar non è installato o l’account locale non è configurato.",
				remoteUnavailableTailscale: "Su questo computer manca il componente runtime Funnel. Reinstalla il pacchetto completo del plugin.",
				remoteStartingCpolar: "Connessione a un nodo cpolar…",
				remoteStartingTailscale: "Avvio del canale sicuro Tailscale…",
				remoteNeedsLogin: "Completa una volta l’accesso Tailscale nel browser. Il plugin non legge mai la password.",
				remoteConnectingCpolar: "Indirizzo pubblico assegnato; avvio del gateway di autenticazione DSH…",
				remoteConnectingTailscale: "Accesso completato; creazione dell’indirizzo HTTPS pubblico…",
				remoteReady: "Accesso remoto pronto. Solo i dispositivi abbinati possono accedere a DSH.",
				remoteError: "Connessione remota non stabilita. Riconnettiti; la rete locale continua a funzionare.",
				funnelPermission: "Accesso completato. Autorizza Funnel per stabilire automaticamente la connessione remota.",
				funnelHttps: "Accesso completato. Autorizza Funnel; la pagina ufficiale abilita anche HTTPS.",
				funnelStart: "Accesso completato. Termina la prima autorizzazione Tailscale Funnel.",
				tailscaleDnsMissing: "Tailscale non ha fornito un indirizzo remoto. Riconnettiti e verifica di aver completato l’accesso.",
				gatewayStartFailed: "Avvio del gateway remoto non riuscito. Riconnettiti; la rete locale non è interessata.",
				controlChannelFailed: "Connessione al componente remoto interrotta. Riconnettiti.",
				cpolarMissing: "Il componente ufficiale cpolar non è installato. Completa i passaggi sopra.",
				cpolarInvalid: "Verifica del componente cpolar non riuscita. Rimuovilo completamente e reinstallalo.",
				cpolarConfigMissing: "Nessun token account cpolar salvato. Completa i passaggi sopra.",
				cpolarConfigInvalid: "Configurazione locale cpolar non valida. Salva nuovamente il token.",
				cpolarPortUnavailable: "Impossibile assegnare una porta locale al gateway remoto. Riprova.",
				cpolarLaunchFailed: "Avvio del client cpolar non riuscito.",
				cpolarTimeout: "Connessione al nodo cpolar scaduta. Riconnettiti.",
				cpolarStopped: "Connessione cpolar arrestata.",
				cpolarExited: "Connessione cpolar terminata inaspettatamente. Riconnettiti.",
				cpolarOutputInvalid: "cpolar ha restituito uno stato non riconosciuto.",
				cpolarOriginInvalid: "L’indirizzo pubblico restituito da cpolar non ha superato la verifica.",
				setupOpened: "La pagina ufficiale Tailscale è aperta. Torna in DSH dopo aver abilitato Funnel; la riconnessione è automatica.",
				switchProviderConfirm: "Il cambio di metodo disattiva prima il canale remoto corrente. Rete locale e dispositivi abbinati non sono interessati. Continuare?",
				switchingCpolar: "Passaggio a cpolar…",
				switchingTailscale: "Passaggio a Tailscale Funnel…",
				installConfirm: "Scaricare e verificare una versione fissa dal sito ufficiale cpolar (circa 7,3 MB), estraendola solo nella directory privata DSH Mobile? Non vengono aggiunti servizi, PATH/registro o avvio automatico.",
				downloading: "Download e verifica…",
				installingCpolar: "Installazione del componente ufficiale cpolar. Mantieni DSH in esecuzione fino al termine.",
				installFailed: "Installazione componente non riuscita: {error}",
				invalidToken: "Incolla l’Authtoken completo dalla dashboard cpolar.",
				configuredConnecting: "Configurazione account salvata; connessione tramite cpolar…",
				configureFailed: "Configurazione non riuscita: {error}",
				purgeConfirm: "Rimuovere completamente componente cpolar, configurazione token e log runtime dalla directory privata DSH Mobile? Rete locale, dati DSH e altri programmi non sono interessati.",
				purging: "Arresto del canale e rimozione dei file cpolar gestiti da DSH Mobile…",
				purgeFailed: "Pulizia non riuscita: {error}",
				reconnectingCpolar: "Riconnessione a un nodo cpolar…",
				reconnectingTailscale: "Controllo impostazioni Tailscale e riconnessione…",
				remoteQrReady: "QR di abbinamento remoto generato. Scansionalo da “Accesso remoto” nell’app.",
				resetCpolarConfirm: "Disattivare il canale remoto cpolar e rimuovere tutti i dispositivi remoti? Account cpolar e altri tunnel restano invariati.",
				resetTailscaleConfirm: "Uscire da Tailscale su questo computer e rimuovere tutti i dispositivi remoti? La configurazione della rete locale resta invariata.",
				requestFailed: "Richiesta non riuscita: {error}",
				wsPathsTitle: "Percorsi WebSocket di terze parti",
				wsPathsIntro: "Quando un plugin installato non riesce a connettersi (per esempio un terminale laterale o un pannello live), di solito è perché i suoi percorsi di connessione non sono ancora stati approvati. Tutto ciò che richiede attenzione è elencato qui sotto: un clic su “Consenti” risolve.",
				wsPathsPlaceholder: "/sidebar/ws/terminal",
				wsPathsAdd: "Consenti percorso",
				wsPathsRemove: "Rimuovi",
				wsPathsEmpty: "Non serve configurare nulla per ora. Se in seguito un plugin non riesce a connettersi, qui compariranno opzioni con un clic.",
				wsPathsInvalid: "Inserisci un percorso esatto che inizi con / (senza query).",
				wsPathsDetected: "Una connessione di un plugin è stata bloccata — premi Consenti per lasciarla passare",
				wsPathsAllow: "Consenti",
				wsPathsAllowAll: "Consenti tutti",
				wsPathsGroupMeta: "{n} percorsi · bloccati {m} volte",
				wsPathsNewBlocked: "Nuove connessioni di terze parti bloccate — apri la diagnostica",
				wsPathsAdvancedToggle: "Aggiungi percorsi manualmente (avanzato)",
				wsPathsAnnounce: "{n} connessioni di plugin in attesa di approvazione",
				wsPathsAdvancedHint: "Le voci manuali servono raramente: usa i pulsanti qui sopra. Compila solo se conosci il percorso esatto."
			},
			zh: {}
		};
		Object.assign(MOBILE_CONTROL_MESSAGES.zh, {
			mobileAccess: "移动访问",
			collapseMobileAccess: "收起移动访问",
			downloadAndroid: "下载最新 Android App",
			downloadAndroidVersion: "下载最新 Android App · v{version}",
			downloadAndroidAria: "从 GitHub Releases 下载最新版 Android App",
			downloadAndroidVersionAria: "从 GitHub Releases 下载 Android App v{version}",
			updatePlugin: "更新插件",
			updatePluginAria: "将 DSH Mobile 更新至 v{version}",
			updatingPlugin: "正在更新…",
			pluginUpdatedRestart: "插件已更新至 v{version}，重启 DSH 后生效。",
			pluginUpdateFailed: "更新失败：{error}",
			updateTo: "更新到 v{version}",
			updateNotesHeading: "更新内容",
			updateNotice: "安装后需重启 DSH。现有 App 与已配对设备无需重新配对；电脑端版本不确定时，先对照 README 兼容表。",
			updateNotesEmpty: "未取到最新版更新说明，仍可继续更新；详情见 GitHub Release 页。",
			updateNow: "立即更新",
			updateLater: "暂不",
			lan: "局域网",
			remote: "远程",
			lanAccess: "局域网访问",
			remoteAccess: "远程访问",
			browserAccess: "浏览器访问",
			remoteAddress: "远程地址",
			loadingStatus: "正在读取状态…",
			loadingRemoteStatus: "正在读取远程状态…",
			generateCopyKey: "生成并复制密钥",
			copyPairLink: "复制配对链接",
			managePairedDevices: "管理配对设备",
			clearAllDevices: "清除所有设备",
			pairingQr: "配对二维码",
			remoteIntro: "选择更适合你的远程通道。切换或关闭远程访问不会影响局域网。",
			chooseProvider: "选择连接方式",
			currentProvider: "当前连接",
			remoteStateOff: "未启用",
			remoteStateConnecting: "连接中",
			remoteStateAttention: "需处理",
			providerInfoAria: "查看远程连接安全与网络说明",
			providerGroupAria: "远程连接方式",
			providerSafeTitle: "你始终可以放心",
			providerSafeText: "只有已配对设备能进入 DSH。cpolar 按需安装并可彻底清理；Tailscale 在中国大陆网络下可能连接缓慢、中断或无法使用，国内网络建议优先尝试 cpolar。",
			builtIn: "内置",
			mainlandPreferred: "国内网络优先",
			tailscaleDescription: "覆盖更广；中国大陆网络可能不稳定，首次需登录并允许 Funnel。",
			cpolarDescription: "按需安装官方组件，适合国内网络环境。",
			prepareCpolar: "准备 cpolar",
			checkingComponent: "正在检查组件…",
			installOfficial: "安装官方组件",
			cpolarAccountNote: "登录 cpolar 官网后复制 Authtoken。令牌只保存在本机插件私有目录，不会显示在页面或日志中。",
			registerCpolar: "注册 cpolar",
			openDashboard: "打开控制台获取令牌",
			tokenPlaceholder: "粘贴 cpolar Authtoken",
			saveConnect: "保存并连接",
			saving: "正在保存…",
			componentDetails: "组件来源与清理说明",
			componentDetailsText: "仅在你点击安装后从 cpolar 官网下载并校验固定版本。不会写入系统服务、开机启动、注册表或 PATH。",
			pluginPrivateDirectory: "插件私有目录",
			officialDownload: "官方下载安装页",
			terms: "服务条款",
			purgeCpolar: "彻底移除 cpolar 组件与配置",
			tailscaleHelp: "Tailscale 使用说明",
			tailscaleHelpText: "运行组件已随插件提供。首次连接会打开 Tailscale 官方登录和 Funnel 授权页；插件不会接触你的账号密码。",
			funnelGuideAria: "Tailscale Funnel 启用步骤",
			funnelGuideTitle: "远程访问设置 · 第 2 步",
			funnelGuideSummary: "Tailscale 登录已完成。还需为这台电脑允许 Funnel，官方页面会同时启用 HTTPS。",
			funnelStep1: "打开当前节点的 Tailscale 官方授权页。",
			funnelStep2: "确认启用 Funnel；无需再次登录 DSH。",
			funnelStep3: "返回 DSH，插件会自动检查并建立连接。",
			funnelGuideNote: "需要使用 Owner、Admin 或 Network admin 账号。",
			continueFunnel: "继续完成 Funnel 授权",
			retryNow: "已完成，立即重试",
			enableRemote: "启用远程访问",
			disableRemote: "关闭远程访问",
			continueLogin: "继续登录",
			reconnect: "重新连接",
			generateRemoteQr: "生成远程配对二维码",
			copyRemoteLink: "复制远程配对链接",
			manageRemoteDevices: "管理远程设备",
			resetRemoteLogin: "退出并清除远程登录",
			resetRemoteDevices: "关闭并清除远程设备",
			lanOn: "局域网访问已开启。",
			lanOff: "局域网访问已关闭。",
			enableLan: "开启局域网访问",
			disableLan: "关闭局域网访问",
			extensionsLoaded: "扩展：{loaded} 个已加载",
			extensionsFailed: "扩展：{loaded} 个已加载，{failed} 个加载失败",
			keyGenerationFailed: "无法生成配对密钥。",
			keyCopied: "配对密钥已复制，请粘贴到 Android App。",
			linkCopied: "配对链接已复制，发给手机后 App 粘贴或浏览器打开即可配对。",
			copySecret: "请复制{kind}：{value}",
			pairingKey: "配对密钥",
			pairingLink: "配对链接",
			noDevices: "暂无配对设备。",
			noRemoteDevices: "暂无远程配对设备。",
			device: "设备",
			expires: "到期 {time}",
			revoke: "撤销",
			confirmResetDevices: "确定要移除所有配对设备吗？此操作会立即终止已连接设备。",
			ready: "已就绪",
			installed: "已安装",
			installWithSize: "安装官方组件 · {size} MB",
			cpolarUnsupported: "当前仅支持 Windows x64。你仍可选择内置的 Tailscale Funnel。",
			cpolarNotInstalled: "尚未安装。只有点击下方按钮后，才会从 cpolar 官网下载固定版本。",
			cpolarNeedsToken: "官方组件 {version} 已校验，下一步只需保存账号令牌。",
			cpolarReady: "官方组件 {version} 与本机账号配置已就绪。免费临时地址可能在 DSH 或 cpolar 重启后变化；App 无法连接时，请重新扫描当前远程二维码。",
			remoteOff: "远程访问未启用。局域网访问不受影响。",
			remoteUnavailableCpolar: "cpolar 尚未安装或未完成本机账号配置。",
			remoteUnavailableTailscale: "当前电脑缺少 Funnel 运行组件，请重新安装完整插件包。",
			remoteStartingCpolar: "正在连接 cpolar 国内节点…",
			remoteStartingTailscale: "正在启动 Tailscale 安全通道…",
			remoteNeedsLogin: "需要在浏览器完成一次 Tailscale 登录。插件不会读取你的密码。",
			remoteConnectingCpolar: "公网地址已分配，正在启动 DSH 认证网关…",
			remoteConnectingTailscale: "登录完成，正在建立公开 HTTPS 地址…",
			remoteReady: "远程访问已就绪。只有已配对设备可以进入 DSH。",
			remoteError: "远程连接未建立。可重新连接，局域网访问仍可正常使用。",
			funnelPermission: "登录已完成。请继续授权 Funnel，完成后会自动建立远程连接。",
			funnelHttps: "登录已完成。请继续授权 Funnel，官方页面会同时启用 HTTPS。",
			funnelStart: "登录已完成。请继续完成 Tailscale Funnel 的首次授权。",
			tailscaleDnsMissing: "Tailscale 暂未提供远程地址。请重新连接并确认已完成登录。",
			gatewayStartFailed: "远程网关启动失败。请重新连接，局域网访问不受影响。",
			controlChannelFailed: "远程组件连接中断。请重新连接。",
			cpolarMissing: "cpolar 官方组件尚未安装。请先完成上方准备步骤。",
			cpolarInvalid: "cpolar 组件校验失败。请彻底移除后重新安装。",
			cpolarConfigMissing: "cpolar 尚未保存账号令牌。请先完成上方准备步骤。",
			cpolarConfigInvalid: "cpolar 本机配置无效。请重新保存账号令牌。",
			cpolarPortUnavailable: "无法分配本机远程网关端口，请重试。",
			cpolarLaunchFailed: "cpolar 客户端未能启动。",
			cpolarTimeout: "连接 cpolar 国内节点超时，请重新连接。",
			cpolarStopped: "cpolar 连接已停止。",
			cpolarExited: "cpolar 连接意外退出，请重新连接。",
			cpolarOutputInvalid: "cpolar 返回了无法识别的状态。",
			cpolarOriginInvalid: "cpolar 返回的公网地址未通过校验。",
			setupOpened: "Tailscale 官方页面已打开。完成启用后返回 DSH，这里会自动重新连接。",
			switchProviderConfirm: "切换连接方式会先关闭当前远程通道。局域网和配对设备不会受影响，是否继续？",
			switchingCpolar: "正在切换到 cpolar…",
			switchingTailscale: "正在切换到 Tailscale Funnel…",
			installConfirm: "将从 cpolar 官方网站下载并校验固定版本（约 7.3 MB），仅解压到 DSH Mobile 私有目录。不会安装系统服务、写入 PATH/注册表或设置开机启动。是否继续？",
			downloading: "正在下载并校验…",
			installingCpolar: "正在安装 cpolar 官方组件。完成前请保持 DSH 运行。",
			installFailed: "组件安装失败：{error}",
			invalidToken: "请粘贴 cpolar 控制台提供的完整 Authtoken。",
			configuredConnecting: "账号配置已保存，正在建立 cpolar 远程通道…",
			configureFailed: "配置失败：{error}",
			purgeConfirm: "彻底移除 DSH Mobile 私有目录中的 cpolar 组件、令牌配置和运行日志？不会影响局域网、DSH 数据或系统中的其他程序。",
			purging: "正在关闭通道并清理 DSH Mobile 管理的 cpolar 文件…",
			purgeFailed: "清理失败：{error}",
			reconnectingCpolar: "正在重新连接 cpolar 国内节点…",
			reconnectingTailscale: "正在确认 Tailscale 设置并重新连接…",
			remoteQrReady: "远程配对二维码已生成。请在 App 的“远程访问”中扫描。",
			resetCpolarConfirm: "关闭 cpolar 远程通道并移除所有远程配对设备？不会修改你的 cpolar 账号或其他隧道。",
			resetTailscaleConfirm: "退出电脑上的 Tailscale 登录并移除所有远程配对设备？局域网配置不会改变。",
			requestFailed: "请求失败：{error}",
			wsPathsTitle: "第三方 WebSocket 路径",
			wsPathsIntro: "插件（如侧边栏终端、实时面板）连不上时，通常是它的连接路径还没放行。下面列出需要处理的项，点「允许」即可。",
			wsPathsPlaceholder: "/sidebar/ws/terminal",
			wsPathsAdd: "允许该路径",
			wsPathsRemove: "移除",
			wsPathsEmpty: "目前无需任何设置。以后有插件连不上，会在这里出现可一键放行的选项。",
			wsPathsInvalid: "请输入以 / 开头的确切路径（不带 query）。",
			wsPathsDetected: "有插件连接被拦截——点「允许」放行",
			wsPathsAllow: "允许",
			wsPathsAllowAll: "全部允许",
			wsPathsGroupMeta: "{n} 条路径 · 共拦截 {m} 次",
			wsPathsNewBlocked: "发现被拦截的第三方连接，去诊断页查看",
			wsPathsAdvancedToggle: "手动添加路径（高级）",
			wsPathsAnnounce: "{n} 条插件连接等待放行",
			wsPathsAdvancedHint: "通常不需要手动填写：用上方按钮即可。只有当你确切知道所需路径时才填。"
		});
		Object.assign(MOBILE_CONTROL_MESSAGES.en, {
			selfHostedConnections: "Self-hosted connection",
			selfHostedDescription: "For users with a VPS and domain. It does not depend on public tunnel bandwidth.",
			advanced: "Advanced",
			frpName: "Self-hosted FRP",
			frpDescription: "A restricted FRP channel for this DSH gateway only. You manage the VPS and public domain.",
			chmlfrpName: "ChmlFrp",
			chmlfrpDescription: "Hosted FRP platform. Paste the frpc.ini generated by the ChmlFrp panel; no VPS is required.",
			chmlfrpInstallClient: "Install ChmlFrp client",
			chmlfrpInstallConfirm: "Download and verify the pinned ChmlFrp client {version} (about {size} MB) from the official ChmlFrp download host? Only the client is extracted into the DSH Mobile private directory.",
			chmlfrpClientReady: "ChmlFrp client {version} is verified.",
			chmlfrpClientMissing: "The ChmlFrp client is not installed. Nothing is downloaded until you click Install.",
			chmlfrpIniLabel: "frpc.ini from the ChmlFrp panel",
			chmlfrpIniPlaceholder: "Paste the whole generated frpc.ini here, including the [common] section.",
			chmlfrpIniRequired: "Paste the frpc.ini generated by the ChmlFrp panel first.",
			chmlfrpConfigured: "ChmlFrp settings are saved.",
			chmlfrpPurge: "Remove ChmlFrp client and settings",
			chmlfrpPurgeConfirm: "Stop FRP and remove the ChmlFrp client, saved credentials, generated frpc.ini, staging files, and logs owned by DSH Mobile? Your ChmlFrp account and tunnels are unchanged.",
			prepareFrp: "Configure self-hosted FRP",
			frpStep1Title: "1 · Connection details",
			frpStep1Text: "Enter the VPS address, frps control port, shared token, and public HTTPS origin.",
			frpServerAddress: "VPS address",
			frpServerAddressPlaceholder: "frp.example.com",
			frpServerPort: "frps port",
			frpToken: "Shared token",
			frpTokenPlaceholder: "At least 16 characters",
			frpPublicOrigin: "Public HTTPS origin",
			frpPublicOriginPlaceholder: "https://dsh.example.com",
			frpStep2Title: "2 · Prepare the VPS",
			frpStep2Text: "Copy the restricted frps and Caddy template, then apply it on your VPS.",
			copyServerTemplate: "Copy server template",
			templateCopied: "Server template copied. Save frps.toml and the Caddy snippet on the VPS, then add the import line to the Caddyfile.",
			templateCopyFailed: "Could not copy the template. Check the four fields above.",
			vpsDeployText: "Use an existing OpenSSH key or agent. The VPS must be Ubuntu/Debian with systemd; existing Caddy site configuration is never overwritten.",
			vpsDeployChangesTitle: "Automatic deployment will change the following on the VPS (manual template changes nothing by itself):",
			vpsDeployChangePackages: "Install Caddy from its official APT repository, plus a Python venv and Certbot for public-IPv4 certificates.",
			vpsDeployChangeServices: "Create the dsh-mobile system user (only if missing, otherwise kept), the frps config and service, the Caddy snippet plus one import line, and a daily certificate-renewal timer.",
			vpsDeployChangeFirewall: "Open the FRP control port, 80/tcp, and 443/tcp in UFW when it is active; other firewalls are left for you to adjust.",
			vpsDeployChangeManual: "Manual deployment applies the same steps by hand from the copied template; automatic deployment runs them over SSH after you confirm the host keys.",
			vpsSshUser: "SSH user",
			vpsSshPort: "SSH port",
			vpsSshKey: "Private key path (optional)",
			vpsSshKeyPlaceholder: "Uses ssh-agent or ~/.ssh/config when empty",
			vpsDeploy: "Deploy frps + Caddy",
			vpsDeploying: "Deploying to the VPS. Keep DSH running…",
			vpsDeploySuccess: "VPS deployment completed. Start FRP connection to verify the public endpoint.",
			vpsDeployFailed: "VPS deployment failed: {error}",
			vpsDeployNotReady: "Save the FRP settings before deploying the VPS.",
			vpsHostKeyFetching: "Reading the VPS host keys…",
			vpsHostKeyFailed: "Could not read the VPS host keys: {error}",
			vpsDeployConfirmWithKeys: "Deploy DSH Mobile frps and Caddy to this VPS? Only DSH Mobile service/config files and firewall rules will be created. Existing non-empty Caddy configuration will stop the deployment.\n\nThe server presents these host keys. Confirm they match the VPS console before continuing:\n{fingerprints}",
			vpsCopyUninstall: "Copy VPS uninstall script",
			vpsUninstallScriptCopied: "Uninstall script copied. Review it before running with root on the VPS.",
			vpsUninstallScriptFailed: "Could not build the uninstall script: {error}",
			vpsUninstall: "Remove DSH Mobile from the VPS",
			vpsUninstallConfirmWithKeys: "Remove all DSH Mobile services, configs, certificates, and owned firewall rules from this VPS? Your own Caddy content and unrelated rules are kept.\n\nThe server presents these host keys. Confirm they match the VPS console before continuing:\n{fingerprints}",
			vpsUninstalling: "Removing DSH Mobile from the VPS. Keep DSH running…",
			vpsUninstallSuccess: "VPS cleanup completed. The local FRP settings are unchanged.",
			vpsUninstallFailed: "VPS cleanup failed: {error}",
			frpStep3Title: "3 · Prepare this computer",
			frpStep3Text: "Download and verify the pinned official frpc client only when requested.",
			installFrpc: "Install official frpc",
			frpInstallConfirm: "Download and verify official frpc 0.70.1 (about {size} MB), extracting only frpc to the DSH Mobile private directory? No service, PATH entry, or startup item is added.",
			installingFrp: "Installing the official frpc component. Keep DSH running until it completes.",
			frpNotInstalled: "frpc is not installed. Nothing is downloaded until you click Install.",
			frpUnsupported: "This desktop platform is not supported by the managed frpc installer.",
			frpComponentReady: "Official frpc {version} is verified.",
			frpStep4Title: "4 · Verify and connect",
			frpStep4Text: "The plugin starts only its DSH HTTP vhost and verifies the public endpoint belongs to this computer.",
			frpAppRequirement: "Custom remote domains require Android app 0.3.3 or later; local network, cpolar, and Tailscale remain compatible with older supported apps.",
			frpSaveConnect: "Save and verify connection",
			frpSavingConnecting: "Saving the private settings and verifying the complete FRP path…",
			frpConfigurationReady: "Server settings are saved. The token remains only in the plugin private directory.",
			frpConfigurationMissing: "Complete all fields, copy the VPS template, then save and connect.",
			frpInputInvalid: "Check the VPS address, port, HTTPS origin, and token.",
			frpComponentDetails: "FRP source and complete cleanup",
			frpComponentDetailsText: "The pinned client is downloaded from the official fatedier/frp release. DSH Mobile never installs a service or accepts arbitrary FRP configuration.",
			frpOfficialRelease: "Official FRP release",
			purgeFrp: "Remove FRP component and private configuration",
			purgeFrpConfirm: "Stop FRP and remove frpc, the shared token, generated configuration, staging files, and logs owned by DSH Mobile? The VPS is unchanged.",
			purgingFrp: "Stopping FRP and removing files managed by DSH Mobile…",
			switchingFrp: "Switching to self-hosted FRP…",
			reconnectingFrp: "Verifying and reconnecting self-hosted FRP…",
			resetFrpConfirm: "Disable self-hosted FRP and remove all remote paired devices? The saved VPS settings and server are unchanged.",
			remoteUnavailableFrp: "frpc is not installed or the private server settings are incomplete.",
			remoteStartingFrp: "Checking the VPS and preparing the restricted FRP channel…",
			remoteConnectingFrp: "frpc is running; verifying the public HTTPS endpoint…",
			frpMissing: "Install the official frpc component first.",
			frpInvalid: "frpc verification failed. Remove it completely and reinstall.",
			frpConfigMissing: "Save the self-hosted FRP connection details first.",
			frpConfigVerifyFailed: "frpc rejected the generated configuration. Check the server details and token.",
			frpVhostPublic: "The VPS plaintext HTTP vhost is publicly reachable. Bind it to 127.0.0.1 and let Caddy provide HTTPS.",
			frpVhostProbeFailed: "The VPS address could not be checked. Confirm DNS and retry.",
			frpLaunchFailed: "frpc failed to start.",
			frpTimeout: "The public endpoint did not become ready. Check frps, Caddy, DNS, and firewall.",
			frpDiscoveryMismatch: "The public domain points to another DSH computer. Check the Caddy and frps mappings.",
			frpDiscoveryInvalid: "The public domain did not return a valid DSH Mobile discovery response.",
			frpStopped: "The FRP connection stopped.",
			frpExited: "frpc exited unexpectedly. Check the VPS configuration and reconnect."
		});
		Object.assign(MOBILE_CONTROL_MESSAGES.it, {
			selfHostedConnections: "Connessione autogestita",
			selfHostedDescription: "Per chi dispone di VPS e dominio. Non dipende dalla banda dei tunnel pubblici.",
			advanced: "Avanzato",
			frpName: "FRP autogestito",
			frpDescription: "Canale FRP limitato al solo gateway DSH. VPS e dominio pubblico restano sotto il tuo controllo.",
			chmlfrpName: "ChmlFrp",
			chmlfrpDescription: "Piattaforma FRP ospitata. Incolla il frpc.ini generato dal pannello ChmlFrp; nessun VPS richiesto.",
			chmlfrpInstallClient: "Installa il client ChmlFrp",
			chmlfrpInstallConfirm: "Scaricare e verificare il client ChmlFrp {version} (circa {size} MB) dall’host ufficiale ChmlFrp? Solo il client viene estratto nella directory privata DSH Mobile.",
			chmlfrpClientReady: "Client ChmlFrp {version} verificato.",
			chmlfrpClientMissing: "Il client ChmlFrp non è installato. Nulla viene scaricato finché non scegli Installa.",
			chmlfrpIniLabel: "frpc.ini dal pannello ChmlFrp",
			chmlfrpIniPlaceholder: "Incolla qui l’intero frpc.ini generato, inclusa la sezione [common].",
			chmlfrpIniRequired: "Incolla prima il frpc.ini generato dal pannello ChmlFrp.",
			chmlfrpConfigured: "Impostazioni ChmlFrp salvate.",
			chmlfrpPurge: "Rimuovi client e impostazioni ChmlFrp",
			chmlfrpPurgeConfirm: "Arrestare FRP e rimuovere il client ChmlFrp, le credenziali salvate, il frpc.ini generato, i file temporanei e i log gestiti da DSH Mobile? Account e tunnel ChmlFrp restano invariati.",
			prepareFrp: "Configura FRP autogestito",
			frpStep1Title: "1 · Dati di connessione",
			frpStep1Text: "Inserisci indirizzo VPS, porta di controllo frps, token condiviso e origine HTTPS pubblica.",
			frpServerAddress: "Indirizzo VPS",
			frpServerAddressPlaceholder: "frp.example.com",
			frpServerPort: "Porta frps",
			frpToken: "Token condiviso",
			frpTokenPlaceholder: "Almeno 16 caratteri",
			frpPublicOrigin: "Origine HTTPS pubblica",
			frpPublicOriginPlaceholder: "https://dsh.example.com",
			frpStep2Title: "2 · Prepara il VPS",
			frpStep2Text: "Copia il modello limitato per frps e Caddy e applicalo sul VPS.",
			copyServerTemplate: "Copia modello server",
			templateCopied: "Modello server copiato. Salva frps.toml e lo snippet Caddy sul VPS, poi aggiungi la riga import al Caddyfile.",
			templateCopyFailed: "Impossibile copiare il modello. Controlla i quattro campi sopra.",
			vpsDeployText: "Usa una chiave OpenSSH o un agent esistente. Il VPS deve essere Ubuntu/Debian con systemd; una configurazione Caddy non vuota non viene sovrascritta.",
			vpsDeployChangesTitle: "Il deploy automatico modifica quanto segue sul VPS (il modello manuale da solo non cambia nulla):",
			vpsDeployChangePackages: "Installa Caddy dal repository APT ufficiale, più un venv Python e Certbot per i certificati IPv4 pubblici.",
			vpsDeployChangeServices: "Crea l’utente di sistema dsh-mobile (solo se assente, altrimenti mantenuto), la configurazione e il servizio frps, lo snippet Caddy più una riga import, e un timer giornaliero di rinnovo certificati.",
			vpsDeployChangeFirewall: "Apre la porta di controllo FRP, 80/tcp e 443/tcp in UFW quando attivo; gli altri firewall restano a tuo carico.",
			vpsDeployChangeManual: "Il deploy manuale applica gli stessi passi a mano dal modello copiato; quello automatico li esegue via SSH dopo la conferma delle chiavi host.",
			vpsSshUser: "Utente SSH",
			vpsSshPort: "Porta SSH",
			vpsSshKey: "Percorso chiave privata (opzionale)",
			vpsSshKeyPlaceholder: "Usa ssh-agent o ~/.ssh/config se vuoto",
			vpsDeploy: "Installa frps + Caddy",
			vpsDeploying: "Deploy sul VPS in corso. Mantieni DSH attivo…",
			vpsDeploySuccess: "Deploy VPS completato. Avvia FRP per verificare l’endpoint pubblico.",
			vpsDeployFailed: "Deploy VPS fallito: {error}",
			vpsDeployNotReady: "Salva le impostazioni FRP prima del deploy VPS.",
			vpsHostKeyFetching: "Lettura delle chiavi host del VPS…",
			vpsHostKeyFailed: "Impossibile leggere le chiavi host del VPS: {error}",
			vpsDeployConfirmWithKeys: "Installare frps e Caddy DSH Mobile su questo VPS? Verranno creati solo file di servizio/configurazione e regole firewall DSH Mobile. Una configurazione Caddy esistente non vuota interromperà il deploy.\n\nIl server presenta queste chiavi host. Verifica che corrispondano alla console del VPS prima di continuare:\n{fingerprints}",
			vpsCopyUninstall: "Copia script di disinstallazione VPS",
			vpsUninstallScriptCopied: "Script di disinstallazione copiato. Controllalo prima di eseguirlo come root sul VPS.",
			vpsUninstallScriptFailed: "Impossibile creare lo script di disinstallazione: {error}",
			vpsUninstall: "Rimuovi DSH Mobile dal VPS",
			vpsUninstallConfirmWithKeys: "Rimuovere tutti i servizi, le configurazioni, i certificati e le regole firewall di DSH Mobile da questo VPS? I tuoi contenuti Caddy e le altre regole restano invariati.\n\nIl server presenta queste chiavi host. Verifica che corrispondano alla console del VPS prima di continuare:\n{fingerprints}",
			vpsUninstalling: "Rimozione di DSH Mobile dal VPS. Mantieni DSH attivo…",
			vpsUninstallSuccess: "Pulizia VPS completata. Le impostazioni FRP locali restano invariate.",
			vpsUninstallFailed: "Pulizia VPS fallita: {error}",
			frpStep3Title: "3 · Prepara questo computer",
			frpStep3Text: "Scarica e verifica il client frpc ufficiale fissato solo su richiesta.",
			installFrpc: "Installa frpc ufficiale",
			frpInstallConfirm: "Scaricare e verificare frpc ufficiale 0.70.1 (circa {size} MB), estraendo solo frpc nella directory privata DSH Mobile? Non vengono aggiunti servizi, PATH o avvio automatico.",
			installingFrp: "Installazione del componente frpc ufficiale. Mantieni DSH in esecuzione.",
			frpNotInstalled: "frpc non è installato. Non viene scaricato nulla finché non scegli Installa.",
			frpUnsupported: "Questa piattaforma desktop non è supportata dal programma di installazione gestito.",
			frpComponentReady: "frpc ufficiale {version} verificato.",
			frpStep4Title: "4 · Verifica e connetti",
			frpStep4Text: "Il plugin avvia solo il vhost HTTP DSH e verifica che l’endpoint pubblico appartenga a questo computer.",
			frpAppRequirement: "I domini remoti personalizzati richiedono l’app Android 0.3.3 o successiva; rete locale, cpolar e Tailscale restano compatibili con le app precedenti supportate.",
			frpSaveConnect: "Salva e verifica connessione",
			frpSavingConnecting: "Salvataggio privato e verifica del percorso FRP completo…",
			frpConfigurationReady: "Impostazioni server salvate. Il token resta solo nella directory privata del plugin.",
			frpConfigurationMissing: "Completa i campi, copia il modello VPS, quindi salva e connetti.",
			frpInputInvalid: "Controlla indirizzo VPS, porta, origine HTTPS e token.",
			frpComponentDetails: "Origine FRP e rimozione completa",
			frpComponentDetailsText: "Il client fissato viene scaricato dalla release ufficiale fatedier/frp. DSH Mobile non installa servizi e non accetta configurazioni FRP arbitrarie.",
			frpOfficialRelease: "Release FRP ufficiale",
			purgeFrp: "Rimuovi componente FRP e configurazione privata",
			purgeFrpConfirm: "Arrestare FRP e rimuovere frpc, token, configurazione, file temporanei e log gestiti da DSH Mobile? Il VPS non viene modificato.",
			purgingFrp: "Arresto FRP e rimozione dei file gestiti da DSH Mobile…",
			switchingFrp: "Passaggio a FRP autogestito…",
			reconnectingFrp: "Verifica e riconnessione FRP autogestito…",
			resetFrpConfirm: "Disattivare FRP autogestito e rimuovere tutti i dispositivi remoti? Impostazioni VPS e server restano invariati.",
			remoteUnavailableFrp: "frpc non è installato o le impostazioni private sono incomplete.",
			remoteStartingFrp: "Controllo VPS e preparazione del canale FRP limitato…",
			remoteConnectingFrp: "frpc è in esecuzione; verifica dell’endpoint HTTPS pubblico…",
			frpMissing: "Installa prima il componente frpc ufficiale.",
			frpInvalid: "Verifica frpc non riuscita. Rimuovilo e reinstallalo.",
			frpConfigMissing: "Salva prima i dati della connessione FRP.",
			frpConfigVerifyFailed: "frpc ha rifiutato la configurazione generata. Controlla server e token.",
			frpVhostPublic: "Il vhost HTTP in chiaro è raggiungibile pubblicamente. Limitalo a 127.0.0.1 e usa Caddy per HTTPS.",
			frpVhostProbeFailed: "Impossibile controllare il VPS. Verifica il DNS e riprova.",
			frpLaunchFailed: "Avvio di frpc non riuscito.",
			frpTimeout: "Endpoint pubblico non pronto. Controlla frps, Caddy, DNS e firewall.",
			frpDiscoveryMismatch: "Il dominio pubblico punta a un altro computer DSH. Controlla Caddy e frps.",
			frpDiscoveryInvalid: "Il dominio pubblico non ha restituito una risposta DSH Mobile valida.",
			frpStopped: "Connessione FRP arrestata.",
			frpExited: "frpc è terminato inaspettatamente. Controlla il VPS e riconnettiti."
		});
		Object.assign(MOBILE_CONTROL_MESSAGES.zh, {
			selfHostedConnections: "自建连接",
			selfHostedDescription: "适合已有 VPS 的用户，可使用域名或公网 IPv4，不受公共服务带宽限制。",
			advanced: "高级",
			frpName: "自建 FRP",
			frpDescription: "只为当前 DSH 网关建立单用途 FRP 通道，VPS 和公开入口由你掌控。",
			chmlfrpName: "ChmlFrp",
			chmlfrpDescription: "托管 FRP 平台。粘贴 ChmlFrp 面板生成的 frpc.ini 即可，无需 VPS。",
			chmlfrpInstallClient: "安装 ChmlFrp 客户端",
			chmlfrpInstallConfirm: "从 ChmlFrp 官方下载地址获取并校验固定版本客户端 {version}（约 {size} MB）？只提取客户端到 DSH Mobile 私有目录。",
			chmlfrpClientReady: "ChmlFrp 客户端 {version} 已通过校验。",
			chmlfrpClientMissing: "ChmlFrp 客户端尚未安装；点击下方按钮后才会开始下载。",
			chmlfrpIniLabel: "ChmlFrp 面板生成的 frpc.ini",
			chmlfrpIniPlaceholder: "把生成的 frpc.ini 完整粘贴到这里，包括 [common] 段。",
			chmlfrpIniRequired: "请先粘贴 ChmlFrp 面板生成的 frpc.ini。",
			chmlfrpConfigured: "ChmlFrp 连接配置已保存。",
			chmlfrpPurge: "移除 ChmlFrp 客户端与配置",
			chmlfrpPurgeConfirm: "关闭 FRP 并移除 DSH Mobile 管理的 ChmlFrp 客户端、已保存凭据、生成的 frpc.ini、临时文件和日志？你的 ChmlFrp 账号与隧道不受影响。",
			prepareFrp: "配置自建 FRP",
			frpStep1Title: "1 · 连接信息",
			frpStep1Text: "填写中转服务器地址、frps 控制端口、共享 Token 和手机访问地址。没有域名时，可直接使用公网 IPv4。",
			frpServerAddress: "中转服务器地址",
			frpServerAddressPlaceholder: "203.0.113.10",
			frpServerPort: "frps 控制端口",
			frpToken: "共享 Token",
			frpTokenPlaceholder: "已保存时可留空；新建至少 16 个字符",
			frpPublicOrigin: "手机访问地址（HTTPS）",
			frpPublicOriginPlaceholder: "https://203.0.113.10",
			frpStep2Title: "2 · 部署中转服务器",
			frpStep2Text: "推荐通过 SSH 一键部署。需要手动操作时，也可以复制受限的 frps 与 Caddy 配置模板。",
			copyServerTemplate: "复制手动部署模板",
			templateCopied: "服务器模板已复制，请在 VPS 上保存 frps.toml 和 Caddy 片段，并在 Caddyfile 里加一行 import。",
			templateCopyFailed: "无法复制模板，请检查上方连接信息。",
			vpsDeployText: "填写 SSH 登录信息。服务器需为带 systemd 的 Ubuntu/Debian；不会覆盖已有的 Caddy 站点配置。",
			vpsDeployChangesTitle: "自动部署会在 VPS 上做这些改动（只复制手动模板不会改变任何东西）：",
			vpsDeployChangePackages: "从官方 APT 源安装 Caddy，并安装 Python venv 与 Certbot（公网 IP 证书用）。",
			vpsDeployChangeServices: "创建 dsh-mobile 系统用户（如已存在则复用，卸载时保留）、frps 配置与服务、Caddy 片段加一行 import，以及每天自动续证书的定时器。",
			vpsDeployChangeFirewall: "UFW 开启时放行 FRP 控制端口、80/tcp 和 443/tcp；其他防火墙需要你自己放行。",
			vpsDeployChangeManual: "手动部署是照着复制的模板一步步自己操作；自动部署是在你确认主机指纹后通过 SSH 执行同样的步骤。",
			vpsSshUser: "SSH 用户",
			vpsSshPort: "SSH 端口",
			vpsSshKey: "私钥文件路径（可选）",
			vpsSshKeyPlaceholder: "留空则使用 ssh-agent 或 SSH 配置",
			vpsDeploy: "一键部署 frps + Caddy",
			vpsDeploying: "正在部署中转服务器，请保持 DSH 运行…",
			vpsDeploySuccess: "中转服务器部署完成，请继续完成本机组件安装和连接验证。",
			vpsDeployFailed: "VPS 部署失败：{error}",
			vpsDeployNotReady: "请先填写完整的连接信息。",
			vpsHostKeyFetching: "正在读取中转服务器的主机指纹…",
			vpsHostKeyFailed: "读取中转服务器主机指纹失败：{error}",
			vpsDeployConfirmWithKeys: "要在这台 VPS 上部署 DSH Mobile 的 frps 和 Caddy 吗？只会创建 DSH Mobile 自己的服务、配置和防火墙规则；如果已有非空 Caddy 配置，部署会停止并保留原配置。\n\n服务器当前的主机指纹如下，请先到 VPS 控制台核对一致后再继续：\n{fingerprints}",
			vpsCopyUninstall: "复制 VPS 卸载脚本",
			vpsUninstallScriptCopied: "卸载脚本已复制，请审阅后再以 root 身份在 VPS 上执行。",
			vpsUninstallScriptFailed: "生成卸载脚本失败：{error}",
			vpsUninstall: "清理 VPS 上的 DSH Mobile",
			vpsUninstallConfirmWithKeys: "要删除这台 VPS 上的 DSH Mobile 服务、配置、证书和专属防火墙规则吗？你自己的 Caddy 内容和其他规则会保留。\n\n服务器当前的主机指纹如下，请先到 VPS 控制台核对一致后再继续：\n{fingerprints}",
			vpsUninstalling: "正在清理 VPS 上的 DSH Mobile，请保持 DSH 运行…",
			vpsUninstallSuccess: "VPS 清理完成，本机 FRP 设置保持不变。",
			vpsUninstallFailed: "VPS 清理失败：{error}",
			frpStep3Title: "3 · 安装本机组件",
			frpStep3Text: "下载并校验固定版本的官方 frpc，只安装到 DSH Mobile 私有目录。",
			installFrpc: "安装官方 frpc",
			frpInstallConfirm: "从 FRP 官方 Release 下载并校验 frpc 0.70.1（约 {size} MB），只提取 frpc 到 DSH Mobile 私有目录？不会安装服务、写入 PATH 或设置开机启动。",
			installingFrp: "正在安装官方 frpc，完成前请保持 DSH 运行。",
			frpNotInstalled: "frpc 尚未安装；点击下方按钮后才会开始下载。",
			frpUnsupported: "当前桌面平台暂不支持托管安装 frpc。",
			frpComponentReady: "官方 frpc {version} 已安装并通过校验。",
			frpStep4Title: "4 · 启用并验证",
			frpStep4Text: "保存配置、启动受限的 FRP 通道，并确认手机访问地址确实连接到这台电脑。",
			frpAppRequirement: "通过自定义域名或公网 IP 连接，需要 Android App 0.3.3 或更高版本。局域网、cpolar 和 Tailscale 不受影响。",
			frpSaveConnect: "保存配置并验证连接",
			frpSavingConnecting: "正在保存私有配置并验证完整 FRP 链路…",
			frpConfigurationReady: "连接配置已安全保存",
			frpConfigurationMissing: "请按顺序完成连接信息、服务器部署和本机组件安装。",
			frpInputInvalid: "请检查服务器地址、控制端口、手机访问地址和共享 Token。",
			frpComponentDetails: "FRP 来源与彻底清理",
			frpComponentDetailsText: "固定版本客户端来自 fatedier/frp 官方 Release。DSH Mobile 不安装系统服务，也不接受任意 FRP 配置。",
			frpOfficialRelease: "FRP 官方 Release",
			purgeFrp: "彻底移除 FRP 组件与私有配置",
			purgeFrpConfirm: "关闭 FRP 并移除 DSH Mobile 管理的 frpc、共享 Token、生成配置、临时文件和日志？不会修改 VPS。",
			purgingFrp: "正在关闭 FRP 并清理 DSH Mobile 管理的文件…",
			switchingFrp: "正在切换到自建 FRP…",
			reconnectingFrp: "正在验证并重新连接自建 FRP…",
			resetFrpConfirm: "关闭自建 FRP 并移除所有远程配对设备？已保存的 VPS 配置和服务器不会改变。",
			remoteUnavailableFrp: "frpc 尚未安装或私有服务器配置不完整。",
			remoteStartingFrp: "正在检查 VPS 并准备受限 FRP 通道…",
			remoteConnectingFrp: "frpc 已启动，正在验证公网 HTTPS 端点…",
			frpMissing: "请先安装官方 frpc。",
			frpInvalid: "frpc 校验失败，请彻底清理后重新安装。",
			frpConfigMissing: "请先保存自建 FRP 连接信息。",
			frpConfigVerifyFailed: "frpc 拒绝了生成的配置，请检查服务器信息和 Token。",
			frpVhostPublic: "VPS 明文 HTTP vhost 可被公网访问。请将其限制到 127.0.0.1，并由 Caddy 提供 HTTPS。",
			frpVhostProbeFailed: "无法检查 VPS 地址，请确认 DNS 后重试。",
			frpLaunchFailed: "frpc 未能启动。",
			frpTimeout: "公网端点未能就绪，请检查 frps、Caddy、DNS 和防火墙。",
			frpDiscoveryMismatch: "公开域名连接到了另一台 DSH 电脑，请检查 Caddy 与 frps 映射。",
			frpDiscoveryInvalid: "公开域名没有返回有效的 DSH Mobile 发现信息。",
			frpStopped: "FRP 连接已停止。",
			frpExited: "frpc 意外退出，请检查 VPS 配置后重新连接。"
		});
		Object.assign(MOBILE_CONTROL_MESSAGES.en, {
			requestTimeout: "The operation timed out. Confirm that DSH is still running, then try again.",
			diagnostics: "Diagnostics",
			openDiagnostics: "Open connection diagnostics",
			back: "Back",
			backToMobile: "Back to Mobile access",
			connectionDiagnostics: "Connection diagnostics",
			diagnosticsIntro: "Check versions, gateway, network adapter, firewall, and remote channel. The report is automatically redacted and never reads conversations or credentials.",
			diagnosticsNotRun: "Not checked yet",
			diagnosticsStartHint: "Select the button below to begin.",
			diagnosticsIdleMeta: "Waiting to run · connection status only",
			diagnosticsStart: "Start check",
			diagnosticsCopy: "Copy redacted report",
			diagnosticsAdvanced: "Advanced diagnostic details",
			diagnosticsComplete: "Check complete",
			diagnosticsAttention: "Some items need attention",
			diagnosticsProblem: "Connection problems found",
			diagnosticsCompleteFallback: "The check is complete.",
			diagnosticStatusOk: "OK",
			diagnosticStatusWarning: "Attention",
			diagnosticStatusError: "Problem",
			diagnosticStatusInfo: "Info",
			diagnosticItems: "{count} items",
			diagnosticCheck: "Check",
			diagnosticAction: "Suggested action",
			diagnosticNeedsAction: "Needs action",
			diagnosticDetails: "Check details",
			diagnosticOther: "Other checks",
			diagnosticNoBlockers: "{count} checks · no blocking issues found",
			diagnosticNeedsCount: "{count} checks · {issues} need attention",
			diagnosticsChecking: "Checking…",
			diagnosticsCheckingTitle: "Checking connection",
			diagnosticsCheckingText: "This usually takes a few seconds. The remote channel performs a real reachability test.",
			diagnosticsRunningMeta: "Running · keep DSH online",
			diagnosticsIncomplete: "Check not completed",
			diagnosticsReadFailed: "Could not read diagnostics: {error}",
			diagnosticsUnavailable: "Diagnostics service unavailable · try again later",
			diagnosticsRetry: "Check again",
			diagnosticsCopied: "Redacted report copied. You can paste it directly into an issue.",
			diagnosticsCopyManual: "Clipboard access was denied. Details are expanded for manual copying.",
			diagnosticLabelVersions: "Version compatibility",
			diagnosticLabelNetwork: "Local network adapter",
			diagnosticLabelLan: "Local network gateway",
			diagnosticLabelFirewall: "Windows Firewall",
			diagnosticLabelRemote: "Remote channel",
			diagnosticLabelPhone: "Phone network",
			funnelTimeout: "The Tailscale component timed out while starting. Check the network, then reconnect."
		});
		Object.assign(MOBILE_CONTROL_MESSAGES.it, {
			requestTimeout: "Operazione scaduta. Verifica che DSH sia ancora in esecuzione e riprova.",
			diagnostics: "Diagnostica",
			openDiagnostics: "Apri diagnostica connessione",
			back: "Indietro",
			backToMobile: "Torna ad Accesso mobile",
			connectionDiagnostics: "Diagnostica connessione",
			diagnosticsIntro: "Controlla versioni, gateway, scheda di rete, firewall e canale remoto. Il report viene anonimizzato automaticamente e non legge conversazioni o credenziali.",
			diagnosticsNotRun: "Controllo non eseguito",
			diagnosticsStartHint: "Premi il pulsante sotto per iniziare.",
			diagnosticsIdleMeta: "In attesa · solo stato connessione",
			diagnosticsStart: "Avvia controllo",
			diagnosticsCopy: "Copia report anonimizzato",
			diagnosticsAdvanced: "Dettagli diagnostici avanzati",
			diagnosticsComplete: "Controllo completato",
			diagnosticsAttention: "Alcuni elementi richiedono attenzione",
			diagnosticsProblem: "Rilevati problemi di connessione",
			diagnosticsCompleteFallback: "Controllo completato.",
			diagnosticStatusOk: "OK",
			diagnosticStatusWarning: "Attenzione",
			diagnosticStatusError: "Problema",
			diagnosticStatusInfo: "Informazione",
			diagnosticItems: "{count} elementi",
			diagnosticCheck: "Controllo",
			diagnosticAction: "Suggerimento",
			diagnosticNeedsAction: "Da risolvere",
			diagnosticDetails: "Dettagli controllo",
			diagnosticOther: "Altri controlli",
			diagnosticNoBlockers: "{count} controlli · nessun problema bloccante",
			diagnosticNeedsCount: "{count} controlli · {issues} richiedono attenzione",
			diagnosticsChecking: "Controllo…",
			diagnosticsCheckingTitle: "Controllo connessione",
			diagnosticsCheckingText: "Di solito richiede pochi secondi. Il canale remoto esegue un test reale di raggiungibilità.",
			diagnosticsRunningMeta: "In esecuzione · mantieni DSH online",
			diagnosticsIncomplete: "Controllo non completato",
			diagnosticsReadFailed: "Impossibile leggere la diagnostica: {error}",
			diagnosticsUnavailable: "Servizio diagnostico non disponibile · riprova più tardi",
			diagnosticsRetry: "Ripeti controllo",
			diagnosticsCopied: "Report anonimizzato copiato. Puoi incollarlo direttamente in una issue.",
			diagnosticsCopyManual: "Il browser ha negato la copia. I dettagli sono stati aperti per la copia manuale.",
			diagnosticLabelVersions: "Compatibilità versioni",
			diagnosticLabelNetwork: "Scheda rete locale",
			diagnosticLabelLan: "Gateway rete locale",
			diagnosticLabelFirewall: "Windows Firewall",
			diagnosticLabelRemote: "Canale remoto",
			diagnosticLabelPhone: "Rete telefono",
			funnelTimeout: "Avvio del componente Tailscale scaduto. Controlla la rete e riconnettiti."
		});
		Object.assign(MOBILE_CONTROL_MESSAGES.zh, {
			requestTimeout: "操作超时，请确认 DSH 仍在运行后重试。",
			diagnostics: "诊断",
			openDiagnostics: "打开连接诊断",
			back: "返回",
			backToMobile: "返回移动访问",
			connectionDiagnostics: "连接诊断",
			diagnosticsIntro: "检查版本、网关、网卡、防火墙和远程通道。报告自动脱敏，不读取对话或凭据。",
			diagnosticsNotRun: "尚未检查",
			diagnosticsStartHint: "点击下方按钮开始。",
			diagnosticsIdleMeta: "等待运行 · 仅收集连接状态",
			diagnosticsStart: "开始检查",
			diagnosticsCopy: "复制脱敏报告",
			diagnosticsAdvanced: "高级诊断详情",
			diagnosticsComplete: "检查完成",
			diagnosticsAttention: "有项目需要留意",
			diagnosticsProblem: "发现连接问题",
			diagnosticsCompleteFallback: "检查已完成。",
			diagnosticStatusOk: "正常",
			diagnosticStatusWarning: "注意",
			diagnosticStatusError: "问题",
			diagnosticStatusInfo: "说明",
			diagnosticItems: "{count} 项",
			diagnosticCheck: "检查项",
			diagnosticAction: "建议",
			diagnosticNeedsAction: "需要处理",
			diagnosticDetails: "检查详情",
			diagnosticOther: "其他检查",
			diagnosticNoBlockers: "{count} 项检查 · 未发现阻断问题",
			diagnosticNeedsCount: "{count} 项检查 · {issues} 项需要处理",
			diagnosticsChecking: "正在检查…",
			diagnosticsCheckingTitle: "正在检查连接",
			diagnosticsCheckingText: "通常几秒内完成。远程通道会执行一次真实可达性测试。",
			diagnosticsRunningMeta: "正在运行 · 请保持 DSH 在线",
			diagnosticsIncomplete: "检查未完成",
			diagnosticsReadFailed: "无法读取诊断结果：{error}",
			diagnosticsUnavailable: "诊断服务暂不可用 · 请稍后重试",
			diagnosticsRetry: "重新检查",
			diagnosticsCopied: "脱敏报告已复制，可直接粘贴到 Issue。",
			diagnosticsCopyManual: "浏览器未允许复制，已展开详情，请手动复制。",
			diagnosticLabelVersions: "版本兼容",
			diagnosticLabelNetwork: "局域网网卡",
			diagnosticLabelLan: "局域网网关",
			diagnosticLabelFirewall: "Windows 防火墙",
			diagnosticLabelRemote: "远程通道",
			diagnosticLabelPhone: "手机网络",
			funnelTimeout: "Tailscale 组件启动超时，请检查网络后重新连接。"
		});
		const LOCALIZED_DIAGNOSTIC_COPY = {
			en: {
				versions: "Installed plugin, DSH, and minimum Android app versions are shown.",
				networkOk: "The configured local network adapter is available.",
				networkError: "The saved local network adapter is unavailable.",
				networkInfo: "A fixed local network configuration is in use.",
				networkAction: "Run dsh-mobile setup again.",
				lanOk: "The local gateway is listening and pairing is available.",
				lanInfo: "Local network access is currently off.",
				lanAction: "Enable local network access when the phone must connect directly.",
				firewallOk: "Local TCP and discovery firewall rules are enabled.",
				firewallWarning: "The complete local network firewall rules were not found.",
				firewallInfo: "The system did not allow the plugin to read firewall status.",
				firewallAction: "Run dsh-mobile setup as administrator and check the firewall rules.",
				remoteOk: "The remote public address passed the reachability check.",
				remoteWarning: "The remote channel needs attention or is still connecting.",
				remoteError: "The remote connection is not currently reachable.",
				remoteInfo: "Remote access is currently off.",
				remoteAction: "Return to Remote access, follow the provider guidance, and reconnect.",
				phone: "The computer cannot determine whether the router isolates the phone.",
				phoneAction: "Confirm the phone and computer use the same network, then disable guest-network or AP isolation.",
				reportTitle: "DSH Mobile diagnostic report",
				generated: "Generated"
			},
			it: {
				versions: "Sono indicate le versioni installate di plugin e DSH e la versione minima dell’app Android.",
				networkOk: "La scheda di rete locale configurata è disponibile.",
				networkError: "La scheda di rete locale salvata non è disponibile.",
				networkInfo: "È in uso una configurazione di rete locale fissa.",
				networkAction: "Esegui di nuovo dsh-mobile setup.",
				lanOk: "Il gateway locale è in ascolto e l’abbinamento è disponibile.",
				lanInfo: "L’accesso dalla rete locale è disattivato.",
				lanAction: "Attiva l’accesso locale quando il telefono deve collegarsi direttamente.",
				firewallOk: "Le regole firewall TCP locale e di rilevamento sono attive.",
				firewallWarning: "Le regole firewall complete per la rete locale non sono state trovate.",
				firewallInfo: "Il sistema non ha consentito al plugin di leggere lo stato del firewall.",
				firewallAction: "Esegui dsh-mobile setup come amministratore e controlla le regole firewall.",
				remoteOk: "L’indirizzo pubblico remoto ha superato il test di raggiungibilità.",
				remoteWarning: "Il canale remoto richiede attenzione o è ancora in connessione.",
				remoteError: "La connessione remota non è al momento raggiungibile.",
				remoteInfo: "L’accesso remoto è disattivato.",
				remoteAction: "Torna ad Accesso remoto, segui le indicazioni del provider e riconnettiti.",
				phone: "Il computer non può stabilire se il router isola il telefono.",
				phoneAction: "Verifica che telefono e computer usino la stessa rete, poi disattiva rete ospiti o isolamento AP.",
				reportTitle: "Report diagnostico DSH Mobile",
				generated: "Generato"
			},
			zh: {
				reportTitle: "DSH Mobile 诊断报告",
				generated: "生成时间"
			}
		};
		const DIAGNOSTIC_REASON_MESSAGES = {
			en: {
				"versions-current": ["Installed plugin, DSH, and minimum Android app versions are shown.", ""],
				"network-unavailable": ["The saved local network adapter is unavailable.", "Run dsh-mobile setup again."],
				"network-interface": ["Using network interface {interfaceName}.", ""],
				"network-fixed": ["A fixed local network configuration is in use.", ""],
				"lan-ready": ["The local gateway is listening at {endpointSuffix}; pairing is available.", ""],
				"lan-off": ["Local network access is currently off.", "Enable local network access when the phone must connect directly."],
				"firewall-ready": ["Local TCP and discovery firewall rules are enabled.", ""],
				"firewall-missing": ["The complete local network firewall rules were not found.", "Run dsh-mobile setup as administrator and check the firewall rules."],
				"firewall-unknown": ["The system did not allow the plugin to read firewall status.", "If the phone cannot find this computer, run setup as administrator."],
				"remote-off": ["Remote access through {provider} is currently off.", ""],
				"remote-ready": ["{provider} endpoint {endpointSuffix} is reachable in about {latencyMs} ms.", ""],
				"remote-rate-limited": ["{provider} endpoint {endpointSuffix} is reachable, but this check observed rate limiting.", "Try again later; older sessions load on demand to reduce traffic."],
				"remote-fake-ip": ["The Tailscale address is intercepted by the current VPN or DNS proxy, so TLS was not established.", "Switch VPN node or proxy mode; if it still fails, use cpolar."],
				"remote-unreachable": ["{provider} reports ready, but endpoint {endpointSuffix} is not reachable.", "Reconnect, then check the provider status if it still fails."],
				"remote-needs-login": ["Tailscale is waiting for login to finish.", "Return to Remote access and continue login."],
				"remote-connecting": ["The {provider} remote channel is still connecting.", "Wait briefly, then check again."],
				"remote-controller-error": ["The {provider} controller reported {controllerCode}.", "Return to Remote access and reconnect."],
				"phone-network-unknown": ["The computer cannot determine whether the router isolates the phone.", "Confirm the phone and computer use the same network, then disable guest-network or AP isolation."]
			},
			it: {
				"versions-current": ["Sono indicate le versioni installate di plugin e DSH e la versione minima dell’app Android.", ""],
				"network-unavailable": ["La scheda di rete locale salvata non è disponibile.", "Esegui di nuovo dsh-mobile setup."],
				"network-interface": ["È in uso l’interfaccia di rete {interfaceName}.", ""],
				"network-fixed": ["È in uso una configurazione di rete locale fissa.", ""],
				"lan-ready": ["Il gateway locale è in ascolto su {endpointSuffix}; l’abbinamento è disponibile.", ""],
				"lan-off": ["L’accesso dalla rete locale è disattivato.", "Attiva l’accesso locale quando il telefono deve collegarsi direttamente."],
				"firewall-ready": ["Le regole firewall TCP locale e di rilevamento sono attive.", ""],
				"firewall-missing": ["Le regole firewall complete per la rete locale non sono state trovate.", "Esegui dsh-mobile setup come amministratore e controlla le regole firewall."],
				"firewall-unknown": ["Il sistema non ha consentito al plugin di leggere lo stato del firewall.", "Se il telefono non trova il computer, esegui setup come amministratore."],
				"remote-off": ["L’accesso remoto tramite {provider} è disattivato.", ""],
				"remote-ready": ["L’endpoint {provider} {endpointSuffix} è raggiungibile in circa {latencyMs} ms.", ""],
				"remote-rate-limited": ["L’endpoint {provider} {endpointSuffix} è raggiungibile, ma il controllo ha rilevato una limitazione temporanea.", "Riprova più tardi; le sessioni precedenti vengono caricate su richiesta per ridurre il traffico."],
				"remote-fake-ip": ["L’indirizzo Tailscale è intercettato dalla VPN o dal proxy DNS corrente e TLS non è stato stabilito.", "Cambia nodo VPN o modalità proxy; se il problema continua, usa cpolar."],
				"remote-unreachable": ["{provider} risulta pronto, ma l’endpoint {endpointSuffix} non è raggiungibile.", "Riconnettiti; se il problema continua, controlla lo stato del provider."],
				"remote-needs-login": ["Tailscale attende il completamento dell’accesso.", "Torna ad Accesso remoto e continua l’accesso."],
				"remote-connecting": ["Il canale remoto {provider} è ancora in connessione.", "Attendi qualche istante e ripeti il controllo."],
				"remote-controller-error": ["Il controller {provider} ha segnalato {controllerCode}.", "Torna ad Accesso remoto e riconnettiti."],
				"phone-network-unknown": ["Il computer non può stabilire se il router isola il telefono.", "Verifica che telefono e computer usino la stessa rete, poi disattiva rete ospiti o isolamento AP."]
			},
			zh: {
				"versions-current": ["已显示插件、DSH 和 Android App 最低版本。", ""],
				"network-unavailable": ["已保存的局域网网卡当前不可用。", "重新运行 dsh-mobile setup。"],
				"network-interface": ["正在使用网卡 {interfaceName}。", ""],
				"network-fixed": ["当前使用固定局域网配置。", ""],
				"lan-ready": ["局域网网关正在监听 {endpointSuffix}，配对入口可用。", ""],
				"lan-off": ["局域网访问当前未开启。", "手机需要直连时开启局域网访问。"],
				"firewall-ready": ["局域网 TCP 与发现防火墙规则已启用。", ""],
				"firewall-missing": ["未找到完整的局域网防火墙规则。", "以管理员身份运行 dsh-mobile setup 并检查防火墙规则。"],
				"firewall-unknown": ["系统未允许插件读取防火墙状态。", "若手机找不到电脑，请以管理员身份运行 setup。"],
				"remote-off": ["{provider} 远程访问当前未启用。", ""],
				"remote-ready": ["{provider} 端点 {endpointSuffix} 可达，往返约 {latencyMs} ms。", ""],
				"remote-rate-limited": ["{provider} 端点 {endpointSuffix} 可达，但本次检查观察到服务限流。", "稍后重试；旧会话会按需加载以减少流量。"],
				"remote-fake-ip": ["Tailscale 地址被当前 VPN 或 DNS 代理接管，TLS 链路未建立。", "切换 VPN 节点或代理模式；仍失败时改用 cpolar。"],
				"remote-unreachable": ["{provider} 显示已就绪，但端点 {endpointSuffix} 暂不可达。", "点击重新连接；仍失败时检查提供方状态。"],
				"remote-needs-login": ["Tailscale 正在等待完成登录。", "返回远程访问并继续登录。"],
				"remote-connecting": ["{provider} 远程通道仍在连接。", "等待片刻后重新检查。"],
				"remote-controller-error": ["{provider} 控制器报告 {controllerCode}。", "返回远程访问并重新连接。"],
				"phone-network-unknown": ["电脑无法判断路由器是否隔离了手机。", "确认手机与电脑使用同一网络，并关闭访客网络或 AP 隔离。"]
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
		/** Wire bounds mirrored by the Android notification policy. */
		const TASK_NOTIFY_LIMITS = Object.freeze({
			title: 80,
			body: 200,
			tag: 64
		});
		const MAX_SEEN_QUESTION_KEYS = 20;
		function sanitizeTagFragment(value) {
			return value.toLowerCase().replaceAll(/[^a-z0-9-]+/gu, "-").replaceAll(/^-+|-+$/gu, "").slice(0, TASK_NOTIFY_LIMITS.tag);
		}
		/** Stable per-turn tag so concurrent sessions keep separate notifications. */
		function taskCompletionTag(sessionId, turn) {
			return `dsh-task-done-${sanitizeTagFragment(`${sessionId}-${String(turn)}`) || "task"}`.slice(0, TASK_NOTIFY_LIMITS.tag);
		}
		/** Decide whether the current snapshot deserves a system notification. */
		var TaskNotifyTracker = class {
			lastActivityAt;
			notifiedDoneAt;
			wasBusy = false;
			busySince;
			idleAnchoredAt;
			seenQuestionKeys = /* @__PURE__ */ new Set();
			quietMs;
			graceMs;
			minBusyMs;
			now;
			format;
			constructor(options) {
				this.quietMs = options.quietMs ?? 9e4;
				this.graceMs = options.graceMs ?? 1e4;
				this.minBusyMs = options.minBusyMs ?? 2e4;
				this.now = options.now ?? Date.now;
				this.format = options.format;
			}
			/** Record assistant-side activity; re-arms completion after a notification. */
			markActivity() {
				const now = this.now();
				this.lastActivityAt = now;
				if (this.notifiedDoneAt !== void 0 && this.notifiedDoneAt <= now) this.notifiedDoneAt = void 0;
			}
			/**
			* Milliseconds until a pending completion anchor fires, or undefined when
			* no anchor exists. Lets the watcher schedule one exact timer instead of
			* waiting for the next coarse poll tick.
			*/
			pendingAnchorDelayMs() {
				if (this.idleAnchoredAt === void 0) return void 0;
				return Math.max(0, this.graceMs - (this.now() - this.idleAnchoredAt));
			}
			evaluate(snapshot) {
				const now = this.now();
				if (!this.wasBusy && snapshot.composerBusy) this.busySince = now;
				if (this.wasBusy && !snapshot.composerBusy) {
					const busyFor = this.busySince === void 0 ? 0 : now - this.busySince;
					this.busySince = void 0;
					if (snapshot.pageHidden && !snapshot.pendingQuestion && busyFor >= this.minBusyMs) {
						this.idleAnchoredAt = void 0;
						this.notifiedDoneAt = now;
						return this.event("done", snapshot.sessionLabel, void 0);
					}
					this.idleAnchoredAt = snapshot.pageHidden ? now : void 0;
					if (!snapshot.pageHidden) this.notifiedDoneAt = now;
				}
				this.wasBusy = snapshot.composerBusy;
				if (snapshot.composerBusy) this.idleAnchoredAt = void 0;
				else if (this.idleAnchoredAt !== void 0 && !snapshot.pageHidden) {
					this.idleAnchoredAt = void 0;
					this.notifiedDoneAt = now;
				}
				if (!snapshot.pageHidden) {
					if (snapshot.pendingQuestion && snapshot.questionKey !== void 0) this.rememberQuestionKey(snapshot.questionKey);
					return;
				}
				if (snapshot.pendingQuestion) {
					if (snapshot.questionKey === void 0 || this.seenQuestionKeys.has(snapshot.questionKey)) return void 0;
					this.rememberQuestionKey(snapshot.questionKey);
					return this.event("question", snapshot.sessionLabel, snapshot.questionKey);
				}
				if (this.idleAnchoredAt !== void 0) {
					if (now - this.idleAnchoredAt < this.graceMs) return void 0;
					this.idleAnchoredAt = void 0;
					this.notifiedDoneAt = now;
					return this.event("done", snapshot.sessionLabel, void 0);
				}
				if (this.lastActivityAt === void 0) return void 0;
				if (now - this.lastActivityAt < this.quietMs) return void 0;
				if (now - this.lastActivityAt > 18e5) {
					this.lastActivityAt = void 0;
					return;
				}
				if (this.notifiedDoneAt !== void 0 && this.notifiedDoneAt >= this.lastActivityAt) return void 0;
				this.notifiedDoneAt = now;
				return this.event("done", snapshot.sessionLabel, void 0);
			}
			rememberQuestionKey(key) {
				this.seenQuestionKeys.add(key);
				if (this.seenQuestionKeys.size > MAX_SEEN_QUESTION_KEYS) {
					const oldest = this.seenQuestionKeys.values().next();
					if (!oldest.done) this.seenQuestionKeys.delete(oldest.value);
				}
			}
			event(kind, sessionLabel, questionKey) {
				const text = this.format(kind, sessionLabel);
				const tag = kind === "question" && questionKey !== void 0 ? `dsh-task-question-${sanitizeTagFragment(questionKey) || "pending"}` : "dsh-task-done";
				return Object.freeze({
					kind,
					title: text.title,
					body: text.body,
					tag
				});
			}
		};
		/**
		* Mirror of the composer busy signal used for media actions: the run is busy
		* while the composer is aria-busy, disabled, read-only, or non-interactive.
		*/
		function readComposerBusyState(root) {
			if (typeof root.querySelector !== "function") return false;
			const card = root.querySelector("[data-composer-card]");
			if (card === null || typeof card.getAttribute !== "function" || typeof card.querySelector !== "function") return false;
			if (card.getAttribute("aria-busy") === "true") return true;
			const field = card.querySelector("textarea,input,[contenteditable=\"true\"],[contenteditable=\"plaintext-only\"]");
			if (field === null) return false;
			return field.disabled === true || field.readOnly === true || field.getAttribute?.("aria-disabled") === "true";
		}
		/**
		* Best-effort session label for the notification body, bounded for the wire.
		* Callers accept that titles may name the active session on the lock screen.
		*/
		function readSessionLabel(title) {
			if (typeof title !== "string") return "";
			return title.normalize("NFC").replace(/[\u0000-\u001f\u007f]+/gu, " ").trim().slice(0, 80);
		}
		/** Whether the document currently shows a card that waits for user input. */
		function hasPendingInputQuestion(root) {
			if (typeof root.querySelector !== "function") return false;
			return root.querySelector("[data-question-key],[data-plan-review-key]") !== null;
		}
		/** Stable key of the waiting input card, when the DOM exposes one. */
		function pendingInputQuestionKey(root) {
			if (typeof root.querySelector !== "function") return void 0;
			const card = root.querySelector("[data-question-key],[data-plan-review-key]");
			const getAttribute = card?.getAttribute;
			if (typeof getAttribute !== "function") return void 0;
			const key = getAttribute.call(card, "data-question-key") ?? getAttribute.call(card, "data-plan-review-key");
			if (key === null || key === "") return void 0;
			return key;
		}
		/** Observe assistant-side conversation mutations; returns a disposer. */
		function observeTaskActivity(target, onActivity, observe = typeof MutationObserver === "function" ? MutationObserver : void 0) {
			if (observe === void 0) return () => void 0;
			const observer = new observe(() => {
				onActivity();
			});
			try {
				observer.observe(target, {
					childList: true,
					characterData: true,
					subtree: true
				});
			} catch {
				return () => void 0;
			}
			return () => {
				observer.disconnect();
			};
		}
		function readNativeBridge() {
			if (typeof window === "undefined") return void 0;
			const bridge = window.__DSH_MOBILE_NATIVE__;
			if (bridge === void 0 || typeof bridge.capabilities !== "function" || typeof bridge.invoke !== "function") return void 0;
			return bridge;
		}
		/** Parse a `task-notify` SSE payload; rejects anything malformed or empty. */
		function parseTaskNotifyPayload(value) {
			let record;
			if (typeof value === "string") try {
				const parsed = JSON.parse(value);
				if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return void 0;
				record = parsed;
			} catch {
				return;
			}
			else if (value !== null && typeof value === "object" && !Array.isArray(value)) record = value;
			else return void 0;
			if (typeof record.sessionId !== "string" || record.sessionId.trim() === "") return void 0;
			const turn = typeof record.turn === "number" && Number.isSafeInteger(record.turn) && record.turn >= 0 ? record.turn : 0;
			return Object.freeze({
				sessionId: record.sessionId.slice(0, 128),
				turn
			});
		}
		/**
		* Deliver one notification through the native bridge when available.
		* Returns false when there is no bridge (desktop browsers keep their own
		* UI) so callers can fall back; a denial flips the module sticky flag via
		* onDenied for the session-lifetime nag guard.
		*/
		function fireTaskNotifyEvent(event, onDenied) {
			const bridge = readNativeBridge();
			if (bridge === void 0) return false;
			Promise.resolve().then(() => bridge.capabilities()).then((capabilities) => {
				if (!capabilities.includes("notification.notify")) return;
				return bridge.invoke("notification.notify", {
					title: event.title,
					body: event.body,
					tag: event.tag
				});
			}).then(() => void 0, (error) => {
				const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
				if ((code === "permission_denied" || code === "denied") && onDenied !== void 0) onDenied();
			});
			return true;
		}
		/**
		* Watch the rendered conversation for finished runs and waiting questions,
		* notifying through the native bridge while the page is hidden. Returns a
		* disposer. Silent when no native bridge exists (desktop browsers keep their
		* own UI) or after the user denies the permission.
		*/
		function installTaskCompletionWatcher(options) {
			if (typeof document === "undefined" || typeof window === "undefined") return () => void 0;
			const tracker = new TaskNotifyTracker({ format: options.label });
			const completionFallback = options.completionFallback ?? true;
			let notifyBlocked = false;
			let timer = 0;
			let anchorTimer = 0;
			const fire = (event) => {
				if (notifyBlocked) return;
				if (!fireTaskNotifyEvent(event, () => {
					notifyBlocked = true;
				})) return;
			};
			const evaluateNow = () => {
				const busy = completionFallback && readComposerBusyState(document);
				const event = tracker.evaluate({
					pageHidden: document.hidden,
					pendingQuestion: hasPendingInputQuestion(document),
					questionKey: pendingInputQuestionKey(document),
					sessionLabel: readSessionLabel(document.title),
					composerBusy: busy
				});
				if (event !== void 0) fire(event);
				scheduleAnchorTimer();
			};
			const scheduleAnchorTimer = () => {
				const delay = tracker.pendingAnchorDelayMs();
				if (delay === void 0) {
					if (anchorTimer !== 0) {
						window.clearTimeout(anchorTimer);
						anchorTimer = 0;
					}
					return;
				}
				if (anchorTimer !== 0) return;
				anchorTimer = window.setTimeout(() => {
					anchorTimer = 0;
					evaluateNow();
				}, delay);
			};
			const disposeObservation = observeTaskActivity(document.documentElement, () => {
				if (completionFallback) tracker.markActivity();
				evaluateNow();
			});
			const onVisibility = () => {
				evaluateNow();
			};
			document.addEventListener("visibilitychange", onVisibility);
			if (typeof window.setInterval === "function") timer = window.setInterval(evaluateNow, 15e3);
			evaluateNow();
			return () => {
				disposeObservation();
				document.removeEventListener("visibilitychange", onVisibility);
				if (timer !== 0) window.clearInterval(timer);
				if (anchorTimer !== 0) window.clearTimeout(anchorTimer);
			};
		}
		//#endregion
		//#region src/native-mobile.ts
		/**
		* Viewport below which the injected chrome becomes an overlay drawer: the
		* sidebar slides in as a sheet, the right panel as a drawer, and the scrim dims
		* the page behind them. The stylesheet and the scrim's visibility both read
		* this query, so a wider viewport never grows drawer chrome whose rules cannot
		* style it.
		*/
		const NATIVE_MOBILE_OVERLAY_QUERY = "(max-width:720px)";
		/** Mobile feature and compatibility rules applied to DSH React surfaces. */
		const NATIVE_MOBILE_STYLES = `
/* The surface appends chrome to <body> on every non-loopback page load, but
   every rule that gives that chrome a box lives inside the overlay query
   below. Outside the query the scrim kept the UA button box: an empty,
   nameless button in normal flow at the document's bottom-left, whose click
   still collapsed the sidebar. Keep the neutral state explicitly invisible —
   the query restores the fixed scrim, and its more specific [hidden] rule
   keeps winning there. */
.dsh-native-mobile-backdrop,.dsh-mobile-branch-toast,.dsh-mobile-media-toast { display:none; }
@media ${NATIVE_MOBILE_OVERLAY_QUERY} {
  html.dsh-native-mobile-active,html.dsh-native-mobile-active body { width:100%; height:100%; overflow:hidden; }
  html.dsh-native-mobile-active { --dsh-mobile-motion-duration:200ms; --dsh-mobile-motion-ease:cubic-bezier(.22,1,.36,1); }
  html.dsh-native-mobile-active :is(a,button,[role="button"],[role="tab"],[tabindex]) { -webkit-tap-highlight-color:transparent; }
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [role="treeitem"] { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  html.dsh-native-mobile-active[data-dsh-mobile-input="touch"] :is(a,button,[role="button"],[role="tab"],[tabindex]):focus { outline:none !important; }
  html.dsh-native-mobile-active [role="tooltip"] { display:none !important; }
  /* Touch has no persistent hover affordance: keep workspace rows neutral after a tap. */
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] { --dsw-alias-interactive-bg-hover:transparent !important; }
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [role="treeitem"]:is(:hover,:active,:focus,[aria-selected="true"]),
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [class*="_sessionRow"][class*="_selected"],
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [class*="_searchResultRow"][class*="_selected"] { background:transparent !important; outline:0 !important; box-shadow:none !important; }
  /* Sidebar row menus are hover-only on desktop. Touch has no hover, so keep
     the ellipsis action visible and give it a reliable hit target. */
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [class*="_rowActions"] { display:inline-flex !important; align-items:center !important; gap:8px !important; }
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [class*="_sessionRow"] [class*="_time"] { display:none !important; }
  html.dsh-native-mobile-active [data-dsh-mobile-sidebar] [class*="_rowActions"] button { box-sizing:border-box !important; width:32px !important; min-width:32px !important; height:32px !important; min-height:32px !important; }
  [data-dsh-mobile-frame] { grid-template-columns:0 minmax(0,1fr) 0 !important; width:100% !important; height:100dvh !important; overflow:hidden !important; }
  [data-dsh-mobile-center] { grid-column:2 !important; width:100vw !important; min-width:0 !important; }
  [data-dsh-mobile-center] > * { min-width:0 !important; }
  [data-dsh-mobile-header] { box-sizing:border-box !important; width:calc(100% - 16px) !important; margin:0 8px !important; min-width:0; padding-top:max(4px,env(safe-area-inset-top)) !important; padding-right:8px !important; padding-left:42px !important; }
  [data-dsh-mobile-header] [class*="_titleRow"] { box-sizing:border-box !important; display:flex !important; align-items:center !important; min-width:0; min-height:32px !important; height:32px !important; gap:6px !important; padding:0 6px !important; }
  [data-dsh-mobile-header] [class*="_titleCluster"] { min-width:0; }
  [data-dsh-mobile-header] [class*="_crumbs"] { min-width:0; overflow:hidden; }
  [data-dsh-mobile-header] [class*="_crumb"] { max-width:46vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  [data-dsh-mobile-header] [class*="_headerActions"] { min-width:0; overflow-x:auto; scrollbar-width:none; }
  [data-dsh-mobile-header] [class*="_headerActions"]::-webkit-scrollbar { display:none; }
  [data-dsh-mobile-header] [class*="_headerUtilities"] { gap:2px !important; }
  [data-dsh-mobile-header] [class*="_sessionLogButton"] { width:40px; min-width:40px; padding:0 !important; overflow:hidden; color:transparent; font-size:0 !important; }
  [data-dsh-mobile-header] [class*="_sessionLogButton"] > * { display:none !important; }
  [data-dsh-mobile-header] [class*="_sessionLogButton"]::after { color:var(--dsw-alias-label-primary, #171a21); content:"Log"; font-size:11px; font-weight:600; }
  html[data-dsh-mobile-language="zh"] [data-dsh-mobile-header] [class*="_sessionLogButton"]::after { content:"日志"; }
  [data-dsh-mobile-header] [class*="_tabs"] { box-sizing:border-box !important; width:max-content !important; max-width:calc(100% - 58px) !important; min-height:28px !important; height:28px !important; margin-top:0 !important; padding-left:6px !important; padding-right:6px !important; overflow-x:auto; scrollbar-width:none; }
  [data-dsh-mobile-header] [class*="_tab"] { padding-bottom:5px !important; }
  [data-dsh-mobile-header] [class*="_tabs"]::-webkit-scrollbar { display:none; }
  [data-dsh-mobile-sidebar] { position:fixed !important; z-index:240 !important; inset:0 auto 0 0 !important; width:0 !important; overflow:visible !important; }
  [data-dsh-mobile-sidebar-root] { position:fixed !important; z-index:241 !important; inset:max(env(safe-area-inset-top),0px) auto 0 0 !important; height:auto !important; transition:width 180ms var(--dsh-mobile-motion-ease),box-shadow 180ms ease !important; }
  [data-dsh-mobile-sidebar][data-open="true"] [data-dsh-mobile-sidebar-root] { width:min(88vw,340px) !important; padding-top:0 !important; box-shadow:18px 0 46px rgb(15 23 42 / 18%); }
  [data-dsh-mobile-sidebar][data-open="true"] [data-dsh-mobile-sidebar-root] [class*="_logoRow"] { height:52px !important; padding:4px 0 4px 4px !important; margin-bottom:4px !important; }
  [data-dsh-mobile-sidebar][data-open="false"] [data-dsh-mobile-sidebar-root] { width:0 !important; border:0 !important; background:transparent !important; box-shadow:none !important; overflow:visible !important; }
  [data-dsh-mobile-sidebar][data-open="false"] [data-dsh-mobile-sidebar-root] > :not(:has([data-dsh-mobile-toggle])) { display:none !important; }
  [data-dsh-mobile-sidebar][data-open="false"] [data-dsh-mobile-sidebar-root] > :has([data-dsh-mobile-toggle]) { position:fixed !important; z-index:244 !important; top:env(safe-area-inset-top) !important; left:0 !important; box-sizing:border-box !important; width:50px !important; height:52px !important; padding:4px !important; border:0 !important; background:transparent !important; }
  [data-dsh-mobile-sidebar][data-open="false"] [data-dsh-mobile-sidebar-root] > :has([data-dsh-mobile-toggle]) > :not([data-dsh-mobile-toggle]) { display:none !important; }
  [data-dsh-mobile-toggle] { width:44px !important; height:44px !important; min-width:44px !important; min-height:44px !important; }
  [data-dsh-mobile-sidebar][data-open="false"] [data-dsh-mobile-toggle] > svg[class*="_railFish"] { transform:translateY(-4px) !important; }
  .dsh-native-mobile-backdrop { display:block; position:fixed; z-index:235; inset:env(safe-area-inset-top) 0 0; border:0; background:rgb(15 23 42 / 32%); }
  .dsh-native-mobile-backdrop:not([hidden]) { animation:dsh-mobile-fade-in var(--dsh-mobile-motion-duration) ease-out; }
  .dsh-native-mobile-backdrop[hidden] { display:none; }
  [data-dsh-mobile-details] { position:fixed !important; z-index:250 !important; inset:0 0 0 auto !important; width:min(94vw,460px) !important; max-width:none !important; transform:translateX(100%); transition:transform var(--dsh-mobile-motion-duration) var(--dsh-mobile-motion-ease); background:var(--dsw-bg, #fff); box-shadow:-18px 0 46px rgb(15 23 42 / 18%); }
  [data-dsh-mobile-details][data-open="true"] { transform:translateX(0); }
  [data-dsh-mobile-handle] { display:none !important; }
  [data-dsh-mobile-settings] { flex-direction:column !important; width:100vw !important; height:100dvh !important; max-width:none !important; border-radius:0 !important; animation:dsh-mobile-panel-in var(--dsh-mobile-motion-duration) var(--dsh-mobile-motion-ease); }
  [data-dsh-mobile-settings-nav] { flex:none !important; width:100% !important; padding:max(14px,env(safe-area-inset-top)) 12px 8px !important; gap:10px !important; border-bottom:1px solid var(--dsw-alias-border-subtle,#e8ebef); }
  [data-dsh-mobile-settings-nav] [class*="_navTitle"] { padding:0 8px !important; font-size:18px !important; line-height:28px !important; }
  [data-dsh-mobile-settings-list] { flex-direction:row !important; gap:4px !important; overflow-x:auto !important; scrollbar-width:none; }
  [data-dsh-mobile-settings-list]::-webkit-scrollbar { display:none; }
  [data-dsh-mobile-settings-list] [class*="_navCell"] { flex:0 0 auto !important; min-width:max-content !important; height:44px !important; padding:10px 12px !important; }
  [data-dsh-mobile-settings-list] [aria-current="true"] { border-color:transparent !important; outline:0 !important; box-shadow:none !important; }
  [data-dsh-mobile-settings-content] { flex:1 1 auto !important; width:100% !important; min-height:0 !important; }
  [data-dsh-mobile-settings-header] { height:48px !important; min-height:48px !important; padding:10px 12px 6px !important; }
  [data-dsh-mobile-settings-header] [class*="_close"] { width:36px !important; height:36px !important; }
  [data-dsh-mobile-settings-options] { box-sizing:border-box !important; width:100% !important; padding:4px 16px max(24px,env(safe-area-inset-bottom)) !important; overflow-x:hidden !important; }
  [data-dsh-mobile-settings-options] > * { width:100% !important; min-width:0 !important; }
  [data-dsh-mobile-settings-options] [data-slot="settings.general.item"] > [class*="_row"] { flex-direction:column !important; align-items:stretch !important; gap:12px !important; }
  [data-dsh-mobile-settings-options] [data-slot="settings.general.item"] [class*="_rowText"] { width:100% !important; padding-right:0 !important; }
  [data-dsh-mobile-settings-options] [data-slot="settings.general.item"] [class*="_selector"] { box-sizing:border-box !important; align-self:flex-start !important; justify-content:space-between !important; min-width:0 !important; min-height:44px !important; max-width:100% !important; }
  [data-dsh-mobile-settings-options] :is(input,select,textarea,button) { max-width:100%; }
  [data-dsh-mobile-settings-options] :is(input,select,textarea) { box-sizing:border-box; width:100%; min-width:0; }
  [data-dsh-mobile-settings-options] [class*="_head"] { min-width:0; flex-wrap:wrap; }
  /* Provider names may shrink, but their edit/delete actions remain horizontal
     and retain a full touch target on narrow screens. */
  [data-dsh-mobile-settings-options] [class*="_rowHead"]:has(> [class*="_rowIdentity"]) { flex-wrap:nowrap !important; align-items:center !important; }
  [data-dsh-mobile-settings-options] [class*="_rowIdentity"] { flex:1 1 auto !important; min-width:0 !important; overflow:hidden !important; }
  [data-dsh-mobile-settings-options] [class*="_rowName"] { min-width:0 !important; overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
  [data-dsh-mobile-settings-options] [class*="_rowActions"] { flex:0 0 auto !important; flex-wrap:nowrap !important; width:max-content !important; min-width:max-content !important; max-width:none !important; }
  [data-dsh-mobile-settings-options] [class*="_rowActions"] button { flex:none !important; width:auto !important; min-width:44px !important; max-width:none !important; min-height:44px !important; padding-inline:10px !important; white-space:nowrap !important; word-break:keep-all !important; writing-mode:horizontal-tb !important; }
  [data-dsh-mobile-settings-content][data-dsh-mobile-view-transition="true"],
  [data-dsh-mobile-view][data-dsh-mobile-view-transition="true"] { animation:dsh-mobile-view-in var(--dsh-mobile-motion-duration) var(--dsh-mobile-motion-ease); }
  [data-dsh-mobile-center] textarea { font-size:16px !important; }
  /* Markdown tables use content-sized columns. Small tables fill the phone;
     wider tables keep readable cells and scroll inside their own region. */
  [data-dsh-mobile-table-scroll] { box-sizing:border-box; width:100%; max-width:100%; overflow-x:auto; overscroll-behavior-x:contain; -webkit-overflow-scrolling:touch; }
  [data-dsh-mobile-table-scroll] table { display:table !important; width:max-content !important; min-width:100% !important; max-width:none !important; table-layout:auto !important; }
  [data-dsh-mobile-table-scroll] :is(th,td) { box-sizing:border-box; min-width:8ch; max-width:32ch; overflow-wrap:anywhere; word-break:break-word; vertical-align:top; }
  [data-dsh-mobile-center] pre { max-width:100%; overflow-x:auto; }
  [data-dsh-mobile-center] :is(img,video,canvas,svg) { max-width:100%; }
  [data-dsh-mobile-message-scroll] { box-sizing:border-box !important; width:100% !important; padding:8px 10px 20px !important; }
  [data-dsh-mobile-history-loader] { position:relative !important; min-height:1px !important; }
  [data-dsh-mobile-history-loader] button:not(:disabled) { position:absolute !important; width:1px !important; height:1px !important; margin:-1px !important; padding:0 !important; clip-path:inset(50%) !important; opacity:0 !important; overflow:hidden !important; pointer-events:none !important; }
  [data-dsh-mobile-history-loader] button:disabled { min-height:28px !important; padding:4px 12px !important; }
  [data-dsh-mobile-message-column] { box-sizing:border-box !important; width:100% !important; max-width:none !important; margin:0 !important; padding:0 !important; gap:10px !important; }
  [data-dsh-mobile-message-column] > * { width:100% !important; max-width:100% !important; }
  [data-dsh-mobile-message-column] [data-disclosure-row] { box-sizing:border-box !important; display:grid !important; grid-template-columns:16px minmax(0,1fr) !important; grid-auto-rows:auto !important; align-items:center !important; column-gap:6px !important; width:100% !important; height:auto !important; min-height:40px !important; padding:4px 0 !important; }
  [data-dsh-mobile-message-column] [data-disclosure-row] > [class*="_leading"] { grid-column:1 !important; grid-row:1 !important; margin-right:0 !important; }
  [data-dsh-mobile-message-column] [data-disclosure-row] > [class*="_title"] { grid-column:2 !important; grid-row:1 !important; min-width:0 !important; overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
  [data-dsh-mobile-message-column] [data-disclosure-row] > :is([class*="_sep"],[class*="_separator"]) { display:none !important; }
  [data-dsh-mobile-message-column] [data-disclosure-row] > :is([class*="_summary"],[class*="_fileLink"]) { grid-column:2 !important; grid-row:2 !important; width:100% !important; min-width:0 !important; max-width:100% !important; overflow:hidden !important; line-height:19px !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
  [data-dsh-mobile-message-column] [data-disclosure-row] > [class*="_summarySuffix"] { grid-column:2 !important; grid-row:3 !important; margin-left:0 !important; }
  [data-dsh-mobile-message-column] [data-context-fields] > * { display:grid !important; grid-template-columns:minmax(72px,30%) minmax(0,1fr) !important; gap:4px 10px !important; }
  [data-dsh-mobile-message-column] [class*="_ioSection"] { grid-template-columns:1fr !important; row-gap:4px !important; }
  [data-dsh-mobile-message-column] [class*="_body"] { max-width:100% !important; overflow-wrap:anywhere; }
  /* Keep folded and expanded reasoning visually separate from the reply. */
  [data-dsh-mobile-message-column] [class*="_body"] > div:has(> [data-variant="think"]) { margin-bottom:12px !important; }
  [data-dsh-mobile-center] [data-composer-card] ~ [class*="_root"],
  [data-dsh-mobile-center] [data-composer-card] ~ * [class*="_root"] { box-sizing:border-box !important; width:100% !important; max-width:100% !important; margin-bottom:-6px !important; padding:3px 4px 0 !important; font-size:11px !important; line-height:18px !important; white-space:normal !important; overflow:visible !important; text-overflow:clip !important; }
  [data-dsh-mobile-center] [data-composer-card] ~ [class*="_root"] [class*="_sep"],
  [data-dsh-mobile-center] [data-composer-card] ~ * [class*="_root"] [class*="_sep"] { margin:0 6px !important; }
  /* Composer dock stats strip (turns/steps/tokens) reads small on phones. */
  [data-dsh-mobile-center] [data-slot="conversation.composer.dock"] [class*="_root"] { font-size:10px !important; line-height:16px !important; }
  /* Message runtime details are inline on desktop. Give the clock/runtime
     label its own wrapping row on narrow screens so TTFT and throughput do
     not push the action buttons or clip at the viewport edge. */
  [data-dsh-mobile-center] [class*="_actions"]:has(> [class*="_timeStart"]),
  [data-dsh-mobile-center] [class*="_actions"]:has(> [class*="_timeEnd"]) { box-sizing:border-box !important; width:100% !important; flex-wrap:wrap !important; justify-content:flex-end !important; height:auto !important; min-height:28px !important; row-gap:2px !important; }
  [data-dsh-mobile-center] [class*="_timeStart"],
  [data-dsh-mobile-center] [class*="_timeEnd"] { box-sizing:border-box !important; flex:1 1 100% !important; order:2 !important; min-width:0 !important; max-width:100% !important; padding:0 !important; line-height:20px !important; text-align:center !important; white-space:normal !important; overflow-wrap:anywhere !important; }
  [data-dsh-mobile-center] [class*="_timeStart"] { box-sizing:border-box !important; flex:1 1 100% !important; order:2 !important; min-width:0 !important; max-width:100% !important; padding:0 !important; line-height:20px !important; text-align:center !important; white-space:normal !important; overflow-wrap:anywhere !important; }
  [data-dsh-mobile-center] [class*="_timeStart"] [class*="_runTimeDot"],
  [data-dsh-mobile-center] [class*="_timeEnd"] [class*="_runTimeDot"] { margin:0 6px !important; }
  /* Keep the context meter's legend rows as readable label/value pairs.
     Generic mobile flex rules can otherwise place the rows side by side and
     break Chinese labels in the middle of a word. */
  [data-dsh-mobile-center] [role="dialog"][aria-label*="上下文"],
  [data-dsh-mobile-center] [role="dialog"][aria-label*="Context"] { width:min(264px,calc(100vw - 32px)) !important; min-width:0 !important; max-width:calc(100vw - 32px) !important; }
  [data-dsh-mobile-center] [role="dialog"][aria-label*="上下文"] [class*="_rows"],
  [data-dsh-mobile-center] [role="dialog"][aria-label*="Context"] [class*="_rows"] { display:block !important; }
  [data-dsh-mobile-center] [role="dialog"][aria-label*="上下文"] [class*="_rows"] > [class*="_row"],
  [data-dsh-mobile-center] [role="dialog"][aria-label*="Context"] [class*="_rows"] > [class*="_row"] { display:flex !important; align-items:center !important; justify-content:space-between !important; width:100% !important; min-width:0 !important; white-space:nowrap !important; }
  [data-dsh-mobile-center] [role="dialog"][aria-label*="上下文"] :is(dt,dd),
  [data-dsh-mobile-center] [role="dialog"][aria-label*="Context"] :is(dt,dd) { white-space:nowrap !important; word-break:keep-all !important; }
  .dsh-mobile-branch-toast,.dsh-mobile-media-toast { display:block; position:fixed; z-index:330; top:max(12px,env(safe-area-inset-top)); left:50%; max-width:calc(100vw - 32px); box-sizing:border-box; padding:7px 14px; border:1px solid rgb(15 23 42 / 10%); border-radius:999px; background:rgb(15 23 42 / 92%); color:#fff; font-size:13px; line-height:20px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0; pointer-events:none; transform:translate(-50%,-8px); transition:opacity 160ms ease,transform 160ms ease; }
  .dsh-mobile-branch-toast[data-visible="true"],.dsh-mobile-media-toast[data-visible="true"] { opacity:1; transform:translate(-50%,0); }
  .dsh-mobile-media-shortcuts { box-sizing:border-box; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; width:100%; padding:4px 4px 8px; margin-bottom:4px; border-bottom:1px solid var(--dsw-alias-border-inverted,var(--dsw-alias-border-subtle,rgb(148 163 184 / 28%))); }
  .dsh-mobile-media-action { box-sizing:border-box; display:flex; align-items:center; justify-content:flex-start; gap:8px; width:100%; min-width:0; min-height:44px; padding:8px 10px; border:0; border-radius:10px; background:var(--dsw-alias-interactive-bg-hover,rgb(148 163 184 / 12%)); color:var(--dsw-alias-label-primary,inherit); cursor:pointer; font:inherit; font-size:14px; line-height:22px; text-align:left; touch-action:manipulation; }
  .dsh-mobile-media-action:active { opacity:.72; }
  .dsh-mobile-media-action:focus-visible { outline:2px solid var(--dsw-alias-interactive-border-focus,#4c82f7); outline-offset:1px; }
  .dsh-mobile-media-action:disabled { cursor:default; opacity:.38; }
  .dsh-mobile-media-action svg { flex:none; width:16px; height:16px; color:var(--dsw-alias-label-tertiary,currentColor); }
  .dsh-mobile-media-action span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  [data-dsh-mobile-center] [class*="_composer"] { padding-left:8px !important; padding-right:8px !important; padding-bottom:max(8px,env(safe-area-inset-bottom)) !important; }
  /* The desktop composer intentionally wraps whole toolbar groups. On a phone,
     dynamic model and status labels made that row alternate between one and
     two lines. Keep two stable columns and let only the model label shrink. */
  [data-dsh-mobile-composer-row] { display:grid !important; grid-template-columns:max-content minmax(0,1fr) !important; align-items:center !important; gap:4px 8px !important; }
  [data-dsh-mobile-composer-tools] { display:flex !important; flex-wrap:nowrap !important; width:max-content !important; min-width:0 !important; max-width:max-content !important; gap:6px !important; }
  [data-dsh-mobile-composer-trailing] { display:flex !important; flex-wrap:nowrap !important; width:100% !important; min-width:0 !important; max-width:100% !important; gap:6px !important; margin-left:0 !important; justify-content:flex-end !important; }
  [data-dsh-mobile-composer-model] { flex:1 1 0 !important; width:auto !important; min-width:0 !important; max-width:none !important; }
  [data-dsh-mobile-composer-model-trigger] { box-sizing:border-box !important; width:100% !important; max-width:100% !important; min-width:0 !important; padding-left:6px !important; padding-right:4px !important; }
  [data-dsh-mobile-composer-model-label] { flex:1 1 auto !important; max-width:none !important; min-width:0 !important; overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
  [data-dsh-mobile-center] [class*="_root"]:has(> [class*="_card"] textarea) { box-sizing:border-box !important; width:100% !important; padding:0 0 8px !important; }
  [data-dsh-mobile-center] [class*="_root"]:has(> [class*="_card"] textarea) > [class=""]:last-child { display:none !important; }
}
@keyframes dsh-mobile-fade-in { from { opacity:0; } }
@keyframes dsh-mobile-panel-in { from { opacity:.72; transform:translateY(6px); } }
@keyframes dsh-mobile-view-in { from { opacity:.58; transform:translateY(5px); } }
@media (max-width:420px) {
  [data-dsh-mobile-header] [class*="_headerActions"] { max-width:42vw; }
  [data-dsh-mobile-settings-options] [data-slot="settings.general.item"] [class*="_selector"] { align-self:stretch !important; width:100% !important; }
  [data-dsh-mobile-message-column] [data-context-fields] > * { grid-template-columns:1fr !important; }
}
@media (prefers-reduced-motion:reduce) {
  [data-dsh-mobile-sidebar-root],[data-dsh-mobile-details] { transition:none !important; }
  .dsh-native-mobile-backdrop:not([hidden]),[data-dsh-mobile-settings],
  [data-dsh-mobile-settings-content][data-dsh-mobile-view-transition="true"],
  [data-dsh-mobile-view][data-dsh-mobile-view-transition="true"] { animation:none !important; }
}
`;
		function classToken(element, suffix) {
			return Array.from(element.classList).some((value) => value.endsWith(suffix));
		}
		function firstByClassSuffix(root, suffix) {
			return Array.from(root.querySelectorAll("[class]")).find((element) => classToken(element, suffix));
		}
		/** Find the stock DSH application frame without mistaking a feature card for the shell. */
		function resolveNativeMobileFrame(root, dedicatedCenter) {
			if (dedicatedCenter !== void 0) return void 0;
			return Array.from(root.querySelectorAll("[class]")).find((candidate) => {
				return classToken(candidate, "_frame") && firstByClassSuffix(candidate, "_sidebarCol") !== void 0 && firstByClassSuffix(candidate, "_centerCol") !== void 0;
			});
		}
		/** Mark every mounted settings dialog so its mobile layout does not depend on the conversation shell. */
		function markNativeMobileSettings(root) {
			let marked = 0;
			for (const dialog of root.querySelectorAll("[role=\"dialog\"]")) {
				const children = Array.from(dialog.children);
				const nav = children.find((child) => classToken(child, "_nav"));
				const content = children.find((child) => classToken(child, "_content"));
				if (nav === void 0 || content === void 0) continue;
				dialog.dataset.dshMobileSettings = "true";
				nav.dataset.dshMobileSettingsNav = "true";
				content.dataset.dshMobileSettingsContent = "true";
				firstByClassSuffix(nav, "_navList")?.setAttribute("data-dsh-mobile-settings-list", "true");
				firstByClassSuffix(content, "_header")?.setAttribute("data-dsh-mobile-settings-header", "true");
				firstByClassSuffix(content, "_options")?.setAttribute("data-dsh-mobile-settings-options", "true");
				marked += 1;
			}
			return marked;
		}
		const AUTO_HISTORY_THRESHOLD_PX = 64;
		function controlledFileDragEvent(type, files, initialDropEffect) {
			const event = new Event(type, {
				bubbles: true,
				cancelable: true
			});
			const dataTransfer = {
				dropEffect: initialDropEffect,
				effectAllowed: "copy",
				files: Object.freeze([...files]),
				types: Object.freeze(["Files"])
			};
			Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
			return event;
		}
		/** Ask the official document dragover listener whether the current composer accepts files. */
		function preflightComposerImageDrop(target, files) {
			if (files.length === 0) return false;
			const event = controlledFileDragEvent("dragover", files, "none");
			target.dispatchEvent(event);
			return event.dataTransfer?.dropEffect === "copy";
		}
		/** Dispatch a real drop only after a fresh official-listener preflight; the result is not an attachment ACK. */
		function dispatchComposerImageDrop(target, files) {
			if (!preflightComposerImageDrop(target, files)) return false;
			target.dispatchEvent(controlledFileDragEvent("drop", files, "copy"));
			return true;
		}
		/** Apply the resolved locale independently from the document's possibly different lang attribute. */
		function applyNativeMobileLanguageMarker(root, language) {
			const previous = root.dataset.dshMobileLanguage;
			root.dataset.dshMobileLanguage = language;
			return () => {
				if (root.dataset.dshMobileLanguage !== language) return;
				if (previous === void 0) delete root.dataset.dshMobileLanguage;
				else root.dataset.dshMobileLanguage = previous;
			};
		}
		/** Resolve the supported language used by native-mobile controls. */
		function resolveNativeMobileLanguage(documentLanguage, browserLanguages) {
			return [documentLanguage, ...browserLanguages].map((value) => value.trim().toLowerCase().split(/[-_]/u)[0]).find((value) => value === "it" || value === "en" || value === "zh") ?? "en";
		}
		/** Whether a user-driven scroll moved upward into the automatic history-loading zone. */
		function shouldAutoLoadEarlier(previousTop, currentTop) {
			return currentTop <= AUTO_HISTORY_THRESHOLD_PX && currentTop < previousTop - .5;
		}
		/**
		* Whether the overlay scrim belongs on screen. The scrim exists for the
		* slide-in drawer only — it dims the page and catches the tap that closes the
		* drawer — so it is shown while that drawer is open *and* the overlay query is
		* in force. `hidden` carries the whole decision rather than the width rules
		* alone: the attribute still hides the element when the injected stylesheet
		* never lands (a CSP without inline styles, a shell that drops the <style>
		* node), where the element would otherwise fall back to the UA button box.
		*/
		function drawerScrimVisible(sidebarCollapsed, overlayActive) {
			return !sidebarCollapsed && overlayActive;
		}
		/** Check that an asynchronous picker result still belongs to its originating session and composer. */
		function isComposerMediaOriginCurrent(origin, current) {
			return !current.disposed && origin.generation === current.generation && origin.href === current.href && origin.composer !== null && current.composerConnected && origin.composer === current.composer && origin.sessionRoot !== null && origin.sessionRoot === current.sessionRoot && origin.sessionId !== null && origin.sessionId === current.sessionId;
		}
		/** Add mobile semantics without replacing feature trees. */
		function installNativeMobileSurface() {
			document.documentElement.classList.add("dsh-native-mobile-active");
			const browserLanguages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
			const language = resolveNativeMobileLanguage(document.documentElement.lang, browserLanguages);
			const restoreLanguageMarker = applyNativeMobileLanguageMarker(document.documentElement, language);
			const label = (italian, english, chinese) => language === "it" ? italian : language === "zh" ? chinese : english;
			const mediaIcon = (kind) => {
				const namespace = "http://www.w3.org/2000/svg";
				const icon = document.createElementNS(namespace, "svg");
				icon.setAttribute("viewBox", "0 0 16 16");
				icon.setAttribute("fill", "none");
				icon.setAttribute("aria-hidden", "true");
				if (kind === "attachment") {
					const path = document.createElementNS(namespace, "path");
					path.setAttribute("d", "M5.5498 9.75V5H6.9502V9.75C6.9502 10.3299 7.4201 10.7998 8 10.7998C8.5799 10.7998 9.0498 10.3299 9.0498 9.75V4.5C9.0498 2.9536 7.7964 1.7002 6.25 1.7002C4.7036 1.7002 3.4502 2.9536 3.4502 4.5V9.75C3.4502 12.2629 5.4871 14.2998 8 14.2998C10.5129 14.2998 12.5498 12.2629 12.5498 9.75V4H13.9502V9.75C13.9502 13.0361 11.2861 15.7002 8 15.7002C4.71391 15.7002 2.0498 13.0361 2.0498 9.75V4.5C2.04981 2.1804 3.9304 0.299806 6.25 0.299805C8.5696 0.299805 10.4502 2.1804 10.4502 4.5V9.75C10.4502 11.1031 9.3531 12.2002 8 12.2002C6.6469 12.2002 5.5498 11.1031 5.5498 9.75Z");
					path.setAttribute("fill", "currentColor");
					icon.append(path);
					return icon;
				}
				const body = document.createElementNS(namespace, "path");
				body.setAttribute("d", "M5.15 3.2 6.05 2h3.9l.9 1.2h1.45c1.05 0 1.9.85 1.9 1.9v6c0 1.05-.85 1.9-1.9 1.9H3.7a1.9 1.9 0 0 1-1.9-1.9v-6c0-1.05.85-1.9 1.9-1.9h1.45Zm-1.45 1.3a.6.6 0 0 0-.6.6v6c0 .33.27.6.6.6h8.6a.6.6 0 0 0 .6-.6v-6a.6.6 0 0 0-.6-.6h-2.1l-.9-1.2H6.7l-.9 1.2H3.7Z");
				body.setAttribute("fill", "currentColor");
				const lens = document.createElementNS(namespace, "circle");
				lens.setAttribute("cx", "8");
				lens.setAttribute("cy", "8.1");
				lens.setAttribute("r", "2.15");
				lens.setAttribute("stroke", "currentColor");
				lens.setAttribute("stroke-width", "1.3");
				icon.append(body, lens);
				return icon;
			};
			const createMediaAction = (kind, text) => {
				const button = document.createElement("button");
				button.type = "button";
				button.className = "dsh-mobile-media-action";
				button.lang = language;
				button.dataset.dshMobileMediaAction = kind;
				button.append(mediaIcon(kind));
				const caption = document.createElement("span");
				caption.textContent = text;
				button.append(caption);
				return button;
			};
			const setInputMode = (mode) => {
				document.documentElement.dataset.dshMobileInput = mode;
			};
			const onPointerDown = (event) => {
				if (event.pointerType === "touch" || event.pointerType === "pen") setInputMode("touch");
			};
			const onKeyDown = (event) => {
				if (event.key === "Tab" || event.key.startsWith("Arrow")) setInputMode("keyboard");
			};
			document.addEventListener("pointerdown", onPointerDown, true);
			document.addEventListener("keydown", onKeyDown, true);
			const overlayQuery = window.matchMedia(NATIVE_MOBILE_OVERLAY_QUERY);
			const backdrop = document.createElement("button");
			backdrop.type = "button";
			backdrop.className = "dsh-native-mobile-backdrop";
			backdrop.lang = language;
			backdrop.hidden = true;
			backdrop.setAttribute("aria-label", label("Chiudi navigazione area di lavoro", "Close workspace navigation", "关闭工作区导航"));
			document.body.append(backdrop);
			const branchToast = document.createElement("div");
			branchToast.className = "dsh-mobile-branch-toast";
			branchToast.lang = language;
			branchToast.setAttribute("role", "status");
			branchToast.setAttribute("aria-live", "polite");
			document.body.append(branchToast);
			const mediaToast = document.createElement("div");
			mediaToast.className = "dsh-mobile-media-toast";
			mediaToast.lang = language;
			mediaToast.setAttribute("role", "status");
			mediaToast.setAttribute("aria-live", "polite");
			document.body.append(mediaToast);
			const mediaActions = document.createElement("div");
			mediaActions.className = "dsh-mobile-media-shortcuts";
			mediaActions.lang = language;
			mediaActions.dataset.dshMobileMediaShortcuts = "true";
			mediaActions.setAttribute("role", "group");
			mediaActions.setAttribute("aria-label", label("Aggiungi immagine", "Add image", "添加图片"));
			const fileButton = createMediaAction("attachment", label("Scegli immagine", "Choose image", "选择图片"));
			const cameraButton = createMediaAction("camera", label("Scatta foto", "Take photo", "拍照"));
			fileButton.disabled = true;
			cameraButton.disabled = true;
			mediaActions.append(fileButton, cameraButton);
			let branchToastTimer = 0;
			let mediaToastTimer = 0;
			const showMediaToast = (message) => {
				mediaToast.textContent = message;
				mediaToast.dataset.visible = "true";
				if (mediaToastTimer !== 0) window.clearTimeout(mediaToastTimer);
				mediaToastTimer = window.setTimeout(() => {
					mediaToast.removeAttribute("data-visible");
					mediaToastTimer = 0;
				}, 2200);
			};
			let mediaRequestGeneration = 0;
			let disposed = false;
			let boundComposer = null;
			let boundSessionRoot = null;
			let boundSessionId = null;
			const preflightFile = new File([], "dsh-mobile-preflight.png", { type: "image/png" });
			const canAcceptComposerDrop = () => preflightComposerImageDrop(document, [preflightFile]);
			const mediaPickerAbortController = new AbortController();
			const browserPickerCleanups = /* @__PURE__ */ new Set();
			const sessionTokens = /* @__PURE__ */ new WeakMap();
			let nextSessionToken = 0;
			const currentSessionOrigin = () => {
				const dedicatedRoot = boundComposer?.closest("[data-dsh-mobile-session]") ?? null;
				const dedicatedId = dedicatedRoot?.getAttribute("data-dsh-mobile-session");
				if (dedicatedRoot !== null && typeof dedicatedId === "string" && dedicatedId !== "") return {
					sessionRoot: dedicatedRoot,
					sessionId: dedicatedId
				};
				const selectedRow = document.querySelector("[role=\"treeitem\"][aria-selected=\"true\"]");
				if (selectedRow === null) return {
					sessionRoot: null,
					sessionId: null
				};
				let token = sessionTokens.get(selectedRow);
				if (token === void 0) {
					token = `stock-${String(++nextSessionToken)}`;
					sessionTokens.set(selectedRow, token);
				}
				const identity = selectedRow.getAttribute("data-session-id") ?? selectedRow.getAttribute("aria-label") ?? selectedRow.textContent?.trim() ?? "";
				return {
					sessionRoot: selectedRow,
					sessionId: `${token}:${identity}`
				};
			};
			const mediaRequestContext = () => {
				const session = currentSessionOrigin();
				return {
					generation: ++mediaRequestGeneration,
					href: window.location.href,
					composer: boundComposer,
					...session
				};
			};
			const mediaRequestIsCurrent = (context) => {
				const session = currentSessionOrigin();
				const composer = boundComposer;
				return isComposerMediaOriginCurrent(context, {
					generation: mediaRequestGeneration,
					href: window.location.href,
					composer,
					sessionRoot: session.sessionRoot,
					sessionId: session.sessionId,
					disposed,
					composerConnected: context.composer?.isConnected === true
				});
			};
			const deliverImages = (files, context) => {
				if (files.length === 0 || !mediaRequestIsCurrent(context)) return;
				dispatchComposerImageDrop(document, files);
			};
			const launchBrowserPicker = (camera, context) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/png,image/jpeg,image/webp,image/gif";
				if (camera) input.capture = "environment";
				input.hidden = true;
				const signal = mediaPickerAbortController.signal;
				let cleanupTimer = 0;
				let watchdogTimer = 0;
				let cleaned = false;
				const scheduleCleanup = () => {
					if (!cleaned && cleanupTimer === 0) cleanupTimer = window.setTimeout(cleanup, 1e3);
				};
				const onVisibilityChange = () => {
					if (document.visibilityState === "visible") scheduleCleanup();
				};
				const onChange = () => {
					if (cleaned) return;
					const files = input.files === null ? [] : [...input.files];
					cleanup();
					deliverImages(files, context);
				};
				const cleanup = () => {
					if (cleaned) return;
					cleaned = true;
					if (cleanupTimer !== 0) window.clearTimeout(cleanupTimer);
					if (watchdogTimer !== 0) window.clearTimeout(watchdogTimer);
					cleanupTimer = 0;
					watchdogTimer = 0;
					input.removeEventListener("change", onChange);
					input.removeEventListener("cancel", cleanup);
					window.removeEventListener("focus", scheduleCleanup);
					document.removeEventListener("visibilitychange", onVisibilityChange);
					signal.removeEventListener("abort", cleanup);
					browserPickerCleanups.delete(cleanup);
					input.remove();
				};
				input.addEventListener("change", onChange);
				input.addEventListener("cancel", cleanup);
				window.addEventListener("focus", scheduleCleanup);
				document.addEventListener("visibilitychange", onVisibilityChange);
				signal.addEventListener("abort", cleanup, { once: true });
				watchdogTimer = window.setTimeout(cleanup, 3e5);
				browserPickerCleanups.add(cleanup);
				if (signal.aborted) {
					cleanup();
					return;
				}
				try {
					document.body.append(input);
					input.click();
				} catch {
					cleanup();
					if (mediaRequestIsCurrent(context)) showMediaToast(label("Impossibile aprire il selettore immagini", "Could not open the image picker", "无法打开图片选择器"));
				}
			};
			const dismissCommandMenu = () => {
				(boundComposer?.querySelector("button[aria-haspopup=\"listbox\"][aria-expanded=\"true\"]"))?.click();
			};
			const setMediaActionsDisabled = (disabled, title) => {
				for (const button of [fileButton, cameraButton]) {
					if (button.disabled !== disabled) button.disabled = disabled;
					if (button.title !== title) button.title = title;
				}
			};
			const quietMediaPointer = (event) => {
				event.preventDefault();
				event.stopPropagation();
				const active = document.activeElement;
				if (active instanceof HTMLElement && (active.matches("input,textarea") || active.isContentEditable)) active.blur();
			};
			const pickImage = (camera) => {
				if (!canAcceptComposerDrop()) {
					setMediaActionsDisabled(true, label("Allegati immagine non disponibili", "Image attachments are unavailable", "图片附件不可用"));
					dismissCommandMenu();
					return;
				}
				const context = mediaRequestContext();
				dismissCommandMenu();
				const bridge = window.__DSH_MOBILE_NATIVE__;
				if (bridge === void 0) {
					launchBrowserPicker(camera, context);
					return;
				}
				const action = camera ? "camera.capture" : "files.pick";
				const input = camera ? {} : { accept: [
					"image/png",
					"image/jpeg",
					"image/webp",
					"image/gif"
				] };
				Promise.resolve().then(() => bridge.invoke(action, input)).then((value) => {
					if (!mediaRequestIsCurrent(context)) return;
					if (value instanceof File) deliverImages([value], context);
					else showMediaToast(label("Il file selezionato non è utilizzabile", "The selected file is unavailable", "所选文件不可用"));
				}).catch((error) => {
					if (!mediaRequestIsCurrent(context)) return;
					const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
					if (code === "cancelled") return;
					showMediaToast(code === "payload_too_large" ? label("L’immagine supera il limite di 8 MiB", "The image exceeds the 8 MiB limit", "图片超过 8 MiB 限制") : label("Impossibile aggiungere l’immagine", "Could not attach the image", "无法附加图片"));
				});
			};
			const chooseImage = () => {
				pickImage(false);
			};
			const takePhoto = () => {
				pickImage(true);
			};
			fileButton.addEventListener("pointerdown", quietMediaPointer);
			cameraButton.addEventListener("pointerdown", quietMediaPointer);
			fileButton.addEventListener("click", chooseImage);
			cameraButton.addEventListener("click", takePhoto);
			const showBranchToast = () => {
				const header = document.querySelector("[data-dsh-mobile-header]");
				const title = header === null ? void 0 : header.querySelector("[class*=\"_crumbCurrent\"]")?.textContent?.trim();
				const prefix = label("Ramo corrente", "Current branch", "当前分支");
				branchToast.textContent = title === void 0 ? prefix : `${prefix}: ${title}`;
				branchToast.dataset.visible = "true";
				if (branchToastTimer !== 0) window.clearTimeout(branchToastTimer);
				branchToastTimer = window.setTimeout(() => {
					branchToast.removeAttribute("data-visible");
					branchToastTimer = 0;
				}, 1600);
			};
			const onBranchClick = (event) => {
				if (!(event.target instanceof Element)) return;
				const branch = event.target.closest("button[aria-label*=\"分支\"],button[aria-label*=\"Branch\"],button[aria-label*=\"branch\"],button[aria-label*=\"Ramo\"],button[aria-label*=\"ramo\"]");
				if (branch === null || branch.hasAttribute("disabled") || branch.getAttribute("aria-disabled") === "true") return;
				window.setTimeout(showBranchToast, 80);
			};
			document.addEventListener("click", onBranchClick, true);
			let frame;
			let sidebar;
			let sidebarRoot;
			let toggle;
			let viewArea;
			let scheduled = 0;
			let transitionFrame = 0;
			let transitionRestartFrame = 0;
			let transitionTimer = 0;
			let transitionTarget;
			let historyScroller;
			let historyPreviousTop = 0;
			const historyLoadButton = () => {
				return (historyScroller === void 0 ? void 0 : firstByClassSuffix(historyScroller, "_older"))?.querySelector("button") ?? void 0;
			};
			const onHistoryScroll = () => {
				if (historyScroller === void 0) return;
				const currentTop = Math.max(0, historyScroller.scrollTop);
				const shouldLoad = shouldAutoLoadEarlier(historyPreviousTop, currentTop);
				historyPreviousTop = currentTop;
				if (!shouldLoad) return;
				const button = historyLoadButton();
				if (button === void 0 || button.disabled || button.getAttribute("aria-disabled") === "true") return;
				button.click();
			};
			const bindHistoryScroller = (next) => {
				if (historyScroller === next) return;
				historyScroller?.removeEventListener("scroll", onHistoryScroll);
				historyScroller = next;
				historyPreviousTop = next?.scrollTop ?? 0;
				historyScroller?.addEventListener("scroll", onHistoryScroll, { passive: true });
			};
			const animateNavigation = (event) => {
				if (!(event.target instanceof Element)) return;
				const trigger = event.target.closest("button,a,[role=\"tab\"],[aria-selected]");
				if (trigger === null || trigger.hasAttribute("disabled") || trigger.getAttribute("aria-disabled") === "true") return;
				if (trigger.getAttribute("aria-selected") === "true" || trigger.getAttribute("aria-current") === "true") return;
				const settingsNavigation = trigger.closest("[data-dsh-mobile-settings-list]") !== null;
				const conversationNavigation = trigger.matches("[role=\"tab\"]");
				const sidebarNavigation = trigger.closest("[data-dsh-mobile-sidebar-root]") !== null && trigger.closest("[data-dsh-mobile-toggle]") === null;
				if (!settingsNavigation && !conversationNavigation && !sidebarNavigation) return;
				if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
				if (transitionFrame !== 0) cancelAnimationFrame(transitionFrame);
				if (transitionRestartFrame !== 0) cancelAnimationFrame(transitionRestartFrame);
				transitionFrame = requestAnimationFrame(() => {
					transitionFrame = 0;
					const target = settingsNavigation ? document.querySelector("[data-dsh-mobile-settings-content]") : viewArea;
					if (target === null || target === void 0) return;
					transitionTarget?.removeAttribute("data-dsh-mobile-view-transition");
					target.removeAttribute("data-dsh-mobile-view-transition");
					transitionRestartFrame = requestAnimationFrame(() => {
						transitionRestartFrame = 0;
						transitionTarget = target;
						target.dataset.dshMobileViewTransition = "true";
						if (transitionTimer !== 0) clearTimeout(transitionTimer);
						transitionTimer = window.setTimeout(() => {
							target.removeAttribute("data-dsh-mobile-view-transition");
							if (transitionTarget === target) transitionTarget = void 0;
							transitionTimer = 0;
						}, 240);
					});
				});
			};
			document.addEventListener("click", animateNavigation);
			const syncMediaBinding = (composer) => {
				const previousComposer = boundComposer;
				boundComposer = composer;
				const session = currentSessionOrigin();
				if (composer === previousComposer && session.sessionRoot === boundSessionRoot && session.sessionId === boundSessionId) return;
				boundSessionRoot = session.sessionRoot;
				boundSessionId = session.sessionId;
				mediaRequestGeneration += 1;
			};
			const sync = () => {
				scheduled = 0;
				const dedicatedCenter = document.querySelector(".dshm-main") ?? void 0;
				const nextFrame = resolveNativeMobileFrame(document, dedicatedCenter);
				if (frame !== nextFrame) frame?.removeAttribute("data-dsh-mobile-frame");
				frame = nextFrame;
				if (frame !== void 0) frame.dataset.dshMobileFrame = "true";
				sidebar = frame === void 0 ? document.querySelector(".dshm-drawer") ?? void 0 : firstByClassSuffix(frame, "_sidebarCol");
				const center = frame === void 0 ? dedicatedCenter : firstByClassSuffix(frame, "_centerCol");
				const details = frame === void 0 ? void 0 : firstByClassSuffix(frame, "_detailsCol");
				const handle = frame === void 0 ? void 0 : firstByClassSuffix(frame, "_handle");
				markNativeMobileSettings(document);
				if (center === void 0) {
					bindHistoryScroller(void 0);
					syncMediaBinding(null);
					setMediaActionsDisabled(true, label("Apri prima una sessione", "Open a session first", "请先打开会话"));
					mediaActions.remove();
					return;
				}
				if (center !== void 0) {
					center.dataset.dshMobileCenter = "true";
					center.querySelector("header")?.setAttribute("data-dsh-mobile-header", "true");
					viewArea = firstByClassSuffix(center, "_viewArea");
					if (viewArea !== void 0) viewArea.dataset.dshMobileView = "true";
					const conversation = center.querySelector("[data-conversation-scroll]");
					bindHistoryScroller(conversation ?? void 0);
					const historyLoader = conversation === null ? void 0 : firstByClassSuffix(conversation, "_older");
					if (historyLoader !== void 0) {
						historyLoader.dataset.dshMobileHistoryLoader = "true";
						historyLoader.setAttribute("aria-live", "polite");
						const button = historyLoader.querySelector("button");
						if (button !== null) {
							button.tabIndex = -1;
							if (button.disabled) button.removeAttribute("aria-hidden");
							else button.setAttribute("aria-hidden", "true");
						}
					}
					const messageColumn = conversation === null ? void 0 : firstByClassSuffix(conversation, "_column");
					const messageScroll = messageColumn?.parentElement;
					if (messageColumn !== void 0 && messageScroll !== null && messageScroll !== void 0 && classToken(messageScroll, "_scroll")) {
						messageColumn.dataset.dshMobileMessageColumn = "true";
						messageScroll.dataset.dshMobileMessageScroll = "true";
					}
					for (const table of center.querySelectorAll("table")) {
						if (table.parentElement?.dataset.dshMobileTableScroll === "true") continue;
						const wrapper = document.createElement("div");
						wrapper.dataset.dshMobileTableScroll = "true";
						table.before(wrapper);
						wrapper.append(table);
					}
					const composerCard = center.querySelector("[data-composer-card]");
					const composerRow = composerCard?.querySelector(":scope > [data-input-scroll]")?.nextElementSibling;
					if (!(composerRow instanceof HTMLElement)) {
						syncMediaBinding(null);
						setMediaActionsDisabled(true, label("Apri prima una sessione", "Open a session first", "请先打开会话"));
						mediaActions.remove();
					}
					if (composerRow instanceof HTMLElement) {
						composerRow.dataset.dshMobileComposerRow = "true";
						const groups = Array.from(composerRow.children).filter((child) => child instanceof HTMLElement);
						const composerTools = groups[0];
						const composerTrailing = groups.at(-1);
						if (composerTools !== void 0) {
							composerTools.dataset.dshMobileComposerTools = "true";
							syncMediaBinding(composerCard ?? null);
							const composerInput = composerCard?.querySelector("textarea");
							const composerEditor = composerCard?.querySelector("[contenteditable=\"true\"],[contenteditable=\"plaintext-only\"]");
							const composerBusy = composerCard?.getAttribute("aria-busy") === "true" || composerInput?.disabled === true || composerInput?.readOnly === true || composerEditor?.getAttribute("aria-disabled") === "true";
							const attachmentBlocked = !canAcceptComposerDrop();
							const mediaDisabled = conversation === null || currentSessionOrigin().sessionId === null || composerBusy || attachmentBlocked;
							const mediaTitle = composerBusy ? label("Attendi il completamento della risposta", "Wait for the response to finish", "请等待回复完成") : attachmentBlocked ? label("Allegati immagine non disponibili", "Image attachments are unavailable", "图片附件不可用") : mediaDisabled ? label("Apri prima una sessione", "Open a session first", "请先打开会话") : label("Allega screenshot, immagine o foto", "Attach screenshot, image, or photo", "附加截图、图片或照片");
							setMediaActionsDisabled(mediaDisabled, mediaTitle);
							const commandMenu = composerCard?.querySelector("[data-trigger-menu]") ?? null;
							if (commandMenu !== null && (mediaActions.parentElement !== commandMenu || commandMenu.firstElementChild !== mediaActions)) commandMenu.prepend(mediaActions);
						}
						if (composerTrailing !== void 0 && composerTrailing !== composerTools) {
							composerTrailing.dataset.dshMobileComposerTrailing = "true";
							const modelTrigger = composerTrailing.querySelector("button[aria-label^=\"选择模型\"],button[aria-label^=\"Select model\"],button[aria-label^=\"Seleziona modello\"]");
							if (modelTrigger !== null) {
								modelTrigger.dataset.dshMobileComposerModelTrigger = "true";
								modelTrigger.parentElement?.setAttribute("data-dsh-mobile-composer-model", "true");
								modelTrigger.querySelector("[class*=\"_triggerLabel\"]")?.setAttribute("data-dsh-mobile-composer-model-label", "true");
							}
						}
					}
				}
				if (handle !== void 0) handle.dataset.dshMobileHandle = "true";
				if (details !== void 0) {
					details.dataset.dshMobileDetails = "true";
					const lastColumn = frame?.style.gridTemplateColumns.trim().split(/\s+/).at(-1);
					details.dataset.open = String(lastColumn !== void 0 && lastColumn !== "0px" && lastColumn !== "0");
				}
				if (sidebar === void 0) return;
				sidebar.dataset.dshMobileSidebar = "true";
				toggle = firstByClassSuffix(sidebar, "_toggle");
				let candidate = toggle?.parentElement;
				while (candidate !== void 0 && candidate !== null && candidate !== sidebar && !classToken(candidate, "_root")) candidate = candidate.parentElement;
				sidebarRoot = candidate !== sidebar && candidate !== null ? candidate : void 0;
				if (sidebarRoot === void 0) return;
				sidebarRoot.dataset.dshMobileSidebarRoot = "true";
				for (const brand of sidebarRoot.querySelectorAll("[class*=\"_fallbackBrandName\"]")) if (brand.textContent?.trim() === "DSH Local Build") brand.textContent = "DeepSeek Harness";
				if (toggle !== void 0) toggle.dataset.dshMobileToggle = "true";
				const collapsed = classToken(sidebarRoot, "_collapsed");
				sidebar.dataset.open = String(!collapsed);
				backdrop.hidden = !drawerScrimVisible(collapsed, overlayQuery.matches);
			};
			const schedule = () => {
				if (scheduled === 0) scheduled = requestAnimationFrame(sync);
			};
			const observer = new MutationObserver(schedule);
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: [
					"class",
					"style",
					"disabled",
					"readonly",
					"aria-busy",
					"aria-selected",
					"data-dsh-mobile-session"
				]
			});
			overlayQuery.addEventListener("change", schedule);
			backdrop.addEventListener("click", () => {
				if (sidebar?.dataset.open === "true") toggle?.click();
			});
			sync();
			const disposeTaskWatcher = installTaskCompletionWatcher({
				completionFallback: false,
				label: (kind, sessionLabel) => kind === "done" ? {
					title: label("Attività completata", "Task finished", "任务已完成"),
					body: sessionLabel === "" ? label("Il tuo task DSH è terminato", "Your DSH task finished", "你的 DSH 任务已完成") : label(`Il tuo task DSH è terminato: ${sessionLabel}`, `Your DSH task finished: ${sessionLabel}`, `你的 DSH 任务已完成：${sessionLabel}`)
				} : {
					title: label("È richiesto un input", "Input needed", "需要你确认"),
					body: label("DSH attende una tua scelta", "DSH waits for your choice", "DSH 等待你的选择")
				}
			});
			return () => {
				disposed = true;
				disposeTaskWatcher();
				mediaRequestGeneration += 1;
				mediaPickerAbortController.abort();
				restoreLanguageMarker();
				for (const cleanup of [...browserPickerCleanups]) cleanup();
				observer.disconnect();
				overlayQuery.removeEventListener("change", schedule);
				document.removeEventListener("click", onBranchClick, true);
				fileButton.removeEventListener("pointerdown", quietMediaPointer);
				cameraButton.removeEventListener("pointerdown", quietMediaPointer);
				fileButton.removeEventListener("click", chooseImage);
				cameraButton.removeEventListener("click", takePhoto);
				if (branchToastTimer !== 0) window.clearTimeout(branchToastTimer);
				if (mediaToastTimer !== 0) window.clearTimeout(mediaToastTimer);
				branchToast.remove();
				mediaToast.remove();
				mediaActions.remove();
				if (scheduled !== 0) cancelAnimationFrame(scheduled);
				if (transitionFrame !== 0) cancelAnimationFrame(transitionFrame);
				if (transitionRestartFrame !== 0) cancelAnimationFrame(transitionRestartFrame);
				if (transitionTimer !== 0) clearTimeout(transitionTimer);
				transitionTarget?.removeAttribute("data-dsh-mobile-view-transition");
				historyScroller?.removeEventListener("scroll", onHistoryScroll);
				document.removeEventListener("pointerdown", onPointerDown, true);
				document.removeEventListener("keydown", onKeyDown, true);
				document.removeEventListener("click", animateNavigation);
				backdrop.remove();
				document.documentElement.classList.remove("dsh-native-mobile-active");
				delete document.documentElement.dataset.dshMobileInput;
			};
		}
		//#endregion
		//#region src/client.ts
		const queuedDefinitions = [];
		let queuedLegacyMount;
		if (typeof window !== "undefined" && window.dshMobile === void 0) window.dshMobile = {
			register: (mount) => {
				queuedLegacyMount = mount;
			},
			define: (definition) => {
				queuedDefinitions.push(definition);
			}
		};
		function isLoopbackHost(hostname) {
			return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
		}
		function selectMobileControlLocale(documentLanguage = "", navigatorLanguages = []) {
			for (const value of [documentLanguage, ...navigatorLanguages]) {
				const language = value.trim().toLowerCase().split(/[-_]/u)[0];
				if (language === "it" || language === "en" || language === "zh") return language;
			}
			return "en";
		}
		function selectedMobileControlLocale() {
			return selectMobileControlLocale(document.documentElement.lang, navigator.languages?.length ? navigator.languages : [navigator.language]);
		}
		/** Remount one plugin-owned surface when DSH changes the document language. */
		function installDshLanguageBoundSurface(install) {
			let locale = selectedMobileControlLocale();
			let dispose = install();
			const observer = new MutationObserver(() => {
				const next = selectedMobileControlLocale();
				if (next === locale) return;
				dispose();
				locale = next;
				dispose = install();
			});
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["lang"]
			});
			return () => {
				observer.disconnect();
				dispose();
			};
		}
		function controlTranslator(locale = selectedMobileControlLocale()) {
			const messages = MOBILE_CONTROL_MESSAGES;
			return (key, values = {}) => {
				return (messages[locale][key] ?? messages.en[key] ?? key).replace(/\{(\w+)\}/gu, (_match, name) => String(values[name] ?? `{${name}}`));
			};
		}
		function normalizeDiagnosticOverall(value) {
			return value === "ok" ? "ok" : value === "attention" ? "attention" : "error";
		}
		function normalizeDiagnosticStatus(value) {
			return value === "ok" || value === "warning" || value === "error" || value === "info" ? value : "error";
		}
		function diagnosticOverallForChecks(value, statuses) {
			const normalized = statuses.map(normalizeDiagnosticStatus);
			const payloadOverall = normalizeDiagnosticOverall(value);
			if (payloadOverall === "error" || normalized.includes("error")) return "error";
			if (payloadOverall === "attention" || normalized.includes("warning")) return "attention";
			return "ok";
		}
		function validateDiagnosticChecks(value) {
			if (!Array.isArray(value)) return {
				entries: [],
				malformed: true
			};
			const entries = [];
			let malformed = false;
			for (const candidate of value) {
				if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
					malformed = true;
					continue;
				}
				entries.push(candidate);
			}
			return {
				entries,
				malformed
			};
		}
		function diagnosticEntriesForRender(data) {
			const overallKnown = data.overall === "ok" || data.overall === "attention" || data.overall === "error";
			const validated = validateDiagnosticChecks(data.checks);
			const statusesKnown = validated.entries.every((entry) => entry.status === "ok" || entry.status === "warning" || entry.status === "error" || entry.status === "info");
			if (!overallKnown || validated.malformed || validated.entries.length === 0 || !statusesKnown) throw new TypeError("diagnostics envelope is unavailable");
			return validated.entries;
		}
		function renderDiagnosticPayloadSafely(data, render, onFailure) {
			try {
				render(data);
			} catch (error) {
				onFailure(error);
			}
		}
		function diagnosticServerCopy(entry) {
			return {
				label: typeof entry.label === "string" ? entry.label : "",
				detail: typeof entry.detail === "string" ? entry.detail : "",
				action: typeof entry.action === "string" ? entry.action : ""
			};
		}
		/**
		* Match DSH's client-side privilege hint to the authenticated mobile gateway.
		* The gateway authenticates the paired device and forwards allowed requests to
		* DSH's loopback listener, so settings RPCs receive the same Host-side checks
		* as the desktop page even though the phone's visible URL is a LAN address.
		*/
		function trustAuthenticatedGatewayConnection(connection) {
			const previous = connection.isLoopback;
			connection.isLoopback = true;
			return () => {
				connection.isLoopback = previous;
			};
		}
		function element(tag, className) {
			const node = document.createElement(tag);
			if (className !== void 0) node.className = className;
			return node;
		}
		const CONTROL_REQUEST_TIMEOUT_MS = 15e3;
		const LONG_CONTROL_REQUEST_TIMEOUT_MS = 21e4;
		const GITHUB_RELEASES_URL = "https://github.com/saya-ch/dsh-mobile/releases";
		const CONTROL_PANEL_ID = "dsh-mobile-control-panel";
		function releaseVersion(value) {
			return typeof value === "string" && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(value) ? value : void 0;
		}
		/** Reduce the loopback release response to trusted text and download metadata. */
		function clientReleaseInfo(data) {
			const latestVersion = releaseVersion(data.latestVersion);
			const androidVersion = releaseVersion(data.androidVersion);
			const expectedAndroidDownloadUrl = androidVersion === void 0 ? void 0 : `${GITHUB_RELEASES_URL}/download/v${androidVersion}/dsh-mobile-android-v${androidVersion}.apk`;
			const androidDownloadUrl = expectedAndroidDownloadUrl !== void 0 && data.androidDownloadUrl === expectedAndroidDownloadUrl ? expectedAndroidDownloadUrl : GITHUB_RELEASES_URL;
			return {
				updateAvailable: data.updateAvailable === true && latestVersion !== void 0,
				...latestVersion === void 0 ? {} : { latestVersion },
				...androidVersion === void 0 ? {} : { androidVersion },
				androidDownloadUrl,
				...typeof data.releaseNotes === "string" && data.releaseNotes !== "" ? { releaseNotes: data.releaseNotes.slice(0, 4e3) } : {}
			};
		}
		async function requestJson(path, init, timeoutMs = CONTROL_REQUEST_TIMEOUT_MS) {
			const controller = new AbortController();
			const upstreamSignal = init?.signal;
			const abortFromUpstream = () => {
				controller.abort(upstreamSignal?.reason);
			};
			if (upstreamSignal?.aborted === true) abortFromUpstream();
			else upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
			const timer = window.setTimeout(() => {
				controller.abort();
			}, timeoutMs);
			try {
				const response = await fetch(path, {
					...init,
					signal: controller.signal,
					headers: {
						"content-type": "application/json",
						...init?.headers
					}
				});
				const body = await response.json();
				if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `HTTP ${String(response.status)}`);
				return body;
			} catch (error) {
				if (controller.signal.aborted && upstreamSignal?.aborted !== true) throw new Error(controlTranslator()("requestTimeout"));
				throw error;
			} finally {
				clearTimeout(timer);
				upstreamSignal?.removeEventListener("abort", abortFromUpstream);
			}
		}
		function officialFunnelSetupUrl(value) {
			if (typeof value !== "string" || value.length > 2048) return "";
			let url;
			try {
				url = new URL(value);
			} catch {
				return "";
			}
			const normalized = url.toString().replace(/\/$/u, "");
			if (normalized === "https://tailscale.com/s/no-funnel" || normalized === "https://tailscale.com/s/https") return normalized;
			if (url.protocol !== "https:" || url.hostname !== "login.tailscale.com" || url.port !== "" || url.username !== "" || url.password !== "") return "";
			return url.toString();
		}
		/** Build the copy-only restricted VPS template without sending the token to the host API. */
		function createFrpServerTemplateForClipboard(serverPort, token, publicOrigin) {
			return createRestrictedFrpServerTemplate(serverPort, token, publicOrigin);
		}
		function installControl() {
			const locale = selectedMobileControlLocale();
			const localeTag = locale === "it" ? "it-IT" : locale === "zh" ? "zh-CN" : "en-US";
			const t = controlTranslator(locale);
			const lifecycle = new AbortController();
			const controlRequestJson = (path, init, timeoutMs) => requestJson(path, {
				...init,
				signal: lifecycle.signal
			}, timeoutMs);
			const root = element("div", "dsh-mobile-control");
			root.lang = locale;
			const panel = element("section", "dsh-mobile-control__panel");
			panel.id = CONTROL_PANEL_ID;
			panel.hidden = true;
			panel.lang = locale;
			panel.setAttribute("aria-label", t("mobileAccess"));
			const header = element("header", "dsh-mobile-control__header");
			const title = element("h2");
			title.textContent = t("mobileAccess");
			const headerActions = element("div", "dsh-mobile-control__header-actions");
			const updatePlugin = element("button", "dsh-mobile-control__update-plugin");
			updatePlugin.type = "button";
			updatePlugin.textContent = t("updatePlugin");
			updatePlugin.hidden = true;
			const updateCard = element("div", "dsh-mobile-control__update-card");
			updateCard.hidden = true;
			const updateCardTitle = element("div", "dsh-mobile-control__update-card-title");
			const updateCardNotes = element("pre", "dsh-mobile-control__update-notes");
			updateCardNotes.setAttribute("tabindex", "0");
			const updateCardNotice = element("p", "dsh-mobile-control__update-notice");
			updateCardNotice.textContent = t("updateNotice");
			const updateActions = element("div", "dsh-mobile-control__update-actions");
			const updateNow = element("button", "dsh-mobile-control__primary");
			updateNow.type = "button";
			updateNow.textContent = t("updateNow");
			const updateLater = element("button", "dsh-mobile-control__secondary");
			updateLater.type = "button";
			updateLater.textContent = t("updateLater");
			updateActions.append(updateLater, updateNow);
			updateCard.append(updateCardTitle, updateCardNotes, updateCardNotice, updateActions);
			const diagnosticsEntry = element("button", "dsh-mobile-control__diagnostic-entry");
			diagnosticsEntry.type = "button";
			diagnosticsEntry.textContent = t("diagnostics");
			diagnosticsEntry.setAttribute("aria-label", t("openDiagnostics"));
			diagnosticsEntry.setAttribute("aria-pressed", "false");
			const close = element("button", "dsh-mobile-control__close");
			close.type = "button";
			close.textContent = "×";
			close.setAttribute("aria-label", t("collapseMobileAccess"));
			headerActions.append(updatePlugin, diagnosticsEntry, close);
			const releaseNotice = element("p", "dsh-mobile-control__release-notice");
			releaseNotice.hidden = true;
			releaseNotice.setAttribute("role", "status");
			releaseNotice.setAttribute("aria-live", "polite");
			const appDownload = element("a", "dsh-mobile-control__app-download");
			appDownload.href = GITHUB_RELEASES_URL;
			appDownload.target = "_blank";
			appDownload.rel = "noopener noreferrer";
			appDownload.textContent = t("downloadAndroid");
			appDownload.setAttribute("aria-label", t("downloadAndroidAria"));
			const switcher = element("div", "dsh-mobile-control__switcher");
			const lanTab = element("button", "dsh-mobile-control__tab is-active");
			lanTab.type = "button";
			lanTab.textContent = t("lan");
			const remoteTab = element("button", "dsh-mobile-control__tab");
			remoteTab.type = "button";
			remoteTab.textContent = t("remote");
			lanTab.setAttribute("aria-pressed", "true");
			remoteTab.setAttribute("aria-pressed", "false");
			switcher.append(lanTab, remoteTab);
			const lanView = element("div", "dsh-mobile-control__view");
			const access = element("div", "dsh-mobile-control__access");
			access.hidden = true;
			const accessLabel = element("span", "dsh-mobile-control__access-label");
			accessLabel.textContent = t("browserAccess");
			const accessLink = element("a", "dsh-mobile-control__access-link");
			accessLink.target = "_blank";
			accessLink.rel = "noreferrer";
			access.append(accessLabel, accessLink);
			const qrBox = element("div", "dsh-mobile-control__qr");
			qrBox.hidden = true;
			const status = element("p", "dsh-mobile-control__status");
			status.textContent = t("loadingStatus");
			const extensionStatus = element("p", "dsh-mobile-control__extensions");
			extensionStatus.hidden = true;
			const actions = element("div", "dsh-mobile-control__actions");
			const toggle = element("button", "dsh-mobile-control__secondary");
			toggle.type = "button";
			const pair = element("button", "dsh-mobile-control__primary");
			pair.type = "button";
			pair.textContent = t("generateCopyKey");
			const linkPair = element("button", "dsh-mobile-control__secondary");
			linkPair.type = "button";
			linkPair.textContent = t("copyPairLink");
			const manageRow = element("div", "dsh-mobile-control__manage-row");
			const manageDevices = element("button", "dsh-mobile-control__manage");
			manageDevices.type = "button";
			manageDevices.textContent = t("managePairedDevices");
			const resetAll = element("button", "dsh-mobile-control__manage");
			resetAll.type = "button";
			resetAll.textContent = t("clearAllDevices");
			manageRow.append(manageDevices, resetAll);
			const devicePanel = element("div", "dsh-mobile-control__devices");
			devicePanel.hidden = true;
			const remoteView = element("div", "dsh-mobile-control__view is-remote");
			remoteView.hidden = true;
			const remoteIntro = element("p", "dsh-mobile-control__intro");
			remoteIntro.textContent = t("remoteIntro");
			const providerSection = element("section", "dsh-mobile-control__provider-section");
			const providerHeading = element("h3", "dsh-mobile-control__section-title");
			providerHeading.textContent = t("chooseProvider");
			const providerInfo = element("div", "dsh-mobile-control__provider-info");
			const providerInfoButton = element("button", "dsh-mobile-control__provider-info-button");
			providerInfoButton.type = "button";
			providerInfoButton.setAttribute("aria-label", t("providerInfoAria"));
			providerInfoButton.setAttribute("aria-expanded", "false");
			providerInfoButton.setAttribute("aria-controls", "dsh-mobile-provider-info");
			providerInfoButton.setAttribute("aria-describedby", "dsh-mobile-provider-info");
			const providerInfoGlyph = element("span", "dsh-mobile-control__provider-info-glyph");
			providerInfoGlyph.textContent = "i";
			providerInfoGlyph.setAttribute("aria-hidden", "true");
			const providerInfoPopover = element("div", "dsh-mobile-control__provider-info-popover");
			providerInfoPopover.id = "dsh-mobile-provider-info";
			providerInfoPopover.setAttribute("role", "tooltip");
			providerInfoPopover.hidden = true;
			const providerInfoTitle = element("strong");
			providerInfoTitle.textContent = t("providerSafeTitle");
			const providerInfoText = element("span");
			providerInfoText.textContent = t("providerSafeText");
			providerInfoButton.append(providerInfoGlyph);
			providerInfoPopover.append(providerInfoTitle, providerInfoText);
			providerInfo.append(providerInfoButton, providerInfoPopover);
			const providerChoices = element("div", "dsh-mobile-control__provider-choices");
			providerChoices.setAttribute("role", "radiogroup");
			providerChoices.setAttribute("aria-label", t("providerGroupAria"));
			const tailscaleChoice = element("button", "dsh-mobile-control__provider");
			tailscaleChoice.type = "button";
			tailscaleChoice.setAttribute("role", "radio");
			tailscaleChoice.setAttribute("aria-checked", "true");
			const tailscaleChoiceTop = element("span", "dsh-mobile-control__provider-top");
			const tailscaleChoiceName = element("strong");
			tailscaleChoiceName.textContent = "Tailscale Funnel";
			const tailscaleChoiceBadge = element("span", "dsh-mobile-control__provider-badge");
			tailscaleChoiceBadge.textContent = t("builtIn");
			const tailscaleChoiceDescription = element("span", "dsh-mobile-control__provider-description");
			tailscaleChoiceDescription.textContent = t("tailscaleDescription");
			tailscaleChoiceTop.append(tailscaleChoiceName, tailscaleChoiceBadge);
			tailscaleChoice.append(tailscaleChoiceTop, tailscaleChoiceDescription);
			const cpolarChoice = element("button", "dsh-mobile-control__provider");
			cpolarChoice.type = "button";
			cpolarChoice.setAttribute("role", "radio");
			cpolarChoice.setAttribute("aria-checked", "false");
			const cpolarChoiceTop = element("span", "dsh-mobile-control__provider-top");
			const cpolarChoiceName = element("strong");
			cpolarChoiceName.textContent = "cpolar";
			const cpolarChoiceBadge = element("span", "dsh-mobile-control__provider-badge is-cpolar");
			cpolarChoiceBadge.textContent = t("mainlandPreferred");
			const cpolarChoiceDescription = element("span", "dsh-mobile-control__provider-description");
			cpolarChoiceDescription.textContent = t("cpolarDescription");
			cpolarChoiceTop.append(cpolarChoiceName, cpolarChoiceBadge);
			cpolarChoice.append(cpolarChoiceTop, cpolarChoiceDescription);
			providerChoices.append(cpolarChoice, tailscaleChoice);
			const cpolarSetup = element("section", "dsh-mobile-control__cpolar-setup");
			cpolarSetup.hidden = true;
			const cpolarSetupTitle = element("h3", "dsh-mobile-control__section-title");
			cpolarSetupTitle.textContent = t("prepareCpolar");
			const cpolarComponentStatus = element("p", "dsh-mobile-control__component-status");
			cpolarComponentStatus.textContent = t("checkingComponent");
			const cpolarInstall = element("button", "dsh-mobile-control__primary");
			cpolarInstall.type = "button";
			cpolarInstall.textContent = t("installOfficial");
			const cpolarAccount = element("div", "dsh-mobile-control__cpolar-account");
			cpolarAccount.hidden = true;
			const cpolarAccountText = element("p", "dsh-mobile-control__component-note");
			cpolarAccountText.textContent = t("cpolarAccountNote");
			const cpolarAccountLinks = element("div", "dsh-mobile-control__link-row");
			const cpolarSignup = element("a", "dsh-mobile-control__text-link");
			cpolarSignup.href = "https://dashboard.cpolar.com/signup";
			cpolarSignup.target = "_blank";
			cpolarSignup.rel = "noopener noreferrer";
			cpolarSignup.textContent = t("registerCpolar");
			const cpolarDashboard = element("a", "dsh-mobile-control__text-link");
			cpolarDashboard.href = "https://dashboard.cpolar.com/auth";
			cpolarDashboard.target = "_blank";
			cpolarDashboard.rel = "noopener noreferrer";
			cpolarDashboard.textContent = t("openDashboard");
			cpolarAccountLinks.append(cpolarSignup, cpolarDashboard);
			const cpolarTokenLabel = element("label", "dsh-mobile-control__token-label");
			cpolarTokenLabel.textContent = "Authtoken";
			const cpolarToken = element("input", "dsh-mobile-control__token");
			cpolarToken.type = "password";
			cpolarToken.autocomplete = "off";
			cpolarToken.spellcheck = false;
			cpolarToken.placeholder = t("tokenPlaceholder");
			cpolarTokenLabel.append(cpolarToken);
			const cpolarConfigure = element("button", "dsh-mobile-control__primary dsh-mobile-control__cpolar-connect");
			cpolarConfigure.type = "button";
			cpolarConfigure.textContent = t("saveConnect");
			cpolarAccount.append(cpolarAccountText, cpolarAccountLinks, cpolarTokenLabel, cpolarConfigure);
			const cpolarDetails = element("details", "dsh-mobile-control__details");
			const cpolarDetailsSummary = element("summary");
			cpolarDetailsSummary.textContent = t("componentDetails");
			const cpolarDetailsBody = element("div", "dsh-mobile-control__details-body");
			const cpolarDetailsText = element("p");
			cpolarDetailsText.textContent = t("componentDetailsText");
			const cpolarStorage = element("code", "dsh-mobile-control__storage");
			cpolarStorage.textContent = t("pluginPrivateDirectory");
			const cpolarOfficial = element("a", "dsh-mobile-control__text-link");
			cpolarOfficial.href = "https://www.cpolar.com/download";
			cpolarOfficial.target = "_blank";
			cpolarOfficial.rel = "noopener noreferrer";
			cpolarOfficial.textContent = t("officialDownload");
			const cpolarTerms = element("a", "dsh-mobile-control__text-link");
			cpolarTerms.href = "https://www.cpolar.com/tos";
			cpolarTerms.target = "_blank";
			cpolarTerms.rel = "noopener noreferrer";
			cpolarTerms.textContent = t("terms");
			const cpolarPurge = element("button", "dsh-mobile-control__danger");
			cpolarPurge.type = "button";
			cpolarPurge.textContent = t("purgeCpolar");
			cpolarDetailsBody.append(cpolarDetailsText, cpolarStorage, cpolarOfficial, cpolarTerms, cpolarPurge);
			cpolarDetails.append(cpolarDetailsSummary, cpolarDetailsBody);
			cpolarSetup.append(cpolarSetupTitle, cpolarComponentStatus, cpolarInstall, cpolarAccount, cpolarDetails);
			const selfHosted = element("details", "dsh-mobile-control__self-hosted");
			const selfHostedSummary = element("summary", "dsh-mobile-control__self-hosted-summary");
			const selfHostedSummaryText = element("span");
			const selfHostedSummaryTitle = element("strong");
			selfHostedSummaryTitle.textContent = t("selfHostedConnections");
			const selfHostedSummaryDescription = element("span");
			selfHostedSummaryDescription.textContent = t("selfHostedDescription");
			const selfHostedBadge = element("span", "dsh-mobile-control__provider-badge is-frp");
			selfHostedBadge.textContent = t("advanced");
			selfHostedSummaryText.append(selfHostedSummaryTitle, selfHostedSummaryDescription);
			selfHostedSummary.append(selfHostedSummaryText, selfHostedBadge);
			const selfHostedBody = element("div", "dsh-mobile-control__self-hosted-body");
			const frpChoice = element("button", "dsh-mobile-control__provider is-frp");
			frpChoice.type = "button";
			frpChoice.setAttribute("aria-pressed", "false");
			const frpChoiceTop = element("span", "dsh-mobile-control__provider-top");
			const frpChoiceName = element("strong");
			frpChoiceName.textContent = t("frpName");
			const frpChoiceDescription = element("span", "dsh-mobile-control__provider-description");
			frpChoiceDescription.textContent = t("frpDescription");
			frpChoiceTop.append(frpChoiceName);
			frpChoice.append(frpChoiceTop, frpChoiceDescription);
			selfHostedBody.append(frpChoice);
			selfHosted.append(selfHostedSummary, selfHostedBody);
			const chmlfrp = element("details", "dsh-mobile-control__self-hosted");
			const chmlfrpSummary = element("summary", "dsh-mobile-control__self-hosted-summary");
			const chmlfrpSummaryText = element("span");
			const chmlfrpSummaryTitle = element("strong");
			chmlfrpSummaryTitle.textContent = t("chmlfrpName");
			const chmlfrpSummaryDescription = element("span");
			chmlfrpSummaryDescription.textContent = t("chmlfrpDescription");
			const chmlfrpBadge = element("span", "dsh-mobile-control__provider-badge is-frp");
			chmlfrpBadge.textContent = t("advanced");
			chmlfrpSummaryText.append(chmlfrpSummaryTitle, chmlfrpSummaryDescription);
			chmlfrpSummary.append(chmlfrpSummaryText, chmlfrpBadge);
			const chmlfrpBody = element("div", "dsh-mobile-control__self-hosted-body");
			const chmlfrpComponentStatus = element("p", "dsh-mobile-control__component-status");
			chmlfrpComponentStatus.textContent = t("checkingComponent");
			const chmlfrpInstall = element("button", "dsh-mobile-control__primary dsh-mobile-control__frp-action");
			chmlfrpInstall.type = "button";
			chmlfrpInstall.textContent = t("chmlfrpInstallClient");
			const chmlfrpIniLabel = element("label", "dsh-mobile-control__field");
			chmlfrpIniLabel.textContent = t("chmlfrpIniLabel");
			const chmlfrpIni = element("textarea");
			chmlfrpIni.rows = 10;
			chmlfrpIni.spellcheck = false;
			chmlfrpIni.autocomplete = "off";
			chmlfrpIni.placeholder = t("chmlfrpIniPlaceholder");
			chmlfrpIniLabel.append(chmlfrpIni);
			const chmlfrpStatus = element("p", "dsh-mobile-control__component-status");
			chmlfrpStatus.textContent = t("frpConfigurationMissing");
			const chmlfrpConfigure = element("button", "dsh-mobile-control__primary dsh-mobile-control__frp-action");
			chmlfrpConfigure.type = "button";
			chmlfrpConfigure.textContent = t("frpSaveConnect");
			const chmlfrpPurge = element("button", "dsh-mobile-control__danger");
			chmlfrpPurge.type = "button";
			chmlfrpPurge.textContent = t("chmlfrpPurge");
			chmlfrpBody.append(chmlfrpComponentStatus, chmlfrpInstall, chmlfrpIniLabel, chmlfrpStatus, chmlfrpConfigure, chmlfrpPurge);
			chmlfrp.append(chmlfrpSummary, chmlfrpBody);
			providerSection.append(providerHeading, providerInfo, providerChoices, selfHosted, chmlfrp);
			const frpSetup = element("section", "dsh-mobile-control__frp-setup");
			frpSetup.hidden = true;
			const frpSetupTitle = element("h3", "dsh-mobile-control__section-title");
			frpSetupTitle.textContent = t("prepareFrp");
			const frpStep1 = element("section", "dsh-mobile-control__frp-step");
			const frpStep1Title = element("strong");
			frpStep1Title.textContent = t("frpStep1Title");
			const frpStep1Text = element("p");
			frpStep1Text.textContent = t("frpStep1Text");
			const frpFields = element("div", "dsh-mobile-control__frp-fields");
			const frpServerLabel = element("label", "dsh-mobile-control__field");
			frpServerLabel.textContent = t("frpServerAddress");
			const frpServer = element("input");
			frpServer.type = "text";
			frpServer.autocomplete = "off";
			frpServer.spellcheck = false;
			frpServer.placeholder = t("frpServerAddressPlaceholder");
			const frpPortLabel = element("label", "dsh-mobile-control__field");
			frpPortLabel.textContent = t("frpServerPort");
			const frpPort = element("input");
			frpPort.type = "number";
			frpPort.inputMode = "numeric";
			frpPort.min = "1";
			frpPort.max = "65535";
			frpPort.value = "7000";
			const frpTokenLabel = element("label", "dsh-mobile-control__field");
			frpTokenLabel.textContent = t("frpToken");
			const frpToken = element("input");
			frpToken.type = "password";
			frpToken.autocomplete = "off";
			frpToken.spellcheck = false;
			frpToken.placeholder = t("frpTokenPlaceholder");
			const frpOriginLabel = element("label", "dsh-mobile-control__field");
			frpOriginLabel.textContent = t("frpPublicOrigin");
			const frpOrigin = element("input");
			frpOrigin.type = "url";
			frpOrigin.autocomplete = "off";
			frpOrigin.spellcheck = false;
			frpOrigin.placeholder = t("frpPublicOriginPlaceholder");
			frpServerLabel.append(frpServer);
			frpPortLabel.append(frpPort);
			frpTokenLabel.append(frpToken);
			frpOriginLabel.append(frpOrigin);
			frpFields.append(frpServerLabel, frpPortLabel, frpTokenLabel, frpOriginLabel);
			frpStep1.append(frpStep1Title, frpStep1Text, frpFields);
			const frpStep2 = element("section", "dsh-mobile-control__frp-step");
			const frpStep2Title = element("strong");
			frpStep2Title.textContent = t("frpStep2Title");
			const frpStep2Text = element("p");
			frpStep2Text.textContent = t("frpStep2Text");
			const frpCopyTemplate = element("button", "dsh-mobile-control__secondary dsh-mobile-control__frp-action");
			frpCopyTemplate.type = "button";
			frpCopyTemplate.textContent = t("copyServerTemplate");
			const vpsDeployText = element("p");
			vpsDeployText.textContent = t("vpsDeployText");
			const vpsChangesTitle = element("p");
			vpsChangesTitle.textContent = t("vpsDeployChangesTitle");
			const vpsChanges = element("ul", "dsh-mobile-control__frp-changes");
			for (const key of [
				"vpsDeployChangePackages",
				"vpsDeployChangeServices",
				"vpsDeployChangeFirewall",
				"vpsDeployChangeManual"
			]) {
				const item = element("li");
				item.textContent = t(key);
				vpsChanges.append(item);
			}
			const vpsDeployFields = element("div", "dsh-mobile-control__frp-fields");
			const vpsSshUserLabel = element("label", "dsh-mobile-control__field");
			vpsSshUserLabel.textContent = t("vpsSshUser");
			const vpsSshUser = element("input");
			vpsSshUser.type = "text";
			vpsSshUser.autocomplete = "username";
			vpsSshUser.value = "ubuntu";
			vpsSshUser.spellcheck = false;
			const vpsSshPortLabel = element("label", "dsh-mobile-control__field");
			vpsSshPortLabel.textContent = t("vpsSshPort");
			const vpsSshPort = element("input");
			vpsSshPort.type = "number";
			vpsSshPort.inputMode = "numeric";
			vpsSshPort.min = "1";
			vpsSshPort.max = "65535";
			vpsSshPort.value = "22";
			const vpsSshKeyLabel = element("label", "dsh-mobile-control__field");
			vpsSshKeyLabel.textContent = t("vpsSshKey");
			const vpsSshKey = element("input");
			vpsSshKey.type = "text";
			vpsSshKey.autocomplete = "off";
			vpsSshKey.spellcheck = false;
			vpsSshKey.placeholder = t("vpsSshKeyPlaceholder");
			vpsSshUserLabel.append(vpsSshUser);
			vpsSshPortLabel.append(vpsSshPort);
			vpsSshKeyLabel.append(vpsSshKey);
			vpsDeployFields.append(vpsSshUserLabel, vpsSshPortLabel, vpsSshKeyLabel);
			const vpsDeploy = element("button", "dsh-mobile-control__primary dsh-mobile-control__frp-action");
			vpsDeploy.type = "button";
			vpsDeploy.textContent = t("vpsDeploy");
			const vpsDeployStatus = element("p", "dsh-mobile-control__component-status");
			vpsDeployStatus.textContent = "";
			const vpsCopyUninstall = element("button", "dsh-mobile-control__secondary dsh-mobile-control__frp-action");
			vpsCopyUninstall.type = "button";
			vpsCopyUninstall.textContent = t("vpsCopyUninstall");
			const vpsUninstall = element("button", "dsh-mobile-control__danger dsh-mobile-control__frp-action");
			vpsUninstall.type = "button";
			vpsUninstall.textContent = t("vpsUninstall");
			frpStep2.append(frpStep2Title, frpStep2Text, frpCopyTemplate, vpsDeployText, vpsChangesTitle, vpsChanges, vpsDeployFields, vpsDeploy, vpsDeployStatus, vpsCopyUninstall, vpsUninstall);
			const frpStep3 = element("section", "dsh-mobile-control__frp-step");
			const frpStep3Title = element("strong");
			frpStep3Title.textContent = t("frpStep3Title");
			const frpStep3Text = element("p");
			frpStep3Text.textContent = t("frpStep3Text");
			const frpComponentStatus = element("p", "dsh-mobile-control__component-status");
			frpComponentStatus.textContent = t("checkingComponent");
			const frpInstall = element("button", "dsh-mobile-control__primary dsh-mobile-control__frp-action");
			frpInstall.type = "button";
			frpInstall.textContent = t("installFrpc");
			frpStep3.append(frpStep3Title, frpStep3Text, frpComponentStatus, frpInstall);
			const frpStep4 = element("section", "dsh-mobile-control__frp-step");
			const frpStep4Title = element("strong");
			frpStep4Title.textContent = t("frpStep4Title");
			const frpStep4Text = element("p");
			frpStep4Text.textContent = t("frpStep4Text");
			const frpAppRequirement = element("p", "dsh-mobile-control__frp-requirement");
			frpAppRequirement.textContent = t("frpAppRequirement");
			const frpConfigurationStatus = element("p", "dsh-mobile-control__component-status");
			frpConfigurationStatus.textContent = t("frpConfigurationMissing");
			const frpConfigure = element("button", "dsh-mobile-control__primary dsh-mobile-control__frp-action");
			frpConfigure.type = "button";
			frpConfigure.textContent = t("frpSaveConnect");
			frpStep4.append(frpStep4Title, frpStep4Text, frpAppRequirement, frpConfigurationStatus, frpConfigure);
			const frpDetails = element("details", "dsh-mobile-control__details");
			const frpDetailsSummary = element("summary");
			frpDetailsSummary.textContent = t("frpComponentDetails");
			const frpDetailsBody = element("div", "dsh-mobile-control__details-body");
			const frpDetailsText = element("p");
			frpDetailsText.textContent = t("frpComponentDetailsText");
			const frpStorage = element("code", "dsh-mobile-control__storage");
			frpStorage.textContent = t("pluginPrivateDirectory");
			const frpOfficial = element("a", "dsh-mobile-control__text-link");
			frpOfficial.href = "https://github.com/fatedier/frp/releases/tag/v0.70.1";
			frpOfficial.target = "_blank";
			frpOfficial.rel = "noopener noreferrer";
			frpOfficial.textContent = t("frpOfficialRelease");
			const frpPurge = element("button", "dsh-mobile-control__danger");
			frpPurge.type = "button";
			frpPurge.textContent = t("purgeFrp");
			frpDetailsBody.append(frpDetailsText, frpStorage, frpOfficial, frpPurge);
			frpDetails.append(frpDetailsSummary, frpDetailsBody);
			const frpOverview = element("section", "dsh-mobile-control__frp-overview");
			frpOverview.hidden = true;
			const frpOverviewMark = element("span", "dsh-mobile-control__frp-overview-mark");
			frpOverviewMark.textContent = "✓";
			const frpOverviewBody = element("div", "dsh-mobile-control__frp-overview-body");
			const frpOverviewTitle = element("strong");
			frpOverviewTitle.textContent = t("frpConfigurationReady");
			const frpOverviewEndpoint = element("span");
			frpOverviewEndpoint.textContent = "";
			frpOverviewBody.append(frpOverviewTitle, frpOverviewEndpoint);
			frpOverview.append(frpOverviewMark, frpOverviewBody);
			const frpConnectionGroup = element("details", "dsh-mobile-control__frp-group");
			const frpConnectionSummary = element("summary");
			frpConnectionSummary.textContent = t("frpStep1Title");
			frpConnectionGroup.append(frpConnectionSummary, frpStep1);
			const frpVpsGroup = element("details", "dsh-mobile-control__frp-group");
			const frpVpsSummary = element("summary");
			frpVpsSummary.textContent = t("frpStep2Title");
			frpVpsGroup.append(frpVpsSummary, frpStep2);
			const frpComponentGroup = element("details", "dsh-mobile-control__frp-group");
			const frpComponentSummary = element("summary");
			frpComponentSummary.textContent = t("frpStep3Title");
			frpComponentGroup.append(frpComponentSummary, frpStep3);
			const frpVerifyGroup = element("details", "dsh-mobile-control__frp-group");
			frpVerifyGroup.open = true;
			const frpVerifySummary = element("summary");
			frpVerifySummary.textContent = t("frpStep4Title");
			frpVerifyGroup.append(frpVerifySummary, frpStep4);
			frpSetup.append(frpSetupTitle, frpOverview, frpConnectionGroup, frpVpsGroup, frpComponentGroup, frpVerifyGroup, frpDetails);
			const tailscaleInfo = element("details", "dsh-mobile-control__details");
			const tailscaleInfoSummary = element("summary");
			tailscaleInfoSummary.textContent = t("tailscaleHelp");
			const tailscaleInfoBody = element("div", "dsh-mobile-control__details-body");
			const tailscaleInfoText = element("p");
			tailscaleInfoText.textContent = t("tailscaleHelpText");
			tailscaleInfoBody.append(tailscaleInfoText);
			tailscaleInfo.append(tailscaleInfoSummary, tailscaleInfoBody);
			const providerSetupHeader = element("div", "dsh-mobile-control__stage-header");
			const providerSetupHeading = element("h3", "dsh-mobile-control__section-title");
			providerSetupHeading.textContent = t("currentProvider");
			const providerSetupName = element("span", "dsh-mobile-control__stage-value");
			providerSetupName.textContent = "Tailscale Funnel";
			const remoteStateBadge = element("span", "dsh-mobile-control__state-badge");
			remoteStateBadge.textContent = t("remoteStateOff");
			const providerSetupMeta = element("div", "dsh-mobile-control__stage-meta");
			providerSetupMeta.append(providerSetupName, remoteStateBadge);
			providerSetupHeader.append(providerSetupHeading, providerSetupMeta);
			const providerSetupBody = element("div", "dsh-mobile-control__provider-setup-body");
			providerSetupBody.append(cpolarSetup, frpSetup, tailscaleInfo);
			const remoteAccess = element("div", "dsh-mobile-control__access");
			remoteAccess.hidden = true;
			const remoteAccessLabel = element("span", "dsh-mobile-control__access-label");
			remoteAccessLabel.textContent = t("remoteAddress");
			const remoteAccessLink = element("a", "dsh-mobile-control__access-link");
			remoteAccessLink.target = "_blank";
			remoteAccessLink.rel = "noreferrer";
			remoteAccess.append(remoteAccessLabel, remoteAccessLink);
			const remoteQr = element("div", "dsh-mobile-control__qr");
			remoteQr.hidden = true;
			const remoteStatus = element("p", "dsh-mobile-control__status");
			remoteStatus.textContent = t("loadingRemoteStatus");
			remoteStatus.setAttribute("aria-live", "polite");
			const remoteGuide = element("section", "dsh-mobile-control__guide");
			remoteGuide.hidden = true;
			remoteGuide.setAttribute("aria-label", t("funnelGuideAria"));
			const remoteGuideTitle = element("h3", "dsh-mobile-control__guide-title");
			remoteGuideTitle.textContent = t("funnelGuideTitle");
			const remoteGuideSummary = element("p", "dsh-mobile-control__guide-summary");
			remoteGuideSummary.textContent = t("funnelGuideSummary");
			const remoteGuideSteps = element("ol", "dsh-mobile-control__guide-steps");
			for (const text of [
				t("funnelStep1"),
				t("funnelStep2"),
				t("funnelStep3")
			]) {
				const item = element("li");
				item.textContent = text;
				remoteGuideSteps.append(item);
			}
			const remoteGuideNote = element("p", "dsh-mobile-control__guide-note");
			remoteGuideNote.textContent = t("funnelGuideNote");
			const remoteGuideActions = element("div", "dsh-mobile-control__guide-actions");
			const remoteSetup = element("button", "dsh-mobile-control__primary");
			remoteSetup.type = "button";
			remoteSetup.textContent = t("continueFunnel");
			const remoteSetupRetry = element("button", "dsh-mobile-control__secondary");
			remoteSetupRetry.type = "button";
			remoteSetupRetry.textContent = t("retryNow");
			remoteGuideActions.append(remoteSetup, remoteSetupRetry);
			remoteGuide.append(remoteGuideTitle, remoteGuideSummary, remoteGuideSteps, remoteGuideNote, remoteGuideActions);
			const remoteActions = element("div", "dsh-mobile-control__actions");
			const remoteToggle = element("button", "dsh-mobile-control__primary");
			remoteToggle.type = "button";
			remoteToggle.textContent = t("enableRemote");
			const remoteLogin = element("button", "dsh-mobile-control__primary");
			remoteLogin.type = "button";
			remoteLogin.textContent = t("continueLogin");
			remoteLogin.hidden = true;
			const remoteReconnect = element("button", "dsh-mobile-control__secondary");
			remoteReconnect.type = "button";
			remoteReconnect.textContent = t("reconnect");
			remoteReconnect.hidden = true;
			const remotePair = element("button", "dsh-mobile-control__secondary");
			remotePair.type = "button";
			remotePair.textContent = t("generateRemoteQr");
			remotePair.disabled = true;
			const remoteCopyLink = element("button", "dsh-mobile-control__secondary");
			remoteCopyLink.type = "button";
			remoteCopyLink.textContent = t("copyRemoteLink");
			remoteCopyLink.disabled = true;
			const remotePairLink = element("p", "dsh-mobile-control__status");
			remotePairLink.hidden = true;
			let activeRemotePairUrl = "";
			let activeRemotePairExpiresAt = 0;
			remoteActions.append(remoteToggle, remoteLogin, remoteReconnect, remotePair, remoteCopyLink);
			const remoteManageRow = element("div", "dsh-mobile-control__manage-row");
			const remoteDevices = element("button", "dsh-mobile-control__manage");
			remoteDevices.type = "button";
			remoteDevices.textContent = t("manageRemoteDevices");
			remoteDevices.disabled = true;
			const remoteReset = element("button", "dsh-mobile-control__manage");
			remoteReset.type = "button";
			remoteReset.textContent = t("resetRemoteLogin");
			remoteManageRow.append(remoteDevices, remoteReset);
			const remoteDevicePanel = element("div", "dsh-mobile-control__devices");
			remoteDevicePanel.hidden = true;
			const wsPathsSection = element("section", "dsh-mobile-control__ws-paths");
			const wsPathsTitle = element("h3", "dsh-mobile-control__section-title");
			wsPathsTitle.textContent = t("wsPathsTitle");
			const wsPathsIntro = element("p", "dsh-mobile-control__intro");
			wsPathsIntro.textContent = t("wsPathsIntro");
			const wsPathsDetected = element("div", "dsh-mobile-control__ws-paths-detected");
			wsPathsDetected.hidden = true;
			const wsPathsDetectedTitle = element("p", "dsh-mobile-control__ws-paths-detected-title");
			wsPathsDetectedTitle.textContent = t("wsPathsDetected");
			const wsPathsDetectedList = element("ul", "dsh-mobile-control__ws-paths-list");
			wsPathsDetected.append(wsPathsDetectedTitle, wsPathsDetectedList);
			const wsPathsList = element("ul", "dsh-mobile-control__ws-paths-list");
			const wsPathsAdvanced = element("details", "dsh-mobile-control__ws-paths-advanced");
			const wsPathsAdvancedSummary = element("summary");
			wsPathsAdvancedSummary.textContent = t("wsPathsAdvancedToggle");
			const wsPathsAdvancedHint = element("p", "dsh-mobile-control__intro");
			wsPathsAdvancedHint.textContent = t("wsPathsAdvancedHint");
			const wsPathsRow = element("div", "dsh-mobile-control__ws-paths-row");
			const wsPathsInput = element("input", "dsh-mobile-control__ws-paths-input");
			wsPathsInput.type = "text";
			wsPathsInput.placeholder = t("wsPathsPlaceholder");
			wsPathsInput.setAttribute("aria-label", t("wsPathsTitle"));
			const wsPathsAdd = element("button", "dsh-mobile-control__primary");
			wsPathsAdd.type = "button";
			wsPathsAdd.textContent = t("wsPathsAdd");
			const wsPathsStatus = element("p", "dsh-mobile-control__status");
			wsPathsStatus.hidden = true;
			wsPathsStatus.setAttribute("aria-live", "polite");
			wsPathsRow.append(wsPathsInput, wsPathsAdd);
			wsPathsAdvanced.append(wsPathsAdvancedSummary, wsPathsAdvancedHint, wsPathsRow, wsPathsStatus);
			wsPathsSection.append(wsPathsTitle, wsPathsIntro, wsPathsDetected, wsPathsList, wsPathsAdvanced);
			let wsPathsCurrent = [];
			let wsPathsBlocked = [];
			let wsPathsLoaded = false;
			const renderWsPaths = (paths) => {
				wsPathsCurrent = [...paths];
				wsPathsList.replaceChildren();
				if (paths.length === 0) {
					const empty = element("li", "dsh-mobile-control__ws-paths-empty");
					empty.textContent = t("wsPathsEmpty");
					wsPathsList.append(empty);
				}
				for (const path of paths) {
					const item = element("li", "dsh-mobile-control__ws-paths-item");
					const label = element("code");
					label.textContent = path;
					const remove = element("button", "dsh-mobile-control__ws-paths-remove");
					remove.type = "button";
					remove.textContent = t("wsPathsRemove");
					remove.setAttribute("aria-label", `${t("wsPathsRemove")}: ${path}`);
					remove.addEventListener("click", () => {
						saveWsPaths(wsPathsCurrent.filter((entry) => entry !== path));
					});
					item.append(label, remove);
					wsPathsList.append(item);
				}
			};
			const wsGroupOf = (path) => {
				const slash = path.lastIndexOf("/");
				return slash > 0 ? path.slice(0, slash) : "/";
			};
			let wsPathsSeenAttempts = 0;
			let wsDotAnnounced = 0;
			const wsDotStatus = element("p", "dsh-mobile-control__ws-sr-status");
			wsDotStatus.setAttribute("role", "status");
			wsDotStatus.setAttribute("aria-atomic", "true");
			const wsBlockedTotal = (blocked) => blocked.reduce((sum, entry) => sum + entry.attempts, 0);
			const renderWsDot = () => {
				for (const stale of document.querySelectorAll(".dsh-mobile-control__ws-dot")) stale.remove();
				if (!wsDotStatus.isConnected) root.append(wsDotStatus);
				const pendingCount = wsPathsBlocked.filter((entry) => !wsPathsCurrent.includes(entry.path)).length;
				if (pendingCount === 0 || wsBlockedTotal(wsPathsBlocked) <= wsPathsSeenAttempts) {
					if (pendingCount === 0 && wsDotAnnounced !== 0) {
						wsDotAnnounced = 0;
						wsDotStatus.textContent = "";
					}
					return;
				}
				if (wsDotAnnounced !== pendingCount) {
					wsDotAnnounced = pendingCount;
					wsDotStatus.textContent = t("wsPathsAnnounce", { n: String(pendingCount) });
				}
				for (const trigger of document.querySelectorAll(".dsh-mobile-control__trigger, .dsh-mobile-control__diagnostic-entry")) {
					const dot = element("span", "dsh-mobile-control__ws-dot");
					dot.textContent = String(pendingCount);
					dot.title = t("wsPathsNewBlocked");
					dot.setAttribute("aria-hidden", "true");
					dot.addEventListener("click", (event) => {
						event.stopPropagation();
						setOpen(true);
						selectView("diagnostics");
					});
					trigger.append(dot);
				}
			};
			const renderWsBlocked = (blocked) => {
				wsPathsDetectedList.replaceChildren();
				const pending = blocked.filter((entry) => !wsPathsCurrent.includes(entry.path));
				wsPathsDetected.hidden = pending.length === 0;
				const groups = /* @__PURE__ */ new Map();
				for (const entry of pending) {
					const group = wsGroupOf(entry.path);
					const list = groups.get(group);
					if (list) list.push(entry);
					else groups.set(group, [entry]);
				}
				for (const [group, entries] of groups) {
					const groupItem = element("li", "dsh-mobile-control__ws-paths-group");
					const groupHead = element("div", "dsh-mobile-control__ws-paths-group-head");
					const groupLabel = element("code");
					groupLabel.textContent = `${group}/*`;
					const groupCount = element("span", "dsh-mobile-control__ws-count");
					groupCount.textContent = t("wsPathsGroupMeta", {
						n: entries.length,
						m: entries.reduce((sum, entry) => sum + entry.attempts, 0)
					});
					groupHead.append(groupLabel, groupCount);
					if (entries.length > 1) {
						const allowAll = element("button", "dsh-mobile-control__primary");
						allowAll.type = "button";
						allowAll.textContent = t("wsPathsAllowAll");
						allowAll.addEventListener("click", () => {
							saveWsPaths([...wsPathsCurrent, ...entries.map((entry) => entry.path)]);
						});
						groupHead.append(allowAll);
					}
					groupItem.append(groupHead);
					for (const entry of entries) {
						const item = element("div", "dsh-mobile-control__ws-paths-item is-child");
						const label = element("code");
						label.textContent = `${entry.path} ×${String(entry.attempts)}`;
						const allow = element("button", "dsh-mobile-control__primary");
						allow.type = "button";
						allow.textContent = t("wsPathsAllow");
						allow.setAttribute("aria-label", `${t("wsPathsAllow")}: ${entry.path}`);
						allow.addEventListener("click", () => {
							saveWsPaths([...wsPathsCurrent, entry.path]);
						});
						item.append(label, allow);
						groupItem.append(item);
					}
					wsPathsDetectedList.append(groupItem);
				}
				renderWsDot();
			};
			const loadWsPaths = () => {
				controlRequestJson("/api/mobile-access/remote/websocket-paths").then((data) => {
					wsPathsLoaded = true;
					wsPathsStatus.hidden = true;
					renderWsPaths(Array.isArray(data.paths) ? data.paths.filter((entry) => typeof entry === "string") : []);
					controlRequestJson("/api/mobile-access/remote/websocket-paths/blocked").then((blocked) => {
						wsPathsBlocked = (Array.isArray(blocked.blocked) ? blocked.blocked : []).filter((entry) => typeof entry === "object" && entry !== null && typeof entry.path === "string" && typeof entry.attempts === "number");
						renderWsBlocked(wsPathsBlocked);
					}, () => {});
				}, (error) => {
					wsPathsStatus.hidden = false;
					wsPathsStatus.textContent = t("requestFailed", { error: String(error) });
				});
			};
			const saveWsPaths = (paths) => {
				wsPathsStatus.hidden = true;
				controlRequestJson("/api/mobile-access/remote/websocket-paths", {
					method: "POST",
					body: JSON.stringify({ paths })
				}).then((data) => {
					wsPathsLoaded = true;
					renderWsPaths(Array.isArray(data.paths) ? data.paths.filter((entry) => typeof entry === "string") : []);
					renderWsBlocked(wsPathsBlocked);
				}, (error) => {
					wsPathsStatus.hidden = false;
					wsPathsStatus.textContent = t("requestFailed", { error: String(error) });
				});
			};
			wsPathsAdd.addEventListener("click", () => {
				const value = wsPathsInput.value.trim();
				if (value === "") {
					wsPathsStatus.hidden = false;
					wsPathsStatus.textContent = t("wsPathsInvalid");
					return;
				}
				wsPathsInput.value = "";
				saveWsPaths([...wsPathsCurrent, value]);
			});
			const remoteWorkspace = element("section", "dsh-mobile-control__remote-workspace");
			remoteWorkspace.append(providerSetupHeader, remoteStatus, remoteAccess, remoteGuide, providerSetupBody, remoteActions, remoteQr, remotePairLink, remoteManageRow, remoteDevicePanel);
			const diagnosticsView = element("div", "dsh-mobile-control__view is-diagnostics");
			diagnosticsView.hidden = true;
			const diagnosticsIntro = element("p", "dsh-mobile-control__intro");
			diagnosticsIntro.textContent = t("diagnosticsIntro");
			const diagnosticsSummary = element("section", "dsh-mobile-control__diagnostic-summary is-idle");
			diagnosticsSummary.setAttribute("aria-live", "polite");
			const diagnosticsSummaryMain = element("div", "dsh-mobile-control__diagnostic-summary-main");
			const diagnosticsSummaryIcon = element("span", "dsh-mobile-control__diagnostic-summary-icon");
			diagnosticsSummaryIcon.setAttribute("aria-hidden", "true");
			const diagnosticsSummaryBody = element("div", "dsh-mobile-control__diagnostic-summary-body");
			const diagnosticsSummaryTitle = element("strong");
			diagnosticsSummaryTitle.textContent = t("diagnosticsNotRun");
			const diagnosticsSummaryText = element("span");
			diagnosticsSummaryText.textContent = t("diagnosticsStartHint");
			const diagnosticsSummaryMeta = element("span", "dsh-mobile-control__diagnostic-summary-meta");
			diagnosticsSummaryMeta.textContent = t("diagnosticsIdleMeta");
			diagnosticsSummaryBody.append(diagnosticsSummaryTitle, diagnosticsSummaryText);
			diagnosticsSummaryMain.append(diagnosticsSummaryIcon, diagnosticsSummaryBody);
			diagnosticsSummary.append(diagnosticsSummaryMain, diagnosticsSummaryMeta);
			const diagnosticsToolbar = element("div", "dsh-mobile-control__diagnostic-toolbar");
			const diagnosticsRun = element("button", "dsh-mobile-control__primary dsh-mobile-control__diagnostic-run");
			diagnosticsRun.type = "button";
			diagnosticsRun.textContent = t("diagnosticsStart");
			const diagnosticsCopy = element("button", "dsh-mobile-control__secondary dsh-mobile-control__diagnostic-copy");
			diagnosticsCopy.type = "button";
			diagnosticsCopy.textContent = t("diagnosticsCopy");
			diagnosticsCopy.disabled = true;
			diagnosticsCopy.hidden = true;
			diagnosticsToolbar.append(diagnosticsRun, diagnosticsCopy);
			const diagnosticsFeedback = element("p", "dsh-mobile-control__diagnostic-feedback");
			diagnosticsFeedback.hidden = true;
			diagnosticsFeedback.setAttribute("role", "status");
			diagnosticsFeedback.setAttribute("aria-live", "polite");
			const diagnosticsChecks = element("div", "dsh-mobile-control__diagnostic-checks");
			diagnosticsChecks.hidden = true;
			const diagnosticsDetails = element("details", "dsh-mobile-control__details dsh-mobile-control__diagnostic-details");
			diagnosticsDetails.hidden = true;
			const diagnosticsDetailsSummary = element("summary");
			diagnosticsDetailsSummary.textContent = t("diagnosticsAdvanced");
			const diagnosticsReport = element("pre", "dsh-mobile-control__diagnostic-report");
			diagnosticsDetails.append(diagnosticsDetailsSummary, diagnosticsReport);
			header.append(title, headerActions);
			actions.append(toggle, pair, linkPair);
			lanView.append(access, qrBox, status, extensionStatus, actions, manageRow, devicePanel);
			remoteView.append(remoteIntro, providerSection, remoteWorkspace);
			diagnosticsView.append(diagnosticsIntro, diagnosticsSummary, diagnosticsToolbar, diagnosticsFeedback, diagnosticsChecks, wsPathsSection, diagnosticsDetails);
			panel.append(header, releaseNotice, updateCard, appDownload, switcher, lanView, remoteView, diagnosticsView);
			root.append(panel);
			document.body.append(root);
			let running = false;
			let origin = "";
			let remoteRunning = false;
			let remoteReady = false;
			let remoteProvider = "tailscale";
			let remoteLoginUrl = "";
			let remoteSetupUrl = "";
			let remoteSetupPending = false;
			let remoteSetupOpenedAt = 0;
			let remoteReconnectBusy = false;
			let remoteProviderBusy = false;
			let cpolarInstalled = false;
			let cpolarConfigured = false;
			let frpInstalled = false;
			let frpConfigured = false;
			let frpLayoutInitialized = false;
			let frpDownloadSize = "14.0";
			let chmlfrpInstalled = false;
			let chmlfrpConfigured = false;
			let chmlfrpDownloadSize = "5.4";
			/** Pinned ChmlFrp client version shown in confirmations; mirrors FRP_COMPONENT releases. */
			const chmlfrpClientVersion = "ChmlFrp-0.51.2_251023";
			let configuredFrpServer = "";
			let configuredFrpPort = 7e3;
			let configuredFrpOrigin = "";
			let providerInfoPinned = false;
			let providerInfoHovered = false;
			let previousAccessView = "lan";
			let diagnosticsBusy = false;
			let copiedDiagnosticReport = "";
			let pluginUpdateAvailable = false;
			let pluginLatestVersion = "";
			let pluginReleaseNotes = "";
			let updateInFlight = false;
			const renderRelease = (data) => {
				const release = clientReleaseInfo(data);
				pluginUpdateAvailable = release.updateAvailable;
				pluginLatestVersion = release.latestVersion ?? "";
				pluginReleaseNotes = release.releaseNotes ?? "";
				updatePlugin.hidden = !pluginUpdateAvailable || !diagnosticsView.hidden || !updateCard.hidden;
				updatePlugin.textContent = t("updatePlugin");
				if (pluginLatestVersion !== "") updatePlugin.setAttribute("aria-label", t("updatePluginAria", { version: pluginLatestVersion }));
				if (release.androidVersion !== void 0) {
					appDownload.textContent = t("downloadAndroidVersion", { version: release.androidVersion });
					appDownload.setAttribute("aria-label", t("downloadAndroidVersionAria", { version: release.androidVersion }));
				}
				appDownload.href = release.androidDownloadUrl;
			};
			const syncProviderInfo = () => {
				const open = providerInfoPinned || providerInfoHovered || providerInfo.contains(document.activeElement);
				providerInfoPopover.hidden = !open;
				providerInfoButton.setAttribute("aria-expanded", String(open));
			};
			providerInfo.addEventListener("pointerenter", () => {
				providerInfoHovered = true;
				syncProviderInfo();
			});
			providerInfo.addEventListener("pointerleave", () => {
				providerInfoHovered = false;
				syncProviderInfo();
			});
			providerInfo.addEventListener("focusin", syncProviderInfo);
			providerInfo.addEventListener("focusout", () => {
				window.setTimeout(syncProviderInfo, 0);
			});
			providerInfoButton.addEventListener("click", () => {
				providerInfoPinned = !providerInfoPinned;
				syncProviderInfo();
			});
			providerInfoButton.addEventListener("keydown", (event) => {
				if (event.key !== "Escape") return;
				providerInfoPinned = false;
				providerInfoHovered = false;
				providerInfoPopover.hidden = true;
				providerInfoButton.setAttribute("aria-expanded", "false");
			});
			const selectView = (view) => {
				if (view !== "diagnostics") previousAccessView = view;
				lanView.hidden = view !== "lan";
				remoteView.hidden = view !== "remote";
				diagnosticsView.hidden = view !== "diagnostics";
				lanTab.classList.toggle("is-active", view === "lan");
				remoteTab.classList.toggle("is-active", view === "remote");
				lanTab.setAttribute("aria-pressed", String(view === "lan"));
				remoteTab.setAttribute("aria-pressed", String(view === "remote"));
				diagnosticsEntry.setAttribute("aria-pressed", String(view === "diagnostics"));
				diagnosticsEntry.textContent = view === "diagnostics" ? t("back") : t("diagnostics");
				diagnosticsEntry.setAttribute("aria-label", view === "diagnostics" ? t("backToMobile") : t("openDiagnostics"));
				if (view === "diagnostics") {
					wsPathsSeenAttempts = wsBlockedTotal(wsPathsBlocked);
					renderWsDot();
					if (!wsPathsLoaded) loadWsPaths();
				}
				updatePlugin.hidden = view === "diagnostics" || !pluginUpdateAvailable;
				appDownload.hidden = view === "diagnostics";
				switcher.hidden = view === "diagnostics";
				title.textContent = view === "lan" ? t("lanAccess") : view === "remote" ? t("remoteAccess") : t("connectionDiagnostics");
			};
			lanTab.addEventListener("click", () => {
				selectView("lan");
			});
			remoteTab.addEventListener("click", () => {
				selectView("remote");
				loadRemote();
			});
			const setOpen = (open) => {
				panel.hidden = !open;
				for (const trigger of document.querySelectorAll(".dsh-mobile-control__trigger")) trigger.setAttribute("aria-expanded", String(open));
			};
			const render = (data) => {
				running = data.running === true;
				origin = running && typeof data.origin === "string" ? data.origin : "";
				access.hidden = origin === "";
				accessLink.href = origin;
				accessLink.textContent = origin;
				accessLink.title = origin;
				status.classList.toggle("is-running", running);
				status.textContent = running ? t("lanOn") : t("lanOff");
				const extensionData = data.extensions;
				if (extensionData !== null && typeof extensionData === "object") {
					const loaded = typeof extensionData.loaded === "number" ? extensionData.loaded : 0;
					const failed = typeof extensionData.failed === "number" ? extensionData.failed : 0;
					extensionStatus.hidden = false;
					extensionStatus.textContent = failed === 0 ? t("extensionsLoaded", { loaded }) : t("extensionsFailed", {
						loaded,
						failed
					});
				} else extensionStatus.hidden = true;
				if (!running) qrBox.hidden = true;
				toggle.textContent = running ? t("disableLan") : t("enableLan");
				pair.disabled = !running;
				linkPair.disabled = !running;
				manageDevices.disabled = !running;
				resetAll.disabled = !running;
			};
			const showQr = (svg, target = qrBox) => {
				target.replaceChildren();
				if (svg === "") {
					target.hidden = true;
					return;
				}
				const image = element("img");
				image.alt = t("pairingQr");
				image.width = 176;
				image.height = 176;
				image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
				target.hidden = false;
				target.append(image);
			};
			const openPairing = (target) => {
				controlRequestJson("/api/mobile-access/lan/pairing/open", {
					method: "POST",
					body: "{}"
				}).then(async (data) => {
					const value = target === "key" ? typeof data.appKey === "string" ? data.appKey : "" : typeof data.pairUrl === "string" ? data.pairUrl : "";
					showQr(typeof data.qrSvg === "string" ? data.qrSvg : "");
					if (value === "") {
						status.textContent = t("keyGenerationFailed");
						return;
					}
					try {
						await navigator.clipboard.writeText(value);
						status.textContent = target === "key" ? t("keyCopied") : t("linkCopied");
					} catch {
						status.textContent = t("copySecret", {
							kind: target === "key" ? t("pairingKey") : t("pairingLink"),
							value
						});
						status.classList.add("is-key");
					}
				}, (error) => {
					status.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					pair.disabled = !running;
					linkPair.disabled = !running;
				});
			};
			toggle.addEventListener("click", () => {
				toggle.disabled = true;
				controlRequestJson("/api/mobile-access/lan/control", {
					method: "POST",
					body: JSON.stringify({ running: !running })
				}).then(render, (error) => {
					status.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					toggle.disabled = false;
				});
			});
			const formatTime = (ms) => typeof ms === "number" ? new Date(ms).toLocaleString(localeTag) : "";
			const formatMegabytes = (bytes) => new Intl.NumberFormat(localeTag, {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			}).format(bytes / 1024 / 1024);
			const renderDevices = (data) => {
				const devices = Array.isArray(data.devices) ? data.devices : [];
				devicePanel.replaceChildren();
				if (devices.length === 0) {
					const empty = element("p", "dsh-mobile-control__device-empty");
					empty.textContent = t("noDevices");
					devicePanel.append(empty);
					return;
				}
				for (const device of devices) {
					const row = element("div", "dsh-mobile-control__device");
					const label = element("span", "dsh-mobile-control__device-label");
					label.textContent = typeof device.label === "string" ? device.label : t("device");
					const meta = element("span", "dsh-mobile-control__device-meta");
					meta.textContent = t("expires", { time: formatTime(device.expiresAt) });
					const revoke = element("button", "dsh-mobile-control__device-revoke");
					revoke.type = "button";
					revoke.textContent = t("revoke");
					const id = typeof device.id === "string" ? device.id : "";
					revoke.addEventListener("click", () => {
						controlRequestJson("/api/mobile-access/lan/devices/revoke", {
							method: "POST",
							body: JSON.stringify({ deviceId: id })
						}).then(loadDevices, (error) => {
							status.textContent = t("requestFailed", { error: String(error) });
						});
					});
					row.append(label, meta, revoke);
					devicePanel.append(row);
				}
			};
			const loadDevices = () => {
				controlRequestJson("/api/mobile-access/lan/devices").then(renderDevices, (error) => {
					status.textContent = t("requestFailed", { error: String(error) });
				});
			};
			manageDevices.addEventListener("click", () => {
				const show = devicePanel.hidden;
				devicePanel.hidden = !show;
				if (show) loadDevices();
			});
			resetAll.addEventListener("click", () => {
				if (!window.confirm(t("confirmResetDevices"))) return;
				controlRequestJson("/api/mobile-access/lan/devices/reset", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}).then(loadDevices, (error) => {
					status.textContent = t("requestFailed", { error: String(error) });
				});
			});
			const renderRemote = (data) => {
				remoteRunning = data.running === true;
				remoteProvider = data.provider === "cpolar" ? "cpolar" : data.provider === "frp" ? "frp" : "tailscale";
				const cpolar = remoteProvider === "cpolar";
				const frp = remoteProvider === "frp";
				const tailscale = remoteProvider === "tailscale";
				tailscaleChoice.classList.toggle("is-selected", tailscale);
				cpolarChoice.classList.toggle("is-selected", cpolar);
				frpChoice.classList.toggle("is-selected", frp);
				tailscaleChoice.setAttribute("aria-checked", String(tailscale));
				cpolarChoice.setAttribute("aria-checked", String(cpolar));
				frpChoice.setAttribute("aria-pressed", String(frp));
				providerSetupName.textContent = cpolar ? "cpolar" : frp ? t("frpName") : "Tailscale Funnel";
				tailscaleChoice.disabled = remoteProviderBusy;
				cpolarChoice.disabled = remoteProviderBusy;
				frpChoice.disabled = remoteProviderBusy;
				cpolarSetup.hidden = !cpolar;
				frpSetup.hidden = !frp;
				if (frp) selfHosted.open = true;
				tailscaleInfo.hidden = !tailscale;
				remoteReset.textContent = tailscale ? t("resetRemoteLogin") : t("resetRemoteDevices");
				const providers = data.providers !== null && typeof data.providers === "object" ? data.providers : {};
				const cpolarProvider = providers.cpolar !== null && typeof providers.cpolar === "object" ? providers.cpolar : {};
				const component = cpolarProvider.component !== null && typeof cpolarProvider.component === "object" ? cpolarProvider.component : {};
				cpolarInstalled = component.installed === true;
				cpolarConfigured = component.configured === true;
				cpolarChoiceBadge.textContent = cpolarConfigured ? t("ready") : cpolarInstalled ? t("installed") : t("mainlandPreferred");
				const cpolarSupported = component.supported !== false;
				const componentVersion = typeof component.version === "string" ? component.version : "";
				const componentDownloadBytes = typeof component.downloadBytes === "number" ? component.downloadBytes : 0;
				const componentStorage = typeof component.storagePath === "string" ? component.storagePath : `DSH Mobile ${t("pluginPrivateDirectory")}`;
				cpolarStorage.textContent = componentStorage;
				cpolarStorage.title = componentStorage;
				cpolarInstall.hidden = cpolarInstalled || !cpolarSupported;
				cpolarInstall.textContent = componentDownloadBytes > 0 ? t("installWithSize", { size: formatMegabytes(componentDownloadBytes) }) : t("installOfficial");
				cpolarInstall.disabled = remoteProviderBusy;
				cpolarAccount.hidden = !cpolarInstalled || cpolarConfigured;
				cpolarConfigure.disabled = remoteProviderBusy;
				cpolarPurge.hidden = !cpolarInstalled && !cpolarConfigured;
				cpolarComponentStatus.textContent = !cpolarSupported ? t("cpolarUnsupported") : !cpolarInstalled ? t("cpolarNotInstalled") : !cpolarConfigured ? t("cpolarNeedsToken", { version: componentVersion }) : t("cpolarReady", { version: componentVersion });
				const frpProvider = providers.frp !== null && typeof providers.frp === "object" ? providers.frp : {};
				const frpComponent = frpProvider.component !== null && typeof frpProvider.component === "object" ? frpProvider.component : {};
				const frpConfiguration = frpProvider.configuration !== null && typeof frpProvider.configuration === "object" ? frpProvider.configuration : {};
				frpInstalled = frpComponent.installed === true;
				frpConfigured = frpConfiguration.configured === true;
				const frpSupported = frpComponent.supported !== false;
				const frpVersion = typeof frpComponent.version === "string" ? frpComponent.version : "";
				const frpDownloadBytes = typeof frpComponent.downloadBytes === "number" ? frpComponent.downloadBytes : 0;
				if (frpDownloadBytes > 0) frpDownloadSize = formatMegabytes(frpDownloadBytes);
				const frpStoragePath = typeof frpComponent.storagePath === "string" ? frpComponent.storagePath : `DSH Mobile ${t("pluginPrivateDirectory")}`;
				configuredFrpServer = typeof frpConfiguration.serverAddress === "string" ? frpConfiguration.serverAddress : "";
				configuredFrpPort = typeof frpConfiguration.serverPort === "number" ? frpConfiguration.serverPort : 7e3;
				configuredFrpOrigin = typeof frpConfiguration.publicOrigin === "string" ? frpConfiguration.publicOrigin : "";
				if (frpServer.value === "" && configuredFrpServer !== "") frpServer.value = configuredFrpServer;
				if ((frpPort.value === "" || frpPort.value === "7000") && configuredFrpPort !== 7e3) frpPort.value = String(configuredFrpPort);
				if (frpOrigin.value === "" && configuredFrpOrigin !== "") frpOrigin.value = configuredFrpOrigin;
				frpStorage.textContent = frpStoragePath;
				frpStorage.title = frpStoragePath;
				frpInstall.hidden = frpInstalled || !frpSupported;
				frpInstall.textContent = frpDownloadBytes > 0 ? t("installWithSize", { size: formatMegabytes(frpDownloadBytes) }) : t("installFrpc");
				frpInstall.disabled = remoteProviderBusy;
				frpConfigure.disabled = remoteProviderBusy || !frpInstalled;
				vpsDeploy.disabled = remoteProviderBusy || !validVpsDeploymentForm();
				vpsCopyUninstall.disabled = vpsDeploy.disabled;
				vpsUninstall.disabled = vpsDeploy.disabled;
				frpPurge.hidden = !frpInstalled && !frpConfigured;
				frpComponentStatus.textContent = !frpSupported ? t("frpUnsupported") : frpInstalled ? t("frpComponentReady", { version: frpVersion }) : t("frpNotInstalled");
				frpConfigurationStatus.textContent = frpConfigured ? t("frpConfigurationReady") : t("frpConfigurationMissing");
				frpOverview.hidden = !frpConfigured;
				frpOverviewEndpoint.textContent = configuredFrpOrigin === "" ? configuredFrpServer : `${configuredFrpOrigin} · ${configuredFrpServer}:${String(configuredFrpPort)}`;
				frpToken.placeholder = frpConfigured ? locale === "zh" ? "已安全保存；留空保持不变" : locale === "it" ? "Salvato; lascia vuoto per mantenerlo" : "Saved securely; leave blank to keep it" : t("frpTokenPlaceholder");
				vpsDeploy.textContent = frpConfigured ? locale === "zh" ? "修复或重新部署 VPS" : locale === "it" ? "Ripara o ridistribuisci VPS" : "Repair or redeploy VPS" : t("vpsDeploy");
				frpConnectionSummary.textContent = `${frpConfigured ? "✓ " : ""}${t("frpStep1Title")}`;
				frpComponentSummary.textContent = `${frpInstalled ? "✓ " : ""}${t("frpStep3Title")}`;
				const chmlfrpProvider = providers.chmlfrp !== null && typeof providers.chmlfrp === "object" ? providers.chmlfrp : {};
				const chmlfrpComponentData = chmlfrpProvider.component !== null && typeof chmlfrpProvider.component === "object" ? chmlfrpProvider.component : {};
				const chmlfrpConfigData = chmlfrpProvider.configuration !== null && typeof chmlfrpProvider.configuration === "object" ? chmlfrpProvider.configuration : {};
				chmlfrpInstalled = chmlfrpComponentData.installed === true;
				chmlfrpConfigured = chmlfrpConfigData.configured === true && chmlfrpConfigData.kind === "chmlfrp";
				const chmlfrpSupported = chmlfrpComponentData.supported !== false;
				const chmlfrpVersion = typeof chmlfrpComponentData.version === "string" ? chmlfrpComponentData.version : "";
				const chmlfrpBytes = typeof chmlfrpComponentData.downloadBytes === "number" ? chmlfrpComponentData.downloadBytes : 0;
				if (chmlfrpBytes > 0) chmlfrpDownloadSize = formatMegabytes(chmlfrpBytes);
				chmlfrpInstall.hidden = chmlfrpInstalled || !chmlfrpSupported;
				chmlfrpInstall.textContent = chmlfrpBytes > 0 ? t("installWithSize", { size: formatMegabytes(chmlfrpBytes) }) : t("chmlfrpInstallClient");
				chmlfrpInstall.disabled = remoteProviderBusy;
				chmlfrpConfigure.disabled = remoteProviderBusy || !chmlfrpInstalled;
				chmlfrpPurge.hidden = !chmlfrpInstalled && !chmlfrpConfigured;
				chmlfrpComponentStatus.textContent = !chmlfrpSupported ? t("frpUnsupported") : chmlfrpInstalled ? t("chmlfrpClientReady", { version: chmlfrpVersion }) : t("chmlfrpClientMissing");
				chmlfrpStatus.textContent = chmlfrpConfigured ? t("chmlfrpConfigured") : t("frpConfigurationMissing");
				chmlfrpBadge.textContent = chmlfrpConfigured && chmlfrpInstalled ? t("ready") : t("advanced");
				chmlfrpSummary.textContent = "";
				chmlfrpSummary.append(chmlfrpSummaryText, chmlfrpBadge);
				if (!frpLayoutInitialized) {
					frpConnectionGroup.open = !frpConfigured;
					frpComponentGroup.open = !frpInstalled;
					frpVpsGroup.open = !frpConfigured;
					frpLayoutInitialized = true;
				}
				selfHostedBadge.textContent = frpConfigured && frpInstalled ? t("ready") : t("advanced");
				const state = typeof data.state === "string" ? data.state : "error";
				const errorCode = typeof data.errorCode === "string" ? data.errorCode : "";
				const remoteOrigin = typeof data.origin === "string" ? data.origin : "";
				remoteLoginUrl = typeof data.loginUrl === "string" ? data.loginUrl : "";
				const candidateSetupUrl = tailscale ? officialFunnelSetupUrl(data.setupUrl) : "";
				remoteSetupUrl = candidateSetupUrl !== "" ? candidateSetupUrl : {
					funnel_permission_required: "https://tailscale.com/s/no-funnel",
					funnel_https_required: "https://tailscale.com/s/https",
					funnel_start_failed: "https://tailscale.com/s/no-funnel"
				}[errorCode] ?? "";
				const needsFunnelSetup = state === "error" && remoteSetupUrl !== "";
				remoteReady = remoteRunning && state === "ready" && remoteOrigin !== "";
				remoteStateBadge.classList.toggle("is-ready", remoteReady);
				remoteStateBadge.classList.toggle("is-busy", state === "starting" || state === "connecting" || state === "needs-login");
				remoteStateBadge.classList.toggle("is-attention", state === "error" || state === "unavailable");
				remoteStateBadge.textContent = remoteReady ? t("ready") : state === "starting" || state === "connecting" || state === "needs-login" ? t("remoteStateConnecting") : state === "error" || state === "unavailable" ? t("remoteStateAttention") : t("remoteStateOff");
				remoteAccess.hidden = !remoteReady;
				remoteAccessLink.href = remoteOrigin;
				remoteAccessLink.textContent = remoteOrigin;
				remoteAccessLink.title = remoteOrigin;
				remoteStatus.classList.toggle("is-running", remoteReady);
				const labels = {
					off: t("remoteOff"),
					unavailable: cpolar ? t("remoteUnavailableCpolar") : frp ? t("remoteUnavailableFrp") : t("remoteUnavailableTailscale"),
					starting: cpolar ? t("remoteStartingCpolar") : frp ? t("remoteStartingFrp") : t("remoteStartingTailscale"),
					"needs-login": t("remoteNeedsLogin"),
					connecting: cpolar ? t("remoteConnectingCpolar") : frp ? t("remoteConnectingFrp") : t("remoteConnectingTailscale"),
					ready: t("remoteReady"),
					error: t("remoteError")
				};
				const errorLabels = {
					funnel_permission_required: t("funnelPermission"),
					funnel_https_required: t("funnelHttps"),
					funnel_start_failed: t("funnelStart"),
					funnel_start_timeout: t("funnelTimeout"),
					tailscale_dns_missing: t("tailscaleDnsMissing"),
					gateway_start_failed: t("gatewayStartFailed"),
					control_channel_failed: t("controlChannelFailed"),
					cpolar_component_missing: t("cpolarMissing"),
					cpolar_component_invalid: t("cpolarInvalid"),
					cpolar_config_missing: t("cpolarConfigMissing"),
					cpolar_config_invalid: t("cpolarConfigInvalid"),
					cpolar_port_unavailable: t("cpolarPortUnavailable"),
					cpolar_launch_failed: t("cpolarLaunchFailed"),
					cpolar_start_timeout: t("cpolarTimeout"),
					cpolar_stopped: t("cpolarStopped"),
					cpolar_exited: t("cpolarExited"),
					cpolar_invalid_output: t("cpolarOutputInvalid"),
					cpolar_invalid_origin: t("cpolarOriginInvalid"),
					frp_component_missing: t("frpMissing"),
					frp_component_invalid: t("frpInvalid"),
					frp_config_missing: t("frpConfigMissing"),
					frp_config_verify_failed: t("frpConfigVerifyFailed"),
					frp_vhost_publicly_reachable: t("frpVhostPublic"),
					frp_vhost_probe_failed: t("frpVhostProbeFailed"),
					frp_launch_failed: t("frpLaunchFailed"),
					frp_start_timeout: t("frpTimeout"),
					frp_discovery_mismatch: t("frpDiscoveryMismatch"),
					frp_discovery_invalid: t("frpDiscoveryInvalid"),
					frp_stopped: t("frpStopped"),
					frp_exited: t("frpExited")
				};
				remoteStatus.textContent = remoteSetupPending && needsFunnelSetup ? t("setupOpened") : state === "error" ? errorLabels[errorCode] ?? labels.error : labels[state] ?? labels.error;
				remoteGuide.hidden = !needsFunnelSetup;
				remoteSetup.disabled = remoteSetupUrl === "" || remoteReconnectBusy;
				remoteSetupRetry.disabled = remoteReconnectBusy;
				remoteToggle.textContent = remoteRunning ? t("disableRemote") : t("enableRemote");
				const providerPrepared = cpolar ? cpolarInstalled && cpolarConfigured : frp ? frpInstalled && frpConfigured : true;
				remoteToggle.disabled = remoteProviderBusy || !providerPrepared;
				remoteLogin.hidden = !tailscale || state !== "needs-login" || remoteLoginUrl === "";
				remoteReconnect.hidden = needsFunnelSetup || state !== "error" && state !== "unavailable" || !providerPrepared;
				remoteActions.hidden = !providerPrepared;
				remotePair.disabled = !remoteReady;
				remoteCopyLink.disabled = !remoteReady;
				remoteDevices.disabled = !remoteReady;
				if (!remoteReady) {
					remoteQr.hidden = true;
					remotePairLink.hidden = true;
					activeRemotePairUrl = "";
					activeRemotePairExpiresAt = 0;
				}
				if (!needsFunnelSetup) remoteSetupPending = false;
			};
			let remoteLoadInFlight = false;
			const loadRemote = () => {
				if (remoteLoadInFlight) return;
				remoteLoadInFlight = true;
				controlRequestJson("/api/mobile-access/remote/control").then(renderRemote, (error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					remoteLoadInFlight = false;
				});
			};
			const chooseRemoteProvider = (provider) => {
				if (remoteProviderBusy || provider === remoteProvider) return;
				if (remoteRunning && !window.confirm(t("switchProviderConfirm"))) return;
				remoteProviderBusy = true;
				tailscaleChoice.disabled = true;
				cpolarChoice.disabled = true;
				frpChoice.disabled = true;
				remoteStatus.textContent = provider === "cpolar" ? t("switchingCpolar") : provider === "frp" ? t("switchingFrp") : t("switchingTailscale");
				controlRequestJson("/api/mobile-access/remote/provider", {
					method: "POST",
					body: JSON.stringify({ provider })
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					loadRemote();
				});
			};
			tailscaleChoice.addEventListener("click", () => {
				chooseRemoteProvider("tailscale");
			});
			cpolarChoice.addEventListener("click", () => {
				chooseRemoteProvider("cpolar");
			});
			frpChoice.addEventListener("click", () => {
				chooseRemoteProvider("frp");
			});
			cpolarInstall.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				if (!window.confirm(t("installConfirm"))) return;
				remoteProviderBusy = true;
				cpolarInstall.disabled = true;
				cpolarInstall.textContent = t("downloading");
				remoteStatus.textContent = t("installingCpolar");
				controlRequestJson("/api/mobile-access/remote/cpolar/component/install", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(renderRemote, (error) => {
					remoteStatus.textContent = t("installFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					loadRemote();
				});
			});
			cpolarConfigure.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				const authtoken = cpolarToken.value.trim();
				if (authtoken.length < 20 || /\s/u.test(authtoken)) {
					remoteStatus.textContent = t("invalidToken");
					cpolarToken.focus();
					return;
				}
				remoteProviderBusy = true;
				cpolarConfigure.disabled = true;
				cpolarConfigure.setAttribute("aria-busy", "true");
				cpolarConfigure.textContent = t("saving");
				controlRequestJson("/api/mobile-access/remote/cpolar/configure", {
					method: "POST",
					body: JSON.stringify({ authtoken })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(() => {
					cpolarToken.value = "";
					remoteStatus.textContent = t("configuredConnecting");
					return controlRequestJson("/api/mobile-access/remote/control", {
						method: "POST",
						body: JSON.stringify({ running: true })
					});
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("configureFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					cpolarConfigure.setAttribute("aria-busy", "false");
					cpolarConfigure.textContent = t("saveConnect");
					loadRemote();
				});
			});
			cpolarPurge.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				if (!window.confirm(t("purgeConfirm"))) return;
				remoteProviderBusy = true;
				cpolarPurge.disabled = true;
				remoteStatus.textContent = t("purging");
				controlRequestJson("/api/mobile-access/remote/cpolar/component/purge", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(renderRemote, (error) => {
					remoteStatus.textContent = t("purgeFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					cpolarPurge.disabled = false;
					loadRemote();
				});
			});
			const validFrpServer = (value) => value === value.trim() && value.length > 0 && value.length <= 253 && !/[\s\u0000-\u001f\u007f/\\@?#]/u.test(value);
			const frpForm = () => ({
				serverAddress: String(frpServer.value ?? "").trim(),
				serverPort: Number(frpPort.value),
				token: String(frpToken.value ?? ""),
				publicOrigin: String(frpOrigin.value ?? "").trim()
			});
			const validFrpForm = (form) => {
				if (!validFrpServer(form.serverAddress)) return false;
				try {
					createFrpServerTemplateForClipboard(form.serverPort, form.token, form.publicOrigin);
					return true;
				} catch {
					return false;
				}
			};
			frpCopyTemplate.addEventListener("click", () => {
				const form = frpForm();
				if (!validFrpForm(form)) {
					remoteStatus.textContent = t("frpInputInvalid");
					return;
				}
				navigator.clipboard.writeText(createFrpServerTemplateForClipboard(form.serverPort, form.token, form.publicOrigin)).then(() => {
					remoteStatus.textContent = t("templateCopied");
				}, () => {
					remoteStatus.textContent = t("templateCopyFailed");
				});
			});
			const validVpsSshUser = (value) => /^[a-z_][a-z0-9_.-]*[$]?$/iu.test(value) && value.length <= 64;
			const validVpsSshKey = (value) => value === "" || /^[a-zA-Z]:[\\/]/u.test(value) || value.startsWith("/");
			const vpsFormStorageKey = "dsh-mobile.frp-vps-form.v1";
			try {
				const saved = JSON.parse(localStorage.getItem(vpsFormStorageKey) ?? "{}");
				if (typeof saved.sshUser === "string" && validVpsSshUser(saved.sshUser)) vpsSshUser.value = saved.sshUser;
				if (typeof saved.sshPort === "number" && Number.isSafeInteger(saved.sshPort) && saved.sshPort >= 1 && saved.sshPort <= 65535) vpsSshPort.value = String(saved.sshPort);
				if (typeof saved.sshKeyPath === "string" && validVpsSshKey(saved.sshKeyPath)) vpsSshKey.value = saved.sshKeyPath;
			} catch {}
			const saveVpsForm = () => {
				try {
					localStorage.setItem(vpsFormStorageKey, JSON.stringify({
						sshUser: String(vpsSshUser.value ?? "").trim(),
						sshPort: Number(vpsSshPort.value),
						sshKeyPath: String(vpsSshKey.value ?? "").trim()
					}));
				} catch {}
			};
			const validVpsDeploymentForm = () => {
				const sshPort = Number(vpsSshPort.value);
				return validVpsFrpForm() && validVpsSshUser(String(vpsSshUser.value ?? "").trim()) && Number.isSafeInteger(sshPort) && sshPort >= 1 && sshPort <= 65535 && validVpsSshKey(String(vpsSshKey.value ?? "").trim());
			};
			/**
			* VPS actions accept blank connection fields when a configuration is already
			* saved; blanks keep their saved values ("已保存时可留空"). The token itself
			* is never readable here, so a blank token is merged server-side while the
			* remaining fields still pass the regular template check.
			*/
			const vpsEffectiveForm = () => {
				const form = frpForm();
				if (!frpConfigured) return form;
				return {
					serverAddress: form.serverAddress === "" ? configuredFrpServer : form.serverAddress,
					serverPort: Number.isSafeInteger(form.serverPort) && form.serverPort >= 1 ? form.serverPort : configuredFrpPort,
					token: form.token,
					publicOrigin: form.publicOrigin === "" ? configuredFrpOrigin : form.publicOrigin
				};
			};
			const validVpsFrpForm = () => {
				const form = vpsEffectiveForm();
				const token = form.token === "" && frpConfigured ? "0123456789abcdef" : form.token;
				return validFrpForm({
					...form,
					token
				});
			};
			const refreshVpsDeployButton = () => {
				const disabled = remoteProviderBusy || !validVpsDeploymentForm();
				vpsDeploy.disabled = disabled;
				vpsCopyUninstall.disabled = disabled;
				vpsUninstall.disabled = disabled;
			};
			for (const input of [
				frpServer,
				frpPort,
				frpToken,
				frpOrigin,
				vpsSshUser,
				vpsSshPort,
				vpsSshKey
			]) input.addEventListener("input", refreshVpsDeployButton);
			for (const input of [
				vpsSshUser,
				vpsSshPort,
				vpsSshKey
			]) input.addEventListener("input", saveVpsForm);
			const vpsCertName = (origin) => {
				try {
					const host = new URL(origin).hostname;
					return /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(host) ? host : void 0;
				} catch {
					return;
				}
			};
			const requestVpsHostKeys = (serverAddress, sshUser, sshPort, sshKeyPath) => {
				const keyPayload = {
					serverAddress,
					sshUser,
					sshPort
				};
				if (sshKeyPath !== "") keyPayload.sshKeyPath = sshKeyPath;
				return controlRequestJson("/api/mobile-access/remote/frp/vps/host-keys", {
					method: "POST",
					body: JSON.stringify(keyPayload)
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then((keys) => {
					const confirmed = (Array.isArray(keys.vpsHostKeys) ? keys.vpsHostKeys : []).filter((key) => typeof key.fingerprint === "string" && typeof key.keyType === "string").map((key) => ({
						display: `${String(key.keyType)} ${String(key.fingerprint)}`,
						fingerprint: String(key.fingerprint)
					}));
					if (confirmed.length === 0) throw new Error(String(t("vpsHostKeyFailed", { error: "empty" })));
					return confirmed;
				});
			};
			vpsDeploy.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				const form = vpsEffectiveForm();
				if (!validVpsFrpForm()) {
					vpsDeployStatus.textContent = t("vpsDeployNotReady");
					return;
				}
				const sshUser = vpsSshUser.value.trim();
				const sshPort = Number(vpsSshPort.value);
				const sshKeyPath = vpsSshKey.value.trim();
				saveVpsForm();
				if (!validVpsSshUser(sshUser) || !Number.isSafeInteger(sshPort) || sshPort < 1 || sshPort > 65535 || !validVpsSshKey(sshKeyPath)) {
					vpsDeployStatus.textContent = t("vpsDeployFailed", { error: t("vpsSshKey") });
					return;
				}
				remoteProviderBusy = true;
				vpsDeploy.disabled = true;
				vpsCopyUninstall.disabled = true;
				vpsUninstall.disabled = true;
				vpsDeployStatus.textContent = t("vpsHostKeyFetching");
				remoteStatus.textContent = t("vpsHostKeyFetching");
				requestVpsHostKeys(form.serverAddress, sshUser, sshPort, sshKeyPath).then((hostKeys) => {
					const display = hostKeys.map((key) => key.display).join("\n");
					if (!window.confirm(t("vpsDeployConfirmWithKeys", { fingerprints: display }))) {
						remoteProviderBusy = false;
						refreshVpsDeployButton();
						loadRemote();
						return;
					}
					vpsDeployStatus.textContent = t("vpsDeploying");
					remoteStatus.textContent = t("vpsDeploying");
					const payload = {
						confirm: true,
						...form,
						sshUser,
						sshPort,
						hostFingerprints: hostKeys.map((key) => key.fingerprint)
					};
					if (sshKeyPath !== "") payload.sshKeyPath = sshKeyPath;
					return controlRequestJson("/api/mobile-access/remote/frp/vps/deploy", {
						method: "POST",
						body: JSON.stringify(payload)
					}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then((data) => {
						const deployment = data.vpsDeployment !== null && typeof data.vpsDeployment === "object" ? data.vpsDeployment : {};
						vpsDeployStatus.textContent = deployment.deployed === true ? t("vpsDeploySuccess") : t("vpsDeployFailed", { error: t("vpsDeployFailed", { error: "unknown result" }) });
						remoteStatus.textContent = vpsDeployStatus.textContent;
						renderRemote(data);
					}, (error) => {
						vpsDeployStatus.textContent = t("vpsDeployFailed", { error: String(error) });
						remoteStatus.textContent = vpsDeployStatus.textContent;
					}).finally(() => {
						remoteProviderBusy = false;
						loadRemote();
					});
				}, (error) => {
					vpsDeployStatus.textContent = t("vpsHostKeyFailed", { error: String(error) });
					remoteStatus.textContent = vpsDeployStatus.textContent;
					remoteProviderBusy = false;
					refreshVpsDeployButton();
					loadRemote();
				});
			});
			const readVpsSshForm = () => {
				const sshUser = vpsSshUser.value.trim();
				const sshPort = Number(vpsSshPort.value);
				const sshKeyPath = vpsSshKey.value.trim();
				saveVpsForm();
				if (!validVpsSshUser(sshUser) || !Number.isSafeInteger(sshPort) || sshPort < 1 || sshPort > 65535 || !validVpsSshKey(sshKeyPath)) {
					vpsDeployStatus.textContent = t("vpsDeployFailed", { error: t("vpsSshKey") });
					return;
				}
				return {
					sshUser,
					sshPort,
					sshKeyPath
				};
			};
			vpsCopyUninstall.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				const form = vpsEffectiveForm();
				if (!validVpsFrpForm()) {
					vpsDeployStatus.textContent = t("vpsDeployNotReady");
					return;
				}
				remoteProviderBusy = true;
				refreshVpsDeployButton();
				const scriptPayload = { serverPort: form.serverPort };
				const certName = vpsCertName(form.publicOrigin);
				if (certName !== void 0) scriptPayload.certName = certName;
				controlRequestJson("/api/mobile-access/remote/frp/vps/uninstall-script", {
					method: "POST",
					body: JSON.stringify(scriptPayload)
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then((data) => {
					const script = typeof data.vpsUninstallScript === "string" ? data.vpsUninstallScript : "";
					if (script === "") throw new Error("empty script");
					return navigator.clipboard.writeText(script);
				}).then(() => {
					vpsDeployStatus.textContent = t("vpsUninstallScriptCopied");
				}, (error) => {
					vpsDeployStatus.textContent = t("vpsUninstallScriptFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					loadRemote();
				});
			});
			vpsUninstall.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				const form = vpsEffectiveForm();
				if (!validVpsFrpForm()) {
					vpsDeployStatus.textContent = t("vpsDeployNotReady");
					return;
				}
				const ssh = readVpsSshForm();
				if (ssh === void 0) return;
				remoteProviderBusy = true;
				refreshVpsDeployButton();
				vpsDeployStatus.textContent = t("vpsHostKeyFetching");
				remoteStatus.textContent = t("vpsHostKeyFetching");
				requestVpsHostKeys(form.serverAddress, ssh.sshUser, ssh.sshPort, ssh.sshKeyPath).then((hostKeys) => {
					if (!window.confirm(t("vpsUninstallConfirmWithKeys", { fingerprints: hostKeys.map((key) => key.display).join("\n") }))) {
						remoteProviderBusy = false;
						refreshVpsDeployButton();
						loadRemote();
						return;
					}
					vpsDeployStatus.textContent = t("vpsUninstalling");
					remoteStatus.textContent = t("vpsUninstalling");
					const payload = {
						confirm: true,
						serverAddress: form.serverAddress,
						serverPort: form.serverPort,
						sshUser: ssh.sshUser,
						sshPort: ssh.sshPort,
						hostFingerprints: hostKeys.map((key) => key.fingerprint)
					};
					if (ssh.sshKeyPath !== "") payload.sshKeyPath = ssh.sshKeyPath;
					const certName = vpsCertName(form.publicOrigin);
					if (certName !== void 0) payload.certName = certName;
					return controlRequestJson("/api/mobile-access/remote/frp/vps/uninstall", {
						method: "POST",
						body: JSON.stringify(payload)
					}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then((data) => {
						const removal = data.vpsUninstall !== null && typeof data.vpsUninstall === "object" ? data.vpsUninstall : {};
						vpsDeployStatus.textContent = removal.removed === true ? t("vpsUninstallSuccess") : t("vpsUninstallFailed", { error: t("vpsUninstallFailed", { error: "unknown result" }) });
						remoteStatus.textContent = vpsDeployStatus.textContent;
						renderRemote(data);
					}, (error) => {
						vpsDeployStatus.textContent = t("vpsUninstallFailed", { error: String(error) });
						remoteStatus.textContent = vpsDeployStatus.textContent;
					}).finally(() => {
						remoteProviderBusy = false;
						loadRemote();
					});
				}, (error) => {
					vpsDeployStatus.textContent = t("vpsHostKeyFailed", { error: String(error) });
					remoteStatus.textContent = vpsDeployStatus.textContent;
					remoteProviderBusy = false;
					refreshVpsDeployButton();
					loadRemote();
				});
			});
			frpInstall.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				if (!window.confirm(t("frpInstallConfirm", { size: frpDownloadSize }))) return;
				remoteProviderBusy = true;
				frpInstall.disabled = true;
				frpInstall.textContent = t("downloading");
				remoteStatus.textContent = t("installingFrp");
				controlRequestJson("/api/mobile-access/remote/frp/component/install", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(renderRemote, (error) => {
					remoteStatus.textContent = t("installFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					loadRemote();
				});
			});
			frpConfigure.addEventListener("click", () => {
				if (remoteProviderBusy || !frpInstalled) return;
				const form = frpForm();
				const unchanged = frpConfigured && form.token === "" && form.serverAddress === configuredFrpServer && form.serverPort === configuredFrpPort && form.publicOrigin === configuredFrpOrigin;
				if (!unchanged && !validFrpForm(form)) {
					remoteStatus.textContent = t("frpInputInvalid");
					return;
				}
				remoteProviderBusy = true;
				frpConfigure.disabled = true;
				frpConfigure.setAttribute("aria-busy", "true");
				frpConfigure.textContent = t("saving");
				(unchanged ? Promise.resolve({}) : controlRequestJson("/api/mobile-access/remote/frp/configure", {
					method: "POST",
					body: JSON.stringify(form)
				})).then(() => {
					frpToken.value = "";
					remoteStatus.textContent = t("frpSavingConnecting");
					return controlRequestJson("/api/mobile-access/remote/control", {
						method: "POST",
						body: JSON.stringify({ running: true })
					});
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("configureFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					frpConfigure.setAttribute("aria-busy", "false");
					frpConfigure.textContent = t("frpSaveConnect");
					loadRemote();
				});
			});
			frpPurge.addEventListener("click", () => {
				if (remoteProviderBusy || !window.confirm(t("purgeFrpConfirm"))) return;
				remoteProviderBusy = true;
				frpPurge.disabled = true;
				remoteStatus.textContent = t("purgingFrp");
				controlRequestJson("/api/mobile-access/remote/frp/component/purge", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(renderRemote, (error) => {
					remoteStatus.textContent = t("purgeFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					frpPurge.disabled = false;
					loadRemote();
				});
			});
			chmlfrpInstall.addEventListener("click", () => {
				if (remoteProviderBusy) return;
				if (!window.confirm(t("chmlfrpInstallConfirm", {
					version: chmlfrpClientVersion,
					size: chmlfrpDownloadSize
				}))) return;
				remoteProviderBusy = true;
				chmlfrpInstall.disabled = true;
				chmlfrpInstall.textContent = t("downloading");
				remoteStatus.textContent = t("installingFrp");
				controlRequestJson("/api/mobile-access/remote/chmlfrp/component/install", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(renderRemote, (error) => {
					remoteStatus.textContent = t("installFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					loadRemote();
				});
			});
			chmlfrpConfigure.addEventListener("click", () => {
				if (remoteProviderBusy || !chmlfrpInstalled) return;
				const ini = chmlfrpIni.value.trim();
				if (ini === "") {
					remoteStatus.textContent = t("chmlfrpIniRequired");
					return;
				}
				remoteProviderBusy = true;
				chmlfrpConfigure.disabled = true;
				chmlfrpConfigure.setAttribute("aria-busy", "true");
				chmlfrpConfigure.textContent = t("saving");
				controlRequestJson("/api/mobile-access/remote/chmlfrp/configure", {
					method: "POST",
					body: JSON.stringify({ ini })
				}).then(() => {
					return controlRequestJson("/api/mobile-access/remote/provider", {
						method: "POST",
						body: JSON.stringify({ provider: "chmlfrp" })
					});
				}).then(() => {
					chmlfrpIni.value = "";
					remoteStatus.textContent = t("frpSavingConnecting");
					return controlRequestJson("/api/mobile-access/remote/control", {
						method: "POST",
						body: JSON.stringify({ running: true })
					});
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("configureFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					chmlfrpConfigure.setAttribute("aria-busy", "false");
					chmlfrpConfigure.textContent = t("frpSaveConnect");
					loadRemote();
				});
			});
			chmlfrpPurge.addEventListener("click", () => {
				if (remoteProviderBusy || !window.confirm(t("chmlfrpPurgeConfirm"))) return;
				remoteProviderBusy = true;
				chmlfrpPurge.disabled = true;
				remoteStatus.textContent = t("purgingFrp");
				controlRequestJson("/api/mobile-access/remote/chmlfrp/component/purge", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then(renderRemote, (error) => {
					remoteStatus.textContent = t("purgeFailed", { error: String(error) });
				}).finally(() => {
					remoteProviderBusy = false;
					chmlfrpPurge.disabled = false;
					loadRemote();
				});
			});
			remoteToggle.addEventListener("click", () => {
				remoteToggle.disabled = true;
				controlRequestJson("/api/mobile-access/remote/control", {
					method: "POST",
					body: JSON.stringify({ running: !remoteRunning })
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				}).finally(loadRemote);
			});
			remoteLogin.addEventListener("click", () => {
				if (remoteLoginUrl !== "") window.open(remoteLoginUrl, "_blank", "noopener,noreferrer");
			});
			const reconnectRemote = () => {
				if (remoteReconnectBusy) return;
				remoteReconnectBusy = true;
				remoteReconnect.disabled = true;
				remoteSetup.disabled = true;
				remoteSetupRetry.disabled = true;
				remoteStatus.textContent = remoteProvider === "cpolar" ? t("reconnectingCpolar") : remoteProvider === "frp" ? t("reconnectingFrp") : t("reconnectingTailscale");
				controlRequestJson("/api/mobile-access/remote/reconnect", {
					method: "POST",
					body: "{}"
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					remoteReconnectBusy = false;
					remoteReconnect.disabled = false;
					remoteSetup.disabled = remoteSetupUrl === "";
					remoteSetupRetry.disabled = false;
				});
			};
			remoteReconnect.addEventListener("click", reconnectRemote);
			remoteSetupRetry.addEventListener("click", () => {
				remoteSetupPending = false;
				reconnectRemote();
			});
			remoteSetup.addEventListener("click", () => {
				if (remoteSetupUrl === "") return;
				remoteSetupPending = true;
				remoteSetupOpenedAt = Date.now();
				remoteStatus.textContent = t("setupOpened");
				window.open(remoteSetupUrl, "_blank", "noopener,noreferrer");
			});
			const retryAfterSetup = () => {
				if (!remoteSetupPending || document.visibilityState === "hidden" || Date.now() - remoteSetupOpenedAt < 800) return;
				remoteSetupPending = false;
				reconnectRemote();
			};
			window.addEventListener("focus", retryAfterSetup);
			document.addEventListener("visibilitychange", retryAfterSetup);
			const copyRemotePairUrl = async () => {
				try {
					await navigator.clipboard.writeText(activeRemotePairUrl);
					remoteStatus.textContent = t("linkCopied");
				} catch {
					remoteStatus.textContent = t("remoteQrReady");
				}
			};
			const openRemotePairing = () => controlRequestJson("/api/mobile-access/remote/pairing/open", {
				method: "POST",
				body: "{}"
			}).then(async (data) => {
				const pairUrl = typeof data.pairUrl === "string" ? data.pairUrl : "";
				const expiresAt = typeof data.expiresAt === "number" && Number.isFinite(data.expiresAt) ? data.expiresAt : 0;
				showQr(typeof data.qrSvg === "string" ? data.qrSvg : "", remoteQr);
				if (pairUrl === "") {
					remoteStatus.textContent = t("keyGenerationFailed");
					return;
				}
				activeRemotePairUrl = pairUrl;
				activeRemotePairExpiresAt = expiresAt;
				remotePairLink.textContent = pairUrl;
				remotePairLink.classList.add("is-key");
				remotePairLink.hidden = false;
				await copyRemotePairUrl();
			});
			remotePair.addEventListener("click", () => {
				remotePair.disabled = true;
				openRemotePairing().catch((error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					remotePair.disabled = !remoteReady;
				});
			});
			remoteCopyLink.addEventListener("click", () => {
				remoteCopyLink.disabled = true;
				(activeRemotePairUrl !== "" && activeRemotePairExpiresAt > Date.now() ? copyRemotePairUrl() : openRemotePairing()).catch((error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				}).finally(() => {
					remoteCopyLink.disabled = !remoteReady;
				});
			});
			const renderRemoteDevices = (data) => {
				const devices = Array.isArray(data.devices) ? data.devices : [];
				remoteDevicePanel.replaceChildren();
				if (devices.length === 0) {
					const empty = element("p", "dsh-mobile-control__device-empty");
					empty.textContent = t("noRemoteDevices");
					remoteDevicePanel.append(empty);
					return;
				}
				for (const device of devices) {
					const row = element("div", "dsh-mobile-control__device");
					const label = element("span", "dsh-mobile-control__device-label");
					label.textContent = typeof device.label === "string" ? device.label : t("device");
					const meta = element("span", "dsh-mobile-control__device-meta");
					meta.textContent = t("expires", { time: formatTime(device.expiresAt) });
					const revoke = element("button", "dsh-mobile-control__device-revoke");
					revoke.type = "button";
					revoke.textContent = t("revoke");
					const id = typeof device.id === "string" ? device.id : "";
					revoke.addEventListener("click", () => {
						controlRequestJson("/api/mobile-access/remote/devices/revoke", {
							method: "POST",
							body: JSON.stringify({ deviceId: id })
						}).then(loadRemoteDevices, (error) => {
							remoteStatus.textContent = t("requestFailed", { error: String(error) });
						});
					});
					row.append(label, meta, revoke);
					remoteDevicePanel.append(row);
				}
			};
			const loadRemoteDevices = () => {
				controlRequestJson("/api/mobile-access/remote/devices").then(renderRemoteDevices, (error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				});
			};
			remoteDevices.addEventListener("click", () => {
				const show = remoteDevicePanel.hidden;
				remoteDevicePanel.hidden = !show;
				if (show) loadRemoteDevices();
			});
			remoteReset.addEventListener("click", () => {
				const prompt = remoteProvider === "cpolar" ? t("resetCpolarConfirm") : remoteProvider === "frp" ? t("resetFrpConfirm") : t("resetTailscaleConfirm");
				if (!window.confirm(prompt)) return;
				controlRequestJson("/api/mobile-access/remote/reset", {
					method: "POST",
					body: JSON.stringify({ confirm: true })
				}).then(renderRemote, (error) => {
					remoteStatus.textContent = t("requestFailed", { error: String(error) });
				});
			});
			const renderDiagnostics = (data) => {
				const entries = [...diagnosticEntriesForRender(data)];
				const overall = diagnosticOverallForChecks(data.overall, entries.map((entry) => entry.status));
				diagnosticsSummary.className = `dsh-mobile-control__diagnostic-summary is-${overall}`;
				diagnosticsSummaryTitle.textContent = overall === "ok" ? t("diagnosticsComplete") : overall === "attention" ? t("diagnosticsAttention") : t("diagnosticsProblem");
				diagnosticsSummaryText.textContent = locale === "zh" && data.overall === overall && typeof data.summary === "string" ? data.summary : t("diagnosticsCompleteFallback");
				diagnosticsChecks.replaceChildren();
				const statusLabels = {
					ok: t("diagnosticStatusOk"),
					warning: t("diagnosticStatusWarning"),
					error: t("diagnosticStatusError"),
					info: t("diagnosticStatusInfo")
				};
				const diagnosticLabelKeys = {
					versions: "diagnosticLabelVersions",
					network: "diagnosticLabelNetwork",
					lan: "diagnosticLabelLan",
					firewall: "diagnosticLabelFirewall",
					remote: "diagnosticLabelRemote",
					"phone-network": "diagnosticLabelPhone"
				};
				const statusOf = (entry) => normalizeDiagnosticStatus(entry.status);
				const localizedEntryCopy = (entry) => {
					const serverCopy = diagnosticServerCopy(entry);
					const reason = typeof entry.reason === "string" ? entry.reason : "";
					const templates = DIAGNOSTIC_REASON_MESSAGES[locale][reason];
					if (templates === void 0) return serverCopy;
					const facts = entry.facts !== null && typeof entry.facts === "object" ? entry.facts : {};
					const values = {
						provider: facts.provider === "tailscale" || facts.provider === "cpolar" || facts.provider === "frp" ? facts.provider : "",
						latencyMs: typeof facts.latencyMs === "number" && Number.isFinite(facts.latencyMs) ? new Intl.NumberFormat(localeTag).format(facts.latencyMs) : "",
						interfaceName: typeof facts.interfaceName === "string" ? facts.interfaceName : "",
						endpointSuffix: typeof facts.endpointSuffix === "string" ? facts.endpointSuffix : "",
						controllerCode: typeof facts.controllerCode === "string" ? facts.controllerCode : ""
					};
					const interpolate = (template) => template.replace(/\{(\w+)\}/gu, (_match, key) => values[key] ?? "");
					let detail = interpolate(templates[0]);
					let action = interpolate(templates[1]);
					if (reason === "versions-current") {
						const versions = data.versions !== null && typeof data.versions === "object" ? data.versions : {};
						if ([
							versions.plugin,
							versions.dsh,
							versions.minimumAndroidApp
						].every((value) => typeof value === "string")) detail += ` plugin ${String(versions.plugin)}, DSH ${String(versions.dsh)}, Android ${String(versions.minimumAndroidApp)}.`;
					}
					if (reason === "remote-controller-error") {
						const actionKey = {
							component_missing: "remoteUnavailableTailscale",
							funnel_permission_required: "funnelPermission",
							funnel_https_required: "funnelHttps",
							funnel_start_failed: "funnelStart",
							funnel_start_timeout: "funnelTimeout",
							tailscale_dns_missing: "tailscaleDnsMissing",
							sidecar_launch_failed: "remoteUnavailableTailscale",
							sidecar_stopped: "controlChannelFailed",
							sidecar_exited: "controlChannelFailed",
							control_channel_failed: "controlChannelFailed",
							cpolar_component_missing: "cpolarMissing",
							cpolar_component_invalid: "cpolarInvalid",
							cpolar_config_missing: "cpolarConfigMissing",
							cpolar_config_invalid: "cpolarConfigInvalid",
							cpolar_start_timeout: "cpolarTimeout",
							cpolar_stopped: "cpolarStopped",
							cpolar_exited: "cpolarExited",
							frp_component_missing: "frpMissing",
							frp_component_invalid: "frpInvalid",
							frp_config_missing: "frpConfigMissing",
							frp_config_verify_failed: "frpConfigVerifyFailed",
							frp_vhost_publicly_reachable: "frpVhostPublic",
							frp_vhost_probe_failed: "frpVhostProbeFailed",
							frp_launch_failed: "frpLaunchFailed",
							frp_start_timeout: "frpTimeout",
							frp_discovery_mismatch: "frpDiscoveryMismatch",
							frp_discovery_invalid: "frpDiscoveryInvalid",
							frp_stopped: "frpStopped",
							frp_exited: "frpExited",
							gateway_start_failed: "gatewayStartFailed"
						}[values.controllerCode ?? ""];
						if (actionKey !== void 0) action = t(actionKey);
					}
					return {
						detail,
						action
					};
				};
				const appendGroup = (label, groupEntries) => {
					if (groupEntries.length === 0) return;
					const group = element("section", "dsh-mobile-control__diagnostic-group");
					const groupHeader = element("header", "dsh-mobile-control__diagnostic-group-header");
					const groupTitle = element("h3");
					groupTitle.textContent = label;
					const groupCount = element("span");
					groupCount.textContent = t("diagnosticItems", { count: groupEntries.length });
					const list = element("div", "dsh-mobile-control__diagnostic-list");
					list.setAttribute("role", "list");
					groupHeader.append(groupTitle, groupCount);
					for (const entry of groupEntries) {
						const state = statusOf(entry);
						const row = element("section", `dsh-mobile-control__diagnostic-check is-${state}`);
						row.setAttribute("role", "listitem");
						const marker = element("span", "dsh-mobile-control__diagnostic-marker");
						marker.setAttribute("aria-hidden", "true");
						const rowBody = element("div", "dsh-mobile-control__diagnostic-check-body");
						const rowHeader = element("div", "dsh-mobile-control__diagnostic-check-header");
						const labelKey = typeof entry.id === "string" ? diagnosticLabelKeys[entry.id] : void 0;
						const rowTitle = element("strong");
						rowTitle.textContent = locale !== "zh" && labelKey !== void 0 ? t(labelKey) : typeof entry.label === "string" ? entry.label : t("diagnosticCheck");
						const badge = element("span", "dsh-mobile-control__diagnostic-badge");
						badge.textContent = statusLabels[state];
						const localizedCopy = localizedEntryCopy(entry);
						const detail = element("p");
						detail.textContent = localizedCopy.detail;
						rowHeader.append(rowTitle, badge);
						rowBody.append(rowHeader, detail);
						if (localizedCopy.action !== "") {
							const action = element("p", "dsh-mobile-control__diagnostic-action");
							const actionLabel = element("span");
							actionLabel.textContent = t("diagnosticAction");
							action.append(actionLabel, document.createTextNode(localizedCopy.action));
							rowBody.append(action);
						}
						row.append(marker, rowBody);
						list.append(row);
					}
					group.append(groupHeader, list);
					diagnosticsChecks.append(group);
				};
				const issues = entries.filter((entry) => statusOf(entry) === "error" || statusOf(entry) === "warning");
				const otherChecks = entries.filter((entry) => statusOf(entry) !== "error" && statusOf(entry) !== "warning");
				appendGroup(t("diagnosticNeedsAction"), issues);
				appendGroup(issues.length === 0 ? t("diagnosticDetails") : t("diagnosticOther"), otherChecks);
				diagnosticsSummaryMeta.textContent = issues.length === 0 ? t("diagnosticNoBlockers", { count: entries.length }) : t("diagnosticNeedsCount", {
					count: entries.length,
					issues: issues.length
				});
				diagnosticsChecks.hidden = entries.length === 0;
				const reportCopy = LOCALIZED_DIAGNOSTIC_COPY[locale];
				const generatedAt = typeof data.generatedAt === "number" ? new Date(data.generatedAt).toLocaleString(localeTag) : (/* @__PURE__ */ new Date()).toLocaleString(localeTag);
				const lines = entries.map((entry) => {
					const state = statusOf(entry);
					const labelKey = typeof entry.id === "string" ? diagnosticLabelKeys[entry.id] : void 0;
					const label = labelKey === void 0 && typeof entry.label === "string" ? entry.label : labelKey === void 0 ? t("diagnosticCheck") : t(labelKey);
					const localizedCopy = localizedEntryCopy(entry);
					return `[${statusLabels[state]}] ${label}: ${localizedCopy.detail}${localizedCopy.action === "" ? "" : ` ${localizedCopy.action}`}`;
				});
				copiedDiagnosticReport = [
					reportCopy.reportTitle,
					`${reportCopy.generated}: ${generatedAt}`,
					...lines
				].join("\n");
				diagnosticsReport.textContent = copiedDiagnosticReport;
				diagnosticsDetails.hidden = copiedDiagnosticReport === "";
				diagnosticsCopy.disabled = copiedDiagnosticReport === "";
				diagnosticsCopy.hidden = copiedDiagnosticReport === "";
				diagnosticsToolbar.classList.toggle("has-report", copiedDiagnosticReport !== "");
			};
			const showDiagnosticsFailure = (error) => {
				diagnosticsSummary.className = "dsh-mobile-control__diagnostic-summary is-error";
				diagnosticsSummaryTitle.textContent = t("diagnosticsIncomplete");
				diagnosticsSummaryText.textContent = t("diagnosticsReadFailed", { error: String(error) });
				diagnosticsSummaryMeta.textContent = t("diagnosticsUnavailable");
				diagnosticsChecks.replaceChildren();
				diagnosticsChecks.hidden = true;
				copiedDiagnosticReport = "";
				diagnosticsReport.textContent = "";
				diagnosticsDetails.hidden = true;
				diagnosticsCopy.disabled = true;
				diagnosticsCopy.hidden = true;
				diagnosticsToolbar.classList.remove("has-report");
			};
			const loadDiagnostics = () => {
				if (diagnosticsBusy) return;
				diagnosticsBusy = true;
				diagnosticsRun.disabled = true;
				diagnosticsRun.setAttribute("aria-busy", "true");
				diagnosticsRun.textContent = t("diagnosticsChecking");
				diagnosticsSummary.className = "dsh-mobile-control__diagnostic-summary is-running";
				diagnosticsSummaryTitle.textContent = t("diagnosticsCheckingTitle");
				diagnosticsSummaryText.textContent = t("diagnosticsCheckingText");
				diagnosticsSummaryMeta.textContent = t("diagnosticsRunningMeta");
				diagnosticsFeedback.hidden = true;
				diagnosticsChecks.classList.add("is-refreshing");
				diagnosticsChecks.setAttribute("aria-busy", "true");
				controlRequestJson("/api/mobile-access/diagnostics").then((data) => {
					renderDiagnosticPayloadSafely(data, renderDiagnostics, showDiagnosticsFailure);
				}, showDiagnosticsFailure).finally(() => {
					diagnosticsBusy = false;
					diagnosticsRun.disabled = false;
					diagnosticsRun.setAttribute("aria-busy", "false");
					diagnosticsRun.textContent = t("diagnosticsRetry");
					diagnosticsChecks.classList.remove("is-refreshing");
					diagnosticsChecks.setAttribute("aria-busy", "false");
				});
			};
			diagnosticsEntry.addEventListener("click", () => {
				if (!diagnosticsView.hidden) {
					selectView(previousAccessView);
					return;
				}
				selectView("diagnostics");
				loadDiagnostics();
			});
			diagnosticsRun.addEventListener("click", loadDiagnostics);
			const closeUpdateCard = () => {
				updateCard.hidden = true;
				if (pluginUpdateAvailable && pluginLatestVersion !== "") updatePlugin.hidden = !diagnosticsView.hidden;
			};
			const runPluginUpdate = () => {
				if (!pluginUpdateAvailable || pluginLatestVersion === "" || updateInFlight) return;
				updateInFlight = true;
				updateNow.disabled = true;
				updateLater.disabled = true;
				updateCardTitle.textContent = t("updatingPlugin");
				releaseNotice.hidden = true;
				releaseNotice.classList.remove("is-error");
				controlRequestJson("/api/mobile-access/release/update", {
					method: "POST",
					body: "{}"
				}, LONG_CONTROL_REQUEST_TIMEOUT_MS).then((data) => {
					const installedVersion = releaseVersion(data.installedVersion) ?? pluginLatestVersion;
					pluginUpdateAvailable = false;
					updateCard.hidden = true;
					updatePlugin.hidden = true;
					releaseNotice.textContent = t("pluginUpdatedRestart", { version: installedVersion });
					releaseNotice.hidden = false;
				}, (error) => {
					updateCard.hidden = true;
					updatePlugin.hidden = false;
					releaseNotice.textContent = t("pluginUpdateFailed", { error: String(error) });
					releaseNotice.classList.add("is-error");
					releaseNotice.hidden = false;
				}).finally(() => {
					updateInFlight = false;
					updateNow.disabled = false;
					updateLater.disabled = false;
				});
			};
			updatePlugin.addEventListener("click", () => {
				if (!pluginUpdateAvailable || pluginLatestVersion === "" || updateInFlight) return;
				updatePlugin.hidden = true;
				updateCardTitle.textContent = t("updateTo", { version: pluginLatestVersion });
				updateCardNotes.textContent = pluginReleaseNotes === "" ? t("updateNotesEmpty") : pluginReleaseNotes;
				updateCardNotes.hidden = pluginReleaseNotes === "";
				updateCard.hidden = false;
			});
			updateNow.addEventListener("click", runPluginUpdate);
			updateLater.addEventListener("click", closeUpdateCard);
			diagnosticsCopy.addEventListener("click", () => {
				if (copiedDiagnosticReport === "") return;
				navigator.clipboard.writeText(copiedDiagnosticReport).then(() => {
					diagnosticsFeedback.textContent = t("diagnosticsCopied");
					diagnosticsFeedback.hidden = false;
				}, () => {
					diagnosticsDetails.open = true;
					diagnosticsFeedback.textContent = t("diagnosticsCopyManual");
					diagnosticsFeedback.hidden = false;
				});
			});
			pair.addEventListener("click", () => {
				pair.disabled = true;
				openPairing("key");
			});
			linkPair.addEventListener("click", () => {
				linkPair.disabled = true;
				openPairing("link");
			});
			close.addEventListener("click", () => {
				setOpen(false);
			});
			const dismiss = (event) => {
				if (panel.hidden || !(event.target instanceof Node)) return;
				if (!providerInfo.contains(event.target)) {
					providerInfoPinned = false;
					providerInfoHovered = false;
					syncProviderInfo();
				}
				if (!panel.contains(event.target) && !document.querySelector(".dsh-mobile-control__trigger")?.contains(event.target)) setOpen(false);
			};
			document.addEventListener("pointerdown", dismiss);
			controlRequestJson("/api/mobile-access/release").then(renderRelease, () => {});
			controlRequestJson("/api/mobile-access/lan/control").then(render, (error) => {
				status.textContent = t("requestFailed", { error: String(error) });
			});
			loadRemote();
			const remotePoll = window.setInterval(() => {
				if (!panel.hidden && !remoteView.hidden) loadRemote();
			}, 1500);
			const pollWsBlocked = () => {
				controlRequestJson("/api/mobile-access/remote/websocket-paths/blocked").then((blocked) => {
					wsPathsBlocked = (Array.isArray(blocked.blocked) ? blocked.blocked : []).filter((entry) => typeof entry === "object" && entry !== null && typeof entry.path === "string" && typeof entry.attempts === "number");
					renderWsDot();
					if (!diagnosticsView.hidden) renderWsBlocked(wsPathsBlocked);
				}, () => {});
			};
			const wsBlockedPoll = window.setInterval(pollWsBlocked, 2e4);
			return {
				remove: () => {
					lifecycle.abort();
					window.clearInterval(remotePoll);
					window.clearInterval(wsBlockedPoll);
					window.removeEventListener("focus", retryAfterSetup);
					document.removeEventListener("visibilitychange", retryAfterSetup);
					document.removeEventListener("pointerdown", dismiss);
					root.remove();
				},
				toggle: () => {
					setOpen(panel.hidden !== false);
				},
				isOpen: () => !panel.hidden
			};
		}
		function mobileRequest(path, init = {}) {
			const target = new URL(path, location.href);
			if (target.origin !== location.origin) throw new TypeError("mobile extension requests must stay on the DSH origin");
			const headers = new Headers(init.headers);
			const method = (init.method ?? "GET").toUpperCase();
			if (method !== "GET" && method !== "HEAD") {
				const csrf = document.cookie.split(";").map((value) => value.trim()).find((value) => value.startsWith("dsh_ma_csrf="))?.slice(12);
				if (csrf !== void 0) headers.set("x-dsh-mobile-csrf", csrf);
			}
			return fetch(target, {
				...init,
				headers,
				credentials: "same-origin",
				cache: "no-store",
				redirect: "error"
			});
		}
		/** Combine extension and caller abort lifetimes and expose deterministic listener cleanup. */
		function combineClientSignalLifetime(first, second) {
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
		/** Combine extension and caller abort lifetimes on WebViews without AbortSignal.any. */
		function combineClientSignals(first, second) {
			return combineClientSignalLifetime(first, second).signal;
		}
		/** Keep a combined request lifetime until a streamed response is consumed or cancelled. */
		function bindClientResponseLifetime(response, cleanup) {
			if (response.body === null) {
				cleanup();
				return response;
			}
			const reader = response.body.getReader();
			let released = false;
			const release = () => {
				if (released) return;
				released = true;
				cleanup();
			};
			const body = new ReadableStream({
				async pull(controller) {
					try {
						const result = await reader.read();
						if (result.done) {
							release();
							controller.close();
						} else controller.enqueue(result.value);
					} catch (error) {
						release();
						controller.error(error);
					}
				},
				async cancel(reason) {
					try {
						await reader.cancel(reason);
					} finally {
						release();
					}
				}
			});
			try {
				const retained = new Response(body, {
					headers: response.headers,
					status: response.status,
					statusText: response.statusText
				});
				Object.defineProperties(retained, {
					redirected: {
						configurable: true,
						value: response.redirected
					},
					type: {
						configurable: true,
						value: response.type
					},
					url: {
						configurable: true,
						value: response.url
					}
				});
				return retained;
			} catch (error) {
				reader.cancel(error);
				release();
				throw error;
			}
		}
		/** Dispose an old UI when its replacement Host generation cannot be activated. */
		function failClosedExtensionGenerationReplacement(hasActive, activeGeneration, replacementGeneration, dispose) {
			if (!hasActive || activeGeneration === replacementGeneration) return false;
			dispose();
			return true;
		}
		/** Resolve one SDK route and prove its normalized path remains in the current extension namespace. */
		function extensionRouteUrl(id, path, baseUrl) {
			const rawPathname = path.split(/[?#]/u, 1)[0] ?? "";
			if (!/^[a-z][a-z0-9-]{0,63}$/u.test(id) || !path.startsWith("/") || path.startsWith("//") || rawPathname.includes("\\") || rawPathname.includes("\0") || /%(?:2f|5c)/iu.test(rawPathname)) throw new TypeError("extension routes must be relative");
			const origin = new URL(baseUrl).origin;
			const prefix = `/mobile-access/extensions/${id}/routes`;
			let target;
			try {
				target = new URL(`${prefix}${path}`, origin);
			} catch {
				throw new TypeError("extension routes must be relative");
			}
			let decodedPathname;
			try {
				decodedPathname = decodeURIComponent(target.pathname);
			} catch {
				throw new TypeError("extension routes must be relative");
			}
			if (target.origin !== origin || target.hash !== "" || decodedPathname.includes("\\") || decodedPathname !== prefix && !decodedPathname.startsWith(`${prefix}/`)) throw new TypeError("extension routes must be relative");
			if (decodedPathname.slice(prefix.length).split("/").some((part) => part === "." || part === "..")) throw new TypeError("extension routes must be relative");
			return target;
		}
		/** Resolve one generation-pinned static asset URL in the current extension namespace. */
		function extensionAssetUrl(id, generation, path, baseUrl) {
			if (!/^[a-z][a-z0-9-]{0,63}$/u.test(id) || generation !== void 0 && !/^[a-f\d]{64}$/u.test(generation)) throw new TypeError("extension asset path is invalid");
			const normalized = path.replaceAll("\\", "/");
			if (normalized.length === 0 || normalized.startsWith("/") || normalized.split("/").some((part) => part === "" || part === "." || part === "..")) throw new TypeError("extension asset path is invalid");
			const target = new URL(`/mobile-access/extensions/${id}/assets/${normalized.split("/").map(encodeURIComponent).join("/")}`, new URL(baseUrl).origin);
			if (generation !== void 0) target.searchParams.set("generation", generation);
			return target;
		}
		/** Add the immutable Host generation selected for one activated mobile UI. */
		function extensionGenerationHeaders(generation, headers) {
			const result = new Headers(headers);
			if (generation !== void 0) result.set("x-dsh-mobile-extension-generation", generation);
			return result;
		}
		function registerUniqueDisposable(entries, claimedIds, id, mount) {
			if (claimedIds.has(id)) throw new Error(`duplicate lifecycle id: ${id}`);
			claimedIds.add(id);
			let mounted;
			try {
				mounted = mount();
			} catch (error) {
				claimedIds.delete(id);
				throw error;
			}
			let disposed = false;
			const dispose = () => {
				if (disposed) return;
				disposed = true;
				mounted.dispose();
			};
			const entry = {
				...mounted,
				dispose
			};
			entries.set(id, entry);
			return () => {
				if (entries.get(id) === entry) {
					entries.delete(id);
					claimedIds.delete(id);
				}
				dispose();
			};
		}
		/** Dispose resources omitted by a successfully fetched authoritative manifest. */
		function reconcileRemovedExtensions(currentIds, seen, dispose) {
			for (const id of new Set(currentIds)) if (!seen.has(id)) dispose(id);
		}
		/** Reconcile managed resources against one validated authoritative id set. */
		function publishAuthoritativeExtensionIds(authoritativeIds, seen, managedIdSources, dispose) {
			const current = new Set(authoritativeIds);
			for (const source of managedIdSources) for (const id of source) current.add(id);
			reconcileRemovedExtensions(current, seen, dispose);
			authoritativeIds.clear();
			for (const id of seen) authoritativeIds.add(id);
		}
		function validManifestResourceUrl(value) {
			return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("://") && !value.split("/").some((part) => part === ".." || part === ".");
		}
		/** Validate the manifest before treating it as authoritative state. */
		function parseMobileExtensionManifest(payload) {
			if (typeof payload !== "object" || payload === null) return void 0;
			const candidate = payload;
			if (candidate.protocol !== 1 || !Array.isArray(candidate.extensions) || typeof candidate.legacy !== "object" || candidate.legacy === null) return void 0;
			const legacy = candidate.legacy;
			if (typeof legacy.scriptRevision !== "string" || typeof legacy.styleRevision !== "string") return void 0;
			const ids = /* @__PURE__ */ new Set();
			const extensions = [];
			for (const value of candidate.extensions) {
				if (typeof value !== "object" || value === null) return void 0;
				const entry = value;
				if (typeof entry.id !== "string" || !/^[a-z][a-z0-9-]{0,63}$/u.test(entry.id) || ids.has(entry.id)) return void 0;
				if (entry.generation !== void 0 && (typeof entry.generation !== "string" || !/^[a-f\d]{64}$/u.test(entry.generation))) return void 0;
				if (entry.scriptUrl !== void 0 && !validManifestResourceUrl(entry.scriptUrl)) return void 0;
				if (entry.styleUrl !== void 0 && !validManifestResourceUrl(entry.styleUrl)) return void 0;
				if (entry.assetsUrl !== void 0 && !validManifestResourceUrl(entry.assetsUrl)) return void 0;
				ids.add(entry.id);
				extensions.push({
					id: entry.id,
					...entry.generation === void 0 ? {} : { generation: entry.generation },
					...entry.scriptUrl === void 0 ? {} : { scriptUrl: entry.scriptUrl },
					...entry.styleUrl === void 0 ? {} : { styleUrl: entry.styleUrl },
					...entry.assetsUrl === void 0 ? {} : { assetsUrl: entry.assetsUrl }
				});
			}
			return {
				extensions,
				legacy: {
					scriptRevision: legacy.scriptRevision,
					styleRevision: legacy.styleRevision
				}
			};
		}
		/** A missing manifest is authoritative before optional legacy resources finish refreshing. */
		async function handleMissingExtensionManifest(clearManifestResources, refreshLegacyResources, signal) {
			clearManifestResources();
			const results = await refreshLegacyResources();
			return !signal.aborted && results.every(Boolean);
		}
		function refreshAborted(signal) {
			return signal.aborted;
		}
		/** Run one coalesced refresh cycle, slowing down when the page is hidden. */
		function startLifecycleRefreshScheduler(refresh, options = {}, runtime = {
			document,
			window
		}) {
			const visibleIntervalMs = options.visibleIntervalMs ?? 45e3;
			const hiddenIntervalMs = options.hiddenIntervalMs ?? 3e5;
			const cycleTimeoutMs = options.cycleTimeoutMs ?? 3e4;
			let timer;
			let cycleTimer;
			let running = false;
			let queued = false;
			let disposed = false;
			let controller;
			const clearTimer = () => {
				if (timer === void 0) return;
				runtime.window.clearTimeout(timer);
				timer = void 0;
			};
			const clearCycleTimer = () => {
				if (cycleTimer === void 0) return;
				runtime.window.clearTimeout(cycleTimer);
				cycleTimer = void 0;
			};
			const schedule = () => {
				if (disposed) return;
				clearTimer();
				const delay = runtime.document.visibilityState === "hidden" ? hiddenIntervalMs : visibleIntervalMs;
				timer = runtime.window.setTimeout(run, delay);
			};
			const run = () => {
				if (disposed) return;
				clearTimer();
				if (running) {
					queued = true;
					return;
				}
				running = true;
				const current = new AbortController();
				controller = current;
				const refreshPromise = Promise.resolve().then(() => refresh(current.signal));
				const timeoutPromise = new Promise((resolve) => {
					cycleTimer = runtime.window.setTimeout(() => {
						cycleTimer = void 0;
						current.abort(new DOMException("mobile extension refresh timed out", "TimeoutError"));
						resolve();
					}, cycleTimeoutMs);
				});
				Promise.race([refreshPromise, timeoutPromise]).catch(() => {}).finally(() => {
					clearCycleTimer();
					if (controller === current) controller = void 0;
					running = false;
					if (disposed) return;
					if (queued) {
						queued = false;
						run();
					} else schedule();
				});
				refreshPromise.catch(() => {});
			};
			const onVisibilityChange = () => {
				if (runtime.document.visibilityState === "hidden") schedule();
				else run();
			};
			runtime.document.addEventListener("visibilitychange", onVisibilityChange);
			runtime.window.addEventListener("focus", run);
			runtime.window.addEventListener("online", run);
			run();
			const stop = () => {
				disposed = true;
				queued = false;
				controller?.abort();
				controller = void 0;
				clearCycleTimer();
				clearTimer();
				runtime.document.removeEventListener("visibilitychange", onVisibilityChange);
				runtime.window.removeEventListener("focus", run);
				runtime.window.removeEventListener("online", run);
			};
			return Object.assign(stop, { refresh: run });
		}
		/** Maintain one authenticated same-origin extension event stream with bounded reconnect backoff. */
		function startExtensionChangeStream(changed, runtime = {
			window,
			create: (url) => new EventSource(url, { withCredentials: true })
		}, onTaskEvent) {
			let source;
			let timer;
			let disposed = false;
			let retryMs = 1e3;
			const clearTimer = () => {
				if (timer === void 0) return;
				runtime.window.clearTimeout(timer);
				timer = void 0;
			};
			const connect = () => {
				if (disposed || source !== void 0) return;
				clearTimer();
				const next = runtime.create("/mobile-access/extensions/events");
				source = next;
				next.onopen = () => {
					retryMs = 1e3;
				};
				next.addEventListener("extensions-changed", changed);
				if (onTaskEvent !== void 0) next.addEventListener("task-notify", (message) => {
					const data = message.data;
					onTaskEvent(data);
				});
				next.onerror = () => {
					if (source !== next) return;
					next.close();
					source = void 0;
					if (disposed) return;
					const delay = retryMs;
					retryMs = Math.min(3e4, retryMs * 2);
					timer = runtime.window.setTimeout(connect, delay);
				};
			};
			const reconnectNow = () => {
				if (disposed) return;
				source?.close();
				source = void 0;
				retryMs = 1e3;
				connect();
			};
			runtime.window.addEventListener("online", reconnectNow);
			connect();
			return () => {
				disposed = true;
				clearTimer();
				source?.close();
				source = void 0;
				runtime.window.removeEventListener("online", reconnectNow);
			};
		}
		/** Keep at most one activation in flight per id and commit only its latest generation. */
		var PerIdActivationLifecycle = class {
			active = /* @__PURE__ */ new Map();
			pending = /* @__PURE__ */ new Map();
			generations = /* @__PURE__ */ new Map();
			disposed = false;
			hasActive(id) {
				return this.active.has(id);
			}
			getActive(id) {
				return this.active.get(id)?.value;
			}
			pendingCount() {
				return this.pending.size;
			}
			async activate(id, key, cycleSignal, create) {
				if (this.disposed || cycleSignal?.aborted === true) return false;
				const existing = this.pending.get(id);
				if (existing !== void 0) {
					if (existing.key === key && !existing.controller.signal.aborted) return this.waitFor(existing, cycleSignal);
					existing.cancel();
				}
				const generation = (this.generations.get(id) ?? 0) + 1;
				this.generations.set(id, generation);
				const controller = new AbortController();
				let work;
				try {
					work = create(controller, generation);
				} catch {
					controller.abort(new DOMException("mobile extension activation failed to start", "AbortError"));
					return false;
				}
				let cancelled = false;
				let pending = {};
				const cancel = () => {
					if (cancelled) return;
					cancelled = true;
					if (this.pending.get(id) === pending) this.pending.delete(id);
					if (this.generations.get(id) === generation) this.generations.set(id, generation + 1);
					controller.abort(new DOMException("mobile extension activation cancelled", "AbortError"));
					work.cancel();
				};
				const completion = Promise.resolve(work.result).then((value) => {
					const current = this.pending.get(id);
					if (!(!this.disposed && current === pending && current.generation === this.generations.get(id) && !controller.signal.aborted)) {
						try {
							work.dispose(value);
						} catch {}
						return false;
					}
					try {
						work.commit?.(value);
					} catch {
						try {
							work.dispose(value);
						} catch {}
						return false;
					}
					const previous = this.active.get(id);
					let valueDisposed = false;
					const dispose = () => {
						if (valueDisposed) return;
						valueDisposed = true;
						controller.abort(new DOMException("mobile extension deactivated", "AbortError"));
						try {
							work.dispose(value);
						} catch {}
					};
					this.active.set(id, {
						value,
						dispose
					});
					previous?.dispose();
					return true;
				}, () => {
					cancel();
					return false;
				}).finally(() => {
					if (this.pending.get(id) === pending) this.pending.delete(id);
				});
				Object.assign(pending, {
					key,
					generation,
					controller,
					cancel,
					completion
				});
				this.pending.set(id, pending);
				return this.waitFor(pending, cycleSignal);
			}
			remove(id) {
				this.generations.set(id, (this.generations.get(id) ?? 0) + 1);
				this.active.get(id)?.dispose();
				this.active.delete(id);
				this.pending.get(id)?.cancel();
			}
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				for (const current of this.active.values()) current.dispose();
				this.active.clear();
				for (const current of this.pending.values()) current.cancel();
			}
			waitFor(pending, signal) {
				if (signal === void 0) return pending.completion;
				if (signal.aborted) {
					pending.cancel();
					return Promise.resolve(false);
				}
				return new Promise((resolve) => {
					let settled = false;
					const finish = (value) => {
						if (settled) return;
						settled = true;
						signal.removeEventListener("abort", onAbort);
						resolve(value);
					};
					const onAbort = () => {
						pending.cancel();
						finish(false);
					};
					signal.addEventListener("abort", onAbort, { once: true });
					pending.completion.then(finish);
				});
			}
		};
		function installCustomAssets() {
			const legacyStyle = element("style");
			legacyStyle.dataset.plugin = "dsh-mobile-custom";
			document.head.append(legacyStyle);
			const legacyCssState = {
				etag: "",
				modified: ""
			};
			const previous = window.dshMobile;
			let legacyMount = queuedLegacyMount;
			let legacySource = "";
			let legacyRoot;
			let legacyDispose;
			const definitions = /* @__PURE__ */ new Map();
			const activations = new PerIdActivationLifecycle();
			const styleNodes = /* @__PURE__ */ new Map();
			const styleEtags = /* @__PURE__ */ new Map();
			const scriptDigests = /* @__PURE__ */ new Map();
			const activeHostGenerations = /* @__PURE__ */ new Map();
			const activationKeys = /* @__PURE__ */ new Map();
			const manifestExtensionIds = /* @__PURE__ */ new Set();
			const managedDefinitionIds = /* @__PURE__ */ new Set();
			let manifestEtag = "";
			let disposed = false;
			let expectedDefinitionId;
			const SURFACE_HOST_STYLES = {
				"sidebar-action": "position:fixed;z-index:1100;top:calc(env(safe-area-inset-top) + 8px);left:8px;display:flex;flex-direction:column;gap:6px;pointer-events:none",
				"header-action": "position:fixed;z-index:1100;top:calc(env(safe-area-inset-top) + 8px);right:8px;display:flex;flex-direction:column;gap:6px;pointer-events:none",
				"composer-dock": "position:fixed;z-index:1100;bottom:calc(env(safe-area-inset-bottom) + 8px);left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;pointer-events:none",
				"settings-section": "position:fixed;z-index:1100;inset:auto 8px calc(env(safe-area-inset-bottom) + 72px) 8px;max-height:40vh;overflow:auto;pointer-events:none"
			};
			const surfaceHost = (placement) => {
				const existing = document.querySelector(`[data-dsh-mobile-surface-host="${placement}"]`);
				if (existing !== null) return existing;
				const style = SURFACE_HOST_STYLES[placement];
				if (style === void 0) return void 0;
				const host = element("div");
				host.dataset.dshMobileSurfaceHost = placement;
				host.style.cssText = style;
				document.body.append(host);
				return host;
			};
			const shellLayer = () => {
				const existing = document.querySelector("[data-dsh-mobile-extension-layer]");
				if (existing !== null) return existing;
				const layer = element("div");
				layer.dataset.dshMobileExtensionLayer = "true";
				layer.style.cssText = "position:fixed;inset:0;z-index:1200;pointer-events:none;overflow:hidden";
				document.body.append(layer);
				return layer;
			};
			const toast = (message) => {
				const node = element("div");
				node.textContent = message;
				node.style.cssText = "position:absolute;top:16px;left:50%;transform:translateX(-50%);padding:9px 14px;border-radius:999px;background:#1f2937;color:white;font:14px system-ui;pointer-events:auto;box-shadow:0 8px 24px #0003";
				shellLayer().append(node);
				window.setTimeout(() => node.remove(), 2600);
			};
			const materializeNativeFile = (value) => {
				if (typeof value !== "object" || value === null || !("base64" in value) || !("name" in value)) return value;
				const candidate = value;
				if (typeof candidate.base64 !== "string" || typeof candidate.name !== "string") return value;
				try {
					const encoded = atob(candidate.base64);
					const bytes = Uint8Array.from(encoded, (character) => character.charCodeAt(0));
					return new File([bytes], candidate.name, { type: typeof candidate.type === "string" ? candidate.type : "application/octet-stream" });
				} catch {
					return value;
				}
			};
			const invokeNative = async (action, input, signal) => {
				const abortReason = () => signal.reason ?? new DOMException("mobile extension disposed", "AbortError");
				if (signal.aborted) throw abortReason();
				const bridge = window.__DSH_MOBILE_NATIVE__;
				if (bridge !== void 0) return new Promise((resolve, reject) => {
					let settled = false;
					const finish = (callback) => {
						if (settled) return;
						settled = true;
						signal.removeEventListener("abort", onAbort);
						callback();
					};
					const onAbort = () => {
						finish(() => {
							reject(abortReason());
						});
					};
					signal.addEventListener("abort", onAbort, { once: true });
					Promise.resolve().then(() => bridge.invoke(action, input)).then((value) => {
						finish(() => {
							resolve(materializeNativeFile(value));
						});
					}, (error) => {
						finish(() => {
							reject(error);
						});
					});
				});
				if (action === "share" && typeof navigator.share === "function") {
					await navigator.share(input ?? {});
					return { ok: true };
				}
				if (action === "clipboard.read" && navigator.clipboard !== void 0) return { text: await navigator.clipboard.readText() };
				if (action === "clipboard.write" && navigator.clipboard !== void 0) {
					await navigator.clipboard.writeText(typeof input === "object" && input !== null && "text" in input ? String(input.text) : "");
					return { ok: true };
				}
				if (action === "files.pick" || action === "camera.capture") {
					const inputElement = element("input");
					inputElement.type = "file";
					inputElement.accept = action === "camera.capture" ? "image/*" : "*/*";
					if (action === "camera.capture") inputElement.capture = "environment";
					inputElement.hidden = true;
					return new Promise((resolve, reject) => {
						let settled = false;
						let cleaned = false;
						let cleanupTimer = 0;
						let watchdogTimer = 0;
						const cleanup = () => {
							if (cleaned) return;
							cleaned = true;
							if (cleanupTimer !== 0) window.clearTimeout(cleanupTimer);
							if (watchdogTimer !== 0) window.clearTimeout(watchdogTimer);
							window.removeEventListener("focus", scheduleCancel);
							document.removeEventListener("visibilitychange", onVisibilityChange);
							signal.removeEventListener("abort", onAbort);
							inputElement.removeEventListener("change", onChange);
							inputElement.removeEventListener("cancel", onCancel);
							inputElement.remove();
						};
						const finish = (callback) => {
							if (settled) return;
							settled = true;
							cleanup();
							callback();
						};
						const onChange = () => {
							const file = inputElement.files?.[0];
							finish(() => {
								resolve(file);
							});
						};
						const onCancel = () => {
							finish(() => {
								resolve(void 0);
							});
						};
						const onAbort = () => {
							finish(() => {
								reject(abortReason());
							});
						};
						const scheduleCancel = () => {
							if (!settled && cleanupTimer === 0) cleanupTimer = window.setTimeout(onCancel, 1e3);
						};
						const onVisibilityChange = () => {
							if (document.visibilityState === "visible") scheduleCancel();
						};
						inputElement.addEventListener("change", onChange, { once: true });
						inputElement.addEventListener("cancel", onCancel, { once: true });
						window.addEventListener("focus", scheduleCancel);
						document.addEventListener("visibilitychange", onVisibilityChange);
						signal.addEventListener("abort", onAbort, { once: true });
						watchdogTimer = window.setTimeout(onCancel, 3e5);
						try {
							document.body.append(inputElement);
							inputElement.click();
						} catch (error) {
							finish(() => {
								reject(error);
							});
						}
					});
				}
				throw new Error("native capability is unavailable");
			};
			const makeApi = (id, hostGeneration, controller, surfaces, surfaceIds) => {
				const ensureCurrent = () => {
					if (controller.signal.aborted) throw controller.signal.reason;
				};
				const requestSignal = (signal) => signal === void 0 || signal === null ? {
					signal: controller.signal,
					cleanup: () => void 0
				} : combineClientSignalLifetime(controller.signal, signal);
				const mountSurface = (surface) => {
					ensureCurrent();
					if (!/^[a-z][a-z0-9-]{0,63}$/u.test(surface.id) || surface.label.length > 120) throw new Error("invalid mobile surface");
					return registerUniqueDisposable(surfaces, surfaceIds, surface.id, () => {
						const container = element("section");
						container.dataset.dshMobileSurface = surface.id;
						container.hidden = surface.placement === "page" || surface.placement === "overlay";
						container.style.cssText = surface.placement === "page" || surface.placement === "overlay" ? "position:absolute;inset:0;overflow:auto;background:var(--dsw-alias-bg-layer-1,#fff);padding:16px;pointer-events:auto" : "pointer-events:auto";
						const host = () => surface.placement === "page" || surface.placement === "overlay" ? shellLayer() : surfaceHost(surface.placement) ?? shellLayer();
						const mounted = surface.mount(container);
						const dispose = () => {
							try {
								if (typeof mounted === "function") mounted();
							} finally {
								container.remove();
							}
						};
						return {
							dispose,
							container,
							host
						};
					});
				};
				return {
					host: {
						invoke: (action, input) => {
							ensureCurrent();
							return mobileRequest(`/mobile-access/extensions/${encodeURIComponent(id)}/actions/${encodeURIComponent(action)}`, {
								method: "POST",
								headers: extensionGenerationHeaders(hostGeneration),
								body: JSON.stringify(input ?? {}),
								signal: controller.signal
							}).then(async (response) => {
								const value = await response.json();
								if (!response.ok) throw new Error(typeof value === "object" && value !== null && "error" in value ? String(value.error) : `HTTP ${String(response.status)}`);
								return value;
							});
						},
						fetch: (path, init) => {
							ensureCurrent();
							const target = extensionRouteUrl(id, path, location.href);
							const headers = extensionGenerationHeaders(hostGeneration, init?.headers);
							const lifetime = requestSignal(init?.signal);
							return mobileRequest(target.href, {
								...init,
								headers,
								signal: lifetime.signal
							}).then((response) => bindClientResponseLifetime(response, lifetime.cleanup), (error) => {
								lifetime.cleanup();
								throw error;
							});
						},
						assetUrl: (path) => {
							ensureCurrent();
							return extensionAssetUrl(id, hostGeneration, path, location.href).href;
						}
					},
					ui: {
						registerSurface: mountSurface,
						open: (surfaceId) => {
							ensureCurrent();
							const entry = surfaces.get(surfaceId);
							if (entry !== void 0) entry.container.hidden = false;
						},
						close: (surfaceId) => {
							ensureCurrent();
							const entry = surfaces.get(surfaceId);
							if (entry !== void 0) entry.container.hidden = true;
						},
						toast: (message) => {
							ensureCurrent();
							toast(message);
						}
					},
					native: {
						capabilities: async () => {
							ensureCurrent();
							const bridge = window.__DSH_MOBILE_NATIVE__;
							return bridge === void 0 ? [
								"files.pick",
								"camera.capture",
								"share",
								"clipboard.read",
								"clipboard.write"
							] : bridge.capabilities();
						},
						invoke: (action, input) => invokeNative(action, input, controller.signal)
					},
					signal: controller.signal,
					document,
					window
				};
			};
			const activateDefinition = (definition, cycleSignal, commitGeneration, hostGeneration) => {
				const previousKey = activationKeys.get(definition.id);
				const key = previousKey?.definition === definition && previousKey.generation === hostGeneration ? previousKey : {
					definition,
					...hostGeneration === void 0 ? {} : { generation: hostGeneration }
				};
				activationKeys.set(definition.id, key);
				return activations.activate(definition.id, key, cycleSignal, (controller) => {
					const surfaces = /* @__PURE__ */ new Map();
					const surfaceIds = /* @__PURE__ */ new Set();
					let pendingDisposed = false;
					const disposePending = () => {
						if (pendingDisposed) return;
						pendingDisposed = true;
						for (const surface of surfaces.values()) try {
							surface.dispose();
						} catch {}
						surfaces.clear();
						surfaceIds.clear();
					};
					return {
						result: Promise.resolve().then(() => definition.activate(makeApi(definition.id, hostGeneration, controller, surfaces, surfaceIds))).then((cleanup) => ({
							controller,
							surfaces,
							...typeof cleanup === "function" ? { cleanup } : {}
						})),
						cancel: disposePending,
						commit: (value) => {
							if (definitions.get(definition.id) !== definition || controller.signal.aborted) throw new Error("stale mobile extension activation");
							for (const surface of value.surfaces.values()) surface.host().append(surface.container);
							activeHostGenerations.set(definition.id, hostGeneration);
							commitGeneration?.();
						},
						dispose: (value) => {
							controller.abort(new DOMException("mobile extension disposed", "AbortError"));
							try {
								value.cleanup?.();
							} finally {
								disposePending();
							}
						}
					};
				});
			};
			const define = (definition) => {
				if (disposed || definition.apiVersion !== 1 || !/^[a-z][a-z0-9-]{0,63}$/u.test(definition.id) || typeof definition.activate !== "function") return;
				if (expectedDefinitionId !== void 0 && definition.id !== expectedDefinitionId) return;
				definitions.set(definition.id, definition);
				if (started && expectedDefinitionId === void 0) activateDefinition(definition);
			};
			let started = false;
			window.dshMobile = Object.freeze({
				register: (mount) => {
					legacyMount = mount;
				},
				define
			});
			for (const definition of queuedDefinitions.splice(0)) define(definition);
			let legacyJsEtag = "";
			let legacyJsModified = "";
			const refreshLegacy = async (signal) => {
				const previousMount = legacyMount;
				let pendingRoot;
				try {
					const headers = {};
					if (legacyJsEtag !== "") headers["if-none-match"] = legacyJsEtag;
					if (legacyJsModified !== "") headers["if-modified-since"] = legacyJsModified;
					const response = await fetch("/mobile-access/custom.js", {
						credentials: "same-origin",
						cache: "no-store",
						headers,
						signal
					});
					if (response.status === 304) return true;
					if (!response.ok) return false;
					const nextEtag = response.headers.get("etag") ?? "";
					const nextModified = response.headers.get("last-modified") ?? "";
					const next = await response.text();
					if (refreshAborted(signal)) return false;
					if (next === legacySource) {
						legacyJsEtag = nextEtag;
						legacyJsModified = nextModified;
						return true;
					}
					legacyMount = void 0;
					const script = element("script");
					script.textContent = `${next}\n//# sourceURL=dsh-mobile-custom.js`;
					document.head.append(script);
					script.remove();
					if (refreshAborted(signal)) {
						legacyMount = previousMount;
						return false;
					}
					const mount = legacyMount;
					if (mount === void 0) {
						legacyDispose?.();
						legacyDispose = void 0;
						legacyRoot?.remove();
						legacyRoot = void 0;
						legacySource = next;
						legacyJsEtag = nextEtag;
						legacyJsModified = nextModified;
						return true;
					}
					const nextRoot = element("div");
					pendingRoot = nextRoot;
					nextRoot.dataset.dshMobileExtension = "true";
					document.body.append(nextRoot);
					const nextDispose = mount({
						document,
						request: mobileRequest,
						root: nextRoot,
						window
					});
					if (refreshAborted(signal)) {
						if (typeof nextDispose === "function") nextDispose();
						pendingRoot.remove();
						pendingRoot = void 0;
						legacyMount = previousMount;
						return false;
					}
					legacyDispose?.();
					legacyRoot?.remove();
					legacyRoot = nextRoot;
					pendingRoot = void 0;
					legacyDispose = typeof nextDispose === "function" ? nextDispose : void 0;
					legacySource = next;
					legacyJsEtag = nextEtag;
					legacyJsModified = nextModified;
					return true;
				} catch {
					pendingRoot?.remove();
					legacyMount = previousMount;
					return false;
				}
			};
			let legacyScriptRevision = "";
			let legacyStyleRevision = "";
			const disposeManifestExtension = (id) => {
				activations.remove(id);
				styleNodes.get(id)?.remove();
				styleNodes.delete(id);
				styleEtags.delete(id);
				scriptDigests.delete(id);
				activeHostGenerations.delete(id);
				activationKeys.delete(id);
				if (managedDefinitionIds.delete(id)) definitions.delete(id);
			};
			const managedManifestIdSources = () => [
				styleNodes.keys(),
				styleEtags.keys(),
				scriptDigests.keys(),
				managedDefinitionIds
			];
			const clearManifestExtensions = () => {
				publishAuthoritativeExtensionIds(manifestExtensionIds, /* @__PURE__ */ new Set(), managedManifestIdSources(), disposeManifestExtension);
				manifestEtag = "";
			};
			const refreshExtensions = async (signal) => {
				try {
					const headers = {};
					if (manifestEtag !== "") headers["if-none-match"] = manifestEtag;
					const response = await fetch("/mobile-access/extensions/manifest", {
						credentials: "same-origin",
						cache: "no-store",
						headers,
						signal
					});
					if (response.status === 404) {
						legacyScriptRevision = "";
						legacyStyleRevision = "";
						return handleMissingExtensionManifest(clearManifestExtensions, () => Promise.all([refreshLegacy(signal), refreshCssLegacy(legacyStyle, signal, legacyCssState)]), signal);
					}
					if (response.status === 304) return true;
					if (!response.ok) return false;
					const nextManifestEtag = response.headers.get("etag") ?? "";
					const payload = parseMobileExtensionManifest(await response.json());
					if (refreshAborted(signal) || payload === void 0) return false;
					const entries = payload.extensions;
					const seen = new Set(entries.map((entry) => entry.id));
					const scriptRevision = payload.legacy.scriptRevision;
					const styleRevision = payload.legacy.styleRevision;
					let refreshComplete = true;
					if (scriptRevision === "" || scriptRevision !== legacyScriptRevision) {
						if (await refreshLegacy(signal)) legacyScriptRevision = scriptRevision;
						else refreshComplete = false;
					}
					if (styleRevision === "" || styleRevision !== legacyStyleRevision) {
						if (await refreshCssLegacy(legacyStyle, signal, legacyCssState)) legacyStyleRevision = styleRevision;
						else refreshComplete = false;
					}
					const commitStyle = (id, change, css, etag) => {
						if (change === "retain") return;
						const oldStyle = styleNodes.get(id);
						if (change === "remove") {
							oldStyle?.remove();
							styleNodes.delete(id);
							styleEtags.delete(id);
							return;
						}
						if (oldStyle?.textContent !== css) {
							const node = element("style");
							node.dataset.dshMobileExtensionStyle = id;
							node.textContent = css ?? "";
							document.head.append(node);
							styleNodes.set(id, node);
							oldStyle?.remove();
						}
						if (etag !== void 0 && etag !== "") styleEtags.set(id, etag);
					};
					for (const entry of entries) {
						const hadActiveGeneration = activations.hasActive(entry.id);
						const previousHostGeneration = activeHostGenerations.get(entry.id);
						let previousDefinition;
						let evaluatedDefinition = false;
						try {
							let styleChange = entry.styleUrl === void 0 ? "remove" : "retain";
							let pendingCss;
							let pendingStyleEtag;
							const cssUrl = typeof entry.styleUrl === "string" ? entry.styleUrl : void 0;
							if (cssUrl !== void 0) {
								const cssHeaders = {};
								const storedEtag = styleEtags.get(entry.id);
								if (storedEtag !== void 0) cssHeaders["if-none-match"] = storedEtag;
								const cssResponse = await fetch(cssUrl, {
									credentials: "same-origin",
									cache: "no-store",
									headers: cssHeaders,
									signal
								});
								if (cssResponse.status !== 304) {
									if (!cssResponse.ok) throw new Error("mobile extension style failed to load");
									pendingStyleEtag = cssResponse.headers.get("etag") ?? void 0;
									pendingCss = await cssResponse.text();
									styleChange = "replace";
									if (refreshAborted(signal)) return false;
								}
							}
							const scriptUrl = typeof entry.scriptUrl === "string" ? entry.scriptUrl : void 0;
							if (scriptUrl === void 0) {
								if (refreshAborted(signal)) return false;
								commitStyle(entry.id, styleChange, pendingCss, pendingStyleEtag);
								activations.remove(entry.id);
								activeHostGenerations.delete(entry.id);
								scriptDigests.delete(entry.id);
								if (managedDefinitionIds.delete(entry.id)) definitions.delete(entry.id);
							} else {
								const scriptHeaders = {};
								const storedDigest = scriptDigests.get(entry.id);
								if (storedDigest !== void 0) scriptHeaders["if-none-match"] = storedDigest;
								const scriptResponse = await fetch(scriptUrl, {
									credentials: "same-origin",
									cache: "no-store",
									headers: scriptHeaders,
									signal
								});
								let nextDigest;
								if (scriptResponse.status !== 304) {
									if (!scriptResponse.ok) throw new Error("mobile extension script failed to load");
									const source = await scriptResponse.text();
									if (refreshAborted(signal)) return false;
									const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
									if (refreshAborted(signal)) return false;
									const key = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
									if (scriptDigests.get(entry.id) !== key) {
										previousDefinition = definitions.get(entry.id);
										try {
											expectedDefinitionId = entry.id;
											try {
												const script = element("script");
												script.textContent = `${source}\n//# sourceURL=dsh-mobile-extension-${entry.id}.js`;
												document.head.append(script);
												script.remove();
											} finally {
												expectedDefinitionId = void 0;
											}
											const nextDefinition = definitions.get(entry.id);
											if (nextDefinition === void 0 || nextDefinition === previousDefinition) throw new Error("mobile extension did not define its manifest id");
											evaluatedDefinition = true;
											nextDigest = key;
										} catch (error) {
											if (previousDefinition === void 0) definitions.delete(entry.id);
											else definitions.set(entry.id, previousDefinition);
											throw error;
										}
									}
								}
								const definition = definitions.get(entry.id);
								const commitGeneration = () => {
									commitStyle(entry.id, styleChange, pendingCss, pendingStyleEtag);
								};
								if (definition === void 0) throw new Error("mobile extension definition is unavailable");
								if (evaluatedDefinition || !activations.hasActive(entry.id) || activeHostGenerations.get(entry.id) !== entry.generation) {
									if (!await activateDefinition(definition, signal, commitGeneration, entry.generation)) throw new Error("mobile extension activation failed");
								} else {
									if (refreshAborted(signal)) return false;
									commitGeneration();
								}
								managedDefinitionIds.add(entry.id);
								if (nextDigest !== void 0) scriptDigests.set(entry.id, nextDigest);
							}
						} catch {
							if (evaluatedDefinition) {
								if (previousDefinition === void 0) definitions.delete(entry.id);
								else definitions.set(entry.id, previousDefinition);
							}
							failClosedExtensionGenerationReplacement(hadActiveGeneration, previousHostGeneration, entry.generation, () => {
								disposeManifestExtension(entry.id);
							});
							refreshComplete = false;
						}
					}
					if (refreshAborted(signal)) return false;
					if (refreshComplete) {
						publishAuthoritativeExtensionIds(manifestExtensionIds, seen, managedManifestIdSources(), disposeManifestExtension);
						manifestEtag = nextManifestEtag;
					} else manifestEtag = "";
					return refreshComplete;
				} catch {
					return false;
				}
			};
			started = true;
			for (const definition of definitions.values()) activateDefinition(definition);
			const stopRefresh = startLifecycleRefreshScheduler(async (signal) => {
				await refreshExtensions(signal);
			});
			const stopEvents = startExtensionChangeStream(() => {
				stopRefresh.refresh();
			}, void 0, (payload) => {
				if (document.hidden !== true) return;
				const parsed = parseTaskNotifyPayload(payload);
				if (parsed === void 0) return;
				const language = resolveNativeMobileLanguage(document.documentElement.lang, navigator.languages.length > 0 ? [...navigator.languages] : [navigator.language]);
				const label = (italian, english, chinese) => language === "it" ? italian : language === "zh" ? chinese : english;
				fireTaskNotifyEvent({
					kind: "done",
					title: label("Attività completata", "Task finished", "任务已完成"),
					body: label("Il tuo task DSH è terminato", "Your DSH task finished", "你的 DSH 任务已完成"),
					tag: taskCompletionTag(parsed.sessionId, parsed.turn)
				});
			});
			return () => {
				disposed = true;
				stopEvents();
				stopRefresh();
				started = false;
				legacyDispose?.();
				legacyDispose = void 0;
				legacyRoot?.remove();
				legacyRoot = void 0;
				legacyStyle.remove();
				activations.dispose();
				for (const node of styleNodes.values()) node.remove();
				styleNodes.clear();
				document.querySelector("[data-dsh-mobile-extension-layer]")?.remove();
				for (const host of document.querySelectorAll("[data-dsh-mobile-surface-host]")) host.remove();
				if (previous === void 0) delete window.dshMobile;
				else window.dshMobile = previous;
			};
		}
		async function refreshCssLegacy(style, signal, state) {
			try {
				const headers = {};
				if (state.etag !== "") headers["if-none-match"] = state.etag;
				if (state.modified !== "") headers["if-modified-since"] = state.modified;
				let response = await fetch("/mobile-access/custom.css", {
					credentials: "same-origin",
					cache: "no-store",
					headers,
					signal
				});
				if (response.status === 304 && style.textContent === "") {
					state.etag = "";
					state.modified = "";
					response = await fetch("/mobile-access/custom.css", {
						credentials: "same-origin",
						cache: "no-store",
						signal
					});
				}
				if (response.status === 304) return true;
				if (response.ok) {
					const nextEtag = response.headers.get("etag") ?? "";
					const nextModified = response.headers.get("last-modified") ?? "";
					const css = await response.text();
					if (refreshAborted(signal)) return false;
					style.textContent = css;
					state.etag = nextEtag;
					state.modified = nextModified;
					return true;
				}
				return false;
			} catch {
				return false;
			}
		}
		/** Theme-aware desktop Mobile Access panel styles. */
		const CONTROL_STYLES = `
.dsh-mobile-control{position:fixed;z-index:1000;left:16px;bottom:112px;font:14px/1.45 system-ui;color:var(--dsw-alias-label-primary,#16181d)}
.dsh-mobile-control__panel{box-sizing:border-box;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 140px);overflow-y:auto;padding:16px;border:1px solid var(--dsw-alias-border-subtle,#e1e5eb);border-radius:18px;background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 18px 50px rgb(15 23 42 / 18%)}
.dsh-mobile-control__header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.dsh-mobile-control__panel h2{margin:0;font-size:17px;line-height:24px}.dsh-mobile-control__header-actions{display:flex;align-items:center;gap:2px}.dsh-mobile-control__update-plugin,.dsh-mobile-control__diagnostic-entry,.dsh-mobile-control__close{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0;border:0;border-radius:10px;background:transparent;color:inherit;cursor:pointer}.dsh-mobile-control__update-plugin,.dsh-mobile-control__diagnostic-entry{padding:0 8px;color:#2563eb;font:650 12px/1 system-ui;white-space:nowrap}.dsh-mobile-control__update-plugin[hidden]{display:none}.dsh-mobile-control__update-plugin:disabled{cursor:wait;opacity:.55}.dsh-mobile-control__close{font-size:24px;line-height:1}.dsh-mobile-control__update-plugin:hover:not(:disabled),.dsh-mobile-control__diagnostic-entry:hover,.dsh-mobile-control__close:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f6)}
.dsh-mobile-control__release-notice{margin:-2px 0 10px;padding:8px 10px;border-radius:9px;background:var(--dsw-alias-bg-layer-1,#eff6ff);color:var(--dsw-alias-label-primary,#1d4ed8);font-size:11px;line-height:1.45}.dsh-mobile-control__release-notice.is-error{color:#dc2626}.dsh-mobile-control__release-notice[hidden]{display:none}.dsh-mobile-control__update-card{margin:0 0 10px;padding:11px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:12px;background:var(--dsw-alias-bg-layer-1,#f8fafc)}.dsh-mobile-control__update-card[hidden]{display:none}.dsh-mobile-control__update-card-title{margin:0 0 7px;color:var(--dsw-alias-label-primary,#16181d);font:650 13px/1.4 system-ui}.dsh-mobile-control__update-notes{display:block;box-sizing:border-box;max-height:150px;overflow-y:auto;margin:0 0 8px;padding:8px 10px;border:1px solid var(--dsw-alias-border-subtle,#e1e5eb);border-radius:9px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-secondary,#475569);white-space:pre-wrap;word-break:break-word;font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.dsh-mobile-control__update-notes[hidden]{display:none}.dsh-mobile-control__update-notice{margin:0 0 9px;padding:7px 9px;border-radius:8px;background:#fff4d6;color:#92400e;font-size:11px;line-height:1.5}.dsh-mobile-control__update-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px}.dsh-mobile-control__update-actions .dsh-mobile-control__primary,.dsh-mobile-control__update-actions .dsh-mobile-control__secondary{min-height:34px;padding:0 12px}.dsh-mobile-control__app-download{display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;min-height:38px;margin:0 0 10px;padding:8px 11px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:11px;background:var(--dsw-alias-bg-layer-1,#f7f8fa);color:var(--dsw-alias-label-primary,#16181d);font:600 12px/1.3 system-ui;text-decoration:none}.dsh-mobile-control__app-download[hidden]{display:none}.dsh-mobile-control__app-download::after{color:#2563eb;font-size:14px;content:"↗"}.dsh-mobile-control__app-download:hover{border-color:#9fb9e8;background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-bg-layer-2,#f5f8ff));color:var(--dsw-alias-label-primary,#1d4ed8)}
.dsh-mobile-control__switcher{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin:0 0 14px;padding:4px;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#f3f5f8)}.dsh-mobile-control__switcher[hidden]{display:none}.dsh-mobile-control__tab{min-height:36px;border:0;border-radius:9px;background:transparent;color:var(--dsw-alias-label-secondary,#606873);font:600 13px/1 system-ui;cursor:pointer}.dsh-mobile-control__tab.is-active{background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#16181d);box-shadow:0 1px 3px rgb(15 23 42 / 10%)}.dsh-mobile-control__view[hidden]{display:none}.dsh-mobile-control__intro{margin:0 0 12px;color:var(--dsw-alias-label-secondary,#606873);font-size:12px;line-height:1.55}.dsh-mobile-control__view.is-remote .dsh-mobile-control__actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dsh-mobile-control__view.is-remote .dsh-mobile-control__actions button[hidden]{display:none}
.dsh-mobile-control__provider-section{position:relative;margin:0 0 14px}.dsh-mobile-control__section-title{margin:0 0 8px;color:var(--dsw-alias-label-primary,#16181d);font:650 13px/1.4 system-ui}.dsh-mobile-control__provider-section>.dsh-mobile-control__section-title{padding-right:42px}.dsh-mobile-control__provider-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dsh-mobile-control__provider{display:flex;min-width:0;flex-direction:column;gap:6px;min-height:94px;padding:10px 11px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:13px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#16181d);text-align:left;cursor:pointer;touch-action:manipulation;transition:border-color 160ms ease,background-color 160ms ease,box-shadow 160ms ease}.dsh-mobile-control__provider:hover{border-color:#6f96db;background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-bg-layer-1,#f8fbff))}.dsh-mobile-control__provider.is-selected{border-color:#2563eb;background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-bg-layer-1,#f5f8ff));box-shadow:0 0 0 1px #2563eb inset}.dsh-mobile-control__provider:disabled{cursor:wait;opacity:.62}.dsh-mobile-control__provider-top{display:flex;min-width:0;align-items:flex-start;justify-content:space-between;gap:5px}.dsh-mobile-control__provider-top strong{min-width:0;font-size:12px;line-height:1.3}.dsh-mobile-control__provider-badge{flex:none;padding:2px 5px;border-radius:999px;background:#e8f0ff;color:#1d4ed8;font:650 9px/1.25 system-ui}.dsh-mobile-control__provider-badge.is-cpolar{background:#eaf8f2;color:#087454}.dsh-mobile-control__provider-description{color:var(--dsw-alias-label-secondary,#606873);font-size:10px;line-height:1.45}.dsh-mobile-control__provider-info{position:absolute;z-index:5;top:-13px;right:-8px}.dsh-mobile-control__provider-info-button{display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary,#475569);cursor:pointer;touch-action:manipulation}.dsh-mobile-control__provider-info-button:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f5f9);color:#2563eb}.dsh-mobile-control__provider-info-glyph{display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:18px;height:18px;border:1.5px solid currentColor;border-radius:50%;font:700 12px/1 system-ui}.dsh-mobile-control__provider-info-popover{position:absolute;z-index:6;top:38px;right:4px;box-sizing:border-box;width:min(292px,calc(100vw - 72px));padding:10px 12px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:12px;background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 10px 28px rgb(15 23 42 / 16%)}.dsh-mobile-control__provider-info-popover[hidden]{display:none}.dsh-mobile-control__provider-info-popover strong,.dsh-mobile-control__provider-info-popover span{display:block}.dsh-mobile-control__provider-info-popover strong{margin-bottom:3px;font-size:12px}.dsh-mobile-control__provider-info-popover span{color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.55}
.dsh-mobile-control__self-hosted{margin:8px 0 0;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:12px;background:var(--dsw-alias-bg-layer-1,#f8fafc)}.dsh-mobile-control__self-hosted-summary{display:flex;box-sizing:border-box;min-height:48px;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;cursor:pointer;list-style-position:inside}.dsh-mobile-control__self-hosted-summary>span:first-child{display:flex;min-width:0;flex-direction:column;gap:1px}.dsh-mobile-control__self-hosted-summary strong{font-size:11px}.dsh-mobile-control__self-hosted-summary span span{color:var(--dsw-alias-label-secondary,#606873);font-size:9px;line-height:1.35}.dsh-mobile-control__provider-badge.is-frp{background:#eef0f3;color:#475569}.dsh-mobile-control__self-hosted-body{padding:0 8px 8px}.dsh-mobile-control__provider.is-frp{width:100%;min-height:64px;background:var(--dsw-alias-bg-layer-2,#fff)}
.dsh-mobile-control__cpolar-setup{margin:0 0 12px;padding:12px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:13px;background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__cpolar-setup[hidden],.dsh-mobile-control__cpolar-account[hidden],.dsh-mobile-control__details[hidden],.dsh-mobile-control__view.is-remote .dsh-mobile-control__actions[hidden],.dsh-mobile-control__danger[hidden]{display:none}.dsh-mobile-control__component-status,.dsh-mobile-control__component-note{margin:0 0 10px;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.55}.dsh-mobile-control__cpolar-setup>.dsh-mobile-control__primary{width:100%;min-height:44px;padding:9px 12px;border-radius:10px;font:600 12px/1.3 system-ui;cursor:pointer}.dsh-mobile-control__cpolar-account{margin-top:10px}.dsh-mobile-control__link-row{display:flex;flex-wrap:wrap;gap:6px 12px;margin:0 0 10px}.dsh-mobile-control__text-link{color:#2563eb;font-size:11px;text-decoration:none}.dsh-mobile-control__text-link:hover{text-decoration:underline}.dsh-mobile-control__token-label{display:flex;flex-direction:column;gap:5px;margin:0 0 8px;color:var(--dsw-alias-label-secondary,#606873);font-size:11px}.dsh-mobile-control__token{box-sizing:border-box;width:100%;min-height:44px;padding:9px 10px;border:1px solid var(--dsw-alias-border-normal,#cfd5dd);border-radius:10px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2,#fff));color:var(--dsw-alias-label-primary,#16181d);font:16px/1.4 system-ui}.dsh-mobile-control__cpolar-connect{display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:100%;min-height:44px;padding:10px 14px;border-radius:12px;font:650 13px/1.2 system-ui;cursor:pointer;transition:background-color 160ms ease,border-color 160ms ease,opacity 160ms ease}.dsh-mobile-control__cpolar-connect:hover:not(:disabled){border-color:#1d4ed8;background:#1d4ed8}.dsh-mobile-control__cpolar-connect:active:not(:disabled){border-color:#1e40af;background:#1e40af}.dsh-mobile-control__cpolar-connect:disabled{cursor:wait;opacity:.55}.dsh-mobile-control__details{margin:10px 0 0;border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb);padding-top:9px}.dsh-mobile-control__details>summary{min-height:30px;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:30px;cursor:pointer}.dsh-mobile-control__details-body{display:flex;flex-wrap:wrap;align-items:center;gap:7px 12px;padding:4px 0}.dsh-mobile-control__details-body p{flex:1 0 100%;margin:0;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.5}.dsh-mobile-control__storage{display:block;flex:1 0 100%;max-width:100%;overflow:hidden;padding:7px 8px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#f3f5f8);color:var(--dsw-alias-label-secondary,#475569);font:10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;text-overflow:ellipsis;white-space:nowrap}.dsh-mobile-control__danger{flex:1 0 100%;min-height:38px;margin-top:3px;padding:7px 10px;border:1px solid #dc2626;border-radius:9px;background:transparent;color:#dc2626;font:12px/1.3 system-ui;cursor:pointer}
.dsh-mobile-control__frp-setup{margin:0;padding:12px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:13px;background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__frp-setup[hidden]{display:none}.dsh-mobile-control__frp-step{padding:11px 0}.dsh-mobile-control__frp-step + .dsh-mobile-control__frp-step{border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb)}.dsh-mobile-control__frp-step>strong{display:block;margin-bottom:3px;font-size:12px;line-height:1.4}.dsh-mobile-control__frp-step>p{margin:0 0 9px;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.5}.dsh-mobile-control__frp-changes{margin:0 0 9px;padding:0;list-style:none;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.5}.dsh-mobile-control__frp-changes li{position:relative;margin:0;padding-left:12px}.dsh-mobile-control__frp-changes li+li{margin-top:5px}.dsh-mobile-control__frp-changes li::before{content:"•";position:absolute;left:2px;color:var(--dsw-alias-label-tertiary,#98a1ad)}.dsh-mobile-control__frp-step>.dsh-mobile-control__frp-requirement{padding:8px 9px;border-radius:9px;background:var(--dsw-alias-bg-layer-1,#f3f5f8);color:var(--dsw-alias-label-primary,#384152);font-size:11px}.dsh-mobile-control__frp-fields{display:grid;grid-template-columns:minmax(0,1fr) 96px;gap:8px}.dsh-mobile-control__field{display:flex;min-width:0;flex-direction:column;gap:5px;color:var(--dsw-alias-label-secondary,#606873);font-size:11px}.dsh-mobile-control__field:nth-child(3),.dsh-mobile-control__field:nth-child(4){grid-column:1/-1}.dsh-mobile-control__field input{box-sizing:border-box;width:100%;min-height:44px;padding:9px 10px;border:1px solid var(--dsw-alias-border-normal,#cfd5dd);border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#16181d);font:16px/1.4 system-ui}.dsh-mobile-control__frp-action{box-sizing:border-box;width:100%;min-height:44px;padding:9px 12px;border-radius:10px;font:650 12px/1.3 system-ui;cursor:pointer}.dsh-mobile-control__frp-action:disabled{cursor:not-allowed;opacity:.5}.dsh-mobile-control__remote-workspace{margin:0;padding:12px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:15px;background:var(--dsw-alias-bg-layer-1,#f7f8fa)}.dsh-mobile-control__stage-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.dsh-mobile-control__stage-header .dsh-mobile-control__section-title{margin:0}.dsh-mobile-control__stage-meta{display:flex;min-width:0;align-items:center;justify-content:flex-end;gap:5px}.dsh-mobile-control__stage-value{max-width:115px;overflow:hidden;color:var(--dsw-alias-label-primary,#16181d);font:650 10px/1.3 system-ui;text-overflow:ellipsis;white-space:nowrap}.dsh-mobile-control__state-badge{flex:none;padding:3px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-secondary,#606873);font:650 9px/1.25 system-ui}.dsh-mobile-control__state-badge.is-ready{background:#e6f7f0;color:#087454}.dsh-mobile-control__state-badge.is-busy{background:#e8f0ff;color:#1d4ed8}.dsh-mobile-control__state-badge.is-attention{background:#fff4dc;color:#935100}.dsh-mobile-control__remote-workspace>.dsh-mobile-control__status{box-sizing:border-box;margin:0 0 10px;padding:9px 10px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fff);font-size:11px;line-height:1.45}.dsh-mobile-control__provider-setup-body{margin:0 0 10px}.dsh-mobile-control__provider-setup-body>.dsh-mobile-control__cpolar-setup{margin:0}.dsh-mobile-control__provider-setup-body>.dsh-mobile-control__cpolar-setup>.dsh-mobile-control__section-title,.dsh-mobile-control__provider-setup-body>.dsh-mobile-control__frp-setup>.dsh-mobile-control__section-title{display:none}.dsh-mobile-control__provider-setup-body>.dsh-mobile-control__details{margin:0;padding:9px 10px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:11px;background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__remote-workspace>.dsh-mobile-control__actions{margin-top:2px}.dsh-mobile-control__remote-workspace>.dsh-mobile-control__qr{margin:10px 0 0}.dsh-mobile-control__remote-workspace>.dsh-mobile-control__manage-row{margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb)}
.dsh-mobile-control__frp-overview{display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:10px;margin:0 0 10px;padding:10px;border:1px solid #a9dfc9;border-radius:11px;background:#edf9f4}.dsh-mobile-control__frp-overview[hidden]{display:none}.dsh-mobile-control__frp-overview-mark{display:grid;width:32px;height:32px;place-items:center;border-radius:50%;background:#087454;color:#fff;font:700 15px/1 system-ui}.dsh-mobile-control__frp-overview-body{display:flex;min-width:0;flex-direction:column;gap:2px}.dsh-mobile-control__frp-overview-body strong{color:#075d46;font-size:12px;line-height:1.35}.dsh-mobile-control__frp-overview-body span{overflow:hidden;color:#357061;font:10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;text-overflow:ellipsis;white-space:nowrap}.dsh-mobile-control__frp-group{margin:8px 0 0;overflow:hidden;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:11px;background:var(--dsw-alias-bg-layer-1,#f8fafc)}.dsh-mobile-control__frp-group>summary{box-sizing:border-box;min-height:44px;padding:12px 34px 10px 12px;color:var(--dsw-alias-label-primary,#16181d);font:650 12px/1.4 system-ui;cursor:pointer}.dsh-mobile-control__frp-group[open]>summary{border-bottom:1px solid var(--dsw-alias-border-subtle,#e1e5eb);background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__frp-group>.dsh-mobile-control__frp-step{padding:12px}.dsh-mobile-control__frp-group>.dsh-mobile-control__frp-step>strong:first-child{display:none}.dsh-mobile-control__frp-group .dsh-mobile-control__frp-step{border-top:0}.dsh-mobile-control__frp-setup>.dsh-mobile-control__frp-step{margin-bottom:8px;padding:10px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:11px;background:var(--dsw-alias-bg-layer-1,#f8fafc)}
.dsh-mobile-control__access{display:flex;align-items:baseline;gap:6px;min-width:0;margin:0 0 12px}.dsh-mobile-control__access[hidden]{display:none}.dsh-mobile-control__access-label{flex:none;color:var(--dsw-alias-label-secondary,#606873);white-space:nowrap}.dsh-mobile-control__access-label::after{content:"："}.dsh-mobile-control__access-link{min-width:0;overflow:hidden;color:#2563eb;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.dsh-mobile-control__access-link:hover{text-decoration:underline}.dsh-mobile-control__qr{display:flex;justify-content:center;margin:0 0 12px}.dsh-mobile-control__qr[hidden]{display:none}.dsh-mobile-control__qr img{border-radius:12px;background:#fff;padding:8px}
.dsh-mobile-control__status{margin:0 0 14px;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary,#606873)}.dsh-mobile-control__status::before{display:inline-block;width:8px;height:8px;margin-right:7px;border-radius:50%;background:#98a1ad;content:""}.dsh-mobile-control__status.is-running::before{background:#16a36a}.dsh-mobile-control__status.is-key{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-all}
.dsh-mobile-control__guide{margin:0 0 14px;padding:12px;border:1px solid #6f96db;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#eff6ff)}.dsh-mobile-control__guide[hidden]{display:none}.dsh-mobile-control__guide-title{margin:0;color:var(--dsw-alias-label-primary,#172554);font:650 13px/1.45 system-ui}.dsh-mobile-control__guide-summary,.dsh-mobile-control__guide-note{margin:4px 0 0;color:var(--dsw-alias-label-secondary,#475569);font-size:12px;line-height:1.5}.dsh-mobile-control__guide-steps{margin:8px 0 0;padding-left:20px;color:var(--dsw-alias-label-primary,#1e293b);font-size:12px;line-height:1.6}.dsh-mobile-control__guide-note{color:var(--dsw-alias-label-secondary,#64748b)}.dsh-mobile-control__guide-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.dsh-mobile-control__guide-actions button{min-width:0;min-height:44px;padding:8px;border-radius:10px;font:12px/1.25 system-ui;cursor:pointer}.dsh-mobile-control__guide-actions button:disabled{cursor:not-allowed;opacity:.45}
.dsh-mobile-control__extensions{margin:0 0 12px;color:var(--dsw-alias-label-secondary,#606873);font-size:12px}
.dsh-mobile-control__view.is-diagnostics{--dsh-diagnostic-ok:#087454;--dsh-diagnostic-warning:#a35b00;--dsh-diagnostic-error:#c62828;--dsh-diagnostic-info:#526071}.dsh-mobile-control__diagnostic-summary{box-sizing:border-box;margin:0;padding:13px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:16px;background:var(--dsw-alias-bg-layer-1,#f8fafc)}.dsh-mobile-control__diagnostic-summary-main{display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:11px}.dsh-mobile-control__diagnostic-summary-icon{position:relative;display:block;width:36px;height:36px;border-radius:50%;background:#e8edf3;color:var(--dsh-diagnostic-info)}.dsh-mobile-control__diagnostic-summary-icon::before,.dsh-mobile-control__diagnostic-summary-icon::after{position:absolute;content:""}.dsh-mobile-control__diagnostic-summary-body{display:flex;min-width:0;flex-direction:column;gap:2px}.dsh-mobile-control__diagnostic-summary-body strong{font-size:13px;line-height:1.35}.dsh-mobile-control__diagnostic-summary-body span{color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.5}.dsh-mobile-control__diagnostic-summary-meta{display:block;margin-top:11px;padding-top:9px;border-top:1px solid var(--dsw-alias-border-subtle,#dbe1e8);color:var(--dsw-alias-label-secondary,#606873);font-size:10px;line-height:1.45}.dsh-mobile-control__diagnostic-summary.is-ok .dsh-mobile-control__diagnostic-summary-icon{background:#e6f7f0;color:var(--dsh-diagnostic-ok)}.dsh-mobile-control__diagnostic-summary.is-ok .dsh-mobile-control__diagnostic-summary-icon::before{top:10px;left:10px;width:13px;height:7px;border-bottom:2px solid currentColor;border-left:2px solid currentColor;transform:rotate(-45deg)}.dsh-mobile-control__diagnostic-summary.is-attention .dsh-mobile-control__diagnostic-summary-icon{background:#fff4dc;color:var(--dsh-diagnostic-warning)}.dsh-mobile-control__diagnostic-summary.is-error .dsh-mobile-control__diagnostic-summary-icon{background:#fdecec;color:var(--dsh-diagnostic-error)}.dsh-mobile-control__diagnostic-summary.is-attention .dsh-mobile-control__diagnostic-summary-icon::before,.dsh-mobile-control__diagnostic-summary.is-error .dsh-mobile-control__diagnostic-summary-icon::before{top:8px;left:17px;width:2px;height:13px;border-radius:2px;background:currentColor}.dsh-mobile-control__diagnostic-summary.is-attention .dsh-mobile-control__diagnostic-summary-icon::after,.dsh-mobile-control__diagnostic-summary.is-error .dsh-mobile-control__diagnostic-summary-icon::after{bottom:8px;left:17px;width:2px;height:2px;border-radius:50%;background:currentColor}.dsh-mobile-control__diagnostic-summary.is-running .dsh-mobile-control__diagnostic-summary-icon{background:#e8f0ff;color:#2563eb}.dsh-mobile-control__diagnostic-summary.is-running .dsh-mobile-control__diagnostic-summary-icon::before{inset:9px;border:2px solid rgb(37 99 235 / 24%);border-top-color:currentColor;border-radius:50%;animation:dsh-diagnostic-spin .8s linear infinite}
.dsh-mobile-control__diagnostic-summary.is-idle .dsh-mobile-control__diagnostic-summary-icon::before{top:8px;left:17px;width:2px;height:2px;border-radius:50%;background:currentColor}.dsh-mobile-control__diagnostic-summary.is-idle .dsh-mobile-control__diagnostic-summary-icon::after{top:13px;left:17px;width:2px;height:11px;border-radius:2px;background:currentColor}
.dsh-mobile-control__diagnostic-toolbar{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}.dsh-mobile-control__diagnostic-toolbar.has-report{grid-template-columns:1fr 1fr}.dsh-mobile-control__diagnostic-run,.dsh-mobile-control__diagnostic-copy{box-sizing:border-box;width:100%;min-height:44px;padding:9px 10px;border-radius:11px;font:650 12px/1.3 system-ui;cursor:pointer;touch-action:manipulation}.dsh-mobile-control__diagnostic-copy[hidden]{display:none}.dsh-mobile-control__diagnostic-run:disabled{cursor:wait;opacity:.58}.dsh-mobile-control__diagnostic-feedback{margin:8px 0 0;padding:8px 10px;border-radius:9px;background:#eff6ff;color:#1d4ed8;font-size:11px;line-height:1.45}.dsh-mobile-control__diagnostic-feedback[hidden]{display:none}
.dsh-mobile-control__diagnostic-checks{display:grid;gap:12px;margin-top:12px;animation:dsh-diagnostic-reveal 160ms ease-out both}.dsh-mobile-control__diagnostic-checks[hidden]{display:none}.dsh-mobile-control__diagnostic-group{overflow:hidden;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:13px;background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__diagnostic-group-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 11px;border-bottom:1px solid var(--dsw-alias-border-subtle,#e1e5eb);background:var(--dsw-alias-bg-layer-1,#f8fafc)}.dsh-mobile-control__diagnostic-group-header h3{margin:0;font:650 11px/1.4 system-ui}.dsh-mobile-control__diagnostic-group-header span{color:var(--dsw-alias-label-secondary,#606873);font-size:10px}.dsh-mobile-control__diagnostic-list{display:flex;flex-direction:column}.dsh-mobile-control__diagnostic-check{display:grid;grid-template-columns:26px minmax(0,1fr);gap:9px;padding:11px;background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__diagnostic-check + .dsh-mobile-control__diagnostic-check{border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb)}.dsh-mobile-control__diagnostic-marker{position:relative;width:26px;height:26px;border-radius:50%;background:#edf1f5;color:var(--dsh-diagnostic-info)}.dsh-mobile-control__diagnostic-marker::before,.dsh-mobile-control__diagnostic-marker::after{position:absolute;content:""}.dsh-mobile-control__diagnostic-check.is-ok .dsh-mobile-control__diagnostic-marker{background:#e6f7f0;color:var(--dsh-diagnostic-ok)}.dsh-mobile-control__diagnostic-check.is-ok .dsh-mobile-control__diagnostic-marker::before{top:7px;left:7px;width:9px;height:5px;border-bottom:1.8px solid currentColor;border-left:1.8px solid currentColor;transform:rotate(-45deg)}.dsh-mobile-control__diagnostic-check.is-warning .dsh-mobile-control__diagnostic-marker{background:#fff4dc;color:var(--dsh-diagnostic-warning)}.dsh-mobile-control__diagnostic-check.is-error .dsh-mobile-control__diagnostic-marker{background:#fdecec;color:var(--dsh-diagnostic-error)}.dsh-mobile-control__diagnostic-check.is-warning .dsh-mobile-control__diagnostic-marker::before,.dsh-mobile-control__diagnostic-check.is-error .dsh-mobile-control__diagnostic-marker::before{top:6px;left:12px;width:2px;height:9px;border-radius:2px;background:currentColor}.dsh-mobile-control__diagnostic-check.is-warning .dsh-mobile-control__diagnostic-marker::after,.dsh-mobile-control__diagnostic-check.is-error .dsh-mobile-control__diagnostic-marker::after{bottom:6px;left:12px;width:2px;height:2px;border-radius:50%;background:currentColor}.dsh-mobile-control__diagnostic-check.is-info .dsh-mobile-control__diagnostic-marker::before{top:6px;left:12px;width:2px;height:2px;border-radius:50%;background:currentColor}.dsh-mobile-control__diagnostic-check.is-info .dsh-mobile-control__diagnostic-marker::after{top:10px;left:12px;width:2px;height:9px;border-radius:2px;background:currentColor}.dsh-mobile-control__diagnostic-check-body{min-width:0}.dsh-mobile-control__diagnostic-check-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.dsh-mobile-control__diagnostic-check-header strong{min-width:0;font-size:12px;line-height:1.4}.dsh-mobile-control__diagnostic-badge{flex:none;padding:2px 6px;border-radius:999px;background:#edf1f5;color:var(--dsh-diagnostic-info);font:650 10px/1.3 system-ui}.dsh-mobile-control__diagnostic-check.is-ok .dsh-mobile-control__diagnostic-badge{background:#e6f7f0;color:var(--dsh-diagnostic-ok)}.dsh-mobile-control__diagnostic-check.is-warning .dsh-mobile-control__diagnostic-badge{background:#fff4dc;color:var(--dsh-diagnostic-warning)}.dsh-mobile-control__diagnostic-check.is-error .dsh-mobile-control__diagnostic-badge{background:#fdecec;color:var(--dsh-diagnostic-error)}.dsh-mobile-control__diagnostic-check p{margin:4px 0 0;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;line-height:1.5;overflow-wrap:anywhere}.dsh-mobile-control__diagnostic-check .dsh-mobile-control__diagnostic-action{margin-top:7px;padding:7px 8px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#f8fafc);color:var(--dsw-alias-label-primary,#16181d)}.dsh-mobile-control__diagnostic-action span{display:inline-block;margin-right:6px;color:#2563eb;font-weight:700}.dsh-mobile-control__diagnostic-details{margin-top:12px}.dsh-mobile-control__diagnostic-details[hidden]{display:none}.dsh-mobile-control__diagnostic-details>summary{box-sizing:border-box;min-height:44px;line-height:44px}.dsh-mobile-control__diagnostic-report{box-sizing:border-box;max-height:220px;margin:4px 0 0;overflow:auto;padding:10px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:10px;background:var(--dsw-alias-bg-layer-1,#f3f5f8);color:var(--dsw-alias-label-secondary,#606873);font:10px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.dsh-mobile-control__diagnostic-checks{transition:opacity 150ms ease}.dsh-mobile-control__diagnostic-checks.is-refreshing{opacity:.52}
@keyframes dsh-diagnostic-spin{to{transform:rotate(360deg)}}@keyframes dsh-diagnostic-reveal{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.dsh-mobile-control__actions{display:flex;flex-wrap:nowrap;gap:6px}.dsh-mobile-control__actions button{flex:1 1 0;min-width:0;min-height:40px;padding:8px 4px;border-radius:10px;font:12px/1.2 system-ui;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dsh-mobile-control__secondary{border:1px solid var(--dsw-alias-border-normal,#cfd5dd);background:transparent;color:inherit}.dsh-mobile-control__primary{border:1px solid #2563eb;background:#2563eb;color:#fff}.dsh-mobile-control__actions button:disabled{cursor:not-allowed;opacity:.45}
.dsh-mobile-control button:focus-visible,.dsh-mobile-control a:focus-visible,.dsh-mobile-control input:focus-visible,.dsh-mobile-control summary:focus-visible{outline:3px solid rgb(37 99 235 / 28%);outline-offset:2px}
.dsh-mobile-control__trigger{box-sizing:border-box;flex:1 1 auto;display:flex;align-items:center;gap:8px;width:100%;height:42px;margin:4px 0;padding:0 10px 0 8px;border:0;border-radius:12px;background:transparent;color:var(--dsw-alias-label-primary,#16181d);font-family:inherit;font-size:14px;line-height:22px;cursor:pointer;overflow:hidden}.dsh-mobile-control__trigger:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f6)}.dsh-mobile-control__trigger:active,.dsh-mobile-control__trigger[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-active,#e8ebf0)}.dsh-mobile-control__trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,currentColor);outline-offset:2px}.dsh-mobile-control__trigger.is-rail{flex:0 0 auto;width:36px;height:36px;margin:8px 0 10px;padding:0;justify-content:center;gap:0;border-radius:50%}.dsh-mobile-control__trigger-icon{display:block;flex:none}.dsh-mobile-control__trigger-label{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dsh-mobile-control__manage-row{display:flex;justify-content:space-between;gap:8px;margin-top:10px}.dsh-mobile-control__manage{flex:1 1 0;min-width:0;min-height:34px;padding:6px 8px;border:1px solid var(--dsw-alias-border-normal,#cfd5dd);border-radius:10px;background:transparent;color:inherit;font:12px/1.3 system-ui;cursor:pointer}.dsh-mobile-control__devices{margin-top:10px;border:1px solid var(--dsw-alias-border-subtle,#e1e5eb);border-radius:10px;padding:8px;max-height:220px;overflow-y:auto}.dsh-mobile-control__device-empty{color:var(--dsw-alias-label-secondary,#606873);font-size:12px;margin:0}.dsh-mobile-control__device{display:flex;align-items:center;gap:8px;padding:6px 2px}.dsh-mobile-control__device + .dsh-mobile-control__device{border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb)}.dsh-mobile-control__device-label{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.dsh-mobile-control__device-meta{flex:none;color:var(--dsw-alias-label-secondary,#606873);font-size:11px;white-space:nowrap}.dsh-mobile-control__device-revoke{flex:none;min-height:28px;padding:4px 8px;border:1px solid #dc2626;border-radius:8px;background:transparent;color:#dc2626;font:12px/1.2 system-ui;cursor:pointer}.dsh-mobile-control__ws-paths{margin:10px 0 0;padding:12px;border:1px solid var(--dsw-alias-border-subtle,#dbe1e8);border-radius:13px;background:var(--dsw-alias-bg-layer-2,#fff)}.dsh-mobile-control__ws-paths-list{margin:0 0 8px;padding:0;list-style:none}.dsh-mobile-control__ws-paths-empty{color:var(--dsw-alias-label-secondary,#606873);font-size:12px}.dsh-mobile-control__ws-paths-item{display:flex;align-items:center;gap:8px;padding:6px 0}.dsh-mobile-control__ws-paths-item + .dsh-mobile-control__ws-paths-item{border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb)}.dsh-mobile-control__ws-paths-item code{flex:1 1 0;min-width:0;overflow:hidden;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;text-overflow:ellipsis;white-space:nowrap}.dsh-mobile-control__ws-paths-remove{flex:none;min-height:28px;padding:4px 8px;border:1px solid var(--dsw-alias-border-normal,#cfd5dd);border-radius:8px;background:transparent;color:inherit;font:12px/1.2 system-ui;cursor:pointer}.dsh-mobile-control__trigger,.dsh-mobile-control__diagnostic-entry{position:relative}.dsh-mobile-control__ws-dot{position:absolute;top:2px;right:2px;z-index:1;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#dc2626;color:#fff;font:650 10px/16px system-ui;text-align:center;cursor:pointer}.dsh-mobile-control__ws-dot::after{content:'';position:absolute;inset:-5px}.dsh-mobile-control__ws-sr-status{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}.dsh-mobile-control__ws-paths-row{display:flex;gap:8px}.dsh-mobile-control__ws-paths-row .dsh-mobile-control__primary{width:auto;flex:none;padding:9px 14px;border-radius:10px}.dsh-mobile-control__ws-paths-group{padding:6px 0}.dsh-mobile-control__ws-paths-group + .dsh-mobile-control__ws-paths-group{border-top:1px solid var(--dsw-alias-border-subtle,#e1e5eb)}.dsh-mobile-control__ws-paths-group-head{display:flex;align-items:center;gap:8px}.dsh-mobile-control__ws-count{flex:none;padding:1px 7px;border-radius:999px;background:#e8f0ff;color:#1d4ed8;font:650 10px/1.6 system-ui}.dsh-mobile-control__ws-paths-item.is-child{padding-left:12px}.dsh-mobile-control__ws-paths-group-head .dsh-mobile-control__primary,.dsh-mobile-control__ws-paths-item .dsh-mobile-control__primary{width:auto;flex:none;min-height:34px;padding:6px 12px;border-radius:10px}.dsh-mobile-control__ws-paths-row input{flex:1 1 0;min-width:0;box-sizing:border-box;min-height:44px;padding:9px 10px;border:1px solid var(--dsw-alias-border-normal,#cfd5dd);border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#16181d);font:16px/1.4 system-ui}.dsh-mobile-control__ws-paths-row button{flex:none}.dsh-mobile-control__ws-paths-detected-title{margin:0 0 2px;font:600 12px/1.4 system-ui}.dsh-mobile-control__ws-paths-advanced{margin-top:8px}.dsh-mobile-control__ws-paths-advanced summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#606873);font:12px/1.4 system-ui;user-select:none}.dsh-mobile-control__ws-paths-advanced summary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,currentColor);outline-offset:2px;border-radius:4px}.dsh-mobile-control__ws-paths-advanced[open] summary{margin-bottom:6px}.dsh-mobile-control__ws-paths-advanced .dsh-mobile-control__status{margin:6px 0 0}
@media (max-width:359px){.dsh-mobile-control__provider-choices{grid-template-columns:1fr}.dsh-mobile-control__provider{min-height:68px}}@media (prefers-reduced-motion:reduce){.dsh-mobile-control__provider,.dsh-mobile-control__cpolar-connect{transition:none}.dsh-mobile-control__diagnostic-summary.is-running .dsh-mobile-control__diagnostic-summary-icon::before,.dsh-mobile-control__diagnostic-checks{animation:none}}
`;
		/** Mount the desktop control or mobile feature enhancements. */
		function apply(ctx) {
			ctx.effect(() => {
				if (window.__DSH_MOBILE_FRONTEND__ !== "dedicated") return;
				return trustAuthenticatedGatewayConnection(ctx.get("connection"));
			}, "dsh-mobile: authenticated gateway client trust");
			ctx.effect(() => {
				const loopback = isLoopbackHost(location.hostname) && !new URLSearchParams(location.search).has("dsh-mobile-preview");
				const style = element("style");
				style.dataset.plugin = "dsh-mobile";
				style.textContent = loopback ? CONTROL_STYLES : NATIVE_MOBILE_STYLES;
				document.head.append(style);
				if (!loopback) {
					const removeCustom = installCustomAssets();
					const removeSurface = installDshLanguageBoundSurface(installNativeMobileSurface);
					return () => {
						removeCustom();
						removeSurface();
						style.remove();
					};
				}
				const removeControl = installDshLanguageBoundSurface(() => {
					const control = installControl();
					const triggerLocale = selectedMobileControlLocale();
					const t = controlTranslator(triggerLocale);
					const disposeSlot = ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
						name: "sidebar.footer.action",
						id: "dsh-mobile"
					}, ({ wide }) => (0, react.createElement)("button", {
						"aria-expanded": control.isOpen(),
						"aria-controls": CONTROL_PANEL_ID,
						"aria-label": t("mobileAccess"),
						className: `dsh-mobile-control__trigger${wide ? "" : " is-rail"}`,
						lang: triggerLocale,
						type: "button",
						title: t("mobileAccess"),
						onClick: control.toggle
					}, (0, react.createElement)("svg", {
						"aria-hidden": true,
						className: "dsh-mobile-control__trigger-icon",
						focusable: false,
						width: wide ? 16 : 18,
						height: wide ? 16 : 18,
						viewBox: "0 0 16 16",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: 1.5,
						strokeLinecap: "round",
						strokeLinejoin: "round"
					}, (0, react.createElement)("rect", {
						x: 4,
						y: 1,
						width: 8,
						height: 14,
						rx: 2
					}), (0, react.createElement)("path", { d: "M7 12h2" })), wide ? (0, react.createElement)("span", { className: "dsh-mobile-control__trigger-label" }, t("mobileAccess")) : void 0)));
					return () => {
						disposeSlot();
						control.remove();
					};
				});
				return () => {
					removeControl();
					style.remove();
				};
			}, "dsh-mobile: stock mobile adaptation and local control");
		}
		/** Client services required by the mobile adaptation. */
		const inject = ["slots"];
		//#endregion
		exports.CONTROL_STYLES = CONTROL_STYLES;
		exports.DIAGNOSTIC_REASON_MESSAGES = DIAGNOSTIC_REASON_MESSAGES;
		exports.MOBILE_CONTROL_MESSAGES = MOBILE_CONTROL_MESSAGES;
		exports.PerIdActivationLifecycle = PerIdActivationLifecycle;
		exports.apply = apply;
		exports.bindClientResponseLifetime = bindClientResponseLifetime;
		exports.clientReleaseInfo = clientReleaseInfo;
		exports.combineClientSignalLifetime = combineClientSignalLifetime;
		exports.combineClientSignals = combineClientSignals;
		exports.createFrpServerTemplateForClipboard = createFrpServerTemplateForClipboard;
		exports.diagnosticEntriesForRender = diagnosticEntriesForRender;
		exports.diagnosticOverallForChecks = diagnosticOverallForChecks;
		exports.diagnosticServerCopy = diagnosticServerCopy;
		exports.extensionAssetUrl = extensionAssetUrl;
		exports.extensionGenerationHeaders = extensionGenerationHeaders;
		exports.extensionRouteUrl = extensionRouteUrl;
		exports.failClosedExtensionGenerationReplacement = failClosedExtensionGenerationReplacement;
		exports.handleMissingExtensionManifest = handleMissingExtensionManifest;
		exports.inject = inject;
		exports.installDshLanguageBoundSurface = installDshLanguageBoundSurface;
		exports.normalizeDiagnosticOverall = normalizeDiagnosticOverall;
		exports.normalizeDiagnosticStatus = normalizeDiagnosticStatus;
		exports.parseMobileExtensionManifest = parseMobileExtensionManifest;
		exports.publishAuthoritativeExtensionIds = publishAuthoritativeExtensionIds;
		exports.reconcileRemovedExtensions = reconcileRemovedExtensions;
		exports.registerUniqueDisposable = registerUniqueDisposable;
		exports.renderDiagnosticPayloadSafely = renderDiagnosticPayloadSafely;
		exports.selectMobileControlLocale = selectMobileControlLocale;
		exports.selectedMobileControlLocale = selectedMobileControlLocale;
		exports.startExtensionChangeStream = startExtensionChangeStream;
		exports.startLifecycleRefreshScheduler = startLifecycleRefreshScheduler;
		exports.trustAuthenticatedGatewayConnection = trustAuthenticatedGatewayConnection;
		exports.validateDiagnosticChecks = validateDiagnosticChecks;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
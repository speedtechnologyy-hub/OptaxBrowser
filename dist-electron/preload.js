//#region electron/preload.ts
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
	navigate: (url) => ipcRenderer.send("navigate", url),
	goBack: () => ipcRenderer.send("go-back"),
	goForward: () => ipcRenderer.send("go-forward"),
	reload: () => ipcRenderer.send("reload"),
	createTab: (url) => ipcRenderer.send("create-tab", url),
	switchTab: (id) => ipcRenderer.send("switch-tab", id),
	closeTab: (id) => ipcRenderer.send("close-tab", id),
	getHistory: () => ipcRenderer.invoke("get-history"),
	importBrowserData: (browser) => ipcRenderer.invoke("import-browser-data", browser),
	importFromFile: () => ipcRenderer.invoke("import-from-file"),
	onTabCreated: (callback) => {
		const listener = (_event, tab) => callback(tab);
		ipcRenderer.on("tab-created", listener);
		return () => ipcRenderer.removeListener("tab-created", listener);
	},
	onTabUpdated: (callback) => {
		const listener = (_event, tab) => callback(tab);
		ipcRenderer.on("tab-updated", listener);
		return () => ipcRenderer.removeListener("tab-updated", listener);
	},
	onDownloadUpdated: (callback) => {
		const listener = (_event, download) => callback(download);
		ipcRenderer.on("download-updated", listener);
		return () => ipcRenderer.removeListener("download-updated", listener);
	},
	onDownloadsCleared: (callback) => {
		const listener = () => callback();
		ipcRenderer.on("downloads-cleared", listener);
		return () => ipcRenderer.removeListener("downloads-cleared", listener);
	},
	onInternalPage: (callback) => {
		const listener = (_event, page) => callback(page);
		ipcRenderer.on("open-internal-page", listener);
		return () => ipcRenderer.removeListener("open-internal-page", listener);
	},
	onFocusUrl: (callback) => {
		const listener = () => callback();
		ipcRenderer.on("focus-url", listener);
		return () => ipcRenderer.removeListener("focus-url", listener);
	},
	onRequestCloseTab: (callback) => {
		const listener = (_event, id) => callback(id);
		ipcRenderer.on("request-close-tab", listener);
		return () => ipcRenderer.removeListener("request-close-tab", listener);
	},
	onTabSwitched: (callback) => {
		const listener = (_event, id) => callback(id);
		ipcRenderer.on("tab-switched", listener);
		return () => ipcRenderer.removeListener("tab-switched", listener);
	},
	setPanelState: (rightWidth) => ipcRenderer.send("set-panel-state", { rightWidth }),
	setInternalPageActive: (active) => ipcRenderer.send("set-internal-page-active", active),
	setSidebarWidth: (width) => ipcRenderer.send("set-sidebar-width", width),
	setHeaderHeight: (height) => ipcRenderer.send("set-header-height", height),
	setMenuOpen: (open) => ipcRenderer.send("set-menu-open", open),
	setFavEditOpen: (open) => ipcRenderer.send("set-fav-edit-open", open),
	getDevExtensions: () => ipcRenderer.invoke("get-dev-extensions"),
	showFavPopup: (items, x, y) => ipcRenderer.invoke("show-fav-popup", {
		items,
		x,
		y
	}),
	showFavEditPopup: (url, name, isFavorite) => ipcRenderer.invoke("show-fav-edit-popup", {
		url,
		name,
		isFavorite
	}),
	onFavEditResult: (cb) => {
		ipcRenderer.on("fav-edit-result", (_e, data) => cb(data));
		return () => ipcRenderer.removeAllListeners("fav-edit-result");
	},
	onNavigateTo: (cb) => {
		ipcRenderer.on("navigate-to", (_e, url) => cb(url));
		return () => ipcRenderer.removeAllListeners("navigate-to");
	},
	onOpenFavoritesPanel: (cb) => {
		ipcRenderer.on("open-favorites-panel", () => cb());
		return () => ipcRenderer.removeAllListeners("open-favorites-panel");
	},
	showOxMenu: () => ipcRenderer.invoke("show-ox-menu"),
	onOxMenuClosed: (cb) => {
		ipcRenderer.on("ox-menu-closed", () => cb());
		return () => ipcRenderer.removeAllListeners("ox-menu-closed");
	},
	onCreateNewTab: (cb) => {
		ipcRenderer.on("create-new-tab", () => cb());
		return () => ipcRenderer.removeAllListeners("create-new-tab");
	},
	onReopenClosedTab: (cb) => {
		ipcRenderer.on("reopen-closed-tab", () => cb());
		return () => ipcRenderer.removeAllListeners("reopen-closed-tab");
	},
	onOpenDownloadsPanel: (cb) => {
		ipcRenderer.on("open-downloads-panel", () => cb());
		return () => ipcRenderer.removeAllListeners("open-downloads-panel");
	},
	onOpenHistoryPanel: (cb) => {
		ipcRenderer.on("open-history-panel", () => cb());
		return () => ipcRenderer.removeAllListeners("open-history-panel");
	},
	getLoadedExtensions: () => ipcRenderer.invoke("get-loaded-extensions"),
	getPinnedExtensions: () => ipcRenderer.invoke("get-pinned-extensions"),
	setPinnedExtensions: (ids) => ipcRenderer.send("set-pinned-extensions", ids),
	onPinnedExtensionsUpdated: (cb) => {
		ipcRenderer.on("pinned-extensions-updated", (_, ids) => cb(ids));
		return () => ipcRenderer.removeAllListeners("pinned-extensions-updated");
	},
	onExtensionInstalled: (cb) => {
		ipcRenderer.on("extension-installed", (_, info) => cb(info));
		return () => ipcRenderer.removeAllListeners("extension-installed");
	},
	onExtensionInstalling: (cb) => {
		ipcRenderer.on("extension-installing", (_, info) => cb(info));
		return () => ipcRenderer.removeAllListeners("extension-installing");
	},
	windowControl: (action) => ipcRenderer.send("window-control", action),
	send: (channel, ...args) => ipcRenderer.send(channel, ...args),
	invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
//#endregion

import { app, BrowserWindow, ipcMain, WebContentsView, session, Menu, MenuItem, shell, dialog } from 'electron'
import Store from 'electron-store'
import fs from 'fs'
import path from 'path'
import os from 'os'
import https from 'https'

const store = new Store()

// ── AUTO UPDATER ──────────────────────────────────────────────────────────────
// Só ativa em produção (não no dev)
let autoUpdater: any = null
if (!process.env.VITE_DEV_SERVER_URL) {
  try {
    const updaterModule = require('electron-updater')
    autoUpdater = updaterModule.autoUpdater
    autoUpdater.autoDownload = true          // Baixa automaticamente em background
    autoUpdater.autoInstallOnAppQuit = true  // Instala quando o usuário fechar o app
  } catch (e) {
    console.log('electron-updater not available:', e)
  }
}

let mainWindow: BrowserWindow | null = null
const tabs = new Map<string, WebContentsView>()
let activeTabId: string | null = null
let sidebarWidth = 240
let secondaryView: WebContentsView | null = null
let secondaryId: string | null = null
let rightPanelWidth = 0
let isInternalPageActive = false
let splitRatio = 0.5
let headerHeight = 42 // updated dynamically when favbar shows/hides
// Menu overlay handled via setIgnoreMouseEvents on webview

const isViewSafe = (view: any): view is WebContentsView => view && !view.webContents.isDestroyed()
const isWindowSafe = () => mainWindow && !mainWindow.isDestroyed()

function createTabView(id: string, url: string = 'https://google.com') {
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  tabs.set(id, view)

  view.webContents.on('did-finish-load', () => {
    if (isWindowSafe()) {
      mainWindow!.webContents.send('tab-updated', {
        id, url: view.webContents.getURL(), title: view.webContents.getTitle(),
      })
    }

    // ── CHROME WEB STORE INTERCEPTOR ─────────────────────────────────────
    try {
      const pageUrl = view.webContents.getURL()
      if (pageUrl.includes('chrome.google.com/webstore') || pageUrl.includes('chromewebstore.google.com')) {
        // First expose the install function
        view.webContents.executeJavaScript(`
          window.__optaxInstall = (extId, extName) => {
            return window.electronAPI?.invoke('install-webstore-extension', { extId, extName }) || Promise.resolve({ success: false, error: 'API não disponível' });
          };
        `).catch(() => {})

        const interceptScript = `
          (function() {
            if (window.__optaxInjected) return;
            window.__optaxInjected = true;

            const BTN_ID = '__optax_install_btn__';
            const TOAST_ID = '__optax_toast__';

            function getExtId() {
              const match = location.href.match(/(?:detail\\/[^\\/]+\\/|[?&]id=)([a-z]{32})/);
              return match ? match[1] : null;
            }

            function getExtName() {
              const h1 = document.querySelector('h1');
              return h1 ? h1.textContent.trim() : 'Extensão';
            }

            function clearEl(el) { while(el.firstChild) el.removeChild(el.firstChild); }

            function showToast(msg, isError, isLoading) {
              let toast = document.getElementById(TOAST_ID);
              if (!toast) {
                toast = document.createElement('div');
                toast.id = TOAST_ID;
                toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#1a1a2e;border:1px solid rgba(168,85,247,0.5);border-radius:14px;padding:14px 18px;color:white;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.6);display:flex;align-items:center;gap:10px;min-width:280px;';
                const style = document.createElement('style');
                style.textContent = '@keyframes optaxSpin{to{transform:rotate(360deg)}}';
                (document.head || document.documentElement).appendChild(style);
                document.body.appendChild(toast);
              }
              clearEl(toast);
              toast.style.borderColor = isError ? 'rgba(248,113,113,0.5)' : isLoading ? 'rgba(168,85,247,0.5)' : 'rgba(74,222,128,0.5)';

              const icon = document.createElement('div');
              if (isLoading) {
                icon.style.cssText = 'width:18px;height:18px;border:2px solid #a855f7;border-top-color:transparent;border-radius:50%;animation:optaxSpin 0.8s linear infinite;flex-shrink:0;';
              } else {
                icon.textContent = isError ? '✗' : '✓';
                icon.style.cssText = 'font-size:18px;font-weight:bold;color:' + (isError ? '#f87171' : '#4ade80') + ';flex-shrink:0;';
              }
              toast.appendChild(icon);

              const textDiv = document.createElement('div');
              const label = document.createElement('div');
              label.style.cssText = 'font-weight:700;font-size:13px;color:' + (isError ? '#f87171' : isLoading ? '#a855f7' : '#4ade80');
              label.textContent = isLoading ? 'Opta X — Instalando...' : (isError ? 'Erro na instalação' : 'Instalada com sucesso!');
              textDiv.appendChild(label);
              const detail = document.createElement('div');
              detail.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;';
              detail.textContent = msg;
              textDiv.appendChild(detail);
              toast.appendChild(textDiv);
              return toast;
            }

            async function installExt() {
              const extId = getExtId();
              const extName = getExtName();
              if (!extId) return;

              const btn = document.getElementById(BTN_ID);
              if (btn) { btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none'; }

              showToast('Instalando ' + extName + '...', false, true);

              try {
                const result = await window.__optaxInstall(extId, extName);
                if (result && result.success) {
                  showToast(extName + ' instalada com sucesso!', false, false);
                  if (btn) { btn.textContent = '✓ Instalada'; btn.style.background = 'rgba(74,222,128,0.15)'; btn.style.color = '#4ade80'; btn.style.border = '1px solid rgba(74,222,128,0.4)'; }
                } else {
                  const errMsg = result?.error || 'Falha na instalação';
                  showToast(errMsg, true, false);
                  if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
                }
              } catch(e) {
                showToast('Erro: ' + (e.message || 'desconhecido'), true, false);
                if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
              }
              setTimeout(() => { const t = document.getElementById(TOAST_ID); if(t) t.remove(); }, 8000);
            }

            function injectButton() {
              if (document.getElementById(BTN_ID)) return;
              const extId = getExtId();
              if (!extId) return;

              // Find the "Usar no Chrome" button area to place ours next to it
              const existingBtn = Array.from(document.querySelectorAll('button')).find(b =>
                b.textContent.includes('Usar no Chrome') || b.textContent.includes('Add to Chrome') || b.textContent.includes('Adicionar')
              );

              const btn = document.createElement('button');
              btn.id = BTN_ID;
              btn.textContent = '⬇ Instalar no Opta X';
              btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;border:none;border-radius:24px;font-size:14px;font-weight:600;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 2px 12px rgba(168,85,247,0.4);transition:all 0.2s;margin-left:8px;';
              btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; btn.style.boxShadow = '0 4px 20px rgba(168,85,247,0.6)'; };
              btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 2px 12px rgba(168,85,247,0.4)'; };
              btn.onclick = installExt;

              if (existingBtn && existingBtn.parentNode) {
                existingBtn.parentNode.insertBefore(btn, existingBtn.nextSibling);
              } else {
                // Fallback: add as floating button
                btn.style.cssText += 'position:fixed;top:80px;right:20px;z-index:2147483647;';
                document.body.appendChild(btn);
              }
            }

            const observer = new MutationObserver(() => injectButton());
            observer.observe(document.body, { childList: true, subtree: true });
            injectButton();
            setTimeout(injectButton, 800);
            setTimeout(injectButton, 2000);
          })();
        `
        view.webContents.executeJavaScript(interceptScript).catch(() => {})
      }
    } catch (e) {}
    // ── AUTOFILL DE SENHAS ────────────────────────────────────────────────
    try {
      const pageUrl = view.webContents.getURL()
      if (!pageUrl || !pageUrl.startsWith('http')) return
      const passwords: any[] = store.get('saved_passwords', []) as any[]
      if (!passwords || passwords.length === 0) return
      let pageHost = ''
      try { pageHost = new URL(pageUrl).hostname.replace(/^www\./, '') } catch { return }
      if (!pageHost) return
      const matches = passwords.filter((p: any) => {
        if (!p || !p.url) return false
        try { return new URL(p.url).hostname.replace(/^www\./, '') === pageHost } catch { return false }
      })
      if (matches.length === 0) return

      const matchesJson = JSON.stringify(matches)
      const script = `
        (function() {
          const matches = ${matchesJson};

          function fillWith(cred) {
            try {
              const inputs = Array.from(document.querySelectorAll('input'));
              let userField = null, passField = null;
              inputs.forEach(inp => {
                const t = (inp.type || '').toLowerCase();
                const n = ((inp.name||'') + (inp.id||'') + (inp.autocomplete||'')).toLowerCase();
                if (!passField && t === 'password') passField = inp;
                if (!userField && (t === 'email' || t === 'text' || n.includes('user') || n.includes('email') || n.includes('login'))) userField = inp;
              });
              if (userField && passField) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(userField, cred.username);
                userField.dispatchEvent(new Event('input', { bubbles: true }));
                userField.dispatchEvent(new Event('change', { bubbles: true }));
                setter.call(passField, cred.password);
                passField.dispatchEvent(new Event('input', { bubbles: true }));
                passField.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            } catch(e) {}
            return false;
          }

          function showPicker(passField) {
            // Remove existing picker
            const old = document.getElementById('__optax_picker__');
            if (old) old.remove();

            const rect = passField.getBoundingClientRect();
            const picker = document.createElement('div');
            picker.id = '__optax_picker__';
            picker.style.cssText = \`
              position: fixed;
              left: \${rect.left}px;
              top: \${rect.bottom + 4}px;
              min-width: \${Math.max(rect.width, 280)}px;
              max-width: 360px;
              background: #1a1a1f;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.8);
              z-index: 2147483647;
              overflow: hidden;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            \`;

            const header = document.createElement('div');
            header.style.cssText = 'padding: 8px 12px; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.06);';
            header.textContent = 'Senhas salvas — Opta X';
            picker.appendChild(header);

            // Scrollable container for items
            const itemsContainer = document.createElement('div');
            itemsContainer.style.cssText = 'max-height: 280px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent;';
            picker.appendChild(itemsContainer);

            matches.forEach((cred, i) => {
              const item = document.createElement('div');
              item.style.cssText = \`
                display: flex; align-items: center; gap: 10px;
                padding: 10px 12px; cursor: pointer;
                transition: background 0.1s;
                border-bottom: \${i < matches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'};
              \`;
              item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.06)';
              item.onmouseleave = () => item.style.background = 'transparent';

              const avatar = document.createElement('div');
              avatar.style.cssText = 'width: 28px; height: 28px; border-radius: 50%; background: rgba(168,85,247,0.2); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #a855f7; flex-shrink: 0;';
              avatar.textContent = (cred.username[0] || '?').toUpperCase();

              const info = document.createElement('div');
              info.style.cssText = 'flex: 1; min-width: 0;';
              const user = document.createElement('div');
              user.style.cssText = 'font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
              user.textContent = cred.username;
              const pass = document.createElement('div');
              pass.style.cssText = 'font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px;';
              pass.textContent = '••••••••';
              info.appendChild(user);
              info.appendChild(pass);

              item.appendChild(avatar);
              item.appendChild(info);
              item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                picker.remove();
                fillWith(cred);
              });
              itemsContainer.appendChild(item);
            });

            document.body.appendChild(picker);
            document.addEventListener('mousedown', (e) => {
              if (!picker.contains(e.target)) picker.remove();
            }, { once: true });
          }

          function tryAttach() {
            try {
              const inputs = Array.from(document.querySelectorAll('input'));
              let userField = null, passField = null;
              inputs.forEach(inp => {
                const t = (inp.type || '').toLowerCase();
                const n = ((inp.name||'') + (inp.id||'') + (inp.autocomplete||'')).toLowerCase();
                if (!passField && t === 'password') passField = inp;
                if (!userField && (t === 'email' || t === 'text' || n.includes('user') || n.includes('email') || n.includes('login'))) userField = inp;
              });

              if (userField && passField) {
                if (matches.length === 1) {
                  // Só uma conta — preenche direto
                  fillWith(matches[0]);
                } else {
                  // Múltiplas contas — mostra picker ao focar no campo
                  userField.addEventListener('focus', () => showPicker(userField), { once: false });
                  passField.addEventListener('focus', () => showPicker(passField), { once: false });
                  // Mostra imediatamente se o campo já está em foco
                  if (document.activeElement === userField || document.activeElement === passField) {
                    showPicker(userField);
                  }
                }
                return true;
              }
            } catch(e) {}
            return false;
          }

          if (!tryAttach()) {
            setTimeout(tryAttach, 800);
            setTimeout(tryAttach, 2500);
          }
        })();
      `
      view.webContents.executeJavaScript(script).catch(() => {})
    } catch (e) {}
  })

  view.webContents.on('did-navigate', (_: any, navigateUrl: string) => {
    const title = view.webContents.getTitle()
    if (isWindowSafe()) mainWindow!.webContents.send('tab-updated', { id, url: navigateUrl, title })
    addToHistory(navigateUrl, title || 'Opta X')
  })

  view.webContents.on('did-navigate-in-page', (_: any, navigateUrl: string, isMainFrame: boolean) => {
    if (!isMainFrame) return
    const title = view.webContents.getTitle()
    if (isWindowSafe()) mainWindow!.webContents.send('tab-updated', { id, url: navigateUrl, title })
    addToHistory(navigateUrl, title || 'Opta X')
  })

  view.webContents.on('page-favicon-updated', (_: any, favicons: string[]) => {
    if (isWindowSafe()) mainWindow!.webContents.send('tab-updated', { id, favicon: favicons[0] })
  })

  view.webContents.on('did-start-loading', () => {
    if (isWindowSafe()) mainWindow!.webContents.send('tab-updated', { id, loading: true })
  })

  view.webContents.on('did-stop-loading', () => {
    if (isWindowSafe()) mainWindow!.webContents.send('tab-updated', { id, loading: false })
  })

  view.webContents.on('page-title-updated', (_: any, title: string) => {
    if (isWindowSafe()) mainWindow!.webContents.send('tab-updated', { id, title })
  })

  view.webContents.on('before-input-event', (event: any, input: any) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        view.webContents.openDevTools({ mode: 'detach' }); event.preventDefault()
      }
      if ((input.control && input.key.toLowerCase() === 'r') || input.key === 'F5') {
        view.webContents.reload(); event.preventDefault()
      }
      if (input.control && input.key.toLowerCase() === 'l') {
        if (isWindowSafe()) mainWindow!.webContents.send('focus-url'); event.preventDefault()
      }
      if (input.control && input.key.toLowerCase() === 't') {
        const newId = Date.now().toString()
        createTabView(newId)
        if (isWindowSafe()) mainWindow!.webContents.send('tab-created', { id: newId, active: true })
        event.preventDefault()
      }
    }
  })

  view.webContents.on('context-menu', (_e: any, params: any) => {
    const menu = new Menu()
    menu.append(new MenuItem({ label: 'Voltar', enabled: view.webContents.canGoBack(), click: () => view.webContents.goBack() }))
    menu.append(new MenuItem({ label: 'Avançar', enabled: view.webContents.canGoForward(), click: () => view.webContents.goForward() }))
    menu.append(new MenuItem({ label: 'Recarregar', click: () => view.webContents.reload() }))
    menu.append(new MenuItem({ type: 'separator' }))
    if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Desfazer', role: 'undo' }))
      menu.append(new MenuItem({ label: 'Refazer', role: 'redo' }))
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ label: 'Cortar', role: 'cut' }))
      menu.append(new MenuItem({ label: 'Copiar', role: 'copy' }))
      menu.append(new MenuItem({ label: 'Colar', role: 'paste' }))
    } else {
      menu.append(new MenuItem({ label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy }))
    }
    if (params.linkURL) {
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ label: 'Abrir link em nova aba', click: () => {
        const newId = Date.now().toString()
        createTabView(newId, params.linkURL)
        if (isWindowSafe()) mainWindow!.webContents.send('tab-created', { id: newId, active: true })
      }}))
    }
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(new MenuItem({ label: 'Inspecionar', click: () => view.webContents.inspectElement(params.x, params.y) }))
    menu.popup()
  })

  view.webContents.session.on('will-download', (_event: any, item: any) => {
    const downloadId = Date.now().toString()
    const savePath = path.join(app.getPath('downloads'), item.getFilename())
    item.setSavePath(savePath)
    const downloadInfo = { id: downloadId, filename: item.getFilename(), url: item.getURL(), totalBytes: item.getTotalBytes(), receivedBytes: 0, state: 'progressing', savePath }
    const all: any[] = (store.get('downloads', []) as any[])
    store.set('downloads', [downloadInfo, ...all].slice(0, 200))
    if (isWindowSafe()) mainWindow!.webContents.send('download-updated', downloadInfo)
    item.on('updated', (_: any, state: string) => {
      const updated = { ...downloadInfo, state, receivedBytes: item.getReceivedBytes() }
      if (isWindowSafe()) mainWindow!.webContents.send('download-updated', updated)
    })
    item.once('done', (_: any, state: string) => {
      const done = { ...downloadInfo, state, receivedBytes: item.getTotalBytes() }
      const current: any[] = (store.get('downloads', []) as any[])
      const idx = current.findIndex((d: any) => d.id === downloadId)
      if (idx > -1) { current[idx] = done; store.set('downloads', current) }
      else store.set('downloads', [done, ...current].slice(0, 200))
      if (isWindowSafe()) mainWindow!.webContents.send('download-updated', done)
    })
  })

  try { view.webContents.loadURL(url) } catch (err) { console.error(err) }
  return view
}

const updateViewBounds = () => {
  if (!isWindowSafe()) return
  const [width, height] = mainWindow!.getContentSize()
  const y = headerHeight  // dynamic: 42 base + 28 favbar
  const x = sidebarWidth
  const w = width - x - rightPanelWidth
  const h = height - y

  if (isInternalPageActive || tabs.size === 0) {
    tabs.forEach(v => { if (isViewSafe(v)) v.setBounds({ x: 0, y: 0, width: 0, height: 0 }) })
    if (isViewSafe(secondaryView)) secondaryView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    return
  }

  const activeView = activeTabId ? tabs.get(activeTabId) : null
  if (secondaryView && isViewSafe(secondaryView) && activeView && isViewSafe(activeView)) {
    const splitX = Math.floor(w * splitRatio)
    activeView.setBounds({ x, y, width: splitX, height: h })
    secondaryView.setBounds({ x: x + splitX, y, width: w - splitX, height: h })
  } else if (activeView && isViewSafe(activeView)) {
    activeView.setBounds({ x, y, width: w, height: h })
    tabs.forEach((v, id) => { if (id !== activeTabId && isViewSafe(v)) v.setBounds({ x: 0, y: 0, width: 0, height: 0 }) })
  }
}

// ── IMPORTAÇÃO REAL DE FAVORITOS ──────────────────────────────────────────────
function readChromeBookmarks(profilePath: string): any[] {
  const bookmarksFile = path.join(profilePath, 'Bookmarks')
  if (!fs.existsSync(bookmarksFile)) return []
  try {
    const data = JSON.parse(fs.readFileSync(bookmarksFile, 'utf-8'))
    const results: any[] = []
    const walk = (node: any) => {
      if (node.type === 'url') results.push({ url: node.url, title: node.name })
      if (node.children) node.children.forEach(walk)
    }
    Object.values(data.roots || {}).forEach((r: any) => walk(r))
    return results
  } catch { return [] }
}

function readChromeHistory(profilePath: string): any[] {
  // Chrome history is SQLite — sem acesso direto no sandbox, retorna vazio
  return []
}

function getChromePath(): string {
  return path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default')
}

function getEdgePath(): string {
  return path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default')
}

function getBrowserData(browser: string): { bookmarks: any[], history: any[] } {
  let profilePath = ''
  if (browser === 'chrome') profilePath = getChromePath()
  else if (browser === 'edge') profilePath = getEdgePath()
  else return { bookmarks: [], history: [] }

  return {
    bookmarks: readChromeBookmarks(profilePath),
    history: readChromeHistory(profilePath),
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function createWindow() {
  // Override user agent to Chrome so Web Store and other sites work correctly
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.234 Safari/537.36'
  session.defaultSession.setUserAgent(chromeUA)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    backgroundColor: '#0d0d0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('resize', updateViewBounds)

  // ── AUTO UPDATER EVENTS ───────────────────────────────────────────────────
  if (autoUpdater && isWindowSafe) {
    // Verifica atualizações 5 segundos após abrir (não trava o startup)
    setTimeout(() => {
      try { autoUpdater.checkForUpdatesAndNotify() } catch (e) {}
    }, 5000)

    autoUpdater.on('update-available', (info: any) => {
      if (isWindowSafe()) {
        mainWindow!.webContents.send('update-available', {
          version: info.version,
          releaseDate: info.releaseDate
        })
      }
    })

    autoUpdater.on('update-downloaded', (info: any) => {
      if (isWindowSafe()) {
        mainWindow!.webContents.send('update-downloaded', {
          version: info.version
        })
      }
    })

    autoUpdater.on('error', (err: any) => {
      console.log('Auto updater error:', err?.message)
    })
  }

  ipcMain.on('install-update', () => {
    if (autoUpdater) {
      try { autoUpdater.quitAndInstall() } catch (e) {}
    }
  })

  // Save session (open tabs) when window closes
  mainWindow.on('close', () => {
    const sessionTabs: any[] = []
    tabs.forEach((view, id) => {
      if (isViewSafe(view)) {
        try {
          const url = view.webContents.getURL()
          const title = view.webContents.getTitle()
          if (url && url !== 'about:blank' && !url.startsWith('opta://')) {
            sessionTabs.push({ id, url, title })
          }
        } catch {}
      }
    })
    if (sessionTabs.length > 0) {
      store.set('lastSession', sessionTabs)
    }
  })

  // Reload saved dev extensions
  const savedDevExts: string[] = store.get('devExtensions', []) as string[]
  savedDevExts.forEach(async (extPath: string) => {
    try {
      if (fs.existsSync(extPath)) {
        await session.defaultSession.loadExtension(extPath, { allowFileAccess: true })
      }
    } catch(e) { console.error('Failed to reload extension:', extPath, e) }
  })

  mainWindow.webContents.once('did-finish-load', () => {
    // Read startup preference saved by SettingsPage
    const settings: any = store.get('appSettings', {})
    const startupMode: string = settings.startupMode || 'newtab'
    const startupUrl: string = settings.startupUrl || 'https://google.com'
    const lastSession: any[] = store.get('lastSession', []) as any[]

    const openTabs = (startupMode === 'continue' && lastSession.length > 0)
      ? lastSession
      : startupMode === 'specific'
        ? [{ id: Date.now().toString(), url: startupUrl, title: '' }]
        : [{ id: Date.now().toString(), url: 'https://google.com', title: 'Google' }]

    openTabs.forEach((tabInfo: any, index: number) => {
      const id = tabInfo.id || Date.now().toString() + index
      const view = createTabView(id, tabInfo.url || 'https://google.com')
      if (index === 0) {
        activeTabId = id
        mainWindow!.contentView.addChildView(view)
        updateViewBounds()
      }
      setTimeout(() => {
        if (isWindowSafe()) {
          mainWindow!.webContents.send('tab-created', {
            id,
            active: index === 0,
            url: tabInfo.url || 'https://google.com',
            title: tabInfo.title || ''
          })
          if (index > 0) {
            mainWindow!.contentView.addChildView(view)
          }
        }
      }, 100 + index * 50)
    })
  })

  // ── IPC HANDLERS ────────────────────────────────────────────────────────────

  ipcMain.on('window-control', (_: any, action: string) => {
    if (!isWindowSafe()) return
    switch (action) {
      case 'close': mainWindow!.close(); break
      case 'minimize': mainWindow!.minimize(); break
      case 'maximize':
        if (mainWindow!.isMaximized()) mainWindow!.unmaximize()
        else mainWindow!.maximize()
        break
      case 'restart': app.relaunch(); app.exit(); break
      case 'new-window': createWindow(); break
    }
  })

  ipcMain.on('create-tab', (_: any, url?: string) => {
    const id = Date.now().toString()
    createTabView(id, url)
    if (isWindowSafe()) mainWindow!.webContents.send('tab-created', { id, active: true })
  })

  ipcMain.on('switch-tab', (_: any, id: string) => {
    if (activeTabId === id) return
    const newView = tabs.get(id)
    if (isViewSafe(newView) && isWindowSafe()) {
      const oldView = activeTabId ? tabs.get(activeTabId) : null
      if (oldView && oldView !== secondaryView) {
        try { mainWindow!.contentView.removeChildView(oldView) } catch (e) {}
      }
      activeTabId = id
      if (!mainWindow!.contentView.children.includes(newView)) mainWindow!.contentView.addChildView(newView)
      updateViewBounds()
    }
  })

  ipcMain.on('close-tab', (_: any, id: string) => {
    const view = tabs.get(id)
    if (view) {
      if (isWindowSafe()) { try { mainWindow!.contentView.removeChildView(view) } catch (e) {} }
      if (!view.webContents.isDestroyed()) view.webContents.destroy()
      tabs.delete(id)
    }
    if (activeTabId === id) activeTabId = null
    if (secondaryId === id) { secondaryId = null; secondaryView = null }

    if (tabs.size === 0) {
      const newId = Date.now().toString()
      createTabView(newId)
      if (isWindowSafe()) mainWindow!.webContents.send('tab-created', { id: newId, active: true })
    } else if (!activeTabId) {
      const nextId = tabs.keys().next().value
      if (nextId) {
        activeTabId = nextId
        const nextView = tabs.get(nextId)!
        if (isWindowSafe()) {
          mainWindow!.contentView.addChildView(nextView)
          updateViewBounds()
          mainWindow!.webContents.send('tab-switched', nextId)
        }
      }
    }
    updateViewBounds()
  })

  ipcMain.on('navigate', (_: any, url: string) => {
    let finalUrl = url
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('opta://')) {
      finalUrl = finalUrl.includes('.') && !finalUrl.includes(' ') ? `https://${finalUrl}` : `https://google.com/search?q=${encodeURIComponent(finalUrl)}`
    }
    if (!activeTabId || !tabs.has(activeTabId)) {
      const id = Date.now().toString(); createTabView(id, finalUrl); return
    }
    const view = tabs.get(activeTabId)
    if (isViewSafe(view)) view.webContents.loadURL(finalUrl)
  })

  ipcMain.on('set-split-view', (_: any, { id, enabled }: { id: string | null, enabled: boolean }) => {
    if (enabled && id && tabs.has(id)) {
      secondaryId = id; secondaryView = tabs.get(id)!
      if (isWindowSafe() && !mainWindow!.contentView.children.includes(secondaryView)) mainWindow!.contentView.addChildView(secondaryView)
    } else {
      if (secondaryView && isWindowSafe()) { try { mainWindow!.contentView.removeChildView(secondaryView) } catch (e) {} }
      secondaryView = null; secondaryId = null
    }
    updateViewBounds()
  })

  ipcMain.on('resize-split-view', (_: any, ratio: number) => { splitRatio = ratio; updateViewBounds() })
  ipcMain.on('set-sidebar-width', (_: any, width: number) => { sidebarWidth = width; updateViewBounds() })

  // FIX OX BUTTON: React informa altura real do header (header+favbar) para posicionar a WebContentsView corretamente
  // Sem isso, a WebContentsView cobre o botão OX e bloqueia os cliques
  ipcMain.on('set-header-height', (_: any, height: number) => {
    headerHeight = height
    updateViewBounds()
  })

  // OX menu: when menu opens, make the WebContentsView ignore mouse events
  // so clicks pass through to the React overlay rendered in the BrowserWindow
  ipcMain.on('set-menu-open', (_: any, open: boolean) => {
    tabs.forEach(view => {
      if (isViewSafe(view)) {
        // forward: true — mouse events still reach the webview for hover effects
        // but click events pass through to the window when we set ignore
        try { view.webContents.setIgnoreMenuShortcuts(false) } catch {}
      }
    })
    if (isWindowSafe()) {
      // Set ignore mouse events on all views so clicks reach BrowserWindow overlay
      tabs.forEach(view => {
        if (isViewSafe(view)) {
          try {
            (view as any).setIgnoreMouseEvents(open, { forward: open })
          } catch {}
        }
      })
    }
  })

  ipcMain.on('set-favorites-dropdown', (_: any, _open: boolean) => { /* no-op */ })
  ipcMain.on('set-fav-edit-open', (_: any, _open: boolean) => { /* no-op */ })
  ipcMain.on('set-panel-state', (_: any, { rightWidth }: { rightWidth: number }) => { rightPanelWidth = rightWidth; updateViewBounds() })
  ipcMain.on('set-internal-page-active', (_: any, active: boolean) => { isInternalPageActive = active; updateViewBounds() })

  // Persist settings from SettingsPage
  ipcMain.on('save-setting', (_: any, settings: any) => {
    store.set('appSettings', settings)
  })

  ipcMain.on('save-passwords', (_: any, passwords: any[]) => {
    store.set('saved_passwords', passwords)
  })

  ipcMain.handle('get-history', () => {
    const histPath = path.join(app.getPath('userData'), 'history.json')
    if (fs.existsSync(histPath)) return JSON.parse(fs.readFileSync(histPath, 'utf-8'))
    return []
  })

  ipcMain.on('clear-history', () => {
    const histPath = path.join(app.getPath('userData'), 'history.json')
    try { fs.writeFileSync(histPath, '[]') } catch (e) {}
  })

  ipcMain.handle('get-all-downloads', () => store.get('downloads', []))

  ipcMain.on('download-action', (_: any, { action }: { id: string, action: string }) => {
    if (action === 'clear-history') {
      store.set('downloads', [])
      if (isWindowSafe()) mainWindow!.webContents.send('downloads-cleared')
    }
  })

  // ── IMPORTAÇÃO REAL ──────────────────────────────────────────────────────────
  ipcMain.handle('import-browser-data', (_: any, browser: string) => {
    try {
      const data = getBrowserData(browser)
      return data
    } catch {
      return { bookmarks: [], history: [] }
    }
  })

  // Importação via arquivo JSON/HTML
  ipcMain.handle('import-from-file', async () => {
    if (!isWindowSafe()) return { bookmarks: [], error: 'no window' }
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Selecionar arquivo de favoritos',
      filters: [
        { name: 'Favoritos', extensions: ['html', 'json'] },
        { name: 'Todos os arquivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { bookmarks: [], canceled: true }

    const filePath = result.filePaths[0]
    const ext = path.extname(filePath).toLowerCase()
    const content = fs.readFileSync(filePath, 'utf-8')
    const bookmarks: any[] = []

    try {
      if (ext === '.json') {
        const parsed = JSON.parse(content)
        // Suporta formato Netscape (array) ou objeto Chrome
        if (Array.isArray(parsed)) {
          parsed.forEach((b: any) => { if (b.url) bookmarks.push({ url: b.url, title: b.title || b.url }) })
        } else if (parsed.roots) {
          const walk = (node: any) => {
            if (node.type === 'url') bookmarks.push({ url: node.url, title: node.name })
            if (node.children) node.children.forEach(walk)
          }
          Object.values(parsed.roots).forEach((r: any) => walk(r))
        }
      } else if (ext === '.html') {
        // Netscape bookmark format (exportado pelo Chrome/Firefox/Edge)
        const matches = content.matchAll(/<A HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi)
        for (const m of matches) {
          bookmarks.push({ url: m[1], title: m[2] })
        }
      }
    } catch (e) {
      return { bookmarks: [], error: String(e) }
    }

    return { bookmarks, history: [] }
  })
  // ─────────────────────────────────────────────────────────────────────────────

  ipcMain.on('open-devtools', () => {
    if (activeTabId && isViewSafe(tabs.get(activeTabId))) {
      tabs.get(activeTabId)!.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // FIX: muta aba antes de fechar para parar áudio/vídeo
  ipcMain.on('mute-tab', (_: any, id: string) => {
    const view = tabs.get(id)
    if (isViewSafe(view)) {
      try { view.webContents.setAudioMuted(true) } catch (e) {}
    }
  })

  // Favorites overflow dropdown as a real Electron window
  let favPopup: BrowserWindow | null = null

  ipcMain.handle('show-fav-popup', async (_: any, { items, x, y }: { items: any[], x: number, y: number }) => {
    if (favPopup && !favPopup.isDestroyed()) { favPopup.close(); favPopup = null; return }
    
    favPopup = new BrowserWindow({
      width: 220,
      height: Math.min(items.length * 36 + 48, 400),
      x: Math.round(x - 220),
      y: Math.round(y),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    const itemsHtml = items.map(item => {
      const hostname = (() => { try { return new URL(item.url).hostname.replace('www.','') } catch { return item.url } })()
      const name = item.name || hostname
      const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`
      return `<div class="item" onclick="navigate('${item.url.replace(/'/g, "\'")}')" title="${item.url}">
        <img src="${favicon}" onerror="this.style.display='none'" />
        <span>${name}</span>
      </div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background:transparent; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
      .menu { background:#1a1a22; border:1px solid rgba(255,255,255,0.1); border-radius:12px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.8); }
      .item { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; color:rgba(255,255,255,0.65); font-size:12px; }
      .item:hover { background:rgba(255,255,255,0.06); color:white; }
      .item img { width:14px; height:14px; border-radius:2px; flex-shrink:0; }
      .item span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .footer { border-top:1px solid rgba(255,255,255,0.06); padding:6px 8px; }
      .manage { display:block; width:100%; padding:6px 8px; background:none; border:none; color:rgba(255,255,255,0.35); font-size:11px; cursor:pointer; text-align:left; border-radius:8px; }
      .manage:hover { background:rgba(255,255,255,0.05); color:white; }
    </style></head><body>
    <div class="menu">
      <div>${itemsHtml}</div>
      <div class="footer"><button class="manage" onclick="manage()">Gerenciar favoritos</button></div>
    </div>
    <script>
      const { ipcRenderer } = require('electron')
      function navigate(url) { ipcRenderer.send('fav-popup-navigate', url) }
      function manage() { ipcRenderer.send('fav-popup-manage') }
      window.addEventListener('blur', () => ipcRenderer.send('fav-popup-close'))
    </script></body></html>`

    favPopup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    favPopup.on('closed', () => { favPopup = null })
    favPopup.show()
    favPopup.focus()
    return true
  })

  ipcMain.on('fav-popup-navigate', (_: any, url: string) => {
    if (isWindowSafe()) mainWindow!.webContents.send('navigate-to', url)
    if (favPopup && !favPopup.isDestroyed()) { favPopup.close(); favPopup = null }
  })

  ipcMain.on('fav-popup-manage', () => {
    if (isWindowSafe()) mainWindow!.webContents.send('open-favorites-panel')
    if (favPopup && !favPopup.isDestroyed()) { favPopup.close(); favPopup = null }
  })

  ipcMain.on('fav-popup-close', () => {
    if (favPopup && !favPopup.isDestroyed()) { favPopup.close(); favPopup = null }
  })

  // Favorite edit dialog as real Electron window
  let favEditPopup: BrowserWindow | null = null

  ipcMain.handle('show-fav-edit-popup', async (_: any, { url, name, isFavorite }: { url: string, name: string, isFavorite: boolean }) => {
    if (favEditPopup && !favEditPopup.isDestroyed()) { favEditPopup.close(); favEditPopup = null }
    
    const [winW, winH] = mainWindow!.getContentSize()
    
    favEditPopup = new BrowserWindow({
      width: 320,
      height: 320,
      x: Math.round(winW - 330),
      y: 46,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background:#1e1e28; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden; color:#e0e0f0; }
      .header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px 14px; border-bottom:1px solid rgba(255,255,255,0.06); }
      .header-left { display:flex; align-items:center; gap:10px; }
      .star { color:#facc15; font-size:16px; }
      .title { font-size:14px; font-weight:700; }
      .close { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; font-size:18px; line-height:1; padding:4px 6px; border-radius:6px; }
      .close:hover { background:rgba(255,255,255,0.1); color:white; }
      .body { padding:16px 20px; display:flex; flex-direction:column; gap:12px; }
      label { font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em; }
      input { width:100%; padding:8px 12px; background:#141420; border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:#e0e0f0; font-size:12px; outline:none; }
      input:focus { border-color:rgba(99,102,241,0.6); }
      .folder { width:100%; padding:8px 12px; background:#141420; border:1px solid rgba(255,255,255,0.08); border-radius:10px; color:rgba(255,255,255,0.4); font-size:12px; display:flex; align-items:center; gap:8px; }
      .actions { display:flex; gap:8px; padding:0 20px 20px; }
      .btn-remove { padding:8px 16px; border-radius:10px; border:1px solid rgba(239,68,68,0.3); background:none; color:#f87171; font-size:12px; font-weight:700; cursor:pointer; }
      .btn-remove:hover { background:rgba(239,68,68,0.1); }
      .btn-save { flex:1; padding:8px; border-radius:10px; border:none; background:#2563eb; color:white; font-size:12px; font-weight:700; cursor:pointer; }
      .btn-save:hover { background:#1d4ed8; }
    </style></head><body>
      <div class="header">
        <div class="header-left"><span class="star">★</span><span class="title">Editar favorito</span></div>
        <button class="close" onclick="close()">×</button>
      </div>
      <div class="body">
        <div>
          <label>Nome</label>
          <input id="name" type="text" value="${name.replace(/"/g, '&quot;')}" autofocus />
        </div>
        <div>
          <label>URL</label>
          <input id="url" type="text" value="${url.replace(/"/g, '&quot;')}" />
        </div>
        <div>
          <label>Pasta</label>
          <div class="folder">📁 Barra de favoritos</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn-remove" onclick="remove()">Remover</button>
        <button class="btn-save" onclick="save()">Salvar</button>
      </div>
      <script>
        const { ipcRenderer } = require('electron')
        function save() {
          ipcRenderer.send('fav-edit-save', { oldUrl: '${url.replace(/'/g, "\'")}', name: document.getElementById('name').value, newUrl: document.getElementById('url').value })
          window.close()
        }
        function remove() {
          ipcRenderer.send('fav-edit-remove', '${url.replace(/'/g, "\'")}')
          window.close()
        }
        function close() { window.close() }
        document.addEventListener('keydown', e => { if(e.key==='Enter') save(); if(e.key==='Escape') close() })
        document.getElementById('name').focus()
        document.getElementById('name').select()
      </script>
    </body></html>`

    favEditPopup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    favEditPopup.show()
    favEditPopup.focus()
    return true
  })

  ipcMain.on('fav-edit-save', (_: any, { oldUrl, name, newUrl }: { oldUrl: string, name: string, newUrl: string }) => {
    if (isWindowSafe()) mainWindow!.webContents.send('fav-edit-result', { action: 'save', oldUrl, name, newUrl })
    if (favEditPopup && !favEditPopup.isDestroyed()) { favEditPopup.close(); favEditPopup = null }
  })

  ipcMain.on('fav-edit-remove', (_: any, url: string) => {
    if (isWindowSafe()) mainWindow!.webContents.send('fav-edit-result', { action: 'remove', oldUrl: url })
    if (favEditPopup && !favEditPopup.isDestroyed()) { favEditPopup.close(); favEditPopup = null }
  })

  // ── CHROME WEB STORE CRX INSTALLER ────────────────────────────────────────

  async function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const doGet = (getUrl: string, depth = 0) => {
        if (depth > 5) { reject(new Error('Too many redirects')); return }
        https.get(getUrl, { headers: { 'User-Agent': chromeUA } }, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            doGet(res.headers.location, depth + 1); return
          }
          if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
          const file = fs.createWriteStream(dest)
          res.pipe(file)
          file.on('finish', () => { file.close(); resolve() })
          file.on('error', reject)
        }).on('error', reject).setTimeout(20000, function() { this.destroy(); reject(new Error('Timeout')) })
      }
      doGet(url)
    })
  }

  async function installCrxFromWebStore(extId: string, extName: string): Promise<{success: boolean, error?: string}> {
    const userData = app.getPath('userData')
    const crxFile = path.join(userData, `${extId}.crx`)
    const extDir = path.join(userData, 'extensions', extId)
    try {
      // Use https directly with Chrome headers
      const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0.6099.234&acceptformat=crx3,crx2&x=id%3D${extId}%26uc&nacl_arch=x86-64&prodchannel=stable`

      await new Promise<void>((resolve, reject) => {
        const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.234 Safari/537.36'
        
        const doRequest = (url: string, depth = 0) => {
          if (depth > 5) { reject(new Error('Muitos redirecionamentos')); return }
          const urlObj = new URL(url)
          const mod = urlObj.protocol === 'https:' ? require('https') : require('http')
          const req = mod.get(url, {
            headers: {
              'User-Agent': chromeUA,
              'Accept': '*/*',
              'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
            }
          }, (res: any) => {
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
              doRequest(res.headers.location, depth + 1)
              return
            }
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}`))
              return
            }
            const chunks: Buffer[] = []
            res.on('data', (c: Buffer) => chunks.push(c))
            res.on('end', () => {
              const buf = Buffer.concat(chunks)
              fs.writeFileSync(crxFile, buf)
              resolve()
            })
            res.on('error', reject)
          })
          req.on('error', reject)
          req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')) })
        }
        doRequest(crxUrl)
      })

      const crxData = fs.readFileSync(crxFile)
      console.log(`[CRX] Downloaded ${crxData.length} bytes for ${extId}`)
      
      if (crxData.length < 1000) {
        fs.unlink(crxFile, () => {})
        return { success: false, error: `Download incompleto (${crxData.length} bytes) — extensão pode não estar disponível` }
      }

      let zipStart = -1
      for (let i = 0; i < crxData.length - 4; i++) {
        if (crxData[i] === 0x50 && crxData[i+1] === 0x4B && crxData[i+2] === 0x03 && crxData[i+3] === 0x04) { zipStart = i; break }
      }
      if (zipStart < 0) { fs.unlink(crxFile, () => {}); return { success: false, error: 'Formato CRX inválido' } }

      const zipFile = crxFile.replace('.crx', '.zip')
      fs.writeFileSync(zipFile, crxData.slice(zipStart))
      if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true })

      const { execSync } = require('child_process')
      try {
        if (process.platform === 'win32') execSync(`powershell -Command "Expand-Archive -Path '${zipFile}' -DestinationPath '${extDir}' -Force"`, { timeout: 30000 })
        else execSync(`unzip -o "${zipFile}" -d "${extDir}"`, { timeout: 30000 })
      } catch (e: any) {
        fs.unlink(zipFile, () => {})
        fs.unlink(crxFile, () => {})
        return { success: false, error: `Erro ao extrair: ${e.message}` }
      }

      fs.unlink(zipFile, () => {})
      fs.unlink(crxFile, () => {})

      if (!fs.existsSync(path.join(extDir, 'manifest.json'))) return { success: false, error: 'manifest.json não encontrado após extração' }

      await session.defaultSession.loadExtension(extDir, { allowFileAccess: true })
      const saved: string[] = store.get('devExtensions', []) as string[]
      if (!saved.includes(extDir)) store.set('devExtensions', [...saved, extDir])
      if (isWindowSafe()) mainWindow!.webContents.send('extension-installed', { id: extId, name: extName })
      return { success: true }
    } catch (e: any) {
      console.error(`[CRX] Error:`, e.message)
      try { fs.unlink(crxFile, () => {}) } catch {}
      return { success: false, error: e.message }
    }
  }

  ipcMain.handle('install-webstore-extension', async (_: any, { extId, extName }: { extId: string, extName: string }) => {
    console.log(`[CRX] Starting install of ${extName} (${extId})`)
    if (isWindowSafe()) mainWindow!.webContents.send('extension-installing', { id: extId, name: extName })
    const result = await installCrxFromWebStore(extId, extName)
    console.log(`[CRX] Result:`, JSON.stringify(result))
    if (isWindowSafe()) mainWindow!.webContents.send('extension-install-result', { ...result, name: extName })
    return result
  })

  ipcMain.handle('open-extension-popup', async (_: any, { extId }: { extId: string }) => {
    try {
      const allExts = session.defaultSession.getAllExtensions()
      const ext = allExts.find((e: any) => e.id === extId)
      if (!ext) return { success: false }

      const manifest = ext.manifest || {}
      const popupPath = manifest.browser_action?.default_popup || manifest.action?.default_popup

      if (!popupPath) return { success: false, error: 'Extensão não tem popup' }

      const popupUrl = `chrome-extension://${extId}/${popupPath}`
      const [winW] = mainWindow!.getContentSize()
      const winBounds = mainWindow!.getBounds()

      const popup = new BrowserWindow({
        width: 380,
        height: 500,
        x: winBounds.x + winW - 400,
        y: winBounds.y + 80,
        frame: false,
        alwaysOnTop: true,
        resizable: true,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          session: session.defaultSession
        }
      })

      popup.loadURL(popupUrl)
      popup.on('blur', () => popup.close())
      popup.show()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('get-loaded-extensions', async () => {
    try {
      const allExts = session.defaultSession.getAllExtensions()
      const savedPaths: string[] = store.get('devExtensions', []) as string[]

      return allExts.map((ext: any) => {
        let iconUrl = ''
        let resolvedName = ext.name || 'Extensão'

        try {
          const manifest = ext.manifest || {}

          // Resolve _MSG_ name from _locales
          let extPath = ext.path || savedPaths.find(p => {
            try {
              const m = JSON.parse(fs.readFileSync(path.join(p, 'manifest.json'), 'utf-8'))
              return m.name === ext.name || m.name === resolvedName
            } catch { return false }
          }) || ''

          // If name starts with __MSG_, resolve it
          if (resolvedName.startsWith('__MSG_') && extPath) {
            const msgKey = resolvedName.replace(/__MSG_|__/g, '')
            for (const locale of ['pt_BR', 'pt', 'en', 'en_US']) {
              try {
                const msgFile = path.join(extPath, '_locales', locale, 'messages.json')
                if (fs.existsSync(msgFile)) {
                  const msgs = JSON.parse(fs.readFileSync(msgFile, 'utf-8'))
                  const found = msgs[msgKey] || msgs[msgKey.toLowerCase()]
                  if (found?.message) { resolvedName = found.message; break }
                }
              } catch {}
            }
            // Still __MSG_? try manifest directly
            if (resolvedName.startsWith('__MSG_')) {
              resolvedName = manifest.description || extPath.split(path.sep).pop() || 'Extensão'
            }
          }

          if (extPath) {
            const iconSources = [manifest.icons, manifest.browser_action?.default_icon, manifest.action?.default_icon]
            let iconPath = ''
            for (const src of iconSources) {
              if (!src) continue
              if (typeof src === 'string') { iconPath = src; break }
              if (typeof src === 'object') {
                iconPath = src['128'] || src['64'] || src['48'] || src['32'] || src['16'] || ''
                if (iconPath) break
              }
            }
            if (!iconPath) {
              for (const name of ['icon128.png', 'icon48.png', 'icon32.png', 'icon.png', 'images/icon128.png']) {
                if (fs.existsSync(path.join(extPath, name))) { iconPath = name; break }
              }
            }
            if (iconPath) {
              const absPath = path.join(extPath, iconPath.replace(/^\//, ''))
              if (fs.existsSync(absPath)) {
                const imgData = fs.readFileSync(absPath)
                const ext2 = path.extname(absPath).toLowerCase().replace('.', '')
                const mime = ext2 === 'svg' ? 'image/svg+xml' : 'image/png'
                iconUrl = `data:${mime};base64,${imgData.toString('base64')}`
              }
            }
          }
        } catch (e) {}

        return { id: ext.id, name: resolvedName, version: ext.manifest?.version || '', iconUrl }
      })
    } catch { return [] }
  })

  ipcMain.on('set-pinned-extensions', (_: any, ids: string[]) => {
    store.set('pinnedExtensions', ids)
    if (isWindowSafe()) mainWindow!.webContents.send('pinned-extensions-updated', ids)
  })

  ipcMain.handle('get-pinned-extensions', () => {
    return store.get('pinnedExtensions', [])
  })

  ipcMain.handle('get-dev-extensions', async () => {
    const saved: string[] = store.get('devExtensions', []) as string[]
    return saved.filter((p: string) => fs.existsSync(p)).map((extPath: string) => {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(extPath, 'manifest.json'), 'utf-8'))
        return { id: manifest.name?.toLowerCase().replace(/\s/g, '-') || extPath, name: manifest.name || 'Extensão', version: manifest.version || '1.0', path: extPath, enabled: true }
      } catch { return null }
    }).filter(Boolean)
  })

  ipcMain.handle('load-dev-extension', async () => {
    if (!isWindowSafe()) return { success: false, error: 'Janela não disponível' }
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Selecionar pasta da extensão (com manifest.json)'
    })
    if (result.canceled || !result.filePaths[0]) return { success: false }
    const extPath = result.filePaths[0]
    const manifestPath = path.join(extPath, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      return { success: false, error: 'manifest.json não encontrado na pasta selecionada.' }
    }
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      await session.defaultSession.loadExtension(extPath, { allowFileAccess: true })
      // Persist path so extension reloads on next launch
      const saved: string[] = store.get('devExtensions', []) as string[]
      if (!saved.includes(extPath)) {
        store.set('devExtensions', [...saved, extPath])
      }
      return {
        success: true,
        id: manifest.name?.toLowerCase().replace(/\s/g, '-') || Date.now().toString(),
        name: manifest.name || 'Extensão',
        version: manifest.version || '1.0',
        path: extPath
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao carregar extensão' }
    }
  })

  ipcMain.handle('select-download-path', async () => {
    if (!isWindowSafe()) return null
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Selecionar pasta de downloads'
    })
    if (!result.canceled && result.filePaths[0]) {
      store.set('downloadPath', result.filePaths[0])
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.on('go-back', () => { if (activeTabId && isViewSafe(tabs.get(activeTabId))) tabs.get(activeTabId)!.webContents.goBack() })
  ipcMain.on('go-forward', () => { if (activeTabId && isViewSafe(tabs.get(activeTabId))) tabs.get(activeTabId)!.webContents.goForward() })
  ipcMain.on('reload', () => { if (activeTabId && isViewSafe(tabs.get(activeTabId))) tabs.get(activeTabId)!.webContents.reload() })

  // ── OX MENU as real BrowserWindow — always on top of WebContentsView ──────
  let oxMenuPopup: BrowserWindow | null = null

  ipcMain.handle('show-ox-menu', async () => {
    if (oxMenuPopup && !oxMenuPopup.isDestroyed()) {
      oxMenuPopup.close()
      oxMenuPopup = null
      if (isWindowSafe()) mainWindow!.webContents.send('ox-menu-closed')
      return
    }
    if (!isWindowSafe()) return

    const [winW] = mainWindow!.getContentSize()
    const winBounds = mainWindow!.getBounds()
    const menuW = 260
    const menuH = 520

    oxMenuPopup = new BrowserWindow({
      width: menuW,
      height: menuH,
      x: winBounds.x + winW - menuW - 4,
      y: winBounds.y + 44,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background:transparent; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:4px; }
      .menu { background:rgba(13,13,15,0.98); border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.9); }
      .scroll { max-height:440px; overflow-y:auto; padding:8px; }
      .scroll::-webkit-scrollbar { width:4px; } .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
      .item { display:flex; align-items:center; gap:10px; padding:8px 10px; cursor:pointer; color:rgba(255,255,255,0.6); font-size:11px; font-weight:700; border-radius:10px; letter-spacing:-0.02em; transition:background 0.1s,color 0.1s; }
      .item:hover { background:rgba(255,255,255,0.05); color:white; }
      .item.danger { color:rgba(239,68,68,0.7); }
      .item.danger:hover { background:rgba(239,68,68,0.1); color:rgb(239,68,68); }
      .icon { width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:13px; transition:background 0.1s; }
      .item:hover .icon { background:rgba(255,255,255,0.1); }
      .item.danger:hover .icon { background:rgba(239,68,68,0.15); }
      .sep { height:1px; background:rgba(255,255,255,0.05); margin:4px 8px; }
      .footer { background:rgba(255,255,255,0.02); padding:10px 14px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; }
      .brand { font-size:9px; font-weight:900; color:rgba(255,255,255,0.2); text-transform:uppercase; letter-spacing:0.2em; }
      .ver { font-size:8px; color:rgba(255,255,255,0.1); }
      .dot { width:8px; height:8px; background:#a855f7; border-radius:50%; box-shadow:0 0 8px #a855f7; animation:pulse 2s infinite; }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    </style></head><body>
    <div class="menu">
      <div class="scroll">
        <div class="item" onclick="act('settings')"><div class="icon">⚙️</div>Configurações</div>
        <div class="item" onclick="act('downloads')"><div class="icon">⬇️</div>Downloads</div>
        <div class="item" onclick="act('history')"><div class="icon">🕐</div>Histórico</div>
        <div class="item" onclick="act('favorites')"><div class="icon">⭐</div>Favoritos</div>
        <div class="item" onclick="act('extensions')"><div class="icon">🧩</div>Extensões</div>
        <div class="sep"></div>
        <div class="item" onclick="act('devtools')"><div class="icon">🛠️</div>DevTools</div>
        <div class="item" onclick="act('new-window')"><div class="icon">🪟</div>Nova Janela</div>
        <div class="item" onclick="act('new-tab')"><div class="icon">➕</div>Nova Aba</div>
        <div class="item" onclick="act('reopen-closed')"><div class="icon">↩️</div>Reabrir Aba Fechada</div>
        <div class="sep"></div>
        <div class="item" onclick="act('import')"><div class="icon">📥</div>Importar Dados</div>
        <div class="item" onclick="act('passwords')"><div class="icon">🔑</div>Gerenciador de Senhas</div>
        <div class="item" onclick="act('about')"><div class="icon">ℹ️</div>Sobre o Opta X</div>
        <div class="sep"></div>
        <div class="item danger" onclick="act('restart')"><div class="icon">🔄</div>Reiniciar Navegador</div>
        <div class="item danger" onclick="act('quit')"><div class="icon">🚪</div>Sair</div>
      </div>
      <div class="footer">
        <div><div class="brand">Opta X Browser</div><div class="ver">Version 1.0.0 (Neon)</div></div>
        <div class="dot"></div>
      </div>
    </div>
    <script>
      const { ipcRenderer } = require('electron')
      function act(action) { ipcRenderer.send('ox-menu-action', action) }
      window.addEventListener('blur', () => ipcRenderer.send('ox-menu-close'))
    </script></body></html>`

    oxMenuPopup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    oxMenuPopup.on('closed', () => {
      oxMenuPopup = null
      if (isWindowSafe()) mainWindow!.webContents.send('ox-menu-closed')
    })
    oxMenuPopup.show()
    oxMenuPopup.focus()
  })

  ipcMain.on('ox-menu-close', () => {
    if (oxMenuPopup && !oxMenuPopup.isDestroyed()) { oxMenuPopup.close(); oxMenuPopup = null }
    if (isWindowSafe()) mainWindow!.webContents.send('ox-menu-closed')
  })

  ipcMain.on('ox-menu-action', (_: any, action: string) => {
    if (oxMenuPopup && !oxMenuPopup.isDestroyed()) { oxMenuPopup.close(); oxMenuPopup = null }
    if (!isWindowSafe()) return
    const wc = mainWindow!.webContents
    if (action === 'settings') wc.send('navigate-to', 'opta://settings')
    else if (action === 'downloads') wc.send('open-downloads-panel')
    else if (action === 'history') wc.send('open-history-panel')
    else if (action === 'favorites') wc.send('open-favorites-panel')
    else if (action === 'extensions') wc.send('navigate-to', 'opta://extensions')
    else if (action === 'import') wc.send('navigate-to', 'opta://import')
    else if (action === 'passwords') wc.send('navigate-to', 'opta://passwords')
    else if (action === 'about') wc.send('navigate-to', 'opta://about')
    else if (action === 'new-tab') wc.send('create-new-tab')
    else if (action === 'new-window') mainWindow!.webContents.send('new-window')
    else if (action === 'reopen-closed') wc.send('reopen-closed-tab')
    else if (action === 'devtools') {
      if (activeTabId && isViewSafe(tabs.get(activeTabId))) tabs.get(activeTabId)!.webContents.openDevTools({ mode: 'detach' })
    }
    else if (action === 'restart') app.relaunch() && app.quit()
    else if (action === 'quit') app.quit()
    wc.send('ox-menu-closed')
  })
}

function addToHistory(url: string, title: string) {
  if (url.startsWith('opta://') || url === 'about:blank') return
  const histPath = path.join(app.getPath('userData'), 'history.json')
  let history: any[] = []
  try {
    if (fs.existsSync(histPath)) history = JSON.parse(fs.readFileSync(histPath, 'utf-8'))
    history.unshift({ url, title, timestamp: Date.now() })
    fs.writeFileSync(histPath, JSON.stringify(history.slice(0, 1000)))
  } catch (e) {}
}

app.whenReady().then(() => {
  // Spoof Chrome user agent so Chrome Web Store accepts the browser
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.234 Safari/537.36'
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = chromeUA
    // Tell Web Store we're Chrome
    if (details.url.includes('chrome.google.com/webstore') || details.url.includes('chromewebstore.google.com')) {
      details.requestHeaders['X-Chrome-UMA-Enabled'] = '1'
      details.requestHeaders['X-Client-Data'] = ''
    }
    callback({ requestHeaders: details.requestHeaders })
  })
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

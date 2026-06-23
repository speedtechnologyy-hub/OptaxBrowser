# Opta X Browser

Navegador desktop customizado com a marca Speed Technology. Feito com Electron + React + TypeScript.

---

## 🚀 Build local (Windows)

```powershell
npm install
npm run build:exe
```
O instalador `.exe` aparece em `release/`.

---

## 📦 Publicar uma nova versão (GitHub Actions)

### 1. Configuração única (só na primeira vez)

1. Crie um repositório no GitHub: `opta-x-browser`
2. No `package.json`, substitua `SEU_USUARIO_GITHUB` pelo seu usuário do GitHub
3. Faça push do código para o repositório

### 2. Como lançar uma nova versão

```bash
# Atualize a versão no package.json (ex: 1.0.1)
# Depois crie e envie a tag:
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

O GitHub Actions vai automaticamente:
- Buildar para **Windows** (`.exe`), **macOS** (`.dmg`) e **Linux** (`.AppImage` + `.deb`)
- Criar um **GitHub Release** com os 3 instaladores prontos para download
- Os navegadores instalados vão **detectar a atualização automaticamente** e notificar o usuário

### 3. Links para o site

Depois do build, os links de download ficam no formato:
```
https://github.com/SEU_USUARIO/opta-x-browser/releases/latest/download/Opta-X-Setup-1.0.1.exe
https://github.com/SEU_USUARIO/opta-x-browser/releases/latest/download/Opta-X-1.0.1.dmg
https://github.com/SEU_USUARIO/opta-x-browser/releases/latest/download/Opta-X-1.0.1.AppImage
```

---

## 🔄 Sistema de atualizações automáticas

O `electron-updater` já está configurado. Quando o usuário abre o navegador:
1. Verifica silenciosamente se há nova versão no GitHub Releases
2. Baixa em background sem interromper o uso
3. Mostra um banner no canto inferior direito: "Nova versão pronta"
4. Instala quando o usuário clicar em "Instalar" ou ao fechar o navegador

---

## 🏗️ Stack

- **Electron 42** + **React 19** + **TypeScript**
- **Vite** + **Tailwind** + **Framer Motion**
- **electron-builder** — empacotamento multiplataforma
- **electron-updater** — atualizações automáticas via GitHub Releases

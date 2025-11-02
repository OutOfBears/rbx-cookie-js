# 🍪 rbx-cookie-js

A lightweight Node.js utility that retrieves the `.ROBLOSECURITY` cookie from your Roblox Studio installation or environment variables.
Supports **Windows** and **macOS**, making it ideal for tooling, automation, or scripts that need Roblox authentication.

---

## ✨ Features

* 🔍 Automatically detects authenticated Roblox Studio sessions
* 💻 Cross-platform support for Windows and macOS
* 🔒 Falls back to the `ROBLOSECURITY` environment variable
* ⚙️ Simple async API for quick integration

---

## 📦 Installation

Using **npm**:

```bash
npm install rbx-cookie
```

Using **pnpm**:

```bash
pnpm add rbx-cookie
```

---

## 🚀 Usage

### ESM (recommended)

```js
import rbxCookie from 'rbx-cookie';

const cookie = await rbxCookie.get();
console.log(cookie);
```

### CommonJS

```js
const rbxCookie = require('rbx-cookie');

(async () => {
  const cookie = await rbxCookie.get();
  console.log(cookie);
})();
```

---

## 🧠 How It Works

`rbx-cookie-js` attempts to find your Roblox authentication cookie in the following order:

1. `ROBLOSECURITY` environment variable
2. Roblox Studio’s local authentication storage
   * **Windows:** Using wincreds, before reverting back to searching the registry
   * **macOS:** Using Roblox Studio HttpStorage, before reverting back to trying the plist


If no cookie is found, it will return `null`

---

## 🧪 Example Use Cases

* Command-line tools for Roblox APIs
* Automated deployment or asset upload scripts
* Roblox project build pipelines

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

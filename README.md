# 🍪 rbx-cookie-js

A lightweight Node.js utility that retrieves the `.ROBLOSECURITY` cookie from your Roblox Studio installation or environment variables.
Supports **Windows** and **macOS**, making it ideal for tooling, automation, or scripts that need Roblox authentication.

---

## ⚙️ Requirements

This project uses **[N-API](https://nodejs.org/api/n-api.html)** bindings implemented in **Rust**, so you must have:

- **Rust (≥ 1.70)** installed — [Install Rust here](https://www.rust-lang.org/tools/install)
- **Node.js (≥ 18)** or **Bun (≥ 1.0)**

> 🪶 On Windows, ensure you have the Rust toolchain and a compatible C++ build environment (e.g. MSVC or GNU).

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

const cookie = rbxCookie.get();
console.log(cookie);
```

### CommonJS

```js
const rbxCookie = require('rbx-cookie');

const cookie = rbxCookie.get();

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

import winCookieMethods from "./winCookie.js";
import macCookieMethods from "./macCookie.js";

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

export async function getFromStudio() {
  if (isWindows) {
    return winCookieMethods.getFromStudio();
  } else if (isMac) {
    return macCookieMethods.getFromStudio();
  }

  throw new Error("Unsupported platform");
}

export async function getFromStudioLegacy() {
  if (isWindows) {
    return winCookieMethods.getFromStudioLegacy();
  } else if (isMac) {
    return macCookieMethods.getFromStudioLegacy();
  }

  throw new Error("Unsupported platform");
}

export async function get() {
  if (process.env.ROBLOSECURITY) {
    return process.env.ROBLOSECURITY;
  }

  try {
    return await getFromStudio();
  } catch {}

  try {
    return await getFromStudioLegacy();
  } catch {}

  return null;
}

export default { get, getFromStudio, getFromStudioLegacy };

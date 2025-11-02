import fs from "fs";
import plist from "plist";
import { CookieStore } from "./binaryCookie.js";

const COOKIE_NAME = ".ROBLOSECURITY";

export async function getFromStudio() {
  const path = `${process.env.HOME}/Library/HTTPStorages/com.Roblox.RobloxStudio.binarycookies`;

  try {
    const content = fs.readFileSync(path);
    const cookieStore = new CookieStore(false);

    cookieStore.parseContent(content);

    const cookie = cookieStore.findByName(COOKIE_NAME);
    if (cookie) return cookie.value;

    const userId = cookieStore.findByName("/RobloxStudioAuth/userid")?.value;
    if (userId) {
      const authCookie = cookieStore.findByName(
        `/RobloxStudioAuth/${COOKIE_NAME}${userId}`
      )?.value;

      if (authCookie) return authCookie.value;
    }
  } catch {}

  return null;
}

export async function getFromStudioLegacy() {
  const path = `${process.env.HOME}/Library/Preferences/com.roblox.RobloxStudioBrowser.plist`;

  try {
    const content = fs.readFileSync(path, "utf8");
    const list = plist.parse(content.toString());

    const rawCookieValue = (function () {
      for (const key of Object.keys(list)) {
        if (key.endsWith("ROBLOSECURITY")) {
          return list[key];
        }
      }
      return null;
    })();

    if (!rawCookieValue) return null;

    for (const item of rawCookieValue.split(",")) {
      const parts = item.split("::");

      const name = parts[0];
      const value = parts[1];
      if (!(name && value)) continue;

      if (name === "COOK" && value.startsWith("<") && value.endsWith(">")) {
        return value.slice(1, -1);
      }
    }
  } catch {}

  return null;
}

export default {
  getFromStudio,
  getFromStudioLegacy,
};

import keytar from "keytar";
import { promisified as regedit } from "regedit";

const COOKIE_NAME = ".ROBLOSECURITY";

export async function getFromStudio() {
  try {
    const userId = await keytar.findPassword(
      "https://www.roblox.com:RobloxStudioAuthuserid"
    );
    const cookie = keytar.findPassword(
      `https://www.roblox.com:RobloxStudioAuth${COOKIE_NAME}${userId}`
    );
    return cookie;
  } catch {}

  return await keytar.findPassword(
    `https://www.roblox.com:RobloxStudioAuth${COOKIE_NAME}`
  );
}

export async function getFromStudioLegacy() {
  const key = "HKCU\\SOFTWARE\\Roblox\\RobloxStudioBrowser\\roblox.com";
  const keyValue = (await regedit.list(key))[key];

  if (!keyValue && keyValue.exists) return null;

  const subKeyValue = keyValue.values[COOKIE_NAME]?.value;
  if (!subKeyValue) return null;

  for (const item of subKeyValue.split(",")) {
    const parts = item.split("::");

    const name = parts[0];
    const value = parts[1];
    if (!(name && value)) continue;

    if (name === "COOK" && value.startsWith("<") && value.endsWith(">")) {
      return value.slice(1, -1);
    }
  }

  return null;
}

export default {
  getFromStudio,
  getFromStudioLegacy,
};

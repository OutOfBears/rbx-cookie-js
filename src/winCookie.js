import { promisified as regedit } from "regedit";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import path from "path";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIE_NAME = ".ROBLOSECURITY";

async function getFromWinCred(name) {
  const winCredPath = path.join(__dirname, "wincred.py");
  return await execAsync(`python "${winCredPath}" "${name}"`).then((result) =>
    result.stdout.trim()
  );
}

export async function getFromStudio() {
  try {
    const userId = await getFromWinCred(
      "https://www.roblox.com:RobloxStudioAuthuserid"
    );
    return await getFromWinCred(
      `https://www.roblox.com:RobloxStudioAuth${COOKIE_NAME}${userId}`
    );
  } catch (e) {}

  return await getFromWinCred(
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

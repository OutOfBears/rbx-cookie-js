import { spawn } from "child_process";
import { promisified as regedit } from "regedit";

const COOKIE_NAME = ".ROBLOSECURITY";

export async function getCredentialFromManager(target) {
  const script = `[void](Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Text;

  namespace CredentialManager
  {
      public class CredentialInfo
      {
          public string Target { get; set; }
          public string Username { get; set; }
          public string Password { get; set; }
          public string Comment { get; set; }
      }

      public class CredMan
      {
          [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
          private static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

          [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
          private static extern bool CredFree(IntPtr credentialPtr);

          [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
          private struct CREDENTIAL
          {
              public int Flags;
              public int Type;
              public string TargetName;
              public string Comment;
              public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
              public int CredentialBlobSize;
              public IntPtr CredentialBlob;
              public int Persist;
              public int AttributeCount;
              public IntPtr Attributes;
              public string TargetAlias;
              public string UserName;
          }

          private static string BlobToString(IntPtr blob, int blobSize)
          {
              if (blob == IntPtr.Zero || blobSize == 0)
              {
                  return string.Empty;
              }

              byte[] blobBytes = new byte[blobSize];
              Marshal.Copy(blob, blobBytes, 0, blobSize);

              // Remove trailing null bytes
              int actualLength = blobBytes.Length;
              while (actualLength > 0 && blobBytes[actualLength - 1] == 0)
              {
                  actualLength--;
              }

              // Try ASCII first (most common for simple passwords)
              return Encoding.ASCII.GetString(blobBytes, 0, actualLength);
          }


          public static string GetPassword(string target)
          {
              IntPtr credPtr;
              if (!CredRead(target, 1, 0, out credPtr))
              {
                  return null;
              }

              try
              {
                  CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                  return BlobToString(cred.CredentialBlob, cred.CredentialBlobSize);
              }
              finally
              {
                  CredFree(credPtr);
              }
          }

          public static CredentialInfo Get(string target)
          {
              IntPtr credPtr;
              if (!CredRead(target, 1, 0, out credPtr))
              {
                  return null;
              }

              try
              {
                  CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                  var info = new CredentialInfo
                  {
                      Target = cred.TargetName,
                      Username = cred.UserName,
                      Password = BlobToString(cred.CredentialBlob, cred.CredentialBlobSize),
                      Comment = cred.Comment
                  };
                  return info;
              }
              finally
              {
                  CredFree(credPtr);
              }
          }
      }
  }
"@)

[CredentialManager.CredMan]::GetPassword("${target}")
`;

  return new Promise((resolve, reject) => {
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "-",
    ]);

    let stdoutData = "";
    let stderrData = "";

    ps.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    ps.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    ps.on("close", (code) => {
      if (code === 0) {
        // If there's stderr but also stdout, we can often ignore stderr
        // as it might contain warnings, not fatal errors.
        if (stderrData && !stdoutData) {
          console.error(
            `PowerShell errors while reading credential "${target}": ${stderrData}`,
          );
          resolve(null);
        } else {
          resolve(stdoutData.trim() || null);
        }
      } else {
        console.error(
          `Failed to read credential "${target}". PowerShell exited with code ${code}: ${stderrData}`,
        );
        resolve(null); // Resolve with null on failure to prevent promise rejection
      }
    });

    ps.on("error", (err) => {
      console.error(
        `Failed to start PowerShell to read credential "${target}": ${err.message}`,
      );
      resolve(null);
    });

    // Write the script to PowerShell's standard input
    ps.stdin.write(script);
    // End the input stream
    ps.stdin.end();
  });
}

export async function getFromStudio() {
  try {
    const userIdTarget = "https://www.roblox.com:RobloxStudioAuthuserid";
    const userId = await getCredentialFromManager(userIdTarget);

    if (userId) {
      const modernCookieTarget = `https://www.roblox.com:RobloxStudioAuth${COOKIE_NAME}${userId}`;
      const cookie = await getCredentialFromManager(modernCookieTarget);
      if (cookie) {
        return cookie;
      }
    }
  } catch (error) {
    console.error(
      "An error occurred during modern cookie search, proceeding to fallback:",
      error,
    );
  }

  const legacyCookieTarget = `https://www.roblox.com:RobloxStudioAuth${COOKIE_NAME}`;
  return await getCredentialFromManager(legacyCookieTarget);
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

export class CookieStore {
  constructor(httpOnly) {
    this.httpOnly = !!httpOnly;
    this.cookies = [];
  }

  findByName(name) {
    return this.cookies.find((cookie) => cookie.name === name);
  }

  /**
   * Parse entire cookie file Buffer
   * @param {Buffer} bs
   */
  parseContent(bs) {
    // Magic bytes: "COOK" = 0x63 0x6F 0x6F 0x6B
    if (!eqBytes(slice(bs, 0, 4), Buffer.from([0x63, 0x6f, 0x6f, 0x6b]))) {
      throw new Error("not a cookie file");
    }

    const count = readU32BE(slice(bs, 4, 4));
    const table = parseTableBE(bs.subarray(8), count);

    // pages follow the 8-byte header + count*4 table?
    // In the Rust version, it folds starting at (count*4 + 8)
    let off = count * 4 + 8;
    for (const len of table) {
      try {
        const pageBuf = slice(bs, off, len);
        this.parsePage(pageBuf);
      } catch (err) {
        console.warn(`page parse failure: ${err.message || err}`);
      }
      off += len;
    }
  }

  /**
   * Parse a single page
   * @param {Buffer} bs
   */
  parsePage(bs) {
    // header 0x00 0x00 0x01 0x00
    if (!eqBytes(slice(bs, 0, 4), Buffer.from([0x00, 0x00, 0x01, 0x00]))) {
      throw new Error("bad page header");
    }

    const count = readU32LE(slice(bs, 4, 4));
    const table = parseTableLE(bs.subarray(8), count);

    for (const off of table) {
      try {
        // first 4 bytes at cookie offset is the total length (LE)
        const len = readU32LE(slice(bs, off, 4));
        const cookieBuf = slice(bs, off, len);
        this.parseCookie(cookieBuf, "LE");
      } catch (err) {
        console.warn(`cookie parse failure: ${err.message || err}`);
      }
    }

    // trailer: 4 zero bytes after the table
    if (
      !eqBytes(
        slice(bs, count * 4 + 8, 4),
        Buffer.from([0x00, 0x00, 0x00, 0x00])
      )
    ) {
      throw new Error("bad page trailer");
    }
  }

  /**
   * Parse a single cookie record (endianness depends on page)
   * @param {Buffer} bs
   * @param {"LE"|"BE"} endian
   */
  parseCookie(bs, endian) {
    if (bs.length < 0x30) {
      throw new Error("cookie data underflow");
    }

    const rdU32 = endian === "LE" ? readU32LE : readU32BE;
    const rdF64 = endian === "LE" ? readF64LE : readF64BE;

    const flags = rdU32(slice(bs, 0x08, 4));

    const urlOffset = rdU32(slice(bs, 0x10, 4));
    const nameOffset = rdU32(slice(bs, 0x14, 4));
    const pathOffset = rdU32(slice(bs, 0x18, 4));
    const valueOffset = rdU32(slice(bs, 0x1c, 4));

    // iOS/macOS timestamp is CFAbsoluteTime (seconds since 2001-01-01),
    // convert to Unix (since 1970-01-01) by adding 978307200.
    const expiry = rdF64(slice(bs, 0x28, 8)) + 978307200;

    const url = cStr(sliceTo(bs, urlOffset, nameOffset));
    const name = cStr(sliceTo(bs, nameOffset, pathOffset));
    const path = cStr(sliceTo(bs, pathOffset, valueOffset));
    const value = cStr(sliceTo(bs, valueOffset, bs.length));

    const isRaw = url.startsWith(".");
    const isSecure = (flags & 0x01) === 0x01;
    const isHttpOnly = (flags & 0x04) === 0x04;

    const prefix = isHttpOnly && this.httpOnly ? "#HttpOnly_" : "";

    this.cookies.push({
      prefix,
      url,
      isRaw,
      path,
      isSecure,
      expiry,
      name,
      value,
    });
  }
}

function slice(bs, off, len) {
  if (off + len > bs.length) {
    const under = off + len - bs.length;
    throw new Error(`data underflow: ${under}`);
  }
  return bs.subarray(off, off + len);
}

function sliceTo(bs, off, to) {
  if (to < off) {
    // Note: to - off would be negative; mirror Rust error text
    throw new Error(`negative data length: ${to - off}`);
  }
  return slice(bs, off, to - off);
}

function parseTableLE(bs, count) {
  const end = count * 4;
  if (end > bs.length) throw new Error("table data underflow");
  const res = [];
  for (let i = 0; i < end; i += 4) {
    res.push(bs.readUInt32LE(i));
  }
  return res;
}

function parseTableBE(bs, count) {
  const end = count * 4;
  if (end > bs.length) throw new Error("table data underflow");
  const res = [];
  for (let i = 0; i < end; i += 4) {
    res.push(bs.readUInt32BE(i));
  }
  return res;
}

function readU32LE(buf) {
  return buf.readUInt32LE(0);
}
function readU32BE(buf) {
  return buf.readUInt32BE(0);
}
function readF64LE(buf) {
  return buf.readDoubleLE(0);
}
function readF64BE(buf) {
  return buf.readDoubleBE(0);
}

function cStr(buf) {
  const idx = buf.indexOf(0x00);
  if (idx === -1) {
    throw new Error("invalid c string (no null char)");
  }
  return buf.subarray(0, idx).toString("utf8");
}

function eqBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

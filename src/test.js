import rbxCookie from "./index.js";

async function test() {
  const cookie = await rbxCookie.getFromStudio();
  console.log(`Cookie from Studio:\n\n${cookie.slice(0, 150)}...`);
}

test();

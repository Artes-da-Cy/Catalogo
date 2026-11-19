const SESSION_COOKIE = "artesdacy_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function cookieOptions(request, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const expiration = Number.isInteger(maxAge) ? `; Max-Age=${maxAge}` : "";
  return `Path=/; HttpOnly; SameSite=Lax${expiration}${secure}`;
}

export function readCookie(request, name) {
  const cookies = request.headers.get("cookie") || "";
  const prefix = `${name}=`;
  const cookie = cookies.split(";").map(value => value.trim())
    .find(value => value.startsWith(prefix));

  return cookie ? cookie.slice(prefix.length) : "";
}

export function setCookie(response, request, name, value, maxAge) {
  response.headers.append(
    "set-cookie",
    `${name}=${value}; ${cookieOptions(request, maxAge)}`
  );
  return response;
}

export function clearCookie(response, request, name) {
  return setCookie(response, request, name, "", 0);
}

async function sessionKey(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSession(email, env) {
  const payload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify({
      email,
      expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
    }))
  );
  const key = await sessionKey(env);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function isAuthorized(request, env) {
  const session = readCookie(request, SESSION_COOKIE);
  const [payload, encodedSignature, ...extra] = session.split(".");

  if (!payload || !encodedSignature || extra.length) return false;

  let signature;
  let data;
  try {
    signature = decodeBase64Url(encodedSignature);
    data = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
  } catch {
    return false;
  }

  const key = await sessionKey(env);
  const validSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(payload)
  );

  return validSignature &&
    data.email === "syssy.ana.dc@gmail.com" &&
    Number.isInteger(data.expiresAt) &&
    data.expiresAt > Math.floor(Date.now() / 1000);
}

export { SESSION_COOKIE, SESSION_DURATION_SECONDS };

import {
  clearCookie,
  setCookie
} from "../../_lib/auth.js";

const FLOW_COOKIE = "artesdacy_oauth_flow";
const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomToken() {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

function redirectToAdmin(request, message) {
  const url = new URL("/admin.html", request.url);
  url.searchParams.set("login", message);
  return new Response(null, {
    status: 302,
    headers: { location: url.toString() }
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("O login Google ainda não está configurado.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  const state = randomToken();
  const verifier = randomToken();
  const challenge = encodeBase64Url(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
    )
  );
  const flow = encodeBase64Url(new TextEncoder().encode(JSON.stringify({
    state,
    verifier,
    returnTo: "/admin.html"
  })));
  const redirectUri = new URL("/api/auth/callback", request.url).toString();
  const authorization = new URL(GOOGLE_AUTHORIZATION_URL);

  authorization.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account"
  }).toString();

  const response = new Response(null, {
    status: 302,
    headers: { location: authorization.toString() }
  });
  clearCookie(response, request, FLOW_COOKIE);
  setCookie(response, request, FLOW_COOKIE, flow, 600);
  return response;
}

export async function onRequestPost({ request }) {
  return redirectToAdmin(request, "denied");
}

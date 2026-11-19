import {
  clearCookie,
  createSession,
  readCookie,
  SESSION_COOKIE,
  setCookie
} from "../../_lib/auth.js";

const FLOW_COOKIE = "artesdacy_oauth_flow";
const ALLOWED_EMAIL = "syssy.ana.dc@gmail.com";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function textResponse(request, text, status) {
  const response = new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
  clearCookie(response, request, FLOW_COOKIE);
  return response;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return textResponse(request, "Login Google cancelado ou recusado.", 400);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const encodedFlow = readCookie(request, FLOW_COOKIE);
  if (!code || !returnedState || !encodedFlow) {
    return textResponse(request, "Solicitação de login inválida. Tente novamente.", 400);
  }

  let flow;
  try {
    const binary = atob(
      encodedFlow.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - encodedFlow.length % 4) % 4)
    );
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    flow = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return textResponse(request, "Sessão de login inválida. Tente novamente.", 400);
  }

  if (
    !flow ||
    flow.state !== returnedState ||
    typeof flow.verifier !== "string" ||
    flow.returnTo !== "/admin.html"
  ) {
    return textResponse(request, "Validação de segurança do login falhou.", 400);
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return textResponse(request, "O login Google ainda não está configurado.", 503);
  }

  const redirectUri = new URL("/api/auth/callback", url).toString();
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: flow.verifier
    })
  });

  if (!tokenResponse.ok) {
    console.error("Google OAuth token exchange failed:", tokenResponse.status);
    return textResponse(request, "Não foi possível validar o login Google.", 502);
  }

  const tokenData = await tokenResponse.json();
  if (typeof tokenData.access_token !== "string") {
    return textResponse(request, "O Google não retornou um token de acesso válido.", 502);
  }

  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${tokenData.access_token}` }
  });
  if (!userResponse.ok) {
    console.error("Google user info request failed:", userResponse.status);
    return textResponse(request, "Não foi possível confirmar a conta Google.", 502);
  }

  const user = await userResponse.json();
  if (
    typeof user.email !== "string" ||
    user.email.toLowerCase() !== ALLOWED_EMAIL ||
    user.email_verified !== true
  ) {
    return textResponse(
      request,
      "Acesso não permitido. Esta conta Google não está autorizada para o painel.",
      403
    );
  }

  const session = await createSession(ALLOWED_EMAIL, env);
  const response = new Response(null, {
    status: 302,
    headers: { location: new URL(flow.returnTo, url).toString() }
  });
  clearCookie(response, request, FLOW_COOKIE);
  setCookie(
    response,
    request,
    SESSION_COOKIE,
    session
  );
  return response;
}

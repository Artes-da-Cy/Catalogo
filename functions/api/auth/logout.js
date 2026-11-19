import { clearCookie, SESSION_COOKIE } from "../../_lib/auth.js";

export async function onRequestGet({ request }) {
  const response = new Response(null, {
    status: 302,
    headers: {
      location: new URL("/", request.url).toString(),
      "cache-control": "no-store"
    }
  });
  return clearCookie(response, request, SESSION_COOKIE);
}

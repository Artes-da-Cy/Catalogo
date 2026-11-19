import { isAuthorized } from "./auth.js";

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function requireAdmin(context) {
  if (!await isAuthorized(context.request, context.env)) {
    return jsonResponse({ error: "Acesso não autorizado." }, 401);
  }

  if (!context.env.DB) {
    return jsonResponse({ error: "O banco D1 não está configurado." }, 503);
  }

  return null;
}

export function hasSameOrigin(request) {
  const origin = request.headers.get("origin");
  return Boolean(origin) && new URL(origin).origin === new URL(request.url).origin;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function validId(value) {
  return typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function validImageUrl(value, area) {
  if (typeof value !== "string") return false;
  if (value === "") return area === "categories";
  const match = value.match(/^\/api\/media\?key=([^&]+)$/);
  if (!match) return false;

  let key;
  try {
    key = decodeURIComponent(match[1]);
  } catch {
    return false;
  }

  return new RegExp(`^${area}\\/[a-zA-Z0-9-]+\\.(jpg|jpeg|png)$`).test(key);
}

export function toBoolean(value) {
  return value === true ? 1 : 0;
}

export function errorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("UNIQUE constraint failed")) {
    return "Já existe um registro com este identificador.";
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return "Não é possível excluir uma categoria que possui produtos.";
  }
  return "Não foi possível salvar no banco de dados.";
}

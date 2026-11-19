import { isAuthorized } from "../_lib/auth.js";

const MAX_IMAGE_SIZE = 300 * 1000;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function validKey(key) {
  return /^(products|categories|site)\/[a-zA-Z0-9-]+\.(jpg|jpeg|png)$/.test(key);
}

function detectImageType(bytes) {
  if (bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }

  if (bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a) {
    return { contentType: "image/png", extension: "png" };
  }

  return null;
}

async function readImageBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return { body: new Uint8Array(), tooLarge: false };

  const chunks = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    if (size > MAX_IMAGE_SIZE) {
      await reader.cancel();
      return { body: new Uint8Array(), tooLarge: true };
    }

    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { body, tooLarge: false };
}

export async function onRequestGet({ request, env }) {
  if (!env.MEDIA) {
    return jsonResponse({ error: "O armazenamento R2 não está configurado." }, 503);
  }

  const key = new URL(request.url).searchParams.get("key") || "";
  if (!validKey(key)) {
    return jsonResponse({ error: "Chave de imagem inválida." }, 400);
  }

  const object = await env.MEDIA.get(key);
  if (!object) {
    return jsonResponse({ error: "Imagem não encontrada." }, 404);
  }

  const headers = new Headers({
    "cache-control": "public, max-age=86400",
    "content-type": object.httpMetadata?.contentType || "application/octet-stream",
    "etag": object.httpEtag,
    "x-content-type-options": "nosniff"
  });

  return new Response(object.body, { headers });
}

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) {
    return jsonResponse({ error: "O armazenamento R2 não está configurado." }, 503);
  }
  if (!await isAuthorized(request, env)) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
    return jsonResponse({ error: "Origem da solicitação não autorizada." }, 403);
  }

  const declaredSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_SIZE) {
    return jsonResponse({ error: "A imagem deve ter no máximo 300 KB." }, 413);
  }

  const image = await readImageBody(request);
  if (image.tooLarge) {
    return jsonResponse({ error: "A imagem deve ter no máximo 300 KB." }, 413);
  }
  if (image.body.byteLength === 0) {
    return jsonResponse({ error: "A imagem deve ter entre 1 byte e 300 KB." }, 413);
  }

  const detectedType = detectImageType(image.body);
  if (!detectedType) {
    return jsonResponse({
      error: "Arquivo inválido. Envie uma imagem JPG, JPEG ou PNG."
    }, 415);
  }

  const area = new URL(request.url).searchParams.get("area");
  if (area !== "products" && area !== "categories") {
    return jsonResponse({ error: "Informe a área products ou categories." }, 400);
  }

  const key = `${area}/${crypto.randomUUID()}.${detectedType.extension}`;
  await env.MEDIA.put(key, image.body, {
    httpMetadata: { contentType: detectedType.contentType }
  });

  return jsonResponse({
    key,
    url: `/api/media?key=${encodeURIComponent(key)}`
  }, 201);
}

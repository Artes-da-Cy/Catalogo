import { isAuthorized } from "./_lib/auth.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function socialDescription(value) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 200
    ? `${normalized.slice(0, 197).trimEnd()}...`
    : normalized || "Conheça esta criação artesanal da Artes da Cy.";
}

async function addProductSocialMetadata(response, request, env) {
  if (!response.ok) return response;

  const url = new URL(request.url);
  const productId = url.searchParams.get("produto");
  if (!productId || !env.DB) return response;

  const result = await env.DB.prepare(`
    SELECT name, description, images, price, show_price
    FROM products
    WHERE id = ? AND active = 1
  `).bind(productId).first();
  if (!result) return response;

  const images = JSON.parse(result.images || "[]");
  const imagePath = Array.isArray(images)
    ? images.find(image => typeof image === "string" &&
      image.startsWith("/api/media?key="))
    : null;
  const title = `${result.name} | Artes da Cy`;
  const description = socialDescription(result.description);
  const pageUrl = url.toString();
  const metadata = [
    `<meta property="og:type" content="product">`,
    `<meta property="og:site_name" content="Artes da Cy">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  ];

  if (imagePath) {
    const imageUrl = new URL(imagePath, url.origin).toString();
    metadata.push(
      `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
      `<meta property="og:image:alt" content="${escapeHtml(result.name)}">`,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`
    );
  }

  if (result.show_price && Number.isInteger(result.price)) {
    metadata.push(
      `<meta property="product:price:amount" content="${(result.price / 100).toFixed(2)}">`,
      `<meta property="product:price:currency" content="BRL">`
    );
  }

  const html = await response.text();
  const updatedHtml = html
    .replace(
      /<title>[^<]*<\/title>/i,
      `<title>${escapeHtml(title)}</title>`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}">`
    )
    .replace("</head>", `${metadata.join("\n  ")}\n</head>`);
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.delete("content-length");
  headers.delete("etag");

  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (
    ["/produto", "/produto.html"].includes(url.pathname) &&
    context.request.method === "GET"
  ) {
    const response = await context.next();
    return addProductSocialMetadata(response, context.request, context.env);
  }

  if (!["/admin", "/admin/", "/admin.html"].includes(url.pathname)) {
    return context.next();
  }

  if (await isAuthorized(context.request, context.env)) {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.set("pragma", "no-cache");
    headers.set("expires", "0");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  return Response.redirect(
    new URL("/api/auth/login?returnTo=%2Fadmin.html", url),
    302
  );
}

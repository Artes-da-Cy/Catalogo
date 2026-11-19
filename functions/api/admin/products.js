import {
  errorMessage,
  hasSameOrigin,
  jsonResponse,
  readJson,
  requireAdmin,
  toBoolean,
  validImageUrl,
  validId
} from "../../_lib/admin-api.js";

function validProduct(product) {
  return product &&
    validId(product.id) &&
    validId(product.categoria) &&
    typeof product.nome === "string" &&
    product.nome.trim().length > 0 &&
    typeof product.descricao === "string" &&
    typeof product.medidas === "string" &&
    typeof product.materiais === "string" &&
    Array.isArray(product.tags || []) &&
    (product.tags || []).every(tag => typeof tag === "string") &&
    Array.isArray(product.imagens) &&
    product.imagens.every(image => validImageUrl(image, "products")) &&
    (product.preco === null ||
      (Number.isInteger(product.preco) && product.preco >= 0)) &&
    Number.isInteger(product.ordem) &&
    product.ordem >= 0;
}

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  if (!hasSameOrigin(context.request)) {
    return jsonResponse({ error: "Origem da solicitação não autorizada." }, 403);
  }

  const product = await readJson(context.request);
  if (!validProduct(product)) {
    return jsonResponse({ error: "Dados de produto inválidos." }, 400);
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO products
        (id, category_id, name, description, measures, materials, tags, images,
         price, show_price, featured, active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product.id,
      product.categoria,
      product.nome.trim(),
      product.descricao.trim(),
      product.medidas.trim(),
      product.materiais.trim(),
      JSON.stringify(product.tags || []),
      JSON.stringify(product.imagens),
      product.preco,
      toBoolean(product.exibirPreco),
      toBoolean(product.destaque),
      toBoolean(product.ativo),
      product.ordem
    ).run();
    return jsonResponse({ id: product.id }, 201);
  } catch (error) {
    return jsonResponse({ error: errorMessage(error) }, 409);
  }
}

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  if (!hasSameOrigin(context.request)) {
    return jsonResponse({ error: "Origem da solicitação não autorizada." }, 403);
  }

  const product = await readJson(context.request);
  const originalId = new URL(context.request.url).searchParams.get("id");
  if (!validId(originalId) || !validProduct(product)) {
    return jsonResponse({ error: "Dados de produto inválidos." }, 400);
  }

  try {
    const result = await context.env.DB.prepare(`
      UPDATE products
      SET id = ?, category_id = ?, name = ?, description = ?, measures = ?,
          materials = ?, tags = ?, images = ?, price = ?, show_price = ?,
          featured = ?, active = ?, display_order = ?
      WHERE id = ?
    `).bind(
      product.id,
      product.categoria,
      product.nome.trim(),
      product.descricao.trim(),
      product.medidas.trim(),
      product.materiais.trim(),
      JSON.stringify(product.tags || []),
      JSON.stringify(product.imagens),
      product.preco,
      toBoolean(product.exibirPreco),
      toBoolean(product.destaque),
      toBoolean(product.ativo),
      product.ordem,
      originalId
    ).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: "Produto não encontrado." }, 404);
    }
    return jsonResponse({ id: product.id });
  } catch (error) {
    return jsonResponse({ error: errorMessage(error) }, 409);
  }
}

export async function onRequestDelete(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  if (!hasSameOrigin(context.request)) {
    return jsonResponse({ error: "Origem da solicitação não autorizada." }, 403);
  }

  const id = new URL(context.request.url).searchParams.get("id");
  if (!validId(id)) {
    return jsonResponse({ error: "Identificador de produto inválido." }, 400);
  }

  const result = await context.env.DB.prepare(
    "DELETE FROM products WHERE id = ?"
  ).bind(id).run();

  if (result.meta.changes === 0) {
    return jsonResponse({ error: "Produto não encontrado." }, 404);
  }
  return jsonResponse({ id });
}

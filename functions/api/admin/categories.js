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

function validCategory(category) {
  return category &&
    validId(category.id) &&
    typeof category.nome === "string" &&
    category.nome.trim().length > 0 &&
    typeof category.descricao === "string" &&
    validImageUrl(category.imagem, "categories") &&
    Number.isInteger(category.ordem) &&
    category.ordem >= 0;
}

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  if (!hasSameOrigin(context.request)) {
    return jsonResponse({ error: "Origem da solicitação não autorizada." }, 403);
  }

  const category = await readJson(context.request);
  if (!validCategory(category)) {
    return jsonResponse({ error: "Dados de categoria inválidos." }, 400);
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO categories (id, name, description, image, display_order, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      category.id,
      category.nome.trim(),
      category.descricao.trim(),
      category.imagem.trim(),
      category.ordem,
      toBoolean(category.ativa)
    ).run();
    return jsonResponse({ id: category.id }, 201);
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

  const category = await readJson(context.request);
  const originalId = new URL(context.request.url).searchParams.get("id");
  if (!validId(originalId) || !validCategory(category)) {
    return jsonResponse({ error: "Dados de categoria inválidos." }, 400);
  }

  try {
    const result = await context.env.DB.prepare(`
      UPDATE categories
      SET id = ?, name = ?, description = ?, image = ?, display_order = ?,
          active = ?
      WHERE id = ?
    `).bind(
      category.id,
      category.nome.trim(),
      category.descricao.trim(),
      category.imagem.trim(),
      category.ordem,
      toBoolean(category.ativa),
      originalId
    ).run();
    if (result.meta.changes === 0) {
      return jsonResponse({ error: "Categoria não encontrada." }, 404);
    }
    return jsonResponse({ id: category.id });
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
    return jsonResponse({ error: "Identificador de categoria inválido." }, 400);
  }

  try {
    const productCount = await context.env.DB.prepare(`
      SELECT COUNT(*) AS quantity
      FROM products
      WHERE category_id = ?
    `).bind(id).first();

    if (!productCount) {
      return jsonResponse({
        error: "Não foi possível verificar os produtos desta categoria."
      }, 500);
    }

    const quantity = Number(productCount.quantity);
    if (quantity > 0) {
      const message = quantity === 1
        ? "Exclua o produto ou altere a categoria dele primeiro."
        : "Exclua os produtos ou altere a categoria deles primeiro.";
      const noun = quantity === 1 ? "produto vinculado" : "produtos vinculados";

      return jsonResponse({
        error: `Não é possível excluir esta categoria: há ${quantity} ${noun}. ${message}`
      }, 409);
    }

    const result = await context.env.DB.prepare(
      "DELETE FROM categories WHERE id = ?"
    ).bind(id).run();
    if (result.meta.changes === 0) {
      return jsonResponse({ error: "Categoria não encontrada." }, 404);
    }
    return jsonResponse({ id });
  } catch (error) {
    return jsonResponse({ error: errorMessage(error) }, 409);
  }
}

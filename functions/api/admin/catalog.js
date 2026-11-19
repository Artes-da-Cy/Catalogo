import { jsonResponse, requireAdmin } from "../../_lib/admin-api.js";

export async function onRequestGet(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;

  const [settings, categories, products] = await Promise.all([
    context.env.DB.prepare(
      "SELECT setting_key, setting_value FROM site_settings"
    ).all(),
    context.env.DB.prepare(`
      SELECT id, name, description, image, display_order, active
      FROM categories
      ORDER BY display_order, name
    `).all(),
    context.env.DB.prepare(`
      SELECT id, category_id, name, description, measures, materials, tags,
             images, price, show_price, featured, active, display_order
      FROM products
      ORDER BY display_order, name
    `).all()
  ]);

  return jsonResponse({
    configuracao: Object.fromEntries(
      settings.results.map(row => [row.setting_key, row.setting_value])
    ),
    categorias: categories.results.map(row => ({
      id: row.id,
      nome: row.name,
      descricao: row.description,
      imagem: row.image,
      ordem: row.display_order,
      ativa: Boolean(row.active)
    })),
    produtos: products.results.map(row => ({
      id: row.id,
      categoria: row.category_id,
      nome: row.name,
      descricao: row.description,
      medidas: row.measures,
      materiais: row.materials,
      tags: JSON.parse(row.tags || "[]"),
      imagens: JSON.parse(row.images || "[]"),
      preco: row.price,
      exibirPreco: Boolean(row.show_price),
      destaque: Boolean(row.featured),
      ativo: Boolean(row.active),
      ordem: row.display_order
    }))
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return jsonResponse({ error: "O banco de dados D1 não está configurado." }, 503);
  }

  const [settings, categories, products] = await Promise.all([
    env.DB.prepare("SELECT setting_key, setting_value FROM site_settings").all(),
    env.DB.prepare(`
      SELECT id, name, description, image, display_order, active
      FROM categories
      WHERE active = 1
      ORDER BY display_order, name
    `).all(),
    env.DB.prepare(`
      SELECT id, category_id, name, description, measures, materials, tags,
             images, price, show_price, featured, active, display_order
      FROM products
      WHERE active = 1
      ORDER BY display_order, name
    `).all()
  ]);

  const configuration = Object.fromEntries(
    settings.results.map(row => [row.setting_key, row.setting_value])
  );

  return jsonResponse({
    configuracao: {
      marca: configuration.marca || "Artes da Cy",
      whatsapp: configuration.whatsapp || "",
      tituloCapa: configuration.tituloCapa || "Artes da Cy",
      subtituloCapa: configuration.subtituloCapa || "",
      apresentacao: configuration.apresentacao || "",
      logo: configuration.logo || "/api/media?key=site/logo.jpg",
      capa: configuration.capa || "/api/media?key=site/capa.jpg"
    },
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

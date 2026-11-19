CREATE TABLE IF NOT EXISTS site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  measures TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
  images TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(images)),
  price INTEGER CHECK (price IS NULL OR price >= 0),
  show_price INTEGER NOT NULL DEFAULT 1 CHECK (show_price IN (0, 1)),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS products_catalog_order
  ON products(active, display_order, name);

CREATE INDEX IF NOT EXISTS products_category_order
  ON products(category_id, active, display_order);

INSERT OR IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('marca', 'Artes da Cy'),
  ('whatsapp', '5514991223869'),
  ('tituloCapa', 'Artes da Cy'),
  ('subtituloCapa', 'Peças únicas, feitas com carinho para você.'),
  ('apresentacao', 'Cada criação carrega cuidado, criatividade e dedicação. Descubra peças artesanais e personalizadas que tornam momentos especiais ainda mais inesquecíveis.'),
  ('logo', '/api/media?key=site/logo.jpg'),
  ('capa', '/api/media?key=site/capa.jpg');

INSERT OR IGNORE INTO categories
  (id, name, description, image, display_order, active)
VALUES
  ('presentes', 'Presentes personalizados', 'Presentes criados para momentos especiais.', '/api/media?key=categories/presentes.jpeg', 1, 1),
  ('lembrancinhas', 'Lembrancinhas', 'Pequenos detalhes para grandes ocasiões.', '/api/media?key=categories/lembrancinha.jpeg', 2, 1),
  ('decoracao', 'Decoração', 'Detalhes artesanais para decorar.', '/api/media?key=categories/decoracoes.jpeg', 3, 1),
  ('papelaria', 'Papelaria personalizada', 'Criatividade em cada detalhe.', '/api/media?key=categories/papelaria.jpeg', 4, 1);

INSERT OR IGNORE INTO products
  (id, category_id, name, description, measures, materials, tags, images, price, show_price, featured, active, display_order)
VALUES
  ('produto-teste', 'presentes', 'Produto de demonstração', 'Esse arranjo é ótimo para quem quer uma decoração bonita, durável ....', '20 x 15 cm', 'Papel e materiais decorativos', '[]', '["/api/media?key=products/arranjo-papel.jpeg","/api/media?key=products/arranjo-papel1.jpeg"]', 2590, 1, 1, 1, 1),
  ('botton', 'lembrancinhas', 'Botton de demonstração', 'Exemplo para testar o catálogo.', '20 x 15 cm', 'Chaveiro de plástico com decoração', '["botton","button","broche","chaveiro","lembrancinha","lembrancinhas personalizadas","brinde personalizado","presente","festa","aniversário","personalizado"]', '["/api/media?key=products/botton.jpeg","/api/media?key=products/botton1.jpeg"]', 2890, 1, 1, 1, 1),
  ('decoracao-demo', 'decoracao', 'Peça decorativa de demonstração', 'Exemplo de peça artesanal para decorar ambientes e deixar cada espaço mais especial.', 'A definir', 'Materiais decorativos diversos', '[]', '["/api/media?key=products/decoracao.jpeg","/api/media?key=products/decoracao1.jpeg"]', 3500, 1, 0, 1, 1),
  ('papelaria-demo', 'papelaria', 'Papelaria personalizada de demonstração', 'Exemplo de criação personalizada em papel para ocasiões especiais.', 'A definir', 'Papel e materiais para personalização', '[]', '["/api/media?key=products/produto-teste.jpg","/api/media?key=products/produto-teste-detalhe.jpg"]', 1500, 1, 0, 1, 1);

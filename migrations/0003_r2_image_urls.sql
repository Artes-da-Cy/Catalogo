UPDATE site_settings
SET setting_value = '/api/media?key=site/logo.jpg'
WHERE setting_key = 'logo';

UPDATE site_settings
SET setting_value = '/api/media?key=site/capa.jpg'
WHERE setting_key = 'capa';

UPDATE categories
SET image = '/api/media?key=categories/presentes.jpeg'
WHERE id = 'presentes';

UPDATE categories
SET image = '/api/media?key=categories/lembrancinha.jpeg'
WHERE id = 'lembrancinhas';

UPDATE categories
SET image = '/api/media?key=categories/decoracoes.jpeg'
WHERE id = 'decoracao';

UPDATE categories
SET image = '/api/media?key=categories/papelaria.jpeg'
WHERE id = 'papelaria';

UPDATE products
SET images = '["/api/media?key=products/arranjo-papel.jpeg","/api/media?key=products/arranjo-papel1.jpeg"]'
WHERE id = 'produto-teste';

UPDATE products
SET images = '["/api/media?key=products/botton.jpeg","/api/media?key=products/botton1.jpeg"]'
WHERE id = 'botton';

UPDATE products
SET images = '["/api/media?key=products/decoracao.jpeg","/api/media?key=products/decoracao1.jpeg"]'
WHERE id = 'decoracao-demo';

UPDATE products
SET images = '["/api/media?key=products/produto-teste.jpg","/api/media?key=products/produto-teste-detalhe.jpg"]'
WHERE id = 'papelaria-demo';

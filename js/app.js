
window.CATALOGO_PROMISE = window.CATALOGO_PROMISE.then(dados => {
  function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caractere]);
  }

  function formatarPreco(centavos) {
    return (Number(centavos) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function linkWhatsApp(mensagem = "Olá! Gostaria de conhecer os produtos da Artes da Cy.") {
    const numero = dados.configuracao.whatsapp;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  }

  function buscarCategoria(id) {
    return dados.categorias.find(categoria => categoria.id === id);
  }

  function buscarProduto(id) {
    return dados.produtos.find(produto => produto.id === id);
  }

  function listarCategorias() {
    return dados.categorias
      .filter(categoria => categoria.ativa === true)
      .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));
  }

  function listarProdutos(filtros = {}) {
    return dados.produtos
      .filter(produto => produto.ativo === true)
      .filter(produto =>
        filtros.categoria
          ? produto.categoria === filtros.categoria
          : true
      )
      .filter(produto =>
        filtros.destaque === true
          ? produto.destaque === true
          : true
      )
      .sort((a, b) =>
        (Number(a.ordem) || 0) - (Number(b.ordem) || 0)
      );
  }

  function imagemPrincipal(produto) {
    return Array.isArray(produto.imagens) && produto.imagens.length
      ? produto.imagens[0]
      : "";
  }

  window.ArtesDaCy = {
    dados,
    escapar,
    formatarPreco,
    linkWhatsApp,
    buscarCategoria,
    buscarProduto,
    listarCategorias,
    listarProdutos,
    imagemPrincipal
  };

  return dados;
});

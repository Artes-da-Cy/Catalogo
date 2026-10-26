
(function () {
  "use strict";

  function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}
function variantesPalavra(palavra) {
  const variantes = new Set([palavra]);

  if (palavra.length < 4) {
    return [...variantes];
  }

  // Plurais terminados em "ões", como lembrões
  if (palavra.endsWith("oes")) {
    variantes.add(palavra.slice(0, -3) + "ao");
  }

  // Plurais terminados em "ães"
  if (palavra.endsWith("aes")) {
    variantes.add(palavra.slice(0, -3) + "ao");
  }

  // Plurais terminados em "ais"
  if (palavra.endsWith("ais")) {
    variantes.add(palavra.slice(0, -3) + "al");
  }

  // Plurais terminados em "éis"
  if (palavra.endsWith("eis")) {
    variantes.add(palavra.slice(0, -3) + "el");
  }

  // Plurais terminados em "óis"
  if (palavra.endsWith("ois")) {
    variantes.add(palavra.slice(0, -3) + "ol");
  }

  // Plural comum terminado em "s"
  if (palavra.endsWith("s")) {
    variantes.add(palavra.slice(0, -1));
  }

  // Palavras terminadas em "m" podem formar plural em "ns"
  if (palavra.endsWith("ns")) {
    variantes.add(palavra.slice(0, -1).replace(/n$/, "m"));
  }

  return [...variantes];
}

  function pesquisarProdutos(termo, categoriaId = "") {
  const app = window.ArtesDaCy;

  if (!app) return [];

  const consulta = normalizar(termo);

  const palavras = consulta
    .split(" ")
    .filter(Boolean);

  const palavrasBusca = palavras.map(variantesPalavra);

  return app.listarProdutos({ categoria: categoriaId })
    .filter(produto => {
      const categoria = app.buscarCategoria(produto.categoria);

      const conteudo = normalizar([
        produto.nome,
        produto.descricao,
        produto.medidas,
        produto.materiais,
        Array.isArray(produto.tags)
          ? produto.tags.join(" ")
          : produto.tags,
        categoria?.nome
      ].join(" "));

      const palavrasConteudo = conteudo.split(" ");

      return palavrasBusca.every(variantes =>
        variantes.some(variante =>
          palavrasConteudo.some(palavra =>
            palavra === variante
          )
        )
      );
    });
}

  function criarCampoBusca(opcoes = {}) {
    const id = opcoes.id || "buscaProdutos";
    const placeholder = opcoes.placeholder || "O que você procura?";
    const categoriaId = opcoes.categoria || "";

    return `
      <form class="formulario-busca" id="${id}Form" role="search">
        <label class="busca-campo">
          <span class="busca-icone" aria-hidden="true">⌕</span>
          <input
            id="${id}"
            type="search"
            name="q"
            placeholder="${escapar(placeholder)}"
            autocomplete="off"
            aria-label="Buscar produtos"
          >
          <button type="submit" class="botao-buscar">
            Buscar
          </button>
        </label>
      </form>
    `;
  }

  function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  window.ArtesDaCyBusca = {
    normalizar,
    pesquisarProdutos,
    criarCampoBusca
  };
})();

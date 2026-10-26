window.CATALOGO_PROMISE
  .then(iniciarPaginaCategoria)
  .catch(() => mostrarErroCategoria("Não foi possível carregar os produtos."));

function iniciarPaginaCategoria() {
  const app = window.ArtesDaCy;
  const busca = window.ArtesDaCyBusca;

  if (!app || !busca) {
    mostrarErroCategoria("Não foi possível carregar o catálogo.");
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const idInicial = parametros.get("categoria") || "";
  window.categoriaAtual = idInicial;
  const termoInicial = parametros.get("q") || "";

  const categoriaInicial = app.buscarCategoria(idInicial);
  const categoriaValida = categoriaInicial && categoriaInicial.ativa;

  const logo = document.getElementById("logoMarca");
  if (logo) logo.src = app.dados.configuracao.logo;

  definirTextoCategoria("anoAtual", new Date().getFullYear());

  if (idInicial && !categoriaValida) {
    mostrarErroCategoria();
    return;
  }

  document.title = categoriaValida
    ? `${categoriaInicial.nome} | Artes da Cy`
    : `Buscar produtos | Artes da Cy`;

  const topo = document.querySelector(".topo-categoria");
  if (topo) topo.hidden = false;

  definirTextoCategoria(
    "caminhoCategoria",
    categoriaValida ? categoriaInicial.nome : "Buscar produtos"
  );

  definirTextoCategoria(
    "tituloCategoria",
    categoriaValida ? categoriaInicial.nome : "Encontre seus produtos"
  );

  definirTextoCategoria(
    "descricaoCategoria",
    categoriaValida
      ? categoriaInicial.descricao
      : "Pesquise e explore as criações da Artes da Cy."
  );

  configurarFiltros(idInicial, termoInicial);
  atualizarResultados(idInicial, termoInicial);
}

function definirTextoCategoria(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor ?? "";
}

function configurarFiltros(idInicial, termoInicial) {
  const busca = window.ArtesDaCyBusca;
  const app = window.ArtesDaCy;

  const localBusca = document.getElementById("buscaCategoria");
  const seletor = document.getElementById("filtroCategoria");
  
  const seletorOrdem = document.getElementById("ordenarProdutos");

  if (seletorOrdem) {
  seletorOrdem.addEventListener("change", () => {
    atualizarResultados(
      window.categoriaAtual || "",
      obterTermoBusca()
    );
  });
}


  if (localBusca) {
    localBusca.innerHTML = busca.criarCampoBusca({
      id: "buscaCategoriaInput",
      placeholder: "Buscar produtos..."
    });

    const campo = document.getElementById("buscaCategoriaInput");

    campo.value = termoInicial;

    document.getElementById("buscaCategoriaInputForm")
      .addEventListener("submit", evento => {
        evento.preventDefault();
        atualizarEndereco(seletor.value, campo.value.trim());
      });

    campo.addEventListener("input", () => {
      atualizarResultados(seletor.value, campo.value);
    });
  }

  if (seletor) {
    app.listarCategorias().forEach(categoria => {
      const opcao = document.createElement("option");
      opcao.value = categoria.id;
      opcao.textContent = categoria.nome;
      seletor.appendChild(opcao);
    });

    seletor.value = idInicial;

    seletor.addEventListener("change", () => {
      atualizarEndereco(seletor.value, obterTermoBusca());
    });
  }
}

function obterTermoBusca() {
  const campo = document.getElementById("buscaCategoriaInput");
  return campo ? campo.value.trim() : "";
}

function atualizarEndereco(categoria, termo) {
  const parametros = new URLSearchParams();

  if (categoria) parametros.set("categoria", categoria);
  if (termo) parametros.set("q", termo);

  const consulta = parametros.toString();

  window.history.replaceState(
    {},
    "",
    consulta ? `categoria.html?${consulta}` : "categoria.html"
  );

  atualizarResultados(categoria, termo);
}

function atualizarResultados(idCategoria, termo) {
  const app = window.ArtesDaCy;
  const busca = window.ArtesDaCyBusca;
  const container = document.getElementById("listaProdutosCategoria");

  if (!container) return;

  const encontrados = busca.pesquisarProdutos(termo, idCategoria);
const criterio = document.getElementById("ordenarProdutos")?.value || "ordem";
const produtos = ordenarProdutos(encontrados, criterio);

  definirTextoCategoria(
    "quantidadeProdutos",
    produtos.length === 1
      ? "1 produto encontrado"
      : `${produtos.length} produtos encontrados`
  );

  if (!produtos.length) {
    container.innerHTML = `
      <p class="mensagem-vazia">
        Nenhum produto encontrado. Experimente outro termo ou categoria.
      </p>
    `;
    return;
  }

  container.innerHTML = produtos.map(produto => {
    const nome = app.escapar(produto.nome);
    const imagem = app.escapar(app.imagemPrincipal(produto));

    const categoria = app.buscarCategoria(produto.categoria);
    const nomeCategoria = categoria
      ? app.escapar(categoria.nome)
      : "";

    const precoVisivel =
      produto.exibirPreco === true &&
      produto.preco !== null &&
      produto.preco !== undefined;

    const preco = precoVisivel
      ? app.formatarPreco(produto.preco)
      : "Consulte o preço";

    const mensagem = app.linkWhatsApp(
      `Olá! Tenho interesse no produto ${produto.nome}. Poderia me passar mais informações?`
    );

    return `
      <article class="cartao-produto">
        <a href="produto.html?produto=${encodeURIComponent(produto.id)}">
          ${imagem
            ? `<img src="${imagem}" alt="${nome}" loading="lazy"
                    onerror="this.style.display='none'">`
            : ""}
          <div class="cartao-produto-conteudo">
            <h3>${nome}</h3>
            <p>${nomeCategoria}</p>
            <p class="preco">${app.escapar(preco)}</p>
          </div>
        </a>
        <a class="botao-contato"
   href="produto.html?produto=${encodeURIComponent(produto.id)}">
  Ver detalhes
</a>
      </article>
    `;
  }).join("");
}

function mostrarErroCategoria(mensagem) {
  const topo = document.querySelector(".topo-categoria");
  const listagem = document.querySelector(".secao-listagem");
  const aviso = document.getElementById("avisoCategoria");

  if (topo) topo.hidden = true;
  if (listagem) listagem.hidden = true;

  if (aviso) {
    aviso.hidden = false;

    if (mensagem) {
      const paragrafo = aviso.querySelector("p");
      if (paragrafo) paragrafo.textContent = mensagem;
    }
  }

  document.title = "Categoria indisponível | Artes da Cy";
}

function ordenarProdutos(produtos, criterio) {
  const lista = [...produtos];

  function ordemCadastro(a, b) {
    return (Number(a.ordem) || 0) - (Number(b.ordem) || 0);
  }

  function compararNome(a, b) {
    return String(a.nome || "").localeCompare(
      String(b.nome || ""),
      "pt-BR",
      { sensitivity: "base", numeric: true }
    );
  }

  function temPrecoVisivel(produto) {
    return produto.exibirPreco === true &&
      produto.preco !== null &&
      produto.preco !== undefined &&
      Number.isFinite(Number(produto.preco));
  }

  if (criterio === "nome") {
    return lista.sort(compararNome);
  }

  if (criterio === "menor-preco" || criterio === "maior-preco") {
    return lista.sort((a, b) => {
      const aTemPreco = temPrecoVisivel(a);
      const bTemPreco = temPrecoVisivel(b);

      // Produtos sem preço visível ficam no final.
      if (aTemPreco !== bTemPreco) {
        return aTemPreco ? -1 : 1;
      }

      // Se ambos não têm preço visível, mantém a ordem do cadastro.
      if (!aTemPreco) {
        return ordemCadastro(a, b);
      }

      const diferenca = Number(a.preco) - Number(b.preco);

      if (diferenca === 0) {
        return ordemCadastro(a, b);
      }

      return criterio === "menor-preco" ? diferenca : -diferenca;
    });
  }

  return lista.sort(ordemCadastro);
}

function obterCategoriaSelecionada() {
  return window.categoriaAtual || "";
}


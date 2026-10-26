window.CATALOGO_PROMISE.then(iniciarCatalogo).catch(console.error);
function iniciarCatalogo() {
  const app = window.ArtesDaCy;

  if (!app) {
    console.error("Artes da Cy: funções do catálogo não carregadas.");
    return;
  }

  const config = app.dados.configuracao;

  definirTexto("tituloCapa", config.tituloCapa);
  definirTexto("subtituloCapa", config.subtituloCapa);
  definirTexto("textoApresentacao", config.apresentacao);
  definirTexto("anoAtual", new Date().getFullYear());

  definirImagem("logoMarca", config.logo);
  definirImagem("imagemCapa", config.capa);

  document.title = `${config.marca} | Catálogo`;

  const linkWhatsApp = document.getElementById("linkWhatsApp");

  if (linkWhatsApp) {
    linkWhatsApp.href = app.linkWhatsApp();
  }

  renderizarCategorias();
  configurarBuscaInicio();
  renderizarProdutosDestaque();
}

function definirTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento && valor !== undefined && valor !== null) {
    elemento.textContent = valor;
  }
}

function definirImagem(id, caminho) {
  const elemento = document.getElementById(id);

  if (elemento && caminho) {
    elemento.src = caminho;
  }
}

function renderizarCategorias() {
  const app = window.ArtesDaCy;
  const container = document.getElementById("listaCategorias");

  if (!container) return;

  const categorias = app.listarCategorias();

  if (!categorias.length) {
    container.innerHTML =
      '<p class="mensagem-vazia">Nenhuma categoria cadastrada.</p>';
    return;
  }

  container.innerHTML = categorias.map(categoria => {
    const nome = app.escapar(categoria.nome);
    const descricao = app.escapar(categoria.descricao);
    const imagem = app.escapar(categoria.imagem || "");

    return `
      <a class="cartao-categoria"
         href="categoria.html?categoria=${encodeURIComponent(categoria.id)}">
        ${imagem
          ? `<img src="${imagem}" alt="${nome}" loading="lazy"
                  onerror="this.style.display='none'">`
          : ""}
        <h3>${nome}</h3>
        <p>${descricao}</p>
      </a>
    `;
  }).join("");
}

function configurarBuscaInicio() {
  const busca = window.ArtesDaCyBusca;
  const app = window.ArtesDaCy;
  const local = document.getElementById("buscaInicio");

  if (!busca || !local) return;

  local.innerHTML = busca.criarCampoBusca({
    id: "buscaInicioInput",
    placeholder: "Ex.: caixa personalizada, lembrancinha..."
  });

  const formulario = document.getElementById("buscaInicioInputForm");
  const campo = document.getElementById("buscaInicioInput");

  formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const termo = campo.value.trim();

    if (!termo) {
      campo.focus();
      return;
    }

    window.location.href =
      `categoria.html?q=${encodeURIComponent(termo)}`;
  });
}

function renderizarProdutosDestaque() {
  const app = window.ArtesDaCy;
  const container = document.getElementById("listaProdutos");

  if (!container) return;

  const produtos = app.listarProdutos({ destaque: true });

  if (!produtos.length) {
    container.innerHTML =
      '<p class="mensagem-vazia">Em breve, novidades em destaque.</p>';
    return;
  }

  container.innerHTML = produtos.map(criarCartaoProduto).join("");
}

function criarCartaoProduto(produto) {
  const app = window.ArtesDaCy;

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
          <p class="preco ${precoVisivel ? "" : "preco-consulta"}">
            ${app.escapar(preco)}
          </p>
        </div>
      </a>
      <a class="botao-contato"
         href="produto.html?produto=${encodeURIComponent(produto.id)}">
        Ver detalhes
      </a>
    </article>
  `;

}

window.CATALOGO_PROMISE
  .then(iniciarPaginaProduto)
  .catch(() => {
    console.error("Não foi possível carregar os dados do produto.");
  });

function iniciarPaginaProduto() {
  const app = window.ArtesDaCy;

  if (!app) {
    mostrarProdutoIndisponivel();
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const idProduto = parametros.get("produto");
  const produto = app.buscarProduto(idProduto);

  const config = app.dados.configuracao;

  const logo = document.getElementById("logoMarca");
  if (logo) logo.src = config.logo;

  definirTextoProduto("anoAtual", new Date().getFullYear());

  const linkWhatsApp = document.getElementById("linkWhatsApp");
  if (linkWhatsApp) {
    linkWhatsApp.href = app.linkWhatsApp();
  }

  if (!produto || !produto.ativo) {
    mostrarProdutoIndisponivel();
    return;
  }

  const categoria = app.buscarCategoria(produto.categoria);

  document.title = `${produto.nome} | ${config.marca}`;

  definirTextoProduto("caminhoProduto", produto.nome);
  definirTextoProduto("nomeProduto", produto.nome);
  definirTextoProduto("descricaoProduto", produto.descricao || "");

  definirTextoProduto(
    "categoriaProduto",
    categoria ? categoria.nome : "Produto artesanal"
  );

  const linkCategoria = document.getElementById("linkCategoria");

  if (linkCategoria && categoria) {
    linkCategoria.textContent = categoria.nome;
    linkCategoria.href =
      `categoria.html?categoria=${encodeURIComponent(categoria.id)}`;
  }

  mostrarPrecoProduto(produto);
  mostrarEspecificacao("Medidas", produto.medidas, "linhaMedidas", "medidasProduto");
  mostrarEspecificacao("Materiais", produto.materiais, "linhaMateriais", "materiaisProduto");
  montarGaleria(produto);
configurarWhatsApp(produto);
configurarCarrinho(produto);
mostrarOutrosProdutos(produto);
}

function definirTextoProduto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor ?? "";
  }
}

function mostrarPrecoProduto(produto) {
  const app = window.ArtesDaCy;
  const elemento = document.getElementById("precoProduto");

  if (!elemento) return;

  if (
    produto.exibirPreco === true &&
    produto.preco !== null &&
    produto.preco !== undefined
  ) {
    elemento.textContent = app.formatarPreco(produto.preco);
    elemento.hidden = false;
  } else {
    elemento.textContent = "Consulte o preço";
    elemento.hidden = false;
  }
}

function mostrarEspecificacao(rotulo, valor, idLinha, idTexto) {
  const linha = document.getElementById(idLinha);
  const texto = document.getElementById(idTexto);

  if (!linha || !texto) return;

  if (valor && String(valor).trim()) {
    texto.textContent = valor;
    linha.hidden = false;
  } else {
    linha.hidden = true;
  }
}

function montarGaleria(produto) {
  const app = window.ArtesDaCy;
  const imagemPrincipal = document.getElementById("imagemPrincipalProduto");
  const miniaturas = document.getElementById("miniaturasProduto");

  if (!imagemPrincipal || !miniaturas) return;

  const imagens = Array.isArray(produto.imagens)
    ? produto.imagens.filter(Boolean)
    : [];

  miniaturas.innerHTML = "";

  if (!imagens.length) {
    imagemPrincipal.removeAttribute("src");
    imagemPrincipal.alt = "Imagem não cadastrada para este produto";
    imagemPrincipal.classList.add("sem-imagem");
    return;
  }

  imagemPrincipal.classList.remove("sem-imagem");

  function selecionarImagem(caminho, indice) {
    imagemPrincipal.src = caminho;
    imagemPrincipal.alt = `${produto.nome} — foto ${indice + 1}`;

    miniaturas.querySelectorAll("button").forEach((botao, i) => {
      const selecionado = i === indice;

      botao.classList.toggle("selecionada", selecionado);
      botao.setAttribute("aria-pressed", String(selecionado));
    });
  }

  imagens.forEach((caminho, indice) => {
    const botao = document.createElement("button");
    const miniatura = document.createElement("img");

    botao.type = "button";
    botao.className = "miniatura-produto";
    botao.setAttribute(
      "aria-label",
      `Ver foto ${indice + 1} de ${produto.nome}`
    );
    botao.setAttribute("aria-pressed", "false");

    miniatura.src = caminho;
    miniatura.alt = "";
    miniatura.loading = "lazy";

    botao.appendChild(miniatura);

    botao.addEventListener("click", () => {
      selecionarImagem(caminho, indice);
    });

    miniaturas.appendChild(botao);
  });

  selecionarImagem(imagens[0], 0);

  imagemPrincipal.addEventListener("error", function tratarErro() {
    imagemPrincipal.alt = "Não foi possível carregar a foto deste produto";
    imagemPrincipal.classList.add("sem-imagem");
  }, { once: true });
}

function configurarWhatsApp(produto) {
  const app = window.ArtesDaCy;
  const botao = document.getElementById("botaoWhatsAppProduto");

  if (!botao) return;

  const mensagem =
    `Olá! Tenho interesse no produto ${produto.nome}. ` +
    "Poderia me passar mais informações sobre disponibilidade e personalização?";

  botao.href = app.linkWhatsApp(mensagem);
}

function mostrarOutrosProdutos(produtoAtual) {
  const app = window.ArtesDaCy;
  const secao = document.getElementById("outrosProdutos");
  const container = document.getElementById("listaOutrosProdutos");

  if (!secao || !container) return;

  const produtos = app.listarProdutos({
    categoria: produtoAtual.categoria
  }).filter(produto => produto.id !== produtoAtual.id);

  if (!produtos.length) {
    secao.hidden = true;
    return;
  }

  secao.hidden = false;

  container.innerHTML = produtos
    .slice(0, 4)
    .map(montarCartaoRelacionado)
    .join("");
}

function montarCartaoRelacionado(produto) {
  const app = window.ArtesDaCy;

  const nome = app.escapar(produto.nome);
  const imagem = app.escapar(app.imagemPrincipal(produto));

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
          ? `<img src="${imagem}" alt="${nome}" loading="lazy">`
          : ""}

        <div class="cartao-produto-conteudo">
          <h3>${nome}</h3>
          <p class="preco">${app.escapar(preco)}</p>
        </div>
      </a>

      <a class="botao-contato"
         href="${app.escapar(mensagem)}"
         target="_blank"
         rel="noopener noreferrer">
        Consultar
      </a>
    </article>
  `;
}

function mostrarProdutoIndisponivel() {
  const detalhes = document.getElementById("detalhesProduto");
  const indisponivel = document.getElementById("produtoIndisponivel");
  const outros = document.getElementById("outrosProdutos");

  if (detalhes) detalhes.hidden = true;
  if (outros) outros.hidden = true;
  if (indisponivel) indisponivel.hidden = false;

  document.title = "Produto indisponível | Artes da Cy";
}

function configurarCarrinho(produto) {
  const carrinho = window.ArtesDaCyCarrinho;
  const quantidade = document.getElementById("quantidadeProduto");
  const botao = document.getElementById("botaoAdicionarCarrinho");
  const mensagem = document.getElementById("mensagemCarrinho");
 
  const diminuir = document.getElementById("diminuirQuantidadeProduto");
  const aumentar = document.getElementById("aumentarQuantidadeProduto");

  if (diminuir && aumentar && quantidade) {
    diminuir.addEventListener("click", () => {
      const atual = Number(quantidade.value);
      quantidade.value = Math.max(
        1,
        (Number.isInteger(atual) && atual > 0 ? atual : 1) - 1
      );
    });

    aumentar.addEventListener("click", () => {
      const atual = Number(quantidade.value);
      quantidade.value =
        (Number.isSafeInteger(atual) && atual > 0 ? atual : 1) + 1;
    });
  }

  const contador = document.getElementById("contadorCarrinho");

  function atualizarContador() {
    if (carrinho && contador) {
      contador.textContent = carrinho.contarItens();
    }
  }

  atualizarContador();

  if (!carrinho || !quantidade || !botao) {
    console.error("Não foi possível inicializar o carrinho.");
    return;
  }

  botao.addEventListener("click", () => {
    const qtd = Number(quantidade.value);

    if (!Number.isSafeInteger(qtd) || qtd < 1) {
      mensagem.textContent =
        "Informe uma quantidade válida, a partir de 1.";
      quantidade.focus();
      return;
    }

    const adicionado = carrinho.adicionar(produto.id, qtd);

    if (!adicionado) {
      mensagem.textContent =
        "Não foi possível adicionar o produto. Tente novamente.";
      return;
    }

    atualizarContador();

    mensagem.textContent =
      `${qtd} unidade(s) de "${produto.nome}" adicionada(s) ao carrinho.`;

    quantidade.value = "1";
  });
}


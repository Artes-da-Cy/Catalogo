
(function () {
  "use strict";

  window.CATALOGO_PROMISE
    .then(iniciarCarrinho)
    .catch(erro => {
      console.error("Não foi possível iniciar o carrinho:", erro);
    });

  function iniciarCarrinho() {
    const app = window.ArtesDaCy;
    const carrinho = window.ArtesDaCyCarrinho;

    if (!app || !carrinho) {
      mostrarMensagem("Não foi possível carregar o carrinho. Atualize a página.");
      return;
    }

    const lista = document.getElementById("listaCarrinho");
    const resumo = document.getElementById("resumoCarrinho");
    const vazio = document.getElementById("carrinhoVazio");
    const contador = document.getElementById("contadorCarrinho");
    const totalUnidades = document.getElementById("totalUnidades");
    const totalCarrinho = document.getElementById("totalCarrinho");
    const avisoPreco = document.getElementById("avisoPreco");
    const botaoEnviar = document.getElementById("botaoEnviarPedido");
    const confirmacao = document.getElementById("confirmacaoEnvio");
    const botaoConfirmar = document.getElementById("botaoConfirmarEnvio");
    const botaoManter = document.getElementById("botaoManterCarrinho");

    const anoAtual = document.getElementById("anoAtual");
    if (anoAtual) anoAtual.textContent = new Date().getFullYear();

    const logo = document.getElementById("logoMarca");
    if (logo) logo.src = app.dados.configuracao.logo;

    let aguardandoConfirmacao = false;

    function mostrarMensagem(texto) {
      const elemento = document.getElementById("mensagemCarrinho");
      if (elemento) elemento.textContent = texto;
    }

    function atualizar() {
      const itens = carrinho.listar();
      const quantidadeTotal = carrinho.contarItens();
      const total = carrinho.calcularTotal();

      contador.textContent = quantidadeTotal;
      totalUnidades.textContent = quantidadeTotal;

      lista.innerHTML = "";
      vazio.hidden = itens.length > 0;
      resumo.hidden = itens.length === 0;

      if (!itens.length) {
        confirmacao.hidden = true;
        aguardandoConfirmacao = false;
        return;
      }

      avisoPreco.hidden = !itens.some(item => item.subtotal === null);

      totalCarrinho.textContent =
        total === null ? "Consulte os preços" : app.formatarPreco(total);

      itens.forEach(item => {
        const produto = app.buscarProduto(item.id);
        if (!produto) return;

        const cartao = document.createElement("article");
        cartao.className = "item-carrinho";

        const imagem = document.createElement("img");
        imagem.className = "imagem-item-carrinho";
        imagem.src = app.imagemPrincipal(produto);
        imagem.alt = produto.nome;
        imagem.loading = "lazy";

        const conteudo = document.createElement("div");
        conteudo.className = "conteudo-item-carrinho";

        const nome = document.createElement("h2");
        nome.className = "nome-item-carrinho";
        nome.textContent = item.nome;

        const preco = document.createElement("p");
        preco.className = "preco-item-carrinho";
        preco.textContent = item.exibirPreco
          ? app.formatarPreco(item.preco)
          : "Consulte o preço";

        const subtotal = document.createElement("p");
        subtotal.className = "subtotal-item-carrinho";
        subtotal.textContent = item.subtotal === null
          ? "Subtotal: a consultar"
          : `Subtotal: ${app.formatarPreco(item.subtotal)}`;

        const controles = document.createElement("div");
        controles.className = "controles-item-carrinho";

        const controleQtd = document.createElement("div");
        controleQtd.className = "controle-quantidade-carrinho";

        const diminuir = document.createElement("button");
        diminuir.type = "button";
        diminuir.textContent = "−";
        diminuir.setAttribute("aria-label", `Diminuir quantidade de ${item.nome}`);

        const quantidade = document.createElement("span");
        quantidade.className = "valor-quantidade-carrinho";
        quantidade.textContent = item.quantidade;

        const aumentar = document.createElement("button");
        aumentar.type = "button";
        aumentar.textContent = "+";
        aumentar.setAttribute("aria-label", `Aumentar quantidade de ${item.nome}`);

        diminuir.addEventListener("click", () => {
          carrinho.alterarQuantidade(item.id, item.quantidade - 1);
          confirmacao.hidden = true;
          aguardandoConfirmacao = false;
          atualizar();
        });

        aumentar.addEventListener("click", () => {
          carrinho.alterarQuantidade(item.id, item.quantidade + 1);
          confirmacao.hidden = true;
          aguardandoConfirmacao = false;
          atualizar();
        });

        controleQtd.append(diminuir, quantidade, aumentar);

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "botao-remover-item";
        remover.textContent = "Excluir item";

        remover.addEventListener("click", () => {
          carrinho.remover(item.id);
          confirmacao.hidden = true;
          aguardandoConfirmacao = false;
          mostrarMensagem(`${item.nome} foi removido do carrinho.`);
          atualizar();
        });

        controles.append(controleQtd, remover);
        conteudo.append(nome, preco, subtotal, controles);
        cartao.append(imagem, conteudo);
        lista.appendChild(cartao);
      });

      if (!aguardandoConfirmacao) {
        confirmacao.hidden = true;
      }
    }

    botaoEnviar.addEventListener("click", () => {
      const itens = carrinho.listar();

      if (!itens.length) {
        mostrarMensagem("Seu carrinho está vazio.");
        return;
      }

      const linhas = itens.map(item => {
        const valor = item.subtotal === null
          ? "preço a consultar"
          : app.formatarPreco(item.subtotal);

        return `- ${item.nome} | Quantidade: ${item.quantidade} | ${valor}`;
      });

      const total = carrinho.calcularTotal();

      const mensagem = [
        `Olá! Gostaria de fazer uma encomenda na ${app.dados.configuracao.marca}.`,
        "",
        "Meu pedido:",
        ...linhas,
        "",
        `Total de unidades: ${carrinho.contarItens()}`,
        `Total dos produtos: ${
          total === null ? "a consultar" : app.formatarPreco(total)
        }`,
        "",
        "Gostaria de confirmar a disponibilidade e o prazo de produção."
      ].join("\n");

      const url = app.linkWhatsApp(mensagem);
      const janela = window.open(url, "_blank");

      if (!janela) {
        window.location.href = url;
      }

      aguardandoConfirmacao = true;
      confirmacao.hidden = false;
      mostrarMensagem(
        "Confira o pedido no WhatsApp. Depois de enviar a mensagem, volte aqui para limpar o carrinho."
      );
    });

    botaoConfirmar.addEventListener("click", () => {
      if (!aguardandoConfirmacao) return;

      carrinho.limpar();
      aguardandoConfirmacao = false;
      confirmacao.hidden = true;
      mostrarMensagem("Carrinho limpo. Você já pode montar um novo pedido.");
      atualizar();
    });

    botaoManter.addEventListener("click", () => {
      aguardandoConfirmacao = false;
      confirmacao.hidden = true;
      mostrarMensagem("Tudo certo. Seu carrinho foi mantido.");
    });

    atualizar();
  }

  function mostrarMensagem(texto) {
    const elemento = document.getElementById("mensagemCarrinho");
    if (elemento) elemento.textContent = texto;
  }
})();

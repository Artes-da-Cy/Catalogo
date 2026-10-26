
(function () {
  "use strict";

  const CHAVE_CARRINHO = "artesDaCy_carrinho";

  function lerCarrinho() {
    try {
      const dados = JSON.parse(
        localStorage.getItem(CHAVE_CARRINHO) || "[]"
      );

      if (!Array.isArray(dados)) return [];

      return dados.filter(item =>
        item &&
        typeof item.id === "string" &&
        Number.isInteger(item.quantidade) &&
        item.quantidade > 0
      );
    } catch (erro) {
      console.error("Erro ao ler o carrinho:", erro);
      return [];
    }
  }

  function salvarCarrinho(itens) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
  }

  function adicionar(id, quantidade = 1) {
    const app = window.ArtesDaCy;

    if (!app) return false;

    const produto = app.buscarProduto(id);
    const qtd = Math.floor(Number(quantidade));

    if (
      !produto ||
      produto.ativo !== true ||
      !Number.isInteger(qtd) ||
      qtd < 1
    ) {
      return false;
    }

    const itens = lerCarrinho();
    const existente = itens.find(item => item.id === id);

    if (existente) {
      existente.quantidade += qtd;
    } else {
      itens.push({
        id: id,
        quantidade: qtd
      });
    }

    salvarCarrinho(itens);
    return true;
  }

  function alterarQuantidade(id, quantidade) {
    const qtd = Math.floor(Number(quantidade));

    if (!Number.isInteger(qtd) || qtd < 1) {
      return remover(id);
    }

    const itens = lerCarrinho();
    const item = itens.find(item => item.id === id);

    if (!item) return false;

    item.quantidade = qtd;
    salvarCarrinho(itens);

    return true;
  }

  function remover(id) {
    const itens = lerCarrinho();
    const atualizados = itens.filter(item => item.id !== id);

    salvarCarrinho(atualizados);
    return atualizados.length !== itens.length;
  }

  function limpar() {
    localStorage.removeItem(CHAVE_CARRINHO);
  }

  function listar() {
    const app = window.ArtesDaCy;

    if (!app) return [];

    return lerCarrinho()
      .map(item => {
        const produto = app.buscarProduto(item.id);

        if (!produto || produto.ativo !== true) {
          return null;
        }

        return {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          exibirPreco: produto.exibirPreco === true,
          quantidade: item.quantidade,
          subtotal:
            produto.exibirPreco === true &&
            produto.preco !== null &&
            produto.preco !== undefined
              ? Number(produto.preco) * item.quantidade
              : null
        };
      })
      .filter(Boolean);
  }

  function contarItens() {
    return listar().reduce(
      (total, item) => total + item.quantidade,
      0
    );
  }

  function calcularTotal() {
    const itens = listar();

    if (itens.some(item => item.subtotal === null)) {
      return null;
    }

    return itens.reduce(
      (total, item) => total + item.subtotal,
      0
    );
  }

  window.ArtesDaCyCarrinho = {
    adicionar,
    alterarQuantidade,
    remover,
    limpar,
    listar,
    contarItens,
    calcularTotal
  };
})();

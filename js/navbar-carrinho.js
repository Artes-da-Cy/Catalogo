
(function () {
  "use strict";

  const CHAVE_CARRINHO = "artesDaCy_carrinho";

  function contarUnidades() {
    try {
      const itens = JSON.parse(
        localStorage.getItem(CHAVE_CARRINHO) || "[]"
      );

      if (!Array.isArray(itens)) return 0;

      return itens.reduce((total, item) => {
        const quantidade = Number(item.quantidade);

        if (
          typeof item.id === "string" &&
          Number.isSafeInteger(quantidade) &&
          quantidade > 0
        ) {
          return total + quantidade;
        }

        return total;
      }, 0);
    } catch (erro) {
      console.error("Erro ao consultar o carrinho:", erro);
      return 0;
    }
  }

  function criarBotao() {
    if (document.getElementById("botaoFlutuanteCarrinho")) {
      return;
    }

    const botao = document.createElement("a");
    botao.id = "botaoFlutuanteCarrinho";
    botao.className = "botao-flutuante-carrinho";
    botao.href = "carrinho.html";
    botao.setAttribute("aria-label", "Abrir carrinho");

    const icone = document.createElement("span");
    icone.className = "icone-flutuante-carrinho";
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = "🛒";

    const texto = document.createElement("span");
    texto.textContent = "Carrinho";

    const contador = document.createElement("span");
    contador.id = "contadorFlutuanteCarrinho";
    contador.className = "contador-flutuante-carrinho";
    contador.setAttribute("aria-label", "Unidades no carrinho");

    botao.append(icone, texto, contador);
    document.body.appendChild(botao);

    atualizarContador();
  }

  function atualizarContador() {
    const contador = document.getElementById(
      "contadorFlutuanteCarrinho"
    );

    if (contador) {
      contador.textContent = contarUnidades();
    }
  }

  function iniciar() {
    criarBotao();

    window.addEventListener("storage", atualizarContador);

    // Mantém a contagem atualizada quando o carrinho muda
    // na mesma página.
    window.addEventListener(
      "artesDaCyCarrinhoAtualizado",
      atualizarContador
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();


(function () {
  "use strict";

  window.CATALOGO_PROMISE = fetch("/api/catalog")
    .then(resposta => {
      if (!resposta.ok) {
        throw new Error(
          `Não foi possível carregar o catálogo da API (${resposta.status}).`
        );
      }

      return resposta.json();
    })
    .then(dados => {
      if (
        !dados ||
        !Array.isArray(dados.categorias) ||
        !Array.isArray(dados.produtos) ||
        !dados.configuracao
      ) {
        throw new Error("A estrutura recebida para o catálogo está incorreta.");
      }

      window.CATALOGO_DADOS = dados;
      return dados;
    })
    .catch(erro => {
      console.error("Erro ao carregar o catálogo:", erro);

      document.addEventListener("DOMContentLoaded", () => {
        const aviso = document.createElement("p");

        aviso.className = "mensagem-vazia";
        aviso.textContent =
          "Não foi possível carregar o catálogo. Tente novamente mais tarde.";

        document.body.prepend(aviso);
      });

      throw erro;
    });
})();

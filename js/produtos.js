
(function () {
  "use strict";

  function removerComentarios(texto) {
    let resultado = "";
    let dentroString = false;
    let escape = false;

    for (let i = 0; i < texto.length; i++) {
      const atual = texto[i];
      const proximo = texto[i + 1];

      if (dentroString) {
        resultado += atual;

        if (escape) {
          escape = false;
        } else if (atual === "\\") {
          escape = true;
        } else if (atual === '"') {
          dentroString = false;
        }

        continue;
      }

      if (atual === '"') {
        dentroString = true;
        resultado += atual;
        continue;
      }

      if (atual === "/" && proximo === "*") {
        i += 2;

        while (
          i < texto.length &&
          !(texto[i] === "*" && texto[i + 1] === "/")
        ) {
          i++;
        }

        i++;
        continue;
      }

      if (atual === "/" && proximo === "/") {
        while (i < texto.length && texto[i] !== "\n") {
          i++;
        }

        resultado += "\n";
        continue;
      }

      resultado += atual;
    }

    return resultado;
  }

  window.CATALOGO_PROMISE = fetch("produtos.json")
    .then(resposta => {
      if (!resposta.ok) {
        throw new Error(
          `Não foi possível carregar produtos.json (${resposta.status}).`
        );
      }

      return resposta.text();
    })
    .then(texto => {
      const dados = JSON.parse(removerComentarios(texto));

      if (
        !dados ||
        !Array.isArray(dados.categorias) ||
        !Array.isArray(dados.produtos) ||
        !dados.configuracao
      ) {
        throw new Error("A estrutura de produtos.json está incorreta.");
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
          "Não foi possível carregar o catálogo. Confira o arquivo produtos.json.";

        document.body.prepend(aviso);
      });

      throw erro;
    });
})();

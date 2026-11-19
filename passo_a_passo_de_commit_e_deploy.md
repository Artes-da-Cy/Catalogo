# Commit no GitHub e deploy no Cloudflare

## 1. Enviar as alterações ao GitHub

Abra o CMD e execute:

```cmd
cd /d "C:\Users\syssy\Documents\artesdacy"
git add -A
git commit -m "novos arquivos"
git push origin main
```

- `git add -A` prepara todas as alterações, sem precisar listar arquivos ou extensões.
- `git commit` salva as alterações localmente.
- `git push origin main` envia o commit para a branch `main` no GitHub.

Se `git` não for reconhecido, execute primeiro:

```cmd
set "PATH=%LOCALAPPDATA%\GitHubDesktop\app-3.5.2\resources\app\git\cmd;%PATH%"
```

## 2. Publicar no Cloudflare

O projeto usa **Direct Upload**. O `git push` não publica o site. Na pasta do projeto, execute:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\deploy-pages.ps1"
```

Na primeira utilização, autentique-se antes:

```cmd
npx.cmd wrangler login
```

Ao terminar, confira o endereço informado pelo Wrangler ou veja a implantação em **Cloudflare → Workers & Pages → artesdacy → Deployments**.

O logo e a capa são carregados do R2 por `/api/media?key=site/...`; as imagens de categorias e produtos também vêm do catálogo no D1 e do R2. A pasta local `imagens/` serve como origem para o script de envio ao R2, mas não precisa ir para o Pages. O antigo `produtos.json` também não é usado pelo site. O deploy envia somente as páginas e as pastas `css` e `js`; as Pages Functions são compiladas de `functions/`.

**Importante:** não envie `.dev.vars` nem credenciais ao GitHub. O deploy não aplica automaticamente as migrações SQL do D1. Como o projeto usa bindings remotos, alterações feitas pelo admin podem afetar os dados de produção.

visualizar site localmente
npx.cmd wrangler pages dev . --port 8788
ctrl+C para encerrar
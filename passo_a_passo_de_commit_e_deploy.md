# Commit no GitHub e deploy no Cloudflare

## 1. Enviar as alterações ao GitHub

Abra o CMD e execute:

```cmd
cd /d "C:\Users\syssy\Documents\artesdacy"
git add -A
git commit -m "Descreva a alteração"
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

O projeto usa **Direct Upload**. O `git push` não publica o site; faça o deploy separadamente, na pasta do projeto:

```cmd
npx.cmd wrangler pages deploy . --project-name artesdacy --branch production
```

Na primeira utilização, autentique-se antes:

```cmd
npx.cmd wrangler login
```

Ao terminar, confira o endereço informado pelo Wrangler ou veja a implantação em **Cloudflare → Workers & Pages → artesdacy → Deployments**.

**Importante:** não envie `.dev.vars` nem credenciais ao GitHub. O deploy não aplica automaticamente as migrações SQL do D1. Como o projeto usa bindings remotos, alterações feitas pelo admin podem afetar os dados de produção.
# Artes da Cy

Site estático em Cloudflare Pages com Pages Functions, catálogo no D1 e
imagens no R2. O catálogo do navegador não usa arquivo JSON local.

## Cloudflare Pages, D1 e R2

1. Autentique pelo Wrangler com `npx wrangler login`.
2. Crie D1 e R2 (`artesdacy` e `artesdacy-media`) e configure o ID do banco em
   `wrangler.toml`.
3. Aplique as migrações:

   ```powershell
   npx.cmd wrangler d1 migrations apply artesdacy --remote
   ```

4. Cadastre as credenciais OAuth e o segredo de sessão como secrets do Pages,
   conforme a seção de login abaixo.
5. Envie as imagens locais de exemplo para o R2 com
   `.\scripts\upload-images.ps1`. O script limita cada arquivo a 300 KB.
6. Publique:

   ```powershell
   npx.cmd wrangler pages deploy . --project-name artesdacy
   ```

## Login Google do painel administrativo

O middleware protege `/admin.html`; as páginas da loja e a API pública do
catálogo continuam sem login. A URI de retorno OAuth é:

```text
https://artesdacy.pages.dev/api/auth/callback
```

Cadastre essa URI como redirecionamento autorizado no cliente OAuth do Google.
No Pages, defina estes secrets:

```powershell
npx.cmd wrangler pages secret put GOOGLE_CLIENT_ID --project-name artesdacy
npx.cmd wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name artesdacy
npx.cmd wrangler pages secret put SESSION_SECRET --project-name artesdacy
```

O login aceita somente `syssy.ana.dc@gmail.com`, exige e-mail verificado e cria
uma sessão assinada, HttpOnly, SameSite=Lax, válida por até oito horas e
armazenada como cookie de sessão do navegador.
`SESSION_SECRET` deve ser aleatório e ter pelo menos 32 caracteres. Em
desenvolvimento local, use um `.dev.vars` não versionado com esses três
valores.

### Executar localmente

O Live Server (porta 5500) serve apenas arquivos estáticos: ele não executa o
login, as Pages Functions, a API, o D1 ou o R2. Para testar o site completo,
use o servidor local do Cloudflare Pages:

1. Copie `.dev.vars.example` para `.dev.vars` e preencha as credenciais OAuth e
   um `SESSION_SECRET` aleatório. Não publique nem compartilhe esse arquivo.
2. No cliente OAuth do Google, autorize
   `http://127.0.0.1:8788/api/auth/callback` como URI de redirecionamento.
3. Crie o D1 local e aplique as migrações e os dados de demonstração:

   ```powershell
   npx.cmd wrangler d1 migrations apply artesdacy --local
   ```

4. Inicie o Pages Functions:

   ```powershell
   npx.cmd wrangler pages dev . --port 8788
   ```

5. Acesse `http://127.0.0.1:8788/admin.html`.

O D1 e o R2 locais são separados dos recursos de produção; alterações feitas
localmente não atualizam o catálogo publicado. O botão Sair e as APIs também
funcionam localmente por meio desse servidor. O `.dev.vars` é carregado pelo
Wrangler e está excluído do Git.

## Dados e imagens

O catálogo é carregado do D1 por `GET /api/catalog`. Produtos e categorias
são administrados em `/admin.html` e persistidos no D1 por `/api/admin/*`.
Essas operações exigem sessão Google e validação de origem.

Imagens são servidas publicamente de `GET /api/media?key=...`. O painel
autenticado envia JPG/JPEG e PNG para o R2; arquivos AVIF são convertidos para
JPEG no navegador. O limite é de 300 KB (300.000 bytes) por arquivo: JPEG pode
ter dimensões e qualidade reduzidas automaticamente; PNG mantém transparência e
é redimensionado sem compressão com perda. Se ainda exceder o limite, otimize a
imagem antes do envio. Um produto pode ter várias imagens; as URLs delas são
armazenadas no D1. Cada categoria possui uma imagem.

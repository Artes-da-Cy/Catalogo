export function onRequest() {
  return new Response("O catálogo JSON foi removido. Use a API do catálogo.", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

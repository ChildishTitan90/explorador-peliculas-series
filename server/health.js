export default function health(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.statusCode = 405;
    response.end(JSON.stringify({ error: "Método no permitido." }));
    return;
  }
  response.statusCode = 200;
  response.end(JSON.stringify({ status: "ok" }));
}

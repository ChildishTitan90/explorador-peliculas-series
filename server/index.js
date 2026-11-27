import { createServer } from "node:http";
import health from "./health.js";
import auth from "./auth.js";
import account from "./account.js";
import activity from "./activity.js";
import { closeDatabases } from "./databases.js";

const port = Number(process.env.SERVER_PORT || 3001);
const server = createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/api/activity") {
    activity(request, response);
    return;
  }
  if (path.startsWith("/api/account/")) {
    account(request, response);
    return;
  }
  if (path.startsWith("/api/auth/")) {
    auth(request, response);
    return;
  }
  if (path === "/api/health") {
    health(request, response);
    return;
  }
  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Ruta no encontrada." }));
});

server.listen(port, "127.0.0.1", () => {
  console.log("Servidor de Cinepollis disponible en http://127.0.0.1:" + port);
});

async function shutdown() {
  server.close();
  server.closeIdleConnections();
  await closeDatabases();
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

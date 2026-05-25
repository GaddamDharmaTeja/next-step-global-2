import http from "node:http";
import next from "next";
import nextEnv from "@next/env";
import app from "./server/app";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const dev = process.env.NODE_ENV !== "production";
const host = process.env.HOST || "0.0.0.0";
const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const nextApp = next({ dev, hostname: host, port });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

app.all(/.*/, (req, res) => handle(req, res));

http.createServer(app).listen(port, host, () => {
  console.log(`NextStep app listening on http://${host}:${port}`);
});

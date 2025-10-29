import WebScocket, { WebSocketServer } from "ws";
import { createClient } from "redis";

import express from "express";

const app = express();
const httpServer = app.listen(3001);

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  console.log("Frontend connected");
});

async function main() {
  const redis = createClient();
  await redis.connect();

  await redis.subscribe("binance:livePrice", (message) => {
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        console.log("sending to client : ", message);
        client.send(message);
      }
    }
  });
}

main().catch(console.error);

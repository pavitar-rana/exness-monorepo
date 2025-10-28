import WebSocket, { WebSocketServer } from "ws";
import { Queue } from "bullmq";
import { createClient } from "redis";

async function main() {
  const myQueue = new Queue("pricePooler");

  const redis = createClient();
  await redis.connect();

  const socket = new WebSocket(
    "wss://stream.binance.com:9443/stream?streams=btcusdt@kline_1s/solusdt@kline_1s/ethusdt@kline_1s",
  );
  socket.onopen = () => {
    console.log("WebSocket is connected");
  };

  socket.onmessage = async (e) => {
    const data = JSON.parse(e.data.toString());

    const sendD = {
      k: data.data.k,
      symbol: data.data.k.s,
      price: {
        bid: parseFloat((parseFloat(data.data.k.c) - 10).toFixed()),
        ask: parseFloat((parseFloat(data.data.k.c) + 10).toFixed()),
      },
    };

    await redis.publish("binance:livePrice", JSON.stringify(sendD));
    await myQueue.add("priceToDB", sendD, { removeOnComplete: true });
  };
}

main().catch(console.error);

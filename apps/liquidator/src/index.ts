import { prisma } from "@repo/db";
import { createClient } from "redis";

const redis = createClient();

await redis.connect();

const activeTrades: any[] = [];
const trades = await prisma.trade.findMany({
  where: {
    isClosed: false,
  },
});

activeTrades.push(...trades);

await redis.subscribe("user:activeTrades", async (data) => {
  try {
    const trade = JSON.parse(data);

    activeTrades.push(trade);

    console.log(`Removed active trade ${trade.id} (side: ${trade.side})`);
  } catch (err) {
    console.error("Error parsing trade data:", err);
  }
});

await redis.subscribe("user:closedTrades", async (data) => {
  try {
    const trade = JSON.parse(data);

    const index = activeTrades.findIndex((t) => t.id === trade.id);
    if (index !== -1) activeTrades.splice(index, 1);

    console.log(`Added active trade ${trade.id} (side: ${trade.side})`);
  } catch (err) {
    console.error("Error parsing trade data:", err);
  }
});

await redis.subscribe("binance:livePrice", async (data) => {
  try {
    const parsed = JSON.parse(data);
    const { price } = parsed;

    if (!price?.bid || !price?.ask) {
      console.warn("Invalid price payload:", parsed);
      return;
    }

    console.log("liveTrades : ", activeTrades);

    for (const trade of activeTrades) {
      let pnl: number;

      if (trade.side === "CALL") {
        pnl = (price.bid - Number(trade.price)) * Number(trade.quantity);
      } else {
        pnl = (Number(trade.price) - price.ask) * Number(trade.quantity);
      }

      if (pnl > Number(trade.amount)) {
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            isClosed: true,
            closedAt: new Date(),
            closePrice: trade.side === "CALL" ? price.bid : price.ask,
            pnl,
          },
        });

        console.log(`Trade ${trade.id} closed, PnL: ${pnl}`);

        const index = activeTrades.findIndex((t) => t.id === trade.id);
        if (index !== -1) activeTrades.splice(index, 1);
      }
    }
  } catch (err) {
    console.error("Error getting live price:", err);
  }
});

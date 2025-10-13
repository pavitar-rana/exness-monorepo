import { prisma } from "@repo/db";
import { createClient } from "redis";

const redis = createClient();
await redis.connect();

const activeTrades: any[] = [];
const closingTrades = new Set<string>(); // prevent double-close

// Load all open trades at startup
const trades = await prisma.trade.findMany({
  where: { isClosed: false },
});
activeTrades.push(...trades);

console.log(`Loaded ${activeTrades.length} active trades.`);

await redis.subscribe("user:activeTrades", async (data) => {
  try {
    const trade = JSON.parse(data);
    activeTrades.push(trade);
    console.log(`Added active trade ${trade.id} (${trade.side})`);
  } catch (err) {
    console.error("Error parsing active trade:", err);
  }
});

await redis.subscribe("user:closedTrades", async (data) => {
  try {
    const trade = JSON.parse(data);
    const index = activeTrades.findIndex((t) => t.id === trade.id);
    if (index !== -1) activeTrades.splice(index, 1);
    console.log(`Removed closed trade ${trade.id} (${trade.side})`);
  } catch (err) {
    console.error("Error parsing closed trade:", err);
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

    for (const trade of activeTrades) {
      if (closingTrades.has(trade.id)) continue;

      let pnl: number;
      if (trade.side === "CALL") {
        pnl = (price.bid - Number(trade.price)) * Number(trade.quantity);
      } else {
        pnl = (Number(trade.price) - price.ask) * Number(trade.quantity);
      }

      const stopLoss = Number(trade.stopLoss);
      const takeProfit = Number(trade.takeProfit);
      const tradeAmount = Number(trade.amount);

      const stopHit = pnl <= -stopLoss;
      const takeHit = takeProfit !== 0 && pnl >= takeProfit;
      const invalidPnL = Math.abs(pnl) > tradeAmount;

      if (stopHit || takeHit || invalidPnL) {
        closingTrades.add(trade.id);
        console.log(
          `Closing trade ${trade.id} — PnL: ${pnl.toFixed(2)} | StopLoss: ${stopLoss} | TakeProfit: ${takeProfit}`,
        );

        try {
          const user = await prisma.user.findUnique({
            where: { id: trade.userId },
          });

          if (user) {
            await prisma.trade.update({
              where: { id: trade.id },
              data: {
                isClosed: true,
                closedAt: new Date(),
                closePrice: trade.side === "CALL" ? price.bid : price.ask,
                pnl,
              },
            });

            const usdToUpdate =
              parseFloat(user.usd.toFixed(2)) +
              parseFloat(trade.amount) +
              parseFloat(pnl.toFixed(2));

            await prisma.user.update({
              where: { id: user.id },
              data: { usd: usdToUpdate },
            });

            console.log(`Trade ${trade.id} closed successfully.`);
          }

          const index = activeTrades.findIndex((t) => t.id === trade.id);
          if (index !== -1) activeTrades.splice(index, 1);
        } catch (err) {
          console.error(`Error closing trade ${trade.id}:`, err);
        } finally {
          closingTrades.delete(trade.id); // allow cleanup
        }
      }
    }
  } catch (err) {
    console.error("Error processing live price:", err);
  }
});

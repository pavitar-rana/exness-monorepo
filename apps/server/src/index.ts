import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "@repo/db";

import { getToken } from "next-auth/jwt";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let bid = 0;
let ask = 0;

const socket = new WebSocket("ws://localhost:3001");

socket.onopen = () => {
  console.log("connected to websocket");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  bid = data.price.bid;
  ask = data.price.ask;
};
// server/index.ts
const verifyUser = async (req, res, next) => {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  req.user = token;
  next();
};

app.get("/", (req, res) => {
  return res.json({ message: "hi there from root" });
});

app.post("/buy", verifyUser, async (req: any, res) => {
  const { id } = req.query;
  // console.log("user : ", req.user);
  // console.log("user Id : ", id);
  if (ask !== 0 || bid !== 0) {
    const buyD = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Not Authorized" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (buyD.leverage === 1) {
      const quantity = parseFloat((buyD.amount / ask).toFixed(5));

      // console.log("quantity : ", quantity);
      // console.log("buyD.amount : ", buyD.amount);
      // console.log("ask : ", ask);
      if (user.usd < buyD.amount) {
        return res.json({ message: "Insufficient balance" });
      }

      const trade = await prisma.trade.create({
        data: {
          userId: user.id,
          symbol: buyD.symbol,
          amount: buyD.amount,
          side: "CALL",
          price: ask,
          quantity,
          leverage: buyD.leverage,
          exposure: buyD.amount,
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { usd: Number(user.usd) - buyD.amount },
      });

      return res.json({
        message: "Purchase successful",
        user: updatedUser,
        trade,
      });
    } else {
      const collateral = buyD.amount;
      const leverage = buyD.leverage;
      const exposure = parseFloat((collateral * leverage).toFixed(2));

      const quantity = parseFloat((exposure / ask).toFixed(5));
      // console.log("quantity : ", quantity);
      // console.log("exposure : ", exposure);
      // console.log("ask : ", ask);
      if (user.usd < buyD.amount) {
        return res.json({ message: "Insufficient bala" });
      }

      const trade = await prisma.trade.create({
        data: {
          userId: user.id,
          amount: buyD.amount,
          symbol: buyD.symbol,
          side: "CALL",
          price: ask,
          quantity,
          exposure: exposure,
          leverage: leverage,
        },
      });
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { usd: Number(user.usd) - buyD.amount },
      });
      return res.json({
        message: "Purchase successful",
        user: updatedUser,
        trade,
      });
    }
  }
  return res.json({ message: "Error" });
});

app.post("/sell", verifyUser, async (req: any, res) => {
  if (ask !== 0 || bid !== 0) {
    const sellD = req.body;

    console.log("selld : ", sellD);

    if (!req.user) {
      return res.status(401).json({ error: "Not Authorized" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const collateral = sellD.amount;
    const leverage = sellD.leverage;
    const exposure = parseFloat((collateral * leverage).toFixed(2));
    const quantity = parseFloat((exposure / ask).toFixed(5));

    if (Number(user.usd) < sellD.amount) {
      return res.json({ message: "Insufficient bala" });
    }

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        amount: sellD.amount,
        symbol: sellD.symbol,
        side: "PUT",
        price: ask,
        quantity,
        exposure: exposure,
        leverage: leverage,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { usd: Number(user.usd) - sellD.amount },
    });
    return res.json({ message: "Sell confirmeed", user: updatedUser, trade });
  }
});

app.post("/close", async (req, res) => {
  if (ask !== 0 || bid !== 0) {
    const { id } = req.query;
    const { trade } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        id: (id as string) || "",
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tradeToRemove = await prisma.trade.findUnique({
      where: {
        id: trade.id,
      },
    });

    if (!tradeToRemove) {
      return res.status(404).json({ error: "Trade not found" });
    }
    let liq;

    if (trade.side == "CALL") {
      console.log("trade", trade);
      console.log("bid: ", bid);
      liq =
        Number(trade.amount) +
        (bid - Number(trade.price)) * Number(trade.volume);
    } else {
      liq =
        Number(trade.amount) +
        (Number(trade.price) - ask) * Number(trade.volume);
    }

    const tradee = await prisma.trade.update({
      where: {
        id: trade.id,
      },
      data: {
        isClosed: true,
        closePrice: bid,
        pnl: liq,
        closedAt: new Date(),
      },
    });

    console.log("liq : ", liq);
    console.log("user.usd : ", user?.usd);

    const usdToUpdate =
      parseFloat(user.usd.toFixed(2)) + parseFloat(liq.toFixed(2));

    console.log("usdToUpdate : ", usdToUpdate);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        usd: usdToUpdate,
      },
    });

    return res.json({ message: "closing", user: updatedUser, trade: tradee });
  }
});

app.get("/balance", async (req, res) => {
  const { id } = req.query;

  console.log("fetching for id : ", id);
  const user = await prisma.user.findUnique({
    where: {
      id: (id as string) || "",
    },
    include: {
      Balance: true,
    },
  });

  if (!user) {
    return res.json(404).json({ error: "user not found" });
  }

  const history = user?.Balance.filter((t) => t.isClosed === true);

  const openTrades = user.Balance.filter((t) => t.isClosed === false);

  return res.json({
    message: "Found user",
    user: {
      ...user,
      Balance: openTrades,
    },
    history,
  });
});

app.listen(3002, () => {
  console.log("Server started");
});

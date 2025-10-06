import express from "express";
import cors from "cors";
import { isPropertyAccessChain } from "typescript";

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    usd: 5000,
    balance: [],
  },
];

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

app.get("/", (req, res) => {
  return res.json({ message: "hi there from root" });
});

app.post("/buy", (req, res) => {
  if (ask !== 0 || bid !== 0) {
    const { id } = req.query;
    const buyD = req.body;
    const user = users.find((u) => (u.id = id));
    if (buyD.leverage === 1) {
      const quantity = parseFloat((buyD.amount / ask).toFixed(5));

      const data = {
        ...buyD,
        quantity,
        side: "CALL",
        amount: buyD.amount,
        price: ask,
      };

      if (user.usd < buyD.amount) {
        return res.json({ message: "Insufficient bala" });
      }

      user.usd -= buyD.amount;
      user.balance.push(data);
      return res.json({ message: "Purchase successful", user });
    }
    return res.json({ message: "Error" });
  } else {
    const collateral = buyD.amount;
    const leverage = buyD.leverage;
    const exposure = parseFloat((collateral * leverage).toFixed(2));
  }
});

app.post("/sell", (req, res) => {
  if (ask !== 0 || bid !== 0) {
    const { id } = req.query;
    const sellD = req.body;

    const user = users.find((u) => u.id == id);
    const quantity = parseFloat((sellD.amount / ask).toFixed(5));

    const data = {
      ...sellD,
      quantity,
      side: "PUT",
      amount: sellD.amount,
      price: bid,
    };

    if (user.usd < sellD.amount) {
      return res.json({ message: "Insufficient bala" });
    }

    user.balance.push(data);
    user.usd -= sellD.amount;
    return res.json({ message: "Sell confirmeed", user });
  }
});

app.post("/close", (req, res) => {
  if (ask !== 0 || bid !== 0) {
    const { id } = req.query;
    const { trade } = req.body;
    const user = users.find((u) => u.id == id);

    const removeIndex = user.balance.findIndex((t) => t.id === trade.id);
    let liq;

    if (trade.side == "CALL") {
      console.log("trade", trade);
      console.log("bid: ", bid);
      liq = trade.amount + (bid - trade.price) * trade.volume;
    } else {
      liq = trade.amount + (trade.price - ask) * trade.volume;
    }

    if (removeIndex !== -1) {
      user.balance.splice(removeIndex, 1); // remove the trade
    }

    console.log("liq : ", liq);
    console.log("user.usd : ", user.usd);

    user.usd = parseFloat(user.usd.toFixed(2)) + parseFloat(liq.toFixed(2));

    return res.json({ message: "closing", user });
  }
});

app.get("/balance", (req, res) => {
  const { id } = req.query;
  const user = users.find((u) => u.id == id);

  return res.json({ message: "found you ", user });
});

app.listen(3002, () => {
  console.log("Server started");
});

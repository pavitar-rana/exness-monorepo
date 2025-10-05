import express from "express";
import cors from "cors";

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

let price = 0;

const socket = new WebSocket("ws://localhost:3001");

socket.onopen = () => {
  console.log("connected to websocket");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  price = parseFloat(parseFloat(data.c).toFixed(2));
};

app.get("/", (req, res) => {
  return res.json({ message: "hi there from root" });
});

app.post("/buy", (req, res) => {
  if (price !== 0) {
    const { id } = req.query;
    const buyD = req.body;
    const user = users.find((u) => (u.id = id));

    const totalAmt = parseFloat(
      parseFloat((price + 10) * buyD.quantity).toFixed(2),
    );

    const finalPrice = price + 10;

    const data = {
      ...buyD,
      side: "CALL",
      totalAmt,
      price: finalPrice,
    };

    if (user.usd < totalAmt) {
      return res.json({ message: "Insufficient bala" });
    }

    user.usd -= totalAmt;
    user.balance.push(data);
    return res.json({ message: "Purchase successful", user });
  }
  return res.json({ message: "Error" });
});

app.post("/sell", (req, res) => {
  const { id } = req.query;
  const sellD = req.body;

  const user = users.find((u) => u.id == id);
  const totalAmt = parseFloat(
    parseFloat((price + 10) * sellD.quantity).toFixed(2),
  );

  const finalPrice = price - 10;

  const data = {
    ...sellD,
    side: "PUT",
    totalAmt,
    price: finalPrice,
  };

  if (user.usd < totalAmt) {
    return res.json({ message: "Insufficient bala" });
  }

  user.balance.push(data);
  user.usd -= totalAmt;
  return res.json({ message: "Sell confirmeed", user });
});

app.get("/balance", (req, res) => {
  const { id } = req.query;
  const user = users.find((u) => u.id == id);

  return res.json({ message: "found you ", user });
});

app.listen(3002, () => {
  console.log("Server started");
});

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import axios from "axios";

const OrderForm = ({
  setAmount,
  setType,
  setLeverage,
  balance,
  livePriceAsk,
  type,
  livePriceBid,
  amount,
  leverage,
  setTrades,
  setUser,
  userId,
  user,
  setTakeProfit,
  takeProfit,
  setStopLoss,
  stopLoss,
}) => {
  const buyOrder = async () => {
    const jwtRes = await axios.get("/api/get-jwt");
    const jwtToken = jwtRes.data.token;

    if (!jwtToken) {
      throw new Error("Not authenticated");
    }
    const res = await axios.post(
      `http://localhost:3002/buy?id=${userId}`,
      {
        symbol: "btcusdt",
        leverage,
        amount,
        stopLoss,
        takeProfit,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    setTrades((prev) => {
      return [...prev, res.data.trade];
    });

    setUser((prev) => {
      const u = {
        ...prev,
        usd: res.data.user.usd,
        Balance: [...prev.Balance, res.data.trade],
      };
      return u;
    });

    console.log(res.data);
  };

  const sellOrder = async () => {
    const jwtRes = await axios.get("/api/get-jwt");
    const jwtToken = jwtRes.data.token;

    if (!jwtToken) {
      throw new Error("Not authenticated");
    }

    const res = await axios.post(
      `http://localhost:3002/sell?id=${userId}`,
      {
        symbol: "btcusdt",
        leverage,
        amount,
        stopLoss,
        takeProfit,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    setTrades((prev) => {
      return [...prev, res.data.trade];
    });

    setUser((prev) => {
      const u = {
        ...prev,
        usd: res.data.user.usd,
        Balance: [...prev.Balance, res.data.trade],
      };
      return u;
    });

    console.log(res.data);
  };

  return (
    <div className="w-[260px]">
      <div className="text-green-400">
        Balance : {parseFloat(Number(balance).toFixed(2))}
      </div>

      <div>BTC</div>

      <div
        className={cn("mb-4 border-blue-800 border p-2 cursor-pointer", {
          "bg-blue-800": type === "BUY",
        })}
        onClick={() => {
          setType("buy");
        }}
      >
        buy : {livePriceAsk}
      </div>
      <div
        className={cn("mb-4 border-red-600 border p-2 cursor-pointer", {
          "bg-red-600": type === "sell",
        })}
        onClick={() => {
          setType("sell");
        }}
      >
        sell : {livePriceBid}
      </div>

      <div>
        <Label className="flex flex-col items-baseline">
          Amount
          <Input
            type="number"
            step={10}
            min={0}
            value={amount}
            onChange={(e) => {
              if (!e.target.value) {
                setAmount(0);
              } else if (user.usd < e.target.value) {
                setAmount(1);
              } else {
                setAmount(parseFloat(parseFloat(e.target.value).toFixed(2)));
              }
            }}
          />
        </Label>
      </div>
      <div>
        <Label className="flex mt-2 flex-col items-baseline">
          Stop Loss
          <Input
            type="number"
            step={10}
            min={0}
            value={stopLoss}
            onChange={(e) => {
              if (!e.target.value) {
                setStopLoss(0);
              } else if (amount < e.target.value) {
                setStopLoss(0);
              } else {
                setStopLoss(parseFloat(parseFloat(e.target.value).toFixed(2)));
              }
            }}
          />
        </Label>
      </div>
      <div>
        <Label className="flex mt-2 flex-col items-baseline">
          Take Profit
          <Input
            type="number"
            step={10}
            min={0}
            value={takeProfit}
            onChange={(e) => {
              if (!e.target.value) {
                setTakeProfit(0);
              } else if (user.usd < e.target.value) {
                setTakeProfit(1);
              } else {
                setTakeProfit(
                  parseFloat(parseFloat(e.target.value).toFixed(2)),
                );
              }
            }}
          />
        </Label>
      </div>

      <div className="mt-2">
        <div>Leverage</div>
        <div className="flex  justify-between">
          <div
            className={cn("border rounded-md border-border px-3 py-2 ", {
              "bg-green-400 text-black": leverage == 1,
            })}
            onClick={() => {
              setLeverage(1);
            }}
          >
            1x
          </div>
          <div
            className={cn("border rounded-md border-border px-3 py-2", {
              "bg-green-400 text-black": leverage == 10,
            })}
            onClick={() => {
              setLeverage(10);
            }}
          >
            10x
          </div>
          <div
            className={cn("border rounded-md border-border px-3 py-2", {
              "bg-green-400 text-black": leverage == 50,
            })}
            onClick={() => {
              setLeverage(50);
            }}
          >
            50x
          </div>
          <div
            className={cn("border rounded-md border-border px-3 py-2", {
              "bg-green-400 text-black": leverage == 100,
            })}
            onClick={() => {
              setLeverage(100);
            }}
          >
            100x
          </div>
        </div>
      </div>
      <div>
        <Button
          className="w-full mt-4"
          onClick={() => {
            if (type === "buy") {
              buyOrder();
            } else {
              sellOrder();
            }
          }}
        >
          Confirm {type === "buy" ? "Buy" : "Sell"}
        </Button>
      </div>
    </div>
  );
};

export { OrderForm };

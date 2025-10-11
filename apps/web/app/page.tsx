"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { ChartComponent } from "@/components/candle-chart/chart";
import axios from "axios";
import { LivePriceComp } from "@/components/live-price";
import { DataTable } from "@/components/instrument-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { LucideMoveVertical } from "lucide-react";
import { getCsrfToken, getSession, useSession } from "next-auth/react";
import { CANCELLED } from "node:dns/promises";
import { stat } from "node:fs/promises";
import { getJwtToken } from "@/functions/get-jwt";
import { insTable, portfolioTable } from "@/lib/types";
import { assetCol, portfolioCOl } from "@/lib/table";
// const initialData = [
//   { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
// ];

export default function Home() {
  const { data: session, status } = useSession();

  const [lastMin, setLastMin] = useState<number>(0);
  const [livePriceAsk, setLivePriceAsk] = useState<number>(0);
  const [pastPriceAsk, setPastPriceAsk] = useState<number>(livePriceAsk);
  const [livePriceBid, setLivePriceBid] = useState<number>(0);
  const [pastPriceBid, setPastPriceBid] = useState<number>(livePriceBid);
  const [liveCandle, setLIveCandel] = useState<null | Record<string, number>>(
    null,
  );
  const [type, setType] = useState<string>("buy");
  const [newData, setNewData] = useState<boolean>(false);
  const [candles, setCandles] = useState<Record<string, number>[]>([]);
  const [user, setUser] = useState<any>();
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [trades, setTrades] = useState([]);
  const [userId, setUserId] = useState("");
  const closeRef = useRef(0);

  const [leverage, setLeverage] = useState(1);

  const [amount, setAmount] = useState<number>(1);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Socket connected");
    };

    socket.onmessage = (data) => {
      const d = JSON.parse(data.data);
      const newD = d.k;
      const price = d.price;
      const tickTime = Math.floor(new Date(newD.t).getTime() / 1000);
      console.log("history : ", history);

      const candleTime = Math.floor(tickTime / 60) * 60;
      const open = parseFloat(parseFloat(newD.o).toFixed(2));
      const close = parseFloat(parseFloat(newD.c).toFixed(2)) - 10;
      const c2 = parseFloat(parseFloat(newD.c).toFixed(2)) + 10;
      const high = parseFloat(parseFloat(newD.h).toFixed(2));
      const low = parseFloat(parseFloat(newD.l).toFixed(2));
      if (user?.Balance?.length > 0) {
        let portfolioValue = 0;
        for (const t of user.Balance) {
          console.log(t);

          if (t.side === "CALL") {
            portfolioValue +=
              Number(t.amount) + (close - Number(t.price)) * Number(t.quantity);
          } else if (t.side === "PUT") {
            portfolioValue +=
              Number(t.amount) + (Number(t.price) - c2) * Number(t.quantity);
          }
        }
        console.log("portfolioValue : ", portfolioValue);
        console.log("user.ud : ", user.usd);
        const totalBalance = Number(user.usd) + portfolioValue;

        setBalance(() => {
          return parseFloat(totalBalance.toFixed(2));
        });
      }
      setCandles((prevCandles) => {
        const lastCandle = prevCandles[prevCandles.length - 1];

        if (lastCandle && lastCandle.time === candleTime) {
          const updatedCandle = {
            ...lastCandle,
            close,
            high: Math.max(lastCandle.high, parseFloat(newD.h)),
            low: Math.min(lastCandle.low, parseFloat(newD.l)),
          };
          setLIveCandel(updatedCandle);
          return [...prevCandles.slice(0, -1), updatedCandle];
        } else {
          const newCandle = {
            time: candleTime,
            open,
            high,
            low,
            close,
          };
          setLIveCandel(newCandle);
          return [...prevCandles, newCandle];
        }
      });

      setLivePriceAsk((prev) => {
        setPastPriceAsk(prev);
        return price.ask;
      });
      setLivePriceBid((prev) => {
        setPastPriceBid(prev);
        return price.bid;
      });

      closeRef.current = parseFloat((Number(newD.c) - 10).toFixed(2));
    };

    return () => {
      socket.close();
    };
  }, [user?.Balance, user?.usd]);

  useEffect(() => {
    const fetchCandle = async () => {
      const res = await axios.get("/api/get-candles?symbol=btcusdt");
      const data = res.data.data;

      const candleCleaner = (data: Record<string, string>) => {
        const cleanData = {
          time: Math.floor(new Date(data.time).getTime() / 1000),
          open: parseFloat(parseFloat(data.open).toFixed(2)),
          close: parseFloat(parseFloat(data.close).toFixed(2)),
          high: parseFloat(parseFloat(data.high).toFixed(2)),
          low: parseFloat(parseFloat(data.low).toFixed(2)),
        };
        return cleanData;
      };

      const cleanData = data.map(candleCleaner);
      const time: number = cleanData[cleanData.length - 1].time;

      setLastMin(time);
      setCandles(cleanData);
      setNewData(true);
    };

    fetchCandle();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await axios.get(
        `http://localhost:3002/balance?id=${session?.user.id}`,
      );

      setUser(res.data.user);
      const tt = res.data.user.Balance.map((b) => {
        return {
          ...b,
          volume: b.quantity,
          type: b.side,
        };
      });

      setHistory(res.data.history);

      console.log("tt", tt);
      setTrades(tt);
      console.log("usder", res.data.user);
      setBalance(res.data.user.usd);
    };

    if (status === "authenticated") {
      setUserId(session.user.id);
      fetchBalance();
    }
  }, [session, status]);

  useEffect(() => {
    setTrades((prev: any) => {
      const tt = prev.map((b: any) => {
        return {
          ...b,
          volume: b.quantity,
          type: b.side,
          close: livePriceBid,
          ask: livePriceAsk,
          userId: userId,
          setTrades,
          setUser,
          setHistory,
        };
      });

      return tt;
    });
  }, [livePriceBid, livePriceAsk, userId]);

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

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session.user.id) {
    return <div>no user id</div>;
  }

  return (
    <div className="w-screen h-screen flex gap-4 pt-10">
      <div className="w-[25vw] gap-5">
        <div className="text-sm mb-4">Instruments</div>
        <DataTable
          columns={assetCol}
          data={[
            {
              id: "btcusdt",
              symbol: "btcusdt",
              bidPrice: livePriceBid,
              pastBidPrice: pastPriceBid,
              askPrice: livePriceAsk,
              pastAskPrice: pastPriceAsk,
            },
          ]}
        />
      </div>
      <div>
        <div>
          {candles.length > 0 && liveCandle ? (
            <div className="w-[calc(75vw-260px)] h-full">
              <ChartComponent
                data={candles}
                liveCandle={liveCandle}
                newData={newData}
                setNewData={setNewData}
              ></ChartComponent>
            </div>
          ) : (
            <div>No Chart to show</div>
          )}
        </div>
        <div>
          <DataTable columns={portfolioCOl} data={trades} />
        </div>
      </div>

      <div className="w-[260px]">
        <div className="text-green-400">
          Balance : {parseFloat(Number(balance).toFixed(2))}
        </div>

        <div>BTC</div>

        <div
          className={cn("mb-4 border-blue-800 border p-2 cursor-pointer", {
            "bg-blue-800": type === "buy",
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
    </div>
  );
}

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
// const initialData = [
//   { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
// ];

type insTable = {
  id: string;
  symbol: string;
  bidPrice: number;
  pastBidPrice: number;
  askPrice: number;
  pastAskPrice: number;
};
type portfolioTable = {
  id: string;
  symbol: string;
  price: number;
  volume: number;
  close: number;
  ask: number;
  totalAmt: number;
  quantity: number;
  type: "CALL" | "PUT";
};

const columns: ColumnDef<insTable>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "bidPrice",
    header: "Bid",
    cell: ({ row }) => {
      const livePrice = row.original.bidPrice;
      const pastPrice = row.original.pastBidPrice;
      return <LivePriceComp livePrice={livePrice} pastPrice={pastPrice} />;
    },
  },
  {
    accessorKey: "askPrice",
    header: "Ask",
    cell: ({ row }) => {
      const livePrice = row.original.askPrice;
      const pastPrice = row.original.pastAskPrice;
      return <LivePriceComp livePrice={livePrice} pastPrice={pastPrice} />;
    },
  },
];

const portfolioCOl: ColumnDef<portfolioTable>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "volume",
    header: "Volume",
  },

  {
    accessorKey: "price",
    header: "Open Price",
  },
  {
    accessorKey: "close",
    header: "Current Price",
  },

  {
    accessorKey: "pnl",
    header: "P/L, USD",
    cell: ({ row }) => {
      const close = row.original.close;
      const ask = row.original.ask;
      const price = row.original.price;
      const quantity = row.original.quantity;
      const side = row.original.type;

      let portfolioValue = 0;

      if (side === "CALL") {
        portfolioValue += (close - price) * quantity;
      } else if (side === "PUT") {
        portfolioValue += (price - ask) * quantity;
      }

      return <div>{portfolioValue.toFixed(2)}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const trade = row.original;

      return (
        <div>
          <Button
            onClick={async () => {
              const res = await axios.post("http://localhost:3002/close?id=1", {
                trade,
              });
              console.log(res.data);
            }}
          >
            Close
          </Button>
        </div>
      );
    },
  },
];

export default function Home() {
  const [lastMin, setLastMin] = useState<number>(0);
  const [livePriceAsk, setLivePriceAsk] = useState<number>(0);
  const [pastPriceAsk, setPastPriceAsk] = useState<number>(livePriceAsk);
  const [livePriceBid, setLivePriceBid] = useState<number>(0);
  const [pastPriceBid, setPastPriceBid] = useState<number>(livePriceBid);
  const [liveCandle, setLIveCandel] = useState<null | Record<string, number>>(
    null,
  );
  const [volume, setVolume] = useState<number>(0.01);
  const [type, setType] = useState<string>("buy");
  const [newData, setNewData] = useState<boolean>(false);
  const [candles, setCandles] = useState<Record<string, number>[]>([]);
  const [user, setUser] = useState<any>();
  const [balance, setBalance] = useState(0);
  const [trades, setTrades] = useState([]);
  const closeRef = useRef(0);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Socket connected");
    };

    socket.onmessage = (data) => {
      const newD = JSON.parse(data.data);
      const tickTime = Math.floor(new Date(newD.t).getTime() / 1000);

      const candleTime = Math.floor(tickTime / 60) * 60;
      const open = parseFloat(parseFloat(newD.o).toFixed(2));

      const close = parseFloat(parseFloat(newD.c).toFixed(2)) - 10;
      const c2 = parseFloat(parseFloat(newD.c).toFixed(2)) + 10;
      const high = parseFloat(parseFloat(newD.h).toFixed(2));
      const low = parseFloat(parseFloat(newD.l).toFixed(2));

      if (user?.balance?.length > 0) {
        let portfolioValue = 0;
        for (const t of user.balance) {
          if (t.side === "CALL") {
            portfolioValue += t.totalAmt + (close - t.price) * t.quantity;
          } else if (t.side === "PUT") {
            portfolioValue += t.totalAmt + (t.price - c2) * t.quantity;
          }
        }

        const totalBalance = user.usd + portfolioValue;

        setBalance(() => {
          return parseFloat(totalBalance.toFixed(2));
        });
      }
      setCandles((prevCandles) => {
        if (!prevCandles) {
          const firstCandle = { time: candleTime, open, close, high, low };
          setLIveCandel(firstCandle);

          return [firstCandle];
        }

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
        return Number(newD.c) + 10;
      });
      setLivePriceBid((prev) => {
        setPastPriceBid(prev);
        return parseFloat((Number(newD.c) - 10).toFixed(2));
      });

      closeRef.current = parseFloat((Number(newD.c) - 10).toFixed(2));
    };

    return () => {
      socket.close();
    };
  }, [user?.balance, user?.usd]);

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
    const fetchBalance = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await axios.get("http://localhost:3002/balance?id=1");
      setUser(res.data.user);
      const tt = res.data.user.balance.map((b) => {
        return {
          ...b,
          volume: b.quantity,
          type: b.side,
          // close: closeRef.current,
        };
      });

      console.log("tt", tt);
      setTrades(tt);
      console.log("usder", res.data.user);
      setBalance(res.data.user.usd);
    };

    fetchCandle();
    fetchBalance();
  }, []);

  useEffect(() => {
    setTrades((prev: any) => {
      const tt = prev.map((b: any) => {
        return {
          ...b,
          volume: b.quantity,
          type: b.side,
          close: livePriceBid,
          ask: livePriceAsk,
        };
      });

      return tt;
    });
  }, [livePriceBid, livePriceAsk]);

  const buyOrder = async () => {
    const res = await axios.post("http://localhost:3002/buy?id=1", {
      symbol: "btcusdt",
      quantity: volume,
    });

    console.log(res.data);
  };
  const sellOrder = async () => {
    const res = await axios.post("http://localhost:3002/sell?id=1", {
      symbol: "btcusdt",
      quantity: volume,
    });

    console.log(res.data);
  };

  return (
    <div className="w-screen h-screen flex gap-4 pt-10">
      <div className="w-[25vw] gap-5">
        <div className="text-sm mb-4">Instruments</div>
        <DataTable
          columns={columns}
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
          Balance : {parseFloat(balance.toFixed(2))}
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
            Volume
            <Input
              type="number"
              step={0.01}
              min={0.01}
              value={volume}
              onChange={(e) => {
                if (!e.target.value) {
                  setVolume(0.01);
                } else {
                  setVolume(parseFloat(parseFloat(e.target.value).toFixed(2)));
                }
              }}
            />
          </Label>
        </div>

        <div>{type === "buy" ? "Buy" : "Sell"} for : (volume) </div>
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

import { ColumnDef } from "@tanstack/react-table";
import { insTable, portfolioTable } from "./types";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { LivePriceComp } from "@/components/live-price";

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
      const userId = row.original.userId;
      const setTrades = row.original.setTrades;
      const setUser = row.original.setUser;
      const setHistory = row.original.setHistory;

      return (
        <div>
          <Button
            onClick={async () => {
              const res = await axios.post(
                `http://localhost:3002/close?id=${userId}`,
                {
                  trade,
                },
              );

              setTrades((prevTrades) =>
                prevTrades.filter((t) => t.id !== res.data.trade.id),
              );

              setHistory((prev) => {
                return [...prev, res.data.trade];
              });

              setUser((prev) => {
                const u = {
                  ...prev,
                  usd: res.data.user.usd,
                  Balance: prev.Balance.filter(
                    (t) => t.id !== res.data.trade.id,
                  ),
                };
                return u;
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

const assetCol: ColumnDef<insTable>[] = [
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

export { portfolioCOl, assetCol };

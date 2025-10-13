"use client";

import { useEffect, useState } from "react";
import { ChartComponent } from "@/components/candle-chart/chart";
import { DataTable } from "@/components/instrument-table";
import { assetCol, portfolioCOl } from "@/lib/table";
import { useSession } from "next-auth/react";
import { OrderForm } from "@/components/order-form";
import UseWs from "@/hooks/useWs";
import { UseInitialCandle } from "@/hooks/useInitialCandle";
import { Trade, User } from "@repo/db";
import { AllTradesType } from "@/lib/types";

export default function Home() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User>();
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [newData, setNewData] = useState<boolean>(false);
  const [history, setHistory] = useState<Trade[]>([]);
  const [trades, setTrades] = useState<AllTradesType[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(1);
  const [amount, setAmount] = useState<number>(1);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const {
    livePriceAsk,
    pastPriceAsk,
    livePriceBid,
    pastPriceBid,
    liveCandle,
    balance,
    setBalance,
    candles,
    setCandles,
  } = UseWs({ user });

  UseInitialCandle({
    setCandles,
    setNewData,
    setUser,
    setHistory,
    setTrades,
    setUserId,
    setBalance,
    session,
    status,
  });

  useEffect(() => {
    setTrades((prev: AllTradesType[]) => {
      const tt = prev.map((b: AllTradesType) => {
        return {
          ...b,
          volume: b.quantity,
          price: b.price,
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

      <div>
        <OrderForm
          {...{
            setTakeProfit,
            takeProfit,
            setStopLoss,
            stopLoss,
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
          }}
        />
      </div>
    </div>
  );
}

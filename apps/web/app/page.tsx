"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ChartComponent } from "@/components/candle-chart/chart";
import axios from "axios";
import { printTreeView } from "next/dist/build/utils";
import { Socket } from "node:net";
// const initialData = [
//   { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
// ];

export default function Home() {
  const [lastMin, setLastMin] = useState<number>(0);
  const [livePriceAsk, setLivePriceAsk] = useState<number>(0);
  const [pastPriceAsk, setPastPriceAsk] = useState<number>(livePriceAsk);
  const [livePriceBid, setLivePriceBid] = useState<number>(0);
  const [pastPriceBid, setPastPriceBid] = useState<number>(livePriceBid);
  const [liveCandle, setLIveCandel] = useState<null | Record<string, number>>(
    null,
  );

  const [newData, setNewData] = useState<boolean>(false);

  const [candles, setCandles] = useState<Record<string, number>[]>([]);

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

      console.log(cleanData);
      setLastMin(time);
      setCandles(cleanData);
      setNewData(true);
    };

    fetchCandle();
  }, []);

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
      const high = parseFloat(parseFloat(newD.h).toFixed(2));
      const low = parseFloat(parseFloat(newD.l).toFixed(2));

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
        return Number(newD.c) - 10;
      });
    };

    return () => {
      socket.close();
    };
  }, [lastMin]);

  return (
    <div className="w-screen h-screen flex  items-center p-4">
      <div className="w-70 flex flex-col gap-5">
        <div>
          Ask Price:{" "}
          <span
            className={cn("transition-colors duration-300 ease-in-out p-2", {
              "bg-red-500 text-white": livePriceAsk < pastPriceAsk,
              "bg-green-500 text-black": livePriceAsk >= pastPriceAsk,
              "bg-gray-300 text-black ": livePriceAsk == pastPriceAsk,
            })}
          >
            {" "}
            {livePriceAsk}
          </span>
        </div>
        <div>
          Bid Price:{" "}
          <span
            className={cn("transition-colors duration-300 ease-in-out p-2", {
              "bg-red-500 text-white": livePriceBid < pastPriceBid,
              "bg-green-500 text-black": livePriceBid > pastPriceBid,
              "bg-gray-300 text-black ": livePriceBid == pastPriceBid,
            })}
          >
            {" "}
            {livePriceBid}
          </span>
        </div>
      </div>
      <div>
        {candles.length > 0 && liveCandle ? (
          <div className="w-[calc(100vw-312px)] h-[50vh]">
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
    </div>
  );
}

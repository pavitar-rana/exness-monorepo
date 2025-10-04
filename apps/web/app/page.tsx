"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ChartComponent } from "@/components/candle-chart/chart";
const initialData = [
  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
  { open: 9.55, high: 10.3, low: 9.42, close: 9.94, time: 1642514276 },
  { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },
  { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },
  { open: 9.51, high: 10.46, low: 9.1, close: 10.17, time: 1642773476 },
  { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },
  { open: 10.47, high: 11.39, low: 10.4, close: 10.81, time: 1642946276 },
  { open: 10.81, high: 11.6, low: 10.3, close: 10.75, time: 1643032676 },
  { open: 10.75, high: 11.6, low: 10.49, close: 10.93, time: 1643119076 },
  { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },
];

export default function Home() {
  const [livePriceAsk, setLivePriceAsk] = useState<number>(0);
  const [pastPriceAsk, setPastPriceAsk] = useState<number>(livePriceAsk);
  const [livePriceBid, setLivePriceBid] = useState<number>(0);
  const [pastPriceBid, setPastPriceBid] = useState<number>(livePriceBid);
  useEffect(() => {
    const livePriceFetch = async () => {
      const socket = new WebSocket("ws://localhost:3001");

      socket.onopen = () => {
        console.log("Socket connected");
      };

      socket.onmessage = (data) => {
        setLivePriceAsk((prev) => {
          setPastPriceAsk(prev);
          return Number(data.data) + 10;
        });
        setLivePriceBid((prev) => {
          setPastPriceBid(prev);
          return Number(data.data) - 10;
        });
      };
    };
    livePriceFetch();
  }, []);
  return (
    <div className="w-screen h-screen flex  items-center p-4">
      <div className="w-70 flex flex-col gap-5">
        <div>
          Ask Price:{" "}
          <span
            className={cn("transition-colors duration-300 ease-in-out p-2", {
              "bg-red-500": livePriceBid < pastPriceBid,
              "bg-green-500": livePriceBid >= pastPriceBid,
              "bg-gray-300 text-black ": livePriceBid == pastPriceBid,
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
        <div className="w-[calc(100vw-312px)] h-[50vh]">
          <ChartComponent data={initialData}></ChartComponent>
        </div>
      </div>
    </div>
  );
}

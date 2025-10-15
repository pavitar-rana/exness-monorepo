import axios from "axios";
import { useEffect } from "react";

export const UseInitialCandle = ({
  setCandles,
  setNewData,
  setUser,
  setHistory,
  setTrades,
  setUserId,
  setBalance,
  session,
  status,
  timeFrame,
  symbol,
}) => {
  useEffect(() => {
    const fetchCandle = async () => {
      const res = await axios.get(
        `/api/get-candles?symbol=${symbol}&&tf=${timeFrame}`,
      );
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

      setCandles(cleanData);
      setNewData(true);
    };

    fetchCandle();
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
  }, [
    setCandles,
    setNewData,
    session,
    setBalance,
    setHistory,
    setTrades,
    setUser,
    setUserId,
    status,
    symbol,
    timeFrame,
  ]);
};

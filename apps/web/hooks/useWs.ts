import { useEffect, useRef, useState } from "react";

const UseWs = ({ user }) => {
  const [livePriceAsk, setLivePriceAsk] = useState<number>(0);
  const [pastPriceAsk, setPastPriceAsk] = useState<number>(livePriceAsk);
  const [livePriceBid, setLivePriceBid] = useState<number>(0);
  const [pastPriceBid, setPastPriceBid] = useState<number>(livePriceBid);
  const [liveCandle, setLiveCandle] = useState<null | Record<string, number>>(
    null,
  );
  const [balance, setBalance] = useState(0);
  const [candles, setCandles] = useState<Record<string, number>[]>([]);

  const closeRef = useRef(0);

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
      const candleTime = Math.floor(tickTime / 60) * 60;
      const open = parseFloat(parseFloat(newD.o).toFixed(2));
      const close = parseFloat(parseFloat(newD.c).toFixed(2)) - 10;
      const c2 = parseFloat(parseFloat(newD.c).toFixed(2)) + 10;

      if (user?.Balance?.length > 0) {
        let portfolioValue = 0;
        for (const t of user.Balance) {
          if (t.side === "CALL") {
            portfolioValue +=
              Number(t.amount) + (close - Number(t.price)) * Number(t.quantity);
          } else if (t.side === "PUT") {
            portfolioValue +=
              Number(t.amount) + (Number(t.price) - c2) * Number(t.quantity);
          }
        }
        const totalBalance = Number(user.usd) + portfolioValue;
        console.log("user : ", user);
        console.log("live Balance total: ", totalBalance);
        setBalance(parseFloat(totalBalance.toFixed(2)));
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
          setLiveCandle(updatedCandle);
          return [...prevCandles.slice(0, -1), updatedCandle];
        } else {
          const newCandle = {
            time: candleTime,
            open,
            high: parseFloat(newD.h),
            low: parseFloat(newD.l),
            close,
          };
          setLiveCandle(newCandle);
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
  }, [user?.Balance, user?.usd, user]);

  return {
    livePriceAsk,
    setLivePriceAsk,
    pastPriceAsk,
    setPastPriceAsk,
    livePriceBid,
    setLivePriceBid,
    pastPriceBid,
    setPastPriceBid,
    liveCandle,
    setLiveCandle,
    balance,
    setBalance,
    candles,
    setCandles,
  };
};

export default UseWs;

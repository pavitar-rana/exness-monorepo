import { useEffect, useRef, useState } from "react";

const UseWs = ({
  user,
  symbol,
  liveAssetPrice,
  setLiveAssetPrice,
  assetTableDataLive,
  setAssetTableDataLive,
  setSymbol,
  isReady,
  setIsReady,
  liveAssetPriceRef,
}) => {
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
    // const socket = new WebSocket("ws://localhost:3001");
    const socket = new WebSocket("ws://34.14.140.243:3001");

    socket.onopen = () => {
      console.log("Socket connected");
    };

    socket.onmessage = (data) => {
      const d = JSON.parse(data.data);

      const newD = d.k;
      const price = d.price;
      const symb = d.symbol;

      setAssetTableDataLive((prev) => {
        const assetIndex = prev.findIndex((a) => a.symbol === symb);

        if (assetIndex === -1) {
          return [
            ...prev,
            {
              id: symb,
              symbol: symb,
              bidPrice: price.bid,
              pastBidPrice: price.bid,
              askPrice: price.ask,
              pastAskPrice: price.ask,
              setSymbol,
            },
          ];
        } else {
          const updated = [...prev];
          updated[assetIndex] = {
            id: symb,
            symbol: symb,
            bidPrice: price.bid,
            pastBidPrice: updated[assetIndex].bidPrice,
            askPrice: price.ask,
            pastAskPrice: updated[assetIndex].askPrice,
            setSymbol,
          };
          return updated;
        }
      });

      const updatedLiveAssetPrice = { ...liveAssetPriceRef.current };
      if (!updatedLiveAssetPrice[symb]) {
        updatedLiveAssetPrice[symb] = {};
      }
      updatedLiveAssetPrice[symb].bid = price.bid;
      updatedLiveAssetPrice[symb].ask = price.ask;

      liveAssetPriceRef.current = updatedLiveAssetPrice;

      // setLiveAssetPrice(updatedLiveAssetPrice);

      if (
        !isReady &&
        liveAssetPriceRef.current.BTCUSDT?.bid &&
        liveAssetPriceRef.current.SOLUSDT?.bid &&
        liveAssetPriceRef.current.ETHUSDT?.bid
      ) {
        setIsReady(true);
      }

      const tickTime = Math.floor(new Date(newD.t).getTime() / 1000);
      const candleTime = Math.floor(tickTime / 60) * 60;
      const open = parseFloat(parseFloat(newD.o).toFixed(2));
      const close = parseFloat(parseFloat(price.bid).toFixed(2));

      if (user?.Balance?.length > 0) {
        let portfolioValue = 0;

        for (const t of user.Balance) {
          if (t.side === "CALL") {
            portfolioValue +=
              Number(t.amount) +
              (updatedLiveAssetPrice[t.symbol].bid - Number(t.price)) *
                Number(t.quantity);
          } else if (t.side === "PUT") {
            portfolioValue +=
              Number(t.amount) +
              (Number(t.price) - updatedLiveAssetPrice[t.symbol].ask) *
                Number(t.quantity);
          }
        }
        const totalBalance = Number(user.usd) + portfolioValue;

        setBalance(parseFloat(totalBalance.toFixed(2)));
      }

      if (symb === symbol) {
        setCandles((prevCandles) => {
          const lastCandle = prevCandles[prevCandles.length - 1];
          if (lastCandle && lastCandle.time === candleTime) {
            const updatedCandle = {
              ...lastCandle,
              close: updatedLiveAssetPrice[symbol].ask,
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
      }
    };

    return () => {
      socket.close();
    };
  }, [
    user?.Balance,
    user?.usd,
    user,
    symbol,
    liveAssetPrice,
    setLiveAssetPrice,
    liveAssetPriceRef,
    setIsReady,
    isReady,
    setAssetTableDataLive,
    setSymbol,
  ]);

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

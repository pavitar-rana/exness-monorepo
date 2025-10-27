"use client";

import { useEffect, useRef, useState } from "react";
import { ChartComponent } from "@/components/candle-chart/chart";
import { DataTable } from "@/components/instrument-table";
import { assetCol, portfolioCOl } from "@/lib/table";
import { useSession } from "next-auth/react";
import { OrderForm, upgradedUser } from "@/components/order-form";
import { TradingHeader } from "@/components/trading-header";
import UseWs from "@/hooks/useWs";
import { UseInitialCandle } from "@/hooks/useInitialCandle";
import { Trade } from "@repo/db";
import { AllTradesType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Wallet, Activity, History } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<upgradedUser>();
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [timeFrame, setTimeFrame] = useState<string>("1m");
  const [symbol, setSymbol] = useState<string>("BTCUSDT");
  const [newData, setNewData] = useState<boolean>(false);
  const [history, setHistory] = useState<Trade[]>([]);
  const [trades, setTrades] = useState<AllTradesType[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(1);
  const [amount, setAmount] = useState<number>(1);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [liveAssetPrice, setLiveAssetPrice] = useState({});
  const [assetTableDataLive, setAssetTableDataLive] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const liveAssetPriceRef = useRef({});

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
  } = UseWs({
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
  });

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
    symbol,
    timeFrame,
    liveAssetPrice,
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

  if (status === "loading" || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading Trading Platform</h3>
            <p className="text-muted-foreground">
              Please wait while we initialize your session...
            </p>
          </div>
        </div>
      </div>
    );
  }
  const timeFrameOptions = ["1m", "5m", "10m", "30m"];

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <Activity className="h-6 w-6 text-destructive" />
              <span>Authentication Required</span>
            </CardTitle>
            <CardDescription>
              Please sign in to access the trading platform
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" asChild>
              <Link href={"/sign-in"}>SignIn</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TradingHeader
        balance={balance}
        livePriceAsk={livePriceAsk}
        livePriceBid={livePriceBid}
        pastPriceAsk={pastPriceAsk}
        pastPriceBid={pastPriceBid}
        symbol={symbol}
      />

      {/* Main Trading Interface */}
      <div className="container mx-auto p-3 sm:p-6 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Sidebar - Instruments */}
          <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
            <Card>
              <CardHeader className="pb-2 py-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Market Instruments</span>
                </CardTitle>
                <CardDescription>
                  Live market prices and trading pairs
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border rounded-md">
                  <DataTable columns={assetCol} data={assetTableDataLive} />
                  {/*<DataTable
                    columns={assetCol}
                    data={[
                      {
                        id: "BTCUSDT",
                        symbol: "BTCUSDT",
                        bidPrice: livePriceBid,
                        pastBidPrice: pastPriceBid,
                        askPrice: livePriceAsk,
                        pastAskPrice: pastPriceAsk,
                      },
                    ]}
                  />*/}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Chart and Portfolio */}
          <div className="lg:col-span-6 space-y-3 order-1 lg:order-2">
            {/* Chart Section */}
            <Card className="min-h-[400px]">
              <CardHeader className="pb-2 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>{symbol} Chart</span>
                    <Badge
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Live</span>
                    </Badge>
                  </CardTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {timeFrameOptions.map((tf) => (
                      <button
                        key={tf}
                        className={cn(
                          "p-1 sm:p-2 rounded-lg border-2 transition-all duration-200 hover:scale-[1.05] font-semibold text-sm sm:text-base",
                          timeFrame === tf
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50",
                        )}
                        onClick={() => setTimeFrame(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] pt-0">
                {candles.length > 0 && liveCandle ? (
                  <div className="w-full h-full">
                    <ChartComponent
                      data={candles}
                      liveCandle={liveCandle}
                      newData={newData}
                      setNewData={setNewData}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-semibold">No Chart Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Waiting for market data to load...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Open Positions Section */}
            <Card>
              <CardHeader className="pb-2 py-3">
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span>Open Positions</span>
                  <Badge variant="secondary">{trades.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Your active trading positions and portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[400px] overflow-auto border rounded-md">
                  {trades.length > 0 ? (
                    <div className="relative">
                      <DataTable columns={portfolioCOl} data={trades} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center space-y-2">
                        <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          No open positions
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trading History Section */}
            <Card>
              <CardHeader className="pb-2 py-3">
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-primary" />
                  <span>Trading History</span>
                  <Badge variant="outline">{history.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Your completed trades and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[400px] overflow-auto border rounded-md">
                  {history.length > 0 ? (
                    <div className="relative">
                      <DataTable
                        columns={[
                          {
                            accessorKey: "symbol",
                            header: "Symbol",
                          },
                          {
                            accessorKey: "side",
                            header: "Type",
                          },
                          {
                            accessorKey: "quantity",
                            header: "Volume",
                            cell: ({ row }) =>
                              Number(row.getValue("quantity")).toFixed(5),
                          },
                          {
                            accessorKey: "price",
                            header: "Entry Price",
                            cell: ({ row }) =>
                              Number(row.getValue("price")).toFixed(2),
                          },
                          {
                            accessorKey: "closePrice",
                            header: "Exit Price",
                            cell: ({ row }) =>
                              Number(row.getValue("closePrice") || 0).toFixed(
                                2,
                              ),
                          },
                          {
                            accessorKey: "pnl",
                            header: "P/L",
                            cell: ({ row }) => {
                              const pnl = Number(row.getValue("pnl") || 0);
                              return (
                                <span
                                  className={
                                    pnl >= 0 ? "text-green-600" : "text-red-600"
                                  }
                                >
                                  {pnl >= 0 ? "+" : ""}
                                  {pnl.toFixed(2)}
                                </span>
                              );
                            },
                          },
                          {
                            accessorKey: "closedAt",
                            header: "Date",
                            cell: ({ row }) => {
                              const date = new Date(row.getValue("closedAt"));
                              return (
                                date.toLocaleDateString() +
                                " " +
                                date.toLocaleTimeString()
                              );
                            },
                          },
                        ]}
                        data={[...history].sort(
                          (a, b) =>
                            new Date(b.closedAt).getTime() -
                            new Date(a.closedAt).getTime(),
                        )}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center space-y-2">
                        <History className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          No trading history yet
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Order Form */}
          <div className="lg:col-span-3 order-3">
            <Card className="sticky top-4">
              <CardHeader className="pb-2 py-3">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Place Order</span>
                </CardTitle>
                <CardDescription>
                  Execute buy or sell orders with advanced options
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <OrderForm
                  setTakeProfit={setTakeProfit}
                  takeProfit={takeProfit}
                  setStopLoss={setStopLoss}
                  stopLoss={stopLoss}
                  setAmount={setAmount}
                  setType={setType}
                  setLeverage={setLeverage}
                  balance={balance}
                  livePriceAsk={livePriceAsk}
                  type={type}
                  livePriceBid={livePriceBid}
                  amount={amount}
                  leverage={leverage}
                  setTrades={setTrades}
                  setUser={setUser}
                  userId={userId}
                  user={user!}
                  symbol={symbol}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChartComponent } from "@/components/candle-chart/chart";
import { DataTable } from "@/components/instrument-table";
import { assetCol, portfolioCOl } from "@/lib/table";
import { useSession } from "next-auth/react";
import { OrderForm, upgradedUser } from "@/components/order-form";
import { TradingHeader } from "@/components/trading-header";
import UseWs from "@/hooks/useWs";
import { UseInitialCandle } from "@/hooks/useInitialCandle";
import { Trade, User } from "@repo/db";
import { AllTradesType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Wallet, Activity } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<upgradedUser>();
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [newData, setNewData] = useState<boolean>(false);
  const [, setHistory] = useState<Trade[]>([]);
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
      />

      {/* Main Trading Interface */}
      <div className="container mx-auto p-3 sm:p-6 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-100px)]">
          {/* Left Sidebar - Instruments */}
          <div className="lg:col-span-3 space-y-3 order-2 lg:order-1 h-fit">
            <Card className="h-fit">
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
              </CardContent>
            </Card>
          </div>

          {/* Center - Chart and Portfolio */}
          <div className="lg:col-span-6 space-y-3 order-1 lg:order-2 flex flex-col h-">
            {/* Chart Section */}
            <Card className="flex-1 min-h-[350px]">
              <CardHeader className="pb-2 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>BTC/USDT Chart</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Live</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-full pt-0">
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

            {/* Portfolio Section */}
            <Card className="h-[180px]">
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
              <CardContent className="pt-0 h-[120px]">
                <div className="h-full overflow-y-auto">
                  <DataTable columns={portfolioCOl} data={trades} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Order Form */}
          <div className="lg:col-span-3 order-3 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 py-3">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Place Order</span>
                </CardTitle>
                <CardDescription>
                  Execute buy or sell orders with advanced options
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex-1 overflow-y-auto">
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
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

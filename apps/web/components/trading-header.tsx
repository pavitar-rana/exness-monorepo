import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  User,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface TradingHeaderProps {
  balance: number;
  livePriceAsk: number;
  livePriceBid: number;
  pastPriceAsk: number;
  pastPriceBid: number;
  symbol: string;
}

export const TradingHeader: React.FC<TradingHeaderProps> = ({
  balance,
  livePriceAsk,
  livePriceBid,
  pastPriceAsk,
  pastPriceBid,
  symbol,
}) => {
  const askChange = livePriceAsk - pastPriceAsk;
  const bidChange = livePriceBid - pastPriceBid;
  const askChangePercent = pastPriceAsk ? (askChange / pastPriceAsk) * 100 : 0;
  const bidChangePercent = pastPriceBid ? (bidChange / pastPriceBid) * 100 : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  useEffect(() => {
    console.log("balance : ", balance);
  }, [balance]);
  const formatChange = (change: number, isPercent = false) => {
    const formatted = isPercent
      ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
      : `${change >= 0 ? "+" : ""}${formatPrice(change)}`;
    return formatted;
  };

  return (
    <div className="w-full bg-gradient-to-r from-background to-muted/20 border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-6 py-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Exness Trading
              </h1>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex">
              Live Trading
            </Badge>
          </div>

          {/* Trading Stats */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Available Balance */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                Available Balance
              </span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(balance)}
              </span>
            </div>

            {/* BTC/USDT Price */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{symbol}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">
                    {formatPrice(livePriceAsk)}
                  </span>
                  <div
                    className={`flex items-center space-x-1 ${askChange >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {askChange >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">
                      {formatChange(askChangePercent, true)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-border" />

              <div className="flex items-center space-x-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Ask:</span>
                  <span className="ml-1 font-semibold text-green-500">
                    {formatPrice(livePriceAsk)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bid:</span>
                  <span className="ml-1 font-semibold text-red-500">
                    {formatPrice(livePriceBid)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Live Market</span>
            </div>

            {/* User Controls */}
            <div className="flex items-center space-x-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  signOut();
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

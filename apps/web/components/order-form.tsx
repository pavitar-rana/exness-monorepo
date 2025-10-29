import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import axios from "axios";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AllTradesType } from "@/lib/types";
import { Trade, User } from "@repo/db";

type OrderFormProps = {
  setAmount: (amount: number) => void;
  setType: (type: "BUY" | "SELL") => void;
  setLeverage: (leverage: number) => void;
  livePriceAsk: number;
  type: "BUY" | "SELL";
  livePriceBid: number;
  amount: number;
  leverage: number;
  setTrades: React.Dispatch<React.SetStateAction<AllTradesType[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  userId: string;
  user: User;
  setTakeProfit: (takeProfit: number) => void;
  takeProfit: number;
  setStopLoss: (stopLoss: number) => void;
  stopLoss: number;
  symbol: string;
};

export type upgradedUser = User & {
  Balance: Trade[];
};

const OrderForm: React.FC<OrderFormProps> = ({
  setAmount,
  setType,
  setLeverage,
  symbol,
  livePriceAsk,
  type,
  livePriceBid,
  amount,
  leverage,
  setTrades,
  setUser,
  userId,
  user,
  setTakeProfit,
  takeProfit,
  setStopLoss,
  stopLoss,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const calculateEstimatedValue = () => {
    const price = type === "BUY" ? livePriceAsk : livePriceBid;
    return (amount * leverage) / price;
  };

  const calculateMargin = () => {
    return amount * leverage;
  };

  const buyOrder = async () => {
    setIsLoading(true);
    try {
      const jwtRes = await axios.get("/api/get-jwt");
      const jwtToken = jwtRes.data.token;

      if (!jwtToken) {
        throw new Error("Not authenticated");
      }

      const res = await axios.post(
        `http://${process.env.NEXT_PUBLIC_BASE_URL}:3002/buy?id=${userId}`,
        {
          symbol,
          leverage,
          amount,
          stopLoss,
          takeProfit,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );

      setTrades((prev: AllTradesType[]) => {
        return [...prev, res.data.trade];
      });

      setUser((prev: upgradedUser | undefined) => {
        if (!prev) return res.data.user;
        const u: upgradedUser = {
          ...prev,
          usd: res.data.user.usd,
          Balance: [...prev.Balance, res.data.trade],
        };
        return u;
      });

      console.log("buy trade data : ", res.data);
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sellOrder = async () => {
    setIsLoading(true);
    try {
      const jwtRes = await axios.get("/api/get-jwt");
      const jwtToken = jwtRes.data.token;

      if (!jwtToken) {
        throw new Error("Not authenticated");
      }

      const res = await axios.post(
        `http://${process.env.NEXT_PUBLIC_BASE_URL}:3002/sell?id=${userId}`,
        {
          symbol,
          leverage,
          amount,
          stopLoss,
          takeProfit,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );

      setTrades((prev: AllTradesType[]) => {
        return [...prev, res.data.trade];
      });

      setUser((prev: upgradedUser | undefined) => {
        if (!prev) return res.data.user;
        const u: upgradedUser = {
          ...prev,
          usd: res.data.user.usd,
          Balance: [...prev.Balance, res.data.trade],
        };
        return u;
      });

      console.log(res.data);
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const leverageOptions = [1, 10, 50, 100];

  return (
    <div className="space-y-4">
      {/* Available Balance */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <span className="text-sm text-muted-foreground">Available Balance</span>
        <span className="text-lg font-bold text-primary">
          {formatPrice(Number(user?.usd) || 0)}
        </span>
      </div>

      {/* Order Type Selection */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={cn(
              "flex items-center justify-center space-x-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]",
              type === "BUY"
                ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border-border hover:border-green-500/50",
            )}
            onClick={() => setType("BUY")}
          >
            <TrendingUp className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">BUY</div>
              <div className="text-xs text-muted-foreground">
                {formatPrice(livePriceAsk)}
              </div>
            </div>
          </button>

          <button
            className={cn(
              "flex items-center justify-center space-x-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]",
              type === "SELL"
                ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                : "border-border hover:border-red-500/50",
            )}
            onClick={() => setType("SELL")}
          >
            <TrendingDown className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">SELL</div>
              <div className="text-xs text-muted-foreground">
                {formatPrice(livePriceBid)}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Investment Amount</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => {
            if (!e.target.value) {
              setAmount(0);
            } else if (Number(user?.usd) < Number(e.target.value)) {
              setAmount(Number(Number(user.usd).toFixed(2)));
            } else {
              setAmount(parseFloat(parseFloat(e.target.value).toFixed(2)));
            }
          }}
          className="text-lg font-semibold"
          placeholder="Enter amount"
        />
      </div>

      {/* Leverage Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Leverage</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {leverageOptions.map((lev) => (
            <button
              key={lev}
              className={cn(
                "p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.05] font-semibold text-sm sm:text-base",
                leverage === lev
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50",
              )}
              onClick={() => setLeverage(lev)}
            >
              {lev}x
            </button>
          ))}
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Warning:</strong> Higher leverage increases both potential
            profits and losses.
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Risk Management</h4>

        {/* Stop Loss */}
        <div className="space-y-2">
          <Label className="text-sm">Stop Loss (Optional)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={stopLoss || ""}
            onChange={(e) => {
              if (!e.target.value) {
                setStopLoss(0);
              } else {
                setStopLoss(parseFloat(parseFloat(e.target.value).toFixed(2)));
              }
            }}
            placeholder="Set stop loss"
          />
        </div>

        {/* Take Profit */}
        <div className="space-y-2">
          <Label className="text-sm">Take Profit (Optional)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={takeProfit || ""}
            onChange={(e) => {
              if (!e.target.value) {
                setTakeProfit(0);
              } else {
                setTakeProfit(
                  parseFloat(parseFloat(e.target.value).toFixed(2)),
                );
              }
            }}
            placeholder="Set take profit"
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-2 bg-muted/50 rounded-lg p-3">
        <h4 className="font-medium text-sm">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Estimated Position Size:
            </span>
            <span className="font-medium">
              {calculateEstimatedValue().toFixed(6)} {symbol.slice(0, 3)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Margin:</span>
            <span className="font-medium">
              {formatPrice(calculateMargin())}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Leverage:</span>
            <Badge variant="outline">{leverage}x</Badge>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <Button
        className={cn(
          "w-full h-10 text-base font-semibold transition-all duration-200",
          type === "BUY"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white",
        )}
        onClick={() => {
          if (type === "BUY") {
            buyOrder();
          } else {
            sellOrder();
          }
        }}
        disabled={isLoading || amount <= 0 || amount > Number(user?.usd || 0)}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Processing...</span>
            <span className="sm:hidden">...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {type === "BUY" ? (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            <span className="hidden sm:inline">
              {type === "BUY" ? "Buy" : "Sell"} {symbol}
            </span>
            <span className="sm:hidden">{type === "BUY" ? "Buy" : "Sell"}</span>
          </div>
        )}
      </Button>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center bg-muted/30 rounded-lg p-2">
        <p>
          Trading involves substantial risk of loss. Please trade responsibly.
        </p>
      </div>
    </div>
  );
};

export { OrderForm };

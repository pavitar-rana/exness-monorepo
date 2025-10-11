import { Trade, User } from "@repo/db";
import { Decimal } from "@repo/db/generated/prisma/runtime/library";

export type insTable = {
  id: string;
  symbol: string;
  bidPrice: number;
  pastBidPrice: number;
  askPrice: number;
  pastAskPrice: number;
};

export type portfolioTable = {
  id: string;
  symbol: string;
  price: Decimal | number;
  volume: Decimal | number;
  close: number;
  ask: number;
  amount: Decimal | number;
  leverage: Decimal | number;
  exposure: Decimal | number;
  quantity: Decimal | number;
  userId: string;
  setUser: React.Dispatch<React.SetStateAction<unknown>>;
  setTrades: React.Dispatch<React.SetStateAction<unknown>>;
  setHistory: React.Dispatch<React.SetStateAction<unknown>>;
  type: string;
};

export type AllTradesType = Trade & {
  type: string;
  volume: Decimal;
  close: number;
  ask: number;
  price: Decimal | number;
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  setHistory: React.Dispatch<React.SetStateAction<Trade[]>>;
};

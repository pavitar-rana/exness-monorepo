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
  price: number;
  volume: number;
  close: number;
  ask: number;
  amount: number;
  leverage: number;
  exposure: number;
  quantity: number;
  userId: string;
  setUser: React.Dispatch<React.SetStateAction<unknown>>;
  setTrades: React.Dispatch<React.SetStateAction<unknown>>;
  setHistory: React.Dispatch<React.SetStateAction<unknown>>;
  type: "CALL" | "PUT";
};

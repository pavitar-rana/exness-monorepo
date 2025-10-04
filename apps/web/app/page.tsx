"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [livePrice, setLivePrice] = useState<string>("0");
  useEffect(() => {
    const livePrice = async () => {
      const socket = new WebSocket("http://localhost:3001");

      socket.onopen = () => {
        console.log("Socket connected");
      };

      socket.onmessage = (data) => {
        setLivePrice(data.data);
      };
    };
    livePrice();
  }, []);
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      Live Price: {livePrice}
    </div>
  );
}

import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import React, { useEffect, useRef } from "react";

export const ChartComponent = (props) => {
  const { data } = props;

  const chartContainerRef = useRef();

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "black" },
        textColor: "white",
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    series.setData(data);

    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(5);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} />;
};

import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import React, { useEffect, useRef } from "react";

export const ChartComponent = (props) => {
  const { data, liveCandle, newData, setNewData } = props;

  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();

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

    // chart.timeScale().fitContent();
    // chart.timeScale().scrollToPosition(15);

    chartRef.current = chart;
    seriesRef.current = series;

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, []);

  useEffect(() => {
    seriesRef.current.setData(data);
    setNewData(false);
  }, [data, setNewData]);
  useEffect(() => {
    if (seriesRef.current && liveCandle) {
      seriesRef.current.update(liveCandle);
    }
  }, [liveCandle]);

  return <div ref={chartContainerRef} />;
};

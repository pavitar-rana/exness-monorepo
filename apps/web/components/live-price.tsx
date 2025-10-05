import { cn } from "@/lib/utils";

const LivePriceComp = ({ livePrice, pastPrice }) => {
  return (
    <div
      className={cn(
        "transition-colors w-full h-full rounded-sm p-1 duration-300 ease-in-out",
        {
          "bg-red-500 text-white": livePrice < pastPrice,
          "bg-green-500 text-black": livePrice >= pastPrice,
          "bg-background text-white": livePrice == pastPrice,
        },
      )}
    >
      {livePrice}
    </div>
  );
};

export { LivePriceComp };

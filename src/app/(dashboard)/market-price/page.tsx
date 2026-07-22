import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions, canEditMarketPrice } from "@/lib/auth";
import { MarketPriceClient } from "@/modules/market-price/components/market-price-client";

export const metadata = { title: "Market Price · CoalTrade OS" };

export default async function MarketPricePage() {
  const session = await getServerSession(authOptions);
  const canEdit = canEditMarketPrice(session?.user?.role ?? "");

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Market Price <span className="text-muted-foreground font-normal text-base">— Index Tracker</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
        <MarketPriceClient canEdit={canEdit} />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { PaymentClient } from "@/modules/outstanding-payment/components/payment-client";

export const metadata = { title: "Outstanding Payment · CoalTrade OS" };

export default function OutstandingPaymentPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Outstanding Payment <span className="text-muted-foreground font-normal text-base">— DP & Advance Tracking</span>
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
        <PaymentClient />
      </Suspense>
    </div>
  );
}

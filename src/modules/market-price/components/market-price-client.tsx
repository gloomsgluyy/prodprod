"use client";

import { Plus, Settings, X } from "lucide-react";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";
import { PriceCards } from "./price-cards";
import { IndexCalculator, HPBCalculator } from "./calculators";
import { TrendChart } from "./trend-chart";
import { PriceInputForm } from "./price-input-form";
import { PriceHistory } from "./price-history";
import { useScrapeMarketPrice } from "../hooks/use-market-price";

export function MarketPriceClient({ canEdit }: { canEdit: boolean }) {
  const { showInputForm, showScrapingModal, toggleInputForm, toggleScrapingModal } = useMarketPriceUIStore();
  const { mutate: scrape, isPending: scraping } = useScrapeMarketPrice();

  return (
    <div className="flex flex-col gap-6">
      <PriceCards />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <IndexCalculator />
        <HPBCalculator />
      </div>

      <TrendChart />

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button button--primary" onClick={toggleInputForm}>
            {showInputForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {showInputForm ? "Close Input" : "Input Price"}
          </button>
          <button
            type="button"
            className="button button--ghost button--neutral"
            onClick={toggleScrapingModal}
          >
            <Settings size={16} aria-hidden="true" />
            Scraping Settings
          </button>
        </div>
      )}

      {canEdit && showInputForm && <PriceInputForm />}

      <PriceHistory />

      {canEdit && showScrapingModal && (
        <ScrapingModal
          onClose={toggleScrapingModal}
          onFetchNow={() => scrape()}
          isScraping={scraping}
        />
      )}
    </div>
  );
}

function ScrapingModal({
  onClose,
  onFetchNow,
  isScraping,
}: {
  onClose: () => void;
  onFetchNow: () => void;
  isScraping: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Scraping Settings"
    >
      <div className="card w-full max-w-lg mx-4">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Scraping Settings</h2>
            <button
              type="button"
              className="button button--ghost button--neutral button--icon-only"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-sm text-amber-600">Auto Scrape stub/pending integration</span>
          </div>

          <div className="field">
            <label className="field__label">Interval</label>
            <select className="select" defaultValue="6h">
              {["3s (test)", "1min", "5min", "1h", "6h", "12h", "Daily"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <span className="field__label">Target Sources</span>
            <div className="flex flex-col gap-2 mt-1">
              {["GlobalCoal API", "Argus Media", "McCloskey", "ICE Futures"].map((src) => (
                <label key={src} className="field__item">
                  <input type="checkbox" className="checkbox" defaultChecked={src === "GlobalCoal API"} />
                  <span className="field__label font-normal">{src}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 bg-surface rounded font-mono text-xs text-muted-foreground border border-border min-h-16">
            [system] Auto Scrape stub ready; real source integration pending<br />
            [system] Last run: never
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="button button--primary"
              onClick={onFetchNow}
              disabled={isScraping}
              aria-busy={isScraping}
            >
              {isScraping ? <><span className="spinner spinner--sm" aria-hidden="true" /> Fetching...</> : "Fetch Now"}
            </button>
            <button type="button" className="button button--ghost button--neutral" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

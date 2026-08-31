"use client";

import * as React from "react";
import { Plus, Settings, X } from "lucide-react";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";
import { PriceCards } from "./price-cards";
import { IndexCalculator, HPBCalculator } from "./calculators";
import { TrendChart } from "./trend-chart";
import { PriceInputForm } from "./price-input-form";
import { PriceHistory } from "./price-history";
import { MarketComparisonCard } from "./market-comparison-card";
import { useScrapeMarketPrice } from "../hooks/use-market-price";

export function MarketPriceClient({ canEdit }: { canEdit: boolean }) {
  const { showInputForm, showScrapingModal, toggleInputForm, toggleScrapingModal } = useMarketPriceUIStore();
  const { mutate: scrape, isPending: scraping } = useScrapeMarketPrice();

  return (
    <div className="flex flex-col gap-6">
      <PriceCards />

      <MarketComparisonCard />

      <div className="flex flex-col gap-6">
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
  const INTERVAL_KEY = "coaltrade:marketScrapeIntervalMs";
  const INTERVAL_OPTIONS = [
    { label: "3 seconds (test)", value: 3000 },
    { label: "1 minute", value: 60000 },
    { label: "5 minutes", value: 5 * 60000 },
    { label: "1 hour", value: 60 * 60000 },
    { label: "6 hours", value: 6 * 60 * 60000 },
    { label: "12 hours", value: 12 * 60 * 60000 },
    { label: "Daily", value: 24 * 60 * 60000 },
  ];

  const currentInterval = Number(localStorage.getItem(INTERVAL_KEY)) || 6 * 60 * 60000;
  const [selectedInterval, setSelectedInterval] = React.useState(currentInterval);

  const handleSave = () => {
    localStorage.setItem(INTERVAL_KEY, String(selectedInterval));
    window.dispatchEvent(new Event("marketScrapeIntervalChanged"));
    onClose();
  };

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
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className="text-sm text-emerald-600">Auto Scrape active; AI/live mode depends on server env</span>
          </div>

          <div className="field">
            <label className="field__label">Interval</label>
            <select 
              className="select" 
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(Number(e.target.value))}
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Current: {INTERVAL_OPTIONS.find(o => o.value === currentInterval)?.label || "Custom"}
            </p>
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
            [system] Background scrape runs for authenticated users<br />
            [system] Server uses AI when GROQ_API_KEY or OPENROUTER_API_KEY exists
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="button button--success"
              onClick={handleSave}
            >
              Save Interval
            </button>
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

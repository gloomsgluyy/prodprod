export type ExternalNews = { source: string; title: string; description?: string; url?: string };

export async function fetchExternalNews(query: string): Promise<ExternalNews[]> {
  const results: ExternalNews[] = [];
  if (process.env.GNEWS_API_KEY) {
    try {
      const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${process.env.GNEWS_API_KEY}`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        results.push(...(data.articles ?? []).slice(0, 3).map((a: { title?: string; description?: string; url?: string }) => ({
          source: "GNews", title: a.title ?? "Untitled", description: a.description, url: a.url,
        })));
      }
    } catch {}
  }
  if (process.env.NEWS_API_KEY) {
    try {
      const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${process.env.NEWS_API_KEY}`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        results.push(...(data.articles ?? []).slice(0, 3).map((a: { title?: string; description?: string; url?: string }) => ({
          source: "NewsAPI", title: a.title ?? "Untitled", description: a.description, url: a.url,
        })));
      }
    } catch {}
  }
  return results.length ? results : [{ source: "System", title: "No external news found", description: `No recent news for ${query}.` }];
}

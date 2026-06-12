import { getWatchlist }           from "@/app/actions/watchlist";
import { fetchPrices }            from "@/lib/price-service";
import { WatchlistClient }        from "@/components/watchlist/watchlist-client";

export default async function WatchlistPage() {
  const items = await getWatchlist();
  
  let prices = {};
  if (items.length > 0) {
    const priceInputs = items.map((item) => ({
      symbol:      item.symbol,
      type:        item.type,
      exchange:    item.exchange,
      avgBuyPrice: 0,
      currency:    item.currency,
    }));
    try {
      prices = await fetchPrices(priceInputs);
    } catch (err) {
      console.error("Watchlist prices fetch error:", err);
    }
  }

  return <WatchlistClient initialItems={items} initialPrices={prices} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function basicReport(_request: Request) {
  return {
    impressions: 1200,
    redemptions: 84,
    revenueAttributed: 2134.50,
    conversionRate: 84 / 1200,
  };
}
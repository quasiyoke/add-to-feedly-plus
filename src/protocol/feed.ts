export type Feed = {
  url: string;
  title: string | null;
};

export function subscriptionUrl(feed: Feed): string {
  return `https://feedly.com/i/subscription/feed/${feed.url}`;
}

export type Feed = {
  url: string;
  title: string | null;
};

export function label({ title }: Feed, pageTitle: string | undefined) {
  return title || pageTitle || '(no title)';
}

export function subscriptionUrl(feed: Feed): string {
  const path = encodeURIComponent(feed.url);
  return `https://feedly.com/i/subscription/feed%2F${path}`;
}

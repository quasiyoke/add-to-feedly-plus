import type { Feed } from '@/protocol/feed.ts';

export type Page = {
  feeds: Feed[];
  title: string;
};

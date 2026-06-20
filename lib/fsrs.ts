import { createEmptyCard, fsrs, generatorParameters, Rating, Card, RecordLogItem } from "ts-fsrs";

const params = generatorParameters({ enable_fuzz: false });
const scheduler = fsrs(params);

export interface ReviewableItem {
  conceptId: string;
  conceptName: string;
  domain: string;
  card: Card;
  lastReview?: string;
}

// Create a new reviewable card for a concept
export function createReviewCard(conceptId: string, conceptName: string, domain: string): ReviewableItem {
  return {
    conceptId,
    conceptName,
    domain,
    card: createEmptyCard(),
  };
}

// Schedule a review and return the updated card
export function scheduleReview(item: ReviewableItem, rating: Rating): ReviewableItem {
  const now = new Date();
  const scheduling = scheduler.repeat(item.card, now);
  const updated = (scheduling as unknown as Record<number, RecordLogItem>)[rating];

  return {
    ...item,
    card: updated.card,
    lastReview: now.toISOString(),
  };
}

// Find items due for review from a list
export function getDueItems(items: ReviewableItem[]): ReviewableItem[] {
  const now = new Date();
  return items.filter((item) => {
    const due = item.card.due;
    return due <= now;
  });
}

// Re-export Rating for convenience
export { Rating };

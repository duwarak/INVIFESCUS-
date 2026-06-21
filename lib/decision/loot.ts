import { LootDrop, LootTable, LootTier } from "./types";

export const LOOT_TABLES: Record<string, LootTable> = {
  dailyQuest: {
    primary: {
      tableChance: { low: 1, high: 1 },
      items: [
        { item: "Focus Token", itemChance: { low: 1, high: 1 }, minAmount: 25, maxAmount: 75, rarity: "common", emoji: "✦" },
        { item: "Streak Shield", itemChance: { low: 1, high: 4 }, minAmount: 1, maxAmount: 1, rarity: "uncommon", emoji: "🛡" },
      ],
      guaranteed: [
        { item: "XP", minAmount: 50, maxAmount: 50, emoji: "⚡" },
      ],
    },
    secondary: {
      tableChance: { low: 1, high: 6 },
      items: [
        { item: "Insight Drop", itemChance: { low: 1, high: 3 }, minAmount: 1, maxAmount: 1, rarity: "uncommon", emoji: "💡" },
        { item: "Concept Card · Cognition", itemChance: { low: 1, high: 8 }, minAmount: 1, maxAmount: 1, rarity: "rare", emoji: "🧠" },
      ],
    },
    tertiary: {
      tableChance: { low: 1, high: 24 },
      items: [
        { item: "Polymath Sigil", itemChance: { low: 1, high: 12 }, minAmount: 1, maxAmount: 1, rarity: "epic", emoji: "✺" },
      ],
    },
    legendary: {
      tableChance: { low: 1, high: 120 },
      items: [
        { item: "Cross-Domain Crown", itemChance: { low: 1, high: 1 }, minAmount: 1, maxAmount: 1, rarity: "legendary", emoji: "👑" },
      ],
    },
  },
  weeklySynthesis: {
    primary: {
      tableChance: { low: 1, high: 1 },
      items: [
        { item: "Synthesis Token", itemChance: { low: 1, high: 1 }, minAmount: 80, maxAmount: 160, rarity: "uncommon", emoji: "🔗" },
      ],
      guaranteed: [
        { item: "XP", minAmount: 220, maxAmount: 220, emoji: "⚡" },
        { item: "Domain Bridge Card", minAmount: 1, maxAmount: 1, emoji: "🌉" },
      ],
    },
    secondary: {
      tableChance: { low: 1, high: 3 },
      items: [
        { item: "MiroFish Replay", itemChance: { low: 1, high: 2 }, minAmount: 1, maxAmount: 1, rarity: "rare", emoji: "🎞" },
        { item: "Mentor Hour", itemChance: { low: 1, high: 6 }, minAmount: 1, maxAmount: 1, rarity: "epic", emoji: "🧑‍🏫" },
      ],
    },
    legendary: {
      tableChance: { low: 1, high: 60 },
      items: [
        { item: "Aha Moment Shard", itemChance: { low: 1, high: 2 }, minAmount: 1, maxAmount: 1, rarity: "legendary", emoji: "🌟" },
      ],
    },
  },
  bossDecision: {
    primary: {
      tableChance: { low: 1, high: 1 },
      items: [
        { item: "Decision Crystal", itemChance: { low: 1, high: 1 }, minAmount: 1, maxAmount: 1, rarity: "rare", emoji: "💎" },
      ],
      guaranteed: [
        { item: "XP", minAmount: 500, maxAmount: 500, emoji: "⚡" },
        { item: "Pre-mortem Badge", minAmount: 1, maxAmount: 1, emoji: "🛡" },
      ],
    },
    secondary: {
      tableChance: { low: 1, high: 2 },
      items: [
        { item: "Scenario Replay Token", itemChance: { low: 1, high: 1 }, minAmount: 1, maxAmount: 2, rarity: "rare", emoji: "🔮" },
        { item: "Latticework Cosmetic", itemChance: { low: 1, high: 8 }, minAmount: 1, maxAmount: 1, rarity: "epic", emoji: "🪄" },
      ],
    },
    legendary: {
      tableChance: { low: 1, high: 30 },
      items: [
        { item: "C-Suite Mind Trophy", itemChance: { low: 1, high: 1 }, minAmount: 1, maxAmount: 1, rarity: "legendary", emoji: "🏆" },
      ],
    },
  },
};

function rollSuccess(low: number, high: number): boolean {
  return Math.floor(Math.random() * high) + 1 <= low;
}
function rollAmount(min: number, max: number): number {
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateLoot(
  tableName: string,
  tiers: true | (keyof LootTable)[] = true,
  useGuaranteed = true
): LootDrop[] {
  const table = LOOT_TABLES[tableName];
  if (!table) return [];
  const tierKeys: (keyof LootTable)[] =
    tiers === true ? (Object.keys(table) as (keyof LootTable)[]) : tiers;

  const drops: LootDrop[] = [];
  for (const key of tierKeys) {
    const tier: LootTier | undefined = table[key];
    if (!tier) continue;

    if (useGuaranteed && tier.guaranteed) {
      for (const g of tier.guaranteed) {
        drops.push({
          item: g.item,
          amount: rollAmount(g.minAmount, g.maxAmount),
          tier: key as string,
          rarity: "guaranteed",
          emoji: g.emoji ?? "🎁",
          guaranteed: true,
        });
      }
    }

    if (!rollSuccess(tier.tableChance.low, tier.tableChance.high)) continue;

    for (const it of tier.items) {
      if (!rollSuccess(it.itemChance.low, it.itemChance.high)) continue;
      drops.push({
        item: it.item,
        amount: rollAmount(it.minAmount, it.maxAmount),
        tier: key as string,
        rarity: it.rarity ?? "common",
        emoji: it.emoji ?? "•",
        guaranteed: false,
      });
    }
  }
  return drops;
}

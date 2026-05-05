/** Bintang dari jumlah kesalahan (PRD) */
export function starsFromMistakes(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export function computeXp(args: {
  stars: number;
  isFirstComplete: boolean;
  streakBonus: boolean;
}): number {
  const base = args.isFirstComplete ? 20 : 5;
  const perStar = args.stars * 5;
  const streak = args.streakBonus ? 10 : 0;
  return base + perStar + streak;
}

export const LANDING_HERO_PROMPTS_EN = [
  "Make an R&B song about quitting my job",
  "Make a dark drill beat for my 3am thoughts",
  "Write a pop song about me getting ghosted",
  "Make an afrobeats banger for my summer",
  "A melancholic trap about my rainy nights",
  "A lo-fi song for my all-night study sessions",
  "Make a house track about me finally moving on",
  "Travis Scott type beat — spacey and hard, for my next drop",
  "A neo soul song about me missing the train again",
  "Make a jersey club remix of my favorite song",
  "An emotional song about my long-distance love",
  "UK drill beat — cold, cinematic, 140 BPM, for my freestyle",
] as const;

export const LANDING_HERO_PROMPTS_FR = [
  "Fais un son R&B sur ma démission",
  "Un type beat drill sombre pour mes pensées de 3h du mat",
  "Une chanson pop sur mon ex qui ghost",
  "Un beat afrobeats pour mon été à la plage",
  "Une trap mélancolique sur mes nuits pluvieuses",
  "Un song lo-fi pour mes sessions d'étude nocturnes",
  "Un morceau house sur moi qui tourne enfin la page",
  "Type beat Travis Scott — spatial et hard, pour mon prochain son",
  "Une chanson neo soul sur mon train raté (encore)",
  "Un remix jersey club de mon son préféré",
  "Une chanson émotionnelle sur mon amour à distance",
  "Beat drill UK — froid, ciné, 140 BPM, pour mon freestyle",
] as const;

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}

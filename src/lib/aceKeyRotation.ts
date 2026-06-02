/** Compteur client — une clé ACE préférée différente à chaque génération (Edge fait le fallback). */
let aceKeySlot = 0;

export function nextAceKeyPreferIndex(): number {
  aceKeySlot = (aceKeySlot + 1) % 1_000_000;
  return aceKeySlot;
}

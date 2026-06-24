/** Map ACE caption / display hints → genre catalogue (best-effort). */
export function guessGenreFromPromptBank(display: string, caption: string): string {
  const hay = `${display} ${caption}`.toLowerCase();

  const rules: Array<[RegExp, string]> = [
    [/\buk drill\b/, "UK Drill"],
    [/\bny drill\b|\bdrill\b/, "Melodic Drill"],
    [/\btrapsoul\b/, "Trapsoul"],
    [/\bdark r&b\b|\bdark rnb\b/, "Dark R&B"],
    [/\bneo soul\b/, "Neo Soul"],
    [/\bafrobeat\b|\bafrobeats\b/, "Afrobeats"],
    [/\bafropop\b/, "Afrobeats"],
    [/\bdancehall\b/, "Dancehall"],
    [/\bboom bap\b/, "Old School Hip-Hop"],
    [/\blo-?fi\b/, "Lo-Fi Hip-Hop"],
    [/\bgospel\b/, "Neo Soul"],
    [/\bconscious rap\b|\bspoken word\b/, "Contemporary Rap"],
    [/\bcloud trap\b/, "Cloud Rap"],
    [/\bambient trap\b/, "Ambient Trap"],
    [/\bhouse\b/, "House"],
    [/\bhyperpop\b/, "Hyperpop"],
    [/\bphonk\b/, "Brazilian Phonk"],
    [/\bpop r&b\b|\bpop rnb\b/, "Contemporary R&B"],
    [/\br&b\b|\brnb\b/, "Contemporary R&B"],
    [/\btrap\b/, "Melodic Trap"],
    [/\bhip hop\b|\bhip-hop\b/, "Contemporary Rap"],
    [/\bsoul\b/, "Neo Soul"],
    [/\bindie r&b\b|\bindie rnb\b/, "R&B Alternative"],
    [/\balt r&b\b|\balt rnb\b/, "R&B Alternative"],
  ];

  for (const [re, genre] of rules) {
    if (re.test(hay)) return genre;
  }
  return "Contemporary R&B";
}

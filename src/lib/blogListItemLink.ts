/** Parse hub list items like "Title → /blog/slug" into label + internal href. */
export function parseBlogListItemLink(item: string): { label: string; href: string | null } {
  const arrowMatch = item.match(/^(.+?)\s*→\s*(\/\S+)\s*$/);
  if (arrowMatch) {
    return { label: arrowMatch[1]!.trim(), href: arrowMatch[2]!.trim() };
  }
  const barePath = item.match(/^(\/\S+)$/);
  if (barePath) {
    return { label: barePath[1]!, href: barePath[1]! };
  }
  return { label: item, href: null };
}

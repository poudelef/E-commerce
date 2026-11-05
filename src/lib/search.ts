export type Searchable = {
  name: string;
  keywords: string;
  categoryName: string;
};

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = previous[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + cost);
      diagonal = saved;
    }
  }
  return previous[b.length];
}

function tokenLimit(token: string) {
  if (token.length >= 7) return 2;
  if (token.length >= 5) return 1;
  return 0;
}

function tokenMatches(token: string, haystack: string) {
  if (!token) return true;
  if (haystack.includes(token)) return true;
  const limit = tokenLimit(token);
  if (!limit) return false;
  return haystack.split(/[^a-z0-9]+/).some((word) => {
    if (!word) return false;
    if (Math.abs(word.length - token.length) > limit) return false;
    return levenshtein(token, word) <= limit;
  });
}

export function searchScore(item: Searchable, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const name = item.name.toLowerCase();
  const keywords = item.keywords.toLowerCase();
  const category = item.categoryName.toLowerCase();
  const haystack = `${name} ${keywords} ${category}`;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!tokens.every((token) => tokenMatches(token, haystack))) return null;

  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  if (keywords.includes(q) || category.includes(q)) return 3;
  return 4;
}

export function matchesQuery(item: Searchable, query: string) {
  return searchScore(item, query) !== null;
}

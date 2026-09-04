/** Parse @mentions out of comment body text against a known set of members. */
export interface MentionCandidate {
  userId: string;
  name: string;
}

/**
 * Matches "@Firstname" or "@Firstname_Lastname" tokens in text and resolves
 * them against the given candidates by case-insensitive first-name (or
 * full-name with underscores) match.
 */
export function extractMentions(body: string, candidates: MentionCandidate[]): MentionCandidate[] {
  const tokens = body.match(/@([A-Za-z][A-Za-z0-9_.-]*)/g) ?? [];
  if (tokens.length === 0) return [];

  const found = new Map<string, MentionCandidate>();
  for (const token of tokens) {
    const handle = token.slice(1).toLowerCase().replace(/[_.-]+/g, " ");
    const match = candidates.find((c) => {
      const full = c.name.toLowerCase();
      const first = full.split(" ")[0];
      return full === handle || first === handle || full.replace(/\s+/g, " ").startsWith(handle);
    });
    if (match) found.set(match.userId, match);
  }
  return Array.from(found.values());
}

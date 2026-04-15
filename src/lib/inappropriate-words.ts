export const inappropriateWords = [
  // Common mild profanities
  "darn",
  "heck",
  "gosh",
  "crap",
  "damn",
  "hell",

  // Common insults
  "stupid",
  "idiot",
  "dumb",
  "moron",
  "jerk",

  // Words that could be used for bullying
  "loser",
  "ugly",
  "fat",
  "weirdo",
  
  // A production system would use a much more comprehensive, managed list or a dedicated API.
];

/**
 * Checks if a given string contains any inappropriate words from the list.
 * The check is case-insensitive and checks for whole words to avoid false positives (e.g., 'ass' in 'class').
 * @param text The string to check.
 * @returns `true` if inappropriate words are found, otherwise `false`.
 */
export function containsInappropriateWords(text: string): boolean {
  if (!text) {
    return false;
  }
  const lowerCaseText = text.toLowerCase();
  // Using word boundaries (\b) to prevent matching substrings inside other words.
  return inappropriateWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerCaseText);
  });
}

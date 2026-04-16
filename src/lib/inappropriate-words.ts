export const inappropriateWords = [
  // Profanities
  "darn","heck","gosh","crap","damn","hell","ass","shit","fuck","bitch","bastard",
  "piss","dick","cock","pussy","cunt","whore","slut","fag","nigga","nigger",
  // Violence
  "kill","murder","rape","stab","shoot","bomb","terrorist","suicide","die","death",
  "blood","gore","weapon","gun","knife","drug","cocaine","weed","porn","sex",
  // Insults / bullying
  "stupid","idiot","dumb","moron","jerk","loser","ugly","fat","weirdo","retard",
  "freak","hate","racist","abuse","bully","harass",
];

// Extra strict list for under-10
const UNDER_10_EXTRA = [
  "fight","violence","scary","horror","ghost","demon","devil","witch","war",
  "alcohol","beer","wine","smoke","cigarette","vape","dating","kiss","romance",
  "boyfriend","girlfriend","sexy","hot","naked","nude",
];

export function containsInappropriateWords(text: string, strict = false): boolean {
  if (!text) return false;
  const list = strict ? [...inappropriateWords, ...UNDER_10_EXTRA] : inappropriateWords;
  return list.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
}

export function filterForUnder10(text: string): boolean {
  return containsInappropriateWords(text, true);
}

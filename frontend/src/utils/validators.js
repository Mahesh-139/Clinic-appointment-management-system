export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidPassword(value) {
  // Minimum bar for the skeleton phase: 8+ characters.
  // Tighten this (uppercase/number/symbol rules) during Phase 5.
  return typeof value === "string" && value.length >= 8;
}

export function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

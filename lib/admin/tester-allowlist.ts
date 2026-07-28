/**
 * Tester / investor accounts — Profile unlocks skip-wait + jump to L2/L3.
 * Keep in sync with product owners; not a security boundary for server secrets.
 */
const TESTER_INVESTOR_EMAILS = [
  "michaelkillgta@gmail.com",
  "michaelkilligta@gmail.com", // common spelling of the same tester
  "alexis36sg@gmail.com",
  "mailidpwd@gmail.com",
] as const;

const TESTER_SET = new Set(
  TESTER_INVESTOR_EMAILS.map((email) => email.toLowerCase()),
);

export function isTesterInvestorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return TESTER_SET.has(email.trim().toLowerCase());
}

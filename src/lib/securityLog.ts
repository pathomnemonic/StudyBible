/** Plain-language lines for the account's security log (the server stores short event names). */
const TEXT: Record<string, string> = {
  'account-created': 'Account created',
  'signed-in': 'Signed in',
  'wrong-password': 'A wrong password was tried',
  'wrong-code': 'A wrong two-factor code was tried',
  'password-changed': 'Password changed',
  'password-reset': 'Password reset with an operator code',
  'email-changed': 'Email address changed',
  '2fa-enabled': 'Two-factor sign-in turned on',
  '2fa-disabled': 'Two-factor sign-in turned off',
  'recovery-codes-renewed': 'Recovery codes renewed',
  'recovery-code-used': 'A recovery code was used',
};
export const describeEvent = (e: string) => TEXT[e] ?? e;

/** the server's wording when a sign-in needs a second code (so the form can ask for it) */
export const needsCode = (message: string) => /six-digit code/i.test(message);

/** recovery codes as a downloadable text file */
export function recoveryFile(email: string, codes: string[]): string {
  return `Recovery codes for ${email}\nEach code works once. Keep this file somewhere safe and private.\n\n${codes.join('\n')}\n`;
}

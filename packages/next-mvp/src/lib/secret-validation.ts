export function validateAuthSecret(secret: string): { valid: boolean; reason?: string } {
  if (!secret || typeof secret !== 'string') return { valid: false, reason: 'missing' };
  if (secret.length < 32) return { valid: false, reason: 'too_short' };
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];
  const score = classes.reduce((acc, re) => acc + (re.test(secret) ? 1 : 0), 0);
  if (score < 3) return { valid: false, reason: 'weak' };
  return { valid: true };
}

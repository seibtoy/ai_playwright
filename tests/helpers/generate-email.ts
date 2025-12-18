export function generateEmail(domain: string = 'example.com'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `user_${timestamp}_${random}@${domain}`;
}

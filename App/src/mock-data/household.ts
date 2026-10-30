// MOCK DATA: household members and invite codes are fake until a backend exists.
export const MOCK_MEMBER_NAMES = ['Lan', 'Minh', 'Hà', 'Tuấn', 'Mai', 'Phúc']

export function generateInviteCode(): string {
  // No look-alike characters (0/O, 1/I) so codes are easy to read aloud.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `MISE-${suffix}`
}

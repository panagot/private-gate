/** Gate rules operators can attach to a drop. Local demoCheck rehearses the M1 presentation predicate. */

export const RULES = [
  {
    id: 'age18',
    label: 'Age 18+',
    short: 'Prove age ≥ 18',
    description: 'Claimant proves they are at least 18 without revealing date of birth.',
    demoField: 'age',
    demoCheck: (cred) => Number(cred.age) >= 18,
    localHow:
      'Issue a local credential with Age ≥ 18, then Present & claim. The app only records “age ≥ 18” — not the number you typed.',
    m1How:
      'An issuer puts a real ID/age credential in Auro via mina-attestations. Private Gate asks the wallet for a PresentationRequest: age ≥ 18. The wallet returns a ZK proof. A zkApp verifies it and pays out. Date of birth never leaves the wallet.',
    reveals: 'age ≥ 18 (boolean / age bucket)',
    hides: 'date of birth, exact age',
  },
  {
    id: 'non_us',
    label: 'Non-US jurisdiction',
    short: 'Prove not US',
    description: 'Claimant proves nationality is not United States — classic exchange-style check.',
    demoField: 'nationality',
    demoCheck: (cred) => String(cred.nationality).toLowerCase() !== 'united states',
    localHow:
      'Issue a local credential whose Nationality is anything except “United States”, then Present & claim. Only “nationality ≠ US” is recorded.',
    m1How:
      'Wallet holds a nationality (or residency) credential from an issuer. Gate requests: nationality ≠ United States. Presentation proves the inequality without naming the actual country. zkApp verifies → payout.',
    reveals: 'nationality ≠ United States',
    hides: 'which country / residency they have',
  },
  {
    id: 'email_mina',
    label: 'Email domain @mina.local',
    short: 'Prove email domain',
    description:
      'Claimant proves email ends with @mina.local without revealing the full address. (@mina.local is a demo domain for review — not a real mail system.)',
    demoField: 'email',
    demoCheck: (cred) => String(cred.email).toLowerCase().endsWith('@mina.local'),
    localHow:
      'Issue a local credential with an email ending in @mina.local (e.g. builder@mina.local), then Present & claim. Only the domain match is recorded — not the full address.',
    m1How:
      'Same pattern with a real issuer domain (e.g. @company.com). Wallet proves “email ends with X” via mina-attestations. Full inbox address stays private. zkApp verifies → payout.',
    reveals: 'email domain = @mina.local (or configured domain)',
    hides: 'local-part / full email address',
  },
]

export function getRule(id) {
  return RULES.find((r) => r.id === id) || RULES[0]
}

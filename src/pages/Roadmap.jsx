const ITEMS = [
  {
    status: 'done',
    title: 'Local claim path',
    body: 'Create gate, credential attach, selective disclosure, nullifier, destination-bound auth, expiry, refund, and bearer claim / refund links in the URL hash.',
    exit: 'Reviewer can complete create → present → claim → refund without a faucet.',
  },
  {
    status: 'done',
    title: 'Operator shell',
    body: 'Auro connect, Local / Devnet switch, Status probes, Security checks, Exploration evidence slots, and a verification checklist for reviewers.',
    exit: 'Dual-path honesty is visible in the header and claim failures.',
  },
  {
    status: 'next',
    title: 'M1 — Live presentation',
    body: 'Replace the local credential panel with Auro + mina-attestations PresentationRequest for the same gates (age ≥ 18, non-US, email domain). zkApp verifies on Devnet; local ledger stays as honest fallback.',
    weight: 'Exploration · $1,000',
    exit: 'Pinned Devnet claim with explorer hash in operatorProof.',
  },
  {
    status: 'next',
    title: 'M2 — Escrow + nullifier registry',
    body: 'Funded drop escrow, on-chain nullifier set, operator export tooling, and integrator documentation.',
    weight: 'Exploration · $1,000',
    exit: 'Funded drop settles on-chain; double-claim fails against the registry.',
  },
  {
    status: 'later',
    title: 'Mainnet readiness',
    body: 'Only after Devnet E2E with pinned Minascan hashes in operatorProof. No invented explorer links. Audit path discussed after live settlement works.',
    exit: 'Mainnet config + documented risk posture; no premature mainnet claims.',
  },
]

export default function Roadmap() {
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Milestones</p>
        <h1>Roadmap</h1>
        <p>
          What already ships in this prototype versus what Exploration funding completes. Reviewers should judge the
          local path as complete product surface — and M1/M2 as the on-chain completion, not vapor.
        </p>
      </header>

      <div className="page-rail">
        <article>
          <strong>Shipped</strong>
          <p>Local ledger + operator shell ready for walkthroughs now.</p>
        </article>
        <article>
          <strong>M1 · $1,000</strong>
          <p>Presentation + zkApp verify on Devnet.</p>
        </article>
        <article>
          <strong>M2 · $1,000</strong>
          <p>Funded escrow + on-chain nullifier registry.</p>
        </article>
        <article>
          <strong>Mainnet later</strong>
          <p>Only after real Devnet hashes — never invented explorer links.</p>
        </article>
      </div>

      <section className="panel prose" style={{ marginBottom: '1.25rem' }}>
        <h2>Review posture</h2>
        <p>
          Judge the local path as the product contract: create a gate, present a private fact, claim once, refund after
          expiry. Judge M1/M2 as the chain completion that turns the same contract into settlement. Status probes and
          Security checks exist so reviewers can separate UX readiness from chain readiness without guessing.
        </p>
      </section>

      <div className="roadmap-list">
        {ITEMS.map((item) => (
          <article key={item.title} className={`panel road-${item.status}`}>
            <span
              className={`cap-dot ${item.status === 'done' ? 'ready' : item.status === 'next' ? 'partial' : 'next'}`}
            />
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>
                {item.status === 'done' ? 'Shipped' : item.status === 'next' ? 'Next' : 'Later'}
              </p>
              <h2>{item.title}</h2>
              <p className="hint">{item.body}</p>
              {item.weight ? <p className="mono small">{item.weight}</p> : null}
              {item.exit ? (
                <p className="hint">
                  <strong>Exit:</strong> {item.exit}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

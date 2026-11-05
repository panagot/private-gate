/** Visual protocol figure for the home hero — fills the right column on wide screens. */

const STEPS = [
  { n: '01', title: 'Gate', body: 'Rule · amount · expiry stamped by the operator' },
  { n: '02', title: 'Present', body: 'Selective disclosure only — no raw credential' },
  { n: '03', title: 'Claim', body: 'One claim per drop; payout is destination-bound' },
]

export default function GateFigure() {
  return (
    <aside className="gate-figure rise delay-2" aria-label="Claim flow">
      <div className="gate-figure-frame">
        <div className="gate-figure-head">
          <div>
            <p className="gate-figure-kicker">Clearance path</p>
            <strong>Sample operator drop</strong>
          </div>
          <em>Local ledger</em>
        </div>

        <dl className="gate-figure-facts">
          <div>
            <dt>Rule</dt>
            <dd>age ≥ 18</dd>
          </div>
          <div>
            <dt>Reward</dt>
            <dd>1 MINA</dd>
          </div>
          <div>
            <dt>Window</dt>
            <dd>72h</dd>
          </div>
          <div>
            <dt>Claims</dt>
            <dd>1 / drop</dd>
          </div>
        </dl>

        <ol className="gate-figure-steps">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <span className="gate-figure-n">{s.n}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.body}</p>
              </div>
              {i < STEPS.length - 1 ? <span className="gate-figure-rail" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
        <div className="gate-figure-stamp">
          <span>ONCE</span>
          <em>drop closed</em>
        </div>
      </div>
    </aside>
  )
}

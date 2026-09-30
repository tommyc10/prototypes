/* The rule's conditions, as the dashboard prints them. Shared by the pattern scene (where they
 * are written) and the rule page (where they land), so the two line up exactly. */

import { CONDITIONS } from '../data';

export function RuleCode({ className = '' }: { className?: string }) {
  return (
    <div className={`code ${className}`}>
      {CONDITIONS.map((c, i) => (
        <div className="code-line" key={c.field}>
          <span className="code-kw">{i === 0 ? 'where' : '  and'}</span>
          <span>{c.field}</span>
          <span className="code-op">{c.op}</span>
          <span className="code-val" data-from={c.from}>
            {c.general}
          </span>
        </div>
      ))}
      <div className="code-line code-scope">
        <span className="code-kw">{'  and'}</span>
        <span>assignment_group</span>
        <span className="code-op">=</span>
        <span className="code-val">Tractor Beam Ops</span>
      </div>
      <div className="code-cm">{'                                  // scope, locked'}</div>
    </div>
  );
}

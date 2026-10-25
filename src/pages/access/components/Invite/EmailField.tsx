/* The work email field. Type an address and press ↵ (or a comma, or a space), or paste a
 * whole list from an email or a spreadsheet: each address becomes a chip, checked as it
 * lands. Anything that can't be invited says why underneath, in a sentence, beside the way
 * to fix it. Backspace in an empty field takes the last chip back into the text, to correct.
 *
 * Its keys are its own (data-own-keys); ⌘↵ still reaches the page and sends. */

import type { RefObject } from 'react';
import { X } from 'lucide-react';
import { WORK_DOMAIN } from '../../data/mockData';
import { checkEmail, splitEmails, type EmailCheck } from '../../model/people';
import type { Person } from '../../model/types';
import './EmailField.css';

/** Each address in the field, checked against everyone already let in and the ones before it. */
export function checkAll(emails: string[], people: Person[]) {
  return emails.map((email, i) => ({ email, check: checkEmail(email, people, emails.slice(0, i)) }));
}

export function EmailField({
  emails,
  text,
  onChange,
  people,
  onOpen,
  inputRef,
}: {
  emails: string[];
  /** What's typed and not yet a chip. */
  text: string;
  onChange: (emails: string[], text: string) => void;
  people: Person[];
  /** Open someone who already has access. */
  onOpen: (person: Person) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const checked = checkAll(emails, people);

  /** Turn whatever's typed into chips, leaving anything without an @ as text. */
  const commit = (raw: string) => {
    const found = splitEmails(raw);
    const fresh = found.filter((e, i) => !emails.some((x) => x.toLowerCase() === e.toLowerCase()) && found.findIndex((f) => f.toLowerCase() === e.toLowerCase()) === i);
    onChange([...emails, ...fresh], found.length ? '' : raw);
  };

  const removeAt = (i: number) => onChange(emails.filter((_, j) => j !== i), text);

  const problems = checked.filter(({ check }) => check.kind !== 'ok');

  return (
    <div className="ac-email" data-own-keys>
      <div className="ac-email-box" onClick={() => inputRef.current?.focus()} data-invalid={problems.some((p) => blocks(p.check)) || undefined}>
        {checked.map(({ email, check }, i) => (
          <span key={email} className="ac-email-chip" data-check={check.kind}>
            <span className="mn-truncate">{email}</span>
            <button
              type="button"
              className="ac-email-x"
              aria-label={`Remove ${email}`}
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
                inputRef.current?.focus();
              }}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={text}
          aria-label="Work email addresses"
          placeholder={emails.length ? '' : `name@${WORK_DOMAIN}, or paste a list`}
          onChange={(e) => {
            const value = e.target.value;
            // A separator typed straight after an address turns it into a chip.
            if (/[,;\s]$/.test(value) && value.includes('@')) commit(value);
            else onChange(emails, value);
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text');
            if (!pasted.includes('@')) return;
            e.preventDefault();
            commit(`${text} ${pasted}`);
          }}
          onBlur={() => text.includes('@') && commit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              commit(text);
            } else if (e.key === 'Backspace' && !text && emails.length) {
              e.preventDefault();
              // The last chip comes back as text, so a typo is one key away from fixed.
              onChange(emails.slice(0, -1), emails[emails.length - 1]!);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {problems.length > 0 && (
        <ul className="ac-email-problems" aria-live="polite">
          {problems.map(({ email, check }) => (
            <li key={email} data-blocks={blocks(check) || undefined}>
              <Problem email={email} check={check} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Whether an address stops the invitation going (one already let in is just left out). */
export const blocks = (check: EmailCheck) => check.kind === 'malformed' || check.kind === 'outside';

function Problem({ email, check, onOpen }: { email: string; check: EmailCheck; onOpen: (person: Person) => void }) {
  switch (check.kind) {
    case 'malformed':
      return <>“{email}” isn’t an email address. Fix it or remove it.</>;
    case 'outside':
      return (
        <>
          <b>{email}</b> isn’t a work address. Only @{WORK_DOMAIN} addresses can be invited.
        </>
      );
    case 'member':
      return (
        <>
          <b>{email}</b> already has access, so won’t be invited again.{' '}
          <button type="button" className="mn-link" onClick={() => onOpen(check.person)}>
            Open {check.person.name}
          </button>
        </>
      );
    default:
      return null;
  }
}

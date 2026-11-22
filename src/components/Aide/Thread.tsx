/* The conversation. Each kind of thing the aide says has one renderer, keyed by `said.kind`:
 *
 *   hello   who it is, what it knows, and the first shift
 *   reply   a handbook answer, or "I don't know that one yet" with nearer questions
 *   page    a page introduced: what it's for, and the parts it can point at
 *   shift   the first shift, as a card
 *   done    a mission ticked off, and the next one
 *
 * Each new message inks in, a block at a time, so it reads as being said. Older messages
 * don't move again. */

import { ArrowRight, Check, Eye, Sparkles } from 'lucide-react';
import { goKey, type PageId } from '../../lib/route';
import { briefFor, MISSIONS, nextMission, resolve, type Action, type Mission, type MissionId } from './model';
import { progress, useAide, type Message, type Said } from './useAide';

export interface Do {
  run: (action: Action) => void;
  ask: (question: string) => void;
  tryMission: (mission: Mission) => void;
}

/** "Jump with ⌘K" → "jump with ⌘K", for the middle of a sentence. */
export const lower = (title: string) => title[0]!.toLowerCase() + title.slice(1);

function Act({ action, page, run }: { action: Action; page: PageId; run: Do['run'] }) {
  if (action.kind === 'show')
    return (
      <button className="mn-aide-act" onClick={() => run(action)}>
        <Eye size={14} /> {action.label}
      </button>
    );
  if (action.kind === 'tour')
    return (
      <button className="mn-aide-act" onClick={() => run(action)}>
        <Sparkles size={14} /> Take the tour <kbd>?</kbd>
      </button>
    );
  const brief = briefFor(action.page);
  const key = goKey(action.page);
  return (
    <button className="mn-aide-act" onClick={() => run(action)}>
      {action.page === page ? 'Show me here' : `Open ${brief?.name ?? action.page}`}
      {key && action.page !== page ? (
        <span className="mn-aide-keys">
          <kbd>G</kbd>
          <kbd>{key}</kbd>
        </span>
      ) : (
        <ArrowRight size={14} />
      )}
    </button>
  );
}

function Shift({ done, tryMission }: { done: readonly MissionId[]; tryMission: Do['tryMission'] }) {
  const { n, of, next } = progress(done);
  return (
    <div className="mn-aide-card mn-aide-shift">
      <div className="mn-aide-card-head">
        <b>Your first shift</b>
        <span className="mn-aide-count">
          {n} of {of}
        </span>
      </div>
      <div className="mn-aide-meter" role="progressbar" aria-valuemin={0} aria-valuemax={of} aria-valuenow={n} aria-label="First shift">
        <i style={{ transform: `scaleX(${n / of})` }} />
      </div>
      <ol className="mn-aide-missions">
        {MISSIONS.map((m) => {
          const isDone = done.includes(m.id);
          const isNext = m.id === next?.id;
          return (
            <li key={m.id}>
              <button className="mn-aide-mission" data-done={isDone || undefined} data-next={isNext || undefined} onClick={() => tryMission(m)} aria-label={`${m.title}${isDone ? ', done' : ''}`}>
                <span className="mn-aide-tick" aria-hidden>
                  {isDone && <Check size={10} strokeWidth={3} />}
                </span>
                <span className="mn-aide-mission-text">
                  <span>{m.title}</span>
                  {isNext && <span className="mn-aide-why">{m.why}</span>}
                </span>
                {isNext && <ArrowRight size={14} aria-hidden />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Say({ said, page, act }: { said: Said; page: PageId; act: Do }) {
  const done = useAide((s) => s.done);
  const rank = useAide((s) => s.officer).split(' ')[0];

  switch (said.kind) {
    case 'hello':
      return (
        <>
          <p>
            Hello, {rank}. I'm <b>Aide</b>, and I'll get you up to speed on Imperial Ops.
          </p>
          <p>Ask me about a page, a key or a colour, and I'll show you where it lives. I know the handbook, not today's live figures.</p>
          <Shift done={done} tryMission={act.tryMission} />
        </>
      );

    case 'shift':
      return <Shift done={done} tryMission={act.tryMission} />;

    case 'done': {
      const mission = MISSIONS.find((m) => m.id === said.mission)!;
      const next = nextMission(done);
      return (
        <>
          <p className="mn-aide-done">
            <span className="mn-aide-tick" data-done aria-hidden>
              <Check size={10} strokeWidth={3} />
            </span>
            <span>
              <b>{mission.title}</b>, done. {done.length} of {MISSIONS.length}.
            </span>
          </p>
          {next ? (
            <>
              <p>
                Next, <b>{lower(next.title)}</b>. {next.why}
              </p>
              <div className="mn-aide-acts">
                <button className="mn-aide-act" onClick={() => act.tryMission(next)}>
                  Let's go <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <p>
              That's your first shift. You're cleared for duty, {rank}. I'll be here, <kbd>Q</kbd> away.
            </p>
          )}
        </>
      );
    }

    case 'page': {
      const brief = briefFor(said.page);
      if (!brief) return null;
      const here = said.page === page;
      return (
        <>
          <p>
            This is <b>{brief.name}</b>. {brief.summary}
          </p>
          <div className="mn-aide-card">
            {brief.points.map((point, i) => (
              <button key={i} className="mn-aide-point" disabled={!here} onClick={() => act.run({ kind: 'show', target: point.target, label: 'Show me' })}>
                <span>{point.text}</span>
                {here && <Eye size={14} aria-label="Show me" />}
              </button>
            ))}
          </div>
          {brief.tour && here && (
            <div className="mn-aide-acts">
              <Act action={{ kind: 'tour' }} page={page} run={act.run} />
            </div>
          )}
        </>
      );
    }

    case 'missing':
      return <p>It isn't on screen right now. It usually appears once something in the list is picked.</p>;

    case 'reply': {
      const { reply } = said;
      if (reply.kind === 'unknown')
        return (
          <>
            <p>I don't know that one yet. I know the pages, the keys, the colours and the decisions. Closest I have:</p>
            <div className="mn-aide-acts" data-stack>
              {reply.nearest.map((e) => (
                <button key={e.id} className="mn-aide-act" onClick={() => act.ask(e.question)}>
                  {e.question}
                </button>
              ))}
            </div>
          </>
        );
      const actions = resolve(reply.entry.actions ?? [], page);
      return (
        <>
          <div className="mn-aide-body">{resolve(reply.entry.body, page)}</div>
          {actions.length > 0 && (
            <div className="mn-aide-acts">
              {actions.map((a, i) => (
                <Act key={i} action={a} page={page} run={act.run} />
              ))}
            </div>
          )}
        </>
      );
    }
  }
}

export function Thread({ thread, page, act }: { thread: Message[]; page: PageId; act: Do }) {
  return (
    <>
      {thread.map((m) =>
        m.from === 'you' ? (
          <div key={m.id} className="mn-aide-you" data-msg={m.id}>
            {m.text}
          </div>
        ) : (
          <div key={m.id} className="mn-aide-say" data-msg={m.id}>
            <Say said={m.said} page={page} act={act} />
          </div>
        ),
      )}
    </>
  );
}


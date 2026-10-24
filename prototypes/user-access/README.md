# People & access prototypes

With the existing Vite server running, open:

http://localhost:5188/prototypes/user-access/

An isolated exploration. Production code imports nothing from this folder. All three directions use the existing Geist fonts, Midnight tokens, plain CSS and shared button recipes.

| Variant | Direction | Tradeoff |
| --- | --- | --- |
| Roster | People table, status filters and adjacent permissions editor | Best overview; less room for deep permission trees |
| Directory | Searchable people list with a dedicated permission workspace | More room per person; less useful for comparing the whole crew |
| Scope map | Assignment groups first, with a person-by-stream matrix | Best for auditing and batch edits; less direct for a single-person change |

Keys: **1–3** or **←/→** change direction, **R** remounts it, **N** starts an invitation, **/** focuses search, **Esc** closes the editor, **⌘/Ctrl Enter** saves. Typing in fields never changes variants. The selected variant survives reload through `?v=1`, `?v=2` or `?v=3`.

All three support email invitations, Member/Admin roles, assignment groups, streams, individual sub-streams, partial checkbox states, editing and removal. Scope-map changes are staged and saved as a batch. Expand a matrix cell to select its individual sub-streams.

New streams are excluded until explicitly selected. The signed-in admin cannot edit or remove their own access. Admins manage workspace membership; operational data access is still defined by the chosen scopes.

These are interactive client-side prototypes. No invitation email is sent and no real authorization is changed. Member data is saved under the dedicated `imperial-ops-user-access-prototype-v1` localStorage key and shared across directions; activity is session-local. Theme choice uses `mn-ua-prototype-theme`, separate from production.

Browser verification covered invitation validation, group inheritance, individual exclusions, cross-variant editing, native modal editing, confirmed removal, and a two-person batch save surviving reload. The disposable QA invitation was removed and the sample permission restored afterward. Each direction also receives a separate TypeScript check because the repository's tsconfig includes production directories only.

Once a direction is selected, integrate that version in `src/pages/` and remove this prototype folder unless the picker is requested to stay.

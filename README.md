# Rule management

The Midnight rule management page: review rules the engine proposes, and approve,
reject, activate or deactivate them with a written reason. It runs on mock data.

```bash
npm install
npm run dev      # http://localhost:5188
```

## Product stories

- **[Fly](story-directions/)** — the selected 3D scroll story; `cd story-directions && npm install && npm run dev`, then http://localhost:5191. Fly opens by default; Zoom and Snap remain in the picker.
- **[Midnight](midnight-story/)** — the original detailed walkthrough; `cd midnight-story && npm install && npm run dev`, then http://localhost:5189.
- **[scroll-story skill](.claude/skills/scroll-story/)** — reuse either direction in Claude Code or Codex. The `.agents/skills/scroll-story` link points to the same skill.

## Where things are

```
src/
├── main.tsx                  Entry point: fonts, global styles, renders <App/>
├── App.tsx                   The page + the toast container
├── lib/                      Helpers that know nothing about rules
│   ├── clock.ts              The frozen "now" the mock data is built around
│   └── format.ts             93% · 2h ago · 28 Sept · 1h 5m
├── styles/                   Styles for the whole app
│   ├── base.css              Resets + easing curves
│   ├── theme.css             Colour tokens (dark + light) + the theme dissolve
│   ├── ui.css                Shared building blocks: buttons, search, tabs, dots…
│   └── accessibility.css     Reduced transparency + high contrast (loaded last)
└── pages/rule-management/
    ├── RuleManagementPage.tsx   The page: owns the state, wires the pieces together
    ├── RuleManagementPage.css   The three-column layout
    ├── data/mockData.ts         The fake rules and groups (the real API replaces this)
    ├── model/                   The rules of the domain: plain TypeScript, no React
    │   ├── types.ts             What a Rule, incident, audit entry… looks like
    │   ├── policy.ts            Who can do what: actions, validation, impact
    │   ├── labels.ts            The words shown for each value
    │   └── browse.ts            Search, sort, status tabs, group counts
    ├── hooks/                   State and behaviour, one job each
    │   ├── useRulesStore.ts     Where the rules live; apply() changes one
    │   ├── useRuleView.ts       The list's tab, search, group and sort
    │   ├── useWorkingSet.ts     The open tabs
    │   ├── useDecision.ts       The decision form's state and submit
    │   ├── useBacktest.ts       The (faked) backtest while approving
    │   ├── usePaneMode.ts       narrow / wide / ultra, from the pane's width
    │   ├── useTheme.ts          Light / dark
    │   └── useKeyboardShortcuts.ts   Who gets each key press
    └── components/              What you see; each has its CSS next to it
        ├── Sidebar/             Navigation, groups (with search), user, theme
        ├── RuleList/            Search, status tabs, sort menu, rows
        ├── RuleTabs/            The working-set tab bar
        ├── RuleDetail/          The selected rule and its sections
        ├── Composer/            The decision form + hold-to-override
        ├── Incidents/           Incident table, browser, and slide-over panel
        ├── CommandPalette/      ⌘K
        └── common/              Action buttons, weekly chart, decision toast
```

## How it fits together

Data flows **down** as props; changes come back **up** as callbacks.

1. `useRulesStore` holds the rules. `useRuleView` filters and sorts them into `visible`.
2. `RuleManagementPage` passes them to `RuleList`, `RuleTabs` and `RuleDetail`.
3. Pressing Approve calls `act()` → `useDecision` opens the `Composer`.
4. Submitting runs `validate()` → `apply()` updates the store → everything re-renders.

## Going live

Everything fake is in two places: `data/mockData.ts` (rules, groups, incidents) and
`lib/clock.ts` (the frozen date). The backtest timer is in `hooks/useBacktest.ts`, and
`estimateImpact()` in `model/policy.ts` stands in for real impact numbers.

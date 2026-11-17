/* The product's own CSS, lesson by lesson. Imperial Ops is written in plain CSS: a class
 * name (mn-btn) gives a piece its look, a data attribute (data-variant="primary") its variant
 * or state, and tokens (var(--l3)) its colours. Shared pieces start with mn-, Hindcast pieces
 * with hc-.
 *
 * Each demo is a stage of plain HTML and the stylesheet that draws it. The page shows that
 * stylesheet in an editable box, so changing a number here changes what the lesson starts from.
 * This content came from the Midnight style cheat sheet, which this guide replaced. */

export type Part =
  | { k: "p" | "note"; html: string }
  | { k: "demo"; id?: string; col?: boolean; flush?: boolean; surface?: "l1"; html: string; markup?: string; label?: string; css: string }
  | { k: "why"; items: string[] }
  | { k: "recipes"; key: keyof typeof RECIPES }
  | { k: "label"; text: string }
  | { k: "type" }
  | { k: "lookup"; head: string[]; rows: string[][] }

export type Lesson = { title: string; lede: string; entries: { title: string; parts: Part[] }[] }

/** One recipe three ways: the CSS, a Tailwind class that works in any project (values written
 * inline), and the shorter class that works with this guide's theme. */
export type Recipe = { name: string; use: string; preview?: string; glass?: boolean; css: string; tailwind: string; theme: string }

export const RECIPES = {
  surfaces: [
    {
      name: "Ring",
      use: "The 1px outline on almost everything",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);box-shadow: inset 0 0 0 1px var(--line);\"></div>",
      css: "box-shadow: inset 0 0 0 1px var(--line);",
      tailwind: "inset-ring inset-ring-[rgba(255,255,255,0.07)]",
      theme: "inset-ring inset-ring-line",
    },
    {
      name: "Stronger ring",
      use: "Buttons, fields, the important card",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);box-shadow: inset 0 0 0 1px var(--line-2);\"></div>",
      css: "box-shadow: inset 0 0 0 1px var(--line-2);",
      tailwind: "inset-ring inset-ring-[rgba(255,255,255,0.11)]",
      theme: "inset-ring inset-ring-line-2",
    },
    {
      name: "Lit top edge + ring",
      use: "What makes a card look lifted",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line);\"></div>",
      css: "box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line);",
      tailwind: "inset-shadow-[0_1px_0_rgba(255,255,255,0.03)] inset-ring inset-ring-[rgba(255,255,255,0.07)]",
      theme: "inset-shadow-edge inset-ring inset-ring-line",
    },
    {
      name: "Card",
      use: "Stat cards, tables, panels",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);padding: 14px 16px; border-radius: 12px; background: var(--l3); box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line);\"></div>",
      css: `padding: 14px 16px;
border-radius: 12px;
background: var(--l3);
box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line);`,
      tailwind: "rounded-xl bg-[#161616] px-4 py-3.5 inset-shadow-[0_1px_0_rgba(255,255,255,0.03)] inset-ring inset-ring-[rgba(255,255,255,0.07)]",
      theme: "rounded-2xl bg-l3 px-4 py-3.5 inset-shadow-edge inset-ring inset-ring-line",
    },
    {
      name: "Lead card",
      use: "The one important card on a page",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);padding: 20px; border-radius: 14px; background: var(--l3); box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line-2);\"></div>",
      css: `padding: 20px;
border-radius: 14px;
background: var(--l3);
box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line-2);`,
      tailwind: "rounded-[14px] bg-[#161616] p-5 inset-shadow-[0_1px_0_rgba(255,255,255,0.03)] inset-ring inset-ring-[rgba(255,255,255,0.11)]",
      theme: "rounded-3xl bg-l3 p-5 inset-shadow-edge inset-ring inset-ring-line-2",
    },
    {
      name: "Well",
      use: "Sunken: metric strips, tracks",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);border-radius: 9px; background: var(--well-2); box-shadow: inset 0 0 0 1px var(--line);\"></div>",
      css: `border-radius: 9px;
background: var(--well-2);
box-shadow: inset 0 0 0 1px var(--line);`,
      tailwind: "rounded-[9px] bg-[rgba(0,0,0,0.3)] inset-ring inset-ring-[rgba(255,255,255,0.07)]",
      theme: "rounded-lg bg-well-2 inset-ring inset-ring-line",
    },
    {
      name: "Raised",
      use: "Selected rows, active tabs, buttons",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);border-radius: 9px; background: var(--l4); box-shadow: inset 0 0 0 1px var(--line);\"></div>",
      css: `border-radius: 9px;
background: var(--l4);
box-shadow: inset 0 0 0 1px var(--line);`,
      tailwind: "rounded-[9px] bg-[#1c1c1c] inset-ring inset-ring-[rgba(255,255,255,0.07)]",
      theme: "rounded-lg bg-l4 inset-ring inset-ring-line",
    },
    {
      name: "Divider",
      use: "Between rows, chapters, regions",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);border-top: 1px solid var(--line);\"></div>",
      css: "border-top: 1px solid var(--line);",
      tailwind: "border-t border-[rgba(255,255,255,0.07)]",
      theme: "border-t border-line",
    },
    {
      name: "Keyboard focus",
      use: "On buttons and links",
      css: `outline: 2px solid var(--focus-ring);
outline-offset: 2px;`,
      tailwind: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.45)]",
      theme: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    },
    {
      name: "Field focus glow",
      use: "On inputs and text areas",
      preview: "<div style=\"width:100%;min-height:38px;border-radius:10px;background:var(--l3);box-shadow: inset 0 0 0 1px var(--line-3), 0 0 0 3px var(--focus-glow);\"></div>",
      css: "box-shadow: inset 0 0 0 1px var(--line-3), 0 0 0 3px var(--focus-glow);",
      tailwind: "focus:inset-ring focus:inset-ring-[rgba(255,255,255,0.18)] focus:ring-[3px] focus:ring-white/5",
      theme: "focus:inset-ring focus:inset-ring-line-3 focus:ring-[3px] focus:ring-focus-glow",
    },
  ],
  radius: [
    {
      name: "4px",
      use: "Key caps, bars",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 4px;\"></div>",
      css: "border-radius: 4px;",
      tailwind: "rounded",
      theme: "rounded-xs",
    },
    {
      name: "7px",
      use: "Tabs, nav items, icon buttons",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 7px;\"></div>",
      css: "border-radius: 7px;",
      tailwind: "rounded-[7px]",
      theme: "rounded-md",
    },
    {
      name: "9px",
      use: "Buttons, rows, wells",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 9px;\"></div>",
      css: "border-radius: 9px;",
      tailwind: "rounded-[9px]",
      theme: "rounded-lg",
    },
    {
      name: "10px",
      use: "Fields, callouts, code, menus",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 10px;\"></div>",
      css: "border-radius: 10px;",
      tailwind: "rounded-[10px]",
      theme: "rounded-xl",
    },
    {
      name: "12px",
      use: "Cards, tables, toasts",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 12px;\"></div>",
      css: "border-radius: 12px;",
      tailwind: "rounded-xl",
      theme: "rounded-2xl",
    },
    {
      name: "14px",
      use: "Glass bars, palette, lead cards",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 14px;\"></div>",
      css: "border-radius: 14px;",
      tailwind: "rounded-[14px]",
      theme: "rounded-3xl",
    },
    {
      name: "999px",
      use: "Pills, dots, avatars",
      preview: "<div style=\"width:52px;height:52px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);border-radius: 999px;\"></div>",
      css: "border-radius: 999px;",
      tailwind: "rounded-full",
      theme: "rounded-full",
    },
  ],
  heights: [
    {
      name: "18px",
      use: "Key cap",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 18px;\"></div>",
      css: "height: 18px;",
      tailwind: "h-[18px]",
      theme: "h-[18px]",
    },
    {
      name: "20px",
      use: "Chip",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 20px;\"></div>",
      css: "height: 20px;",
      tailwind: "h-5",
      theme: "h-5",
    },
    {
      name: "24px",
      use: "Badge",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 24px;\"></div>",
      css: "height: 24px;",
      tailwind: "h-6",
      theme: "h-6",
    },
    {
      name: "28px",
      use: "Tab, icon button",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 28px;\"></div>",
      css: "height: 28px;",
      tailwind: "h-7",
      theme: "h-7",
    },
    {
      name: "32px",
      use: "Nav item",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 32px;\"></div>",
      css: "height: 32px;",
      tailwind: "h-8",
      theme: "h-8",
    },
    {
      name: "34px",
      use: "Button, search, input",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 34px;\"></div>",
      css: "height: 34px;",
      tailwind: "h-[34px]",
      theme: "h-8.5",
    },
    {
      name: "38px",
      use: "Table row, palette item",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 38px;\"></div>",
      css: "height: 38px;",
      tailwind: "h-[38px]",
      theme: "h-9.5",
    },
    {
      name: "52px",
      use: "Sticky bar, palette search",
      preview: "<div style=\"width:120px;border-radius:7px;background:var(--l4);box-shadow:inset 0 0 0 1px var(--line-2);height: 52px;\"></div>",
      css: "height: 52px;",
      tailwind: "h-[52px]",
      theme: "h-13",
    },
  ],
  spacing: [
    {
      name: "Card padding",
      use: "Stat cards and most panels",
      css: "padding: 14px 16px;",
      tailwind: "px-4 py-3.5",
      theme: "px-4 py-3.5",
    },
    {
      name: "Lead card padding",
      use: "The important card, the form",
      css: "padding: 20px;",
      tailwind: "p-5",
      theme: "p-5",
    },
    {
      name: "Detail pane padding",
      use: "Around the page content",
      css: "padding: 28px 40px 48px;",
      tailwind: "px-10 pt-7 pb-12",
      theme: "px-10 pt-7 pb-12",
    },
    {
      name: "List header padding",
      use: "Title and search above a list",
      css: "padding: 18px 16px 12px;",
      tailwind: "px-4 pt-[18px] pb-3",
      theme: "px-4 pt-4.5 pb-3",
    },
    {
      name: "Row padding",
      use: "A list row",
      css: "padding: 10px 10px 10px 12px;",
      tailwind: "py-2.5 pr-2.5 pl-3",
      theme: "py-2.5 pr-2.5 pl-3",
    },
    {
      name: "Gap inside a control",
      use: "Icon and label, label and key cap",
      css: "gap: 8px;",
      tailwind: "gap-2",
      theme: "gap-2",
    },
    {
      name: "Gap between cards",
      use: "A row of stat cards",
      css: "gap: 10px;",
      tailwind: "gap-2.5",
      theme: "gap-2.5",
    },
    {
      name: "Gap between sections",
      use: "Rules page sections",
      css: "margin-top: 32px;",
      tailwind: "mt-8",
      theme: "mt-8",
    },
  ],
  glass: [
    {
      name: "Action bar, decision form",
      use: "The floating bar over the detail pane",
      preview: "<div style=\"width:100%;padding:10px 14px;font-size:13px;font-weight:500;color:var(--fg-2);border-radius: 14px; background: var(--glass); -webkit-backdrop-filter: blur(20px) saturate(1.2); backdrop-filter: blur(20px) saturate(1.2); box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-float);\">On glass</div>",
      glass: true,
      css: `border-radius: 14px;
background: var(--glass);
-webkit-backdrop-filter: blur(20px) saturate(1.2);
backdrop-filter: blur(20px) saturate(1.2);
box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-float);`,
      tailwind: "rounded-[14px] bg-[rgba(24,24,24,0.78)] inset-shadow-[0_1px_0_rgba(255,255,255,0.07)] ring ring-[rgba(255,255,255,0.11)] shadow-[0_20px_48px_rgba(0,0,0,0.55)] backdrop-blur-[20px] backdrop-saturate-[1.2]",
      theme: "rounded-3xl bg-glass inset-shadow-glass ring-1 ring-line-2 shadow-float backdrop-blur-[20px] backdrop-saturate-[1.2]",
    },
    {
      name: "Menu",
      use: "Dropdowns and popups",
      preview: "<div style=\"width:100%;padding:10px 14px;font-size:13px;font-weight:500;color:var(--fg-2);border-radius: 10px; background: var(--glass-menu); -webkit-backdrop-filter: blur(16px) saturate(1.2); backdrop-filter: blur(16px) saturate(1.2); box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-pop);\">On glass</div>",
      glass: true,
      css: `border-radius: 10px;
background: var(--glass-menu);
-webkit-backdrop-filter: blur(16px) saturate(1.2);
backdrop-filter: blur(16px) saturate(1.2);
box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-pop);`,
      tailwind: "rounded-[10px] bg-[rgba(28,28,28,0.86)] inset-shadow-[0_1px_0_rgba(255,255,255,0.07)] ring ring-[rgba(255,255,255,0.11)] shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-[16px] backdrop-saturate-[1.2]",
      theme: "rounded-xl bg-glass-menu inset-shadow-glass ring-1 ring-line-2 shadow-pop backdrop-blur-[16px] backdrop-saturate-[1.2]",
    },
    {
      name: "Command palette",
      use: "The thinnest tint, the heaviest blur",
      preview: "<div style=\"width:100%;padding:10px 14px;font-size:13px;font-weight:500;color:var(--fg-2);border-radius: 14px; background: var(--glass-palette); -webkit-backdrop-filter: blur(40px) saturate(1.8); backdrop-filter: blur(40px) saturate(1.8); box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-palette);\">On glass</div>",
      glass: true,
      css: `border-radius: 14px;
background: var(--glass-palette);
-webkit-backdrop-filter: blur(40px) saturate(1.8);
backdrop-filter: blur(40px) saturate(1.8);
box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-palette);`,
      tailwind: "rounded-[14px] bg-[rgba(22,22,22,0.6)] inset-shadow-[0_1px_0_rgba(255,255,255,0.07)] ring ring-[rgba(255,255,255,0.11)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-[40px] backdrop-saturate-[1.8]",
      theme: "rounded-3xl bg-glass-palette inset-shadow-glass ring-1 ring-line-2 shadow-palette backdrop-blur-[40px] backdrop-saturate-[1.8]",
    },
    {
      name: "Toast",
      use: "The confirmation after an action",
      preview: "<div style=\"width:100%;padding:10px 14px;font-size:13px;font-weight:500;color:var(--fg-2);border-radius: 12px; background: var(--glass-toast); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-pop);\">On glass</div>",
      glass: true,
      css: `border-radius: 12px;
background: var(--glass-toast);
-webkit-backdrop-filter: blur(20px);
backdrop-filter: blur(20px);
box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-pop);`,
      tailwind: "rounded-xl bg-[rgba(28,28,28,0.88)] inset-shadow-[0_1px_0_rgba(255,255,255,0.07)] ring ring-[rgba(255,255,255,0.11)] shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-[20px]",
      theme: "rounded-2xl bg-glass-toast inset-shadow-glass ring-1 ring-line-2 shadow-pop backdrop-blur-[20px]",
    },
    {
      name: "Scrim",
      use: "Dims the page behind the palette",
      css: `position: fixed;
inset: 0;
z-index: 50;
background: var(--scrim);`,
      tailwind: "fixed inset-0 z-50 bg-[rgba(0,0,0,0.3)]",
      theme: "fixed inset-0 z-50 bg-scrim",
    },
    {
      name: "Solid tooltip",
      use: "Glass edge and shadow, solid fill",
      preview: "<div style=\"width:100%;padding:10px 14px;font-size:13px;font-weight:500;color:var(--fg-2);border-radius: 9px; background: var(--l4); box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-pop);\">On glass</div>",
      glass: true,
      css: `border-radius: 9px;
background: var(--l4);
box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-pop);`,
      tailwind: "rounded-[9px] bg-[#1c1c1c] inset-shadow-[0_1px_0_rgba(255,255,255,0.07)] ring ring-[rgba(255,255,255,0.11)] shadow-[0_16px_40px_rgba(0,0,0,0.5)]",
      theme: "rounded-lg bg-l4 inset-shadow-glass ring-1 ring-line-2 shadow-pop",
    },
  ],
  layout: [
    {
      name: "The three-column shell",
      use: "Sidebar, list, detail",
      css: `display: grid;
grid-template-columns: 240px 380px 1fr;
height: 100vh;
overflow: hidden;`,
      tailwind: "grid h-screen grid-cols-[240px_380px_1fr] overflow-hidden",
      theme: "grid h-screen grid-cols-[240px_380px_1fr] overflow-hidden",
    },
    {
      name: "A pane",
      use: "A flex column that floating things anchor to",
      css: `position: relative;
display: flex;
flex-direction: column;
min-width: 0;
min-height: 0;`,
      tailwind: "relative flex min-h-0 min-w-0 flex-col",
      theme: "relative flex min-h-0 min-w-0 flex-col",
    },
    {
      name: "The scrolling part of a pane",
      use: "Takes the leftover height and scrolls",
      css: `flex: 1;
min-height: 0;
overflow-y: auto;`,
      tailwind: "min-h-0 flex-1 overflow-y-auto",
      theme: "min-h-0 flex-1 overflow-y-auto",
    },
    {
      name: "Sticky bar",
      use: "Stays at the top of its scroller",
      css: `position: sticky;
top: 0;
z-index: 10;
background: var(--l2);
border-bottom: 1px solid var(--line);`,
      tailwind: "sticky top-0 z-10 border-b border-[rgba(255,255,255,0.07)] bg-[#101010]",
      theme: "sticky top-0 z-10 border-b border-line bg-l2",
    },
    {
      name: "Pinned to the bottom of a pane",
      use: "The parent needs position: relative",
      css: `position: absolute;
left: 24px;
right: 24px;
bottom: 80px;`,
      tailwind: "absolute inset-x-6 bottom-20",
      theme: "absolute inset-x-6 bottom-20",
    },
    {
      name: "Centred over the window",
      use: "The command palette",
      css: `position: fixed;
top: 16vh;
left: 50%;
z-index: 51;
transform: translateX(-50%);`,
      tailwind: "fixed top-[16vh] left-1/2 z-51 -translate-x-1/2",
      theme: "fixed top-[16vh] left-1/2 z-51 -translate-x-1/2",
    },
    {
      name: "Cover the whole parent",
      use: "Fills, overlays, the meter fill",
      css: `position: absolute;
inset: 0;`,
      tailwind: "absolute inset-0",
      theme: "absolute inset-0",
    },
    {
      name: "A row as a grid",
      use: "Fixed columns, one that stretches",
      css: `display: grid;
grid-template-columns: 84px minmax(0, 1fr) auto 52px;
align-items: center;
gap: 12px;`,
      tailwind: "grid grid-cols-[84px_minmax(0,1fr)_auto_52px] items-center gap-3",
      theme: "grid grid-cols-[84px_minmax(0,1fr)_auto_52px] items-center gap-3",
    },
    {
      name: "Equal columns",
      use: "A row of stat cards",
      css: `display: grid;
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 10px;`,
      tailwind: "grid grid-cols-4 gap-2.5",
      theme: "grid grid-cols-4 gap-2.5",
    },
    {
      name: "Row of things, centred",
      use: "The default inside any control",
      css: `display: flex;
align-items: center;
gap: 8px;`,
      tailwind: "flex items-center gap-2",
      theme: "flex items-center gap-2",
    },
    {
      name: "Push to the far right",
      use: "A key cap, a timestamp",
      css: "margin-left: auto;",
      tailwind: "ml-auto",
      theme: "ml-auto",
    },
    {
      name: "One line with an ellipsis",
      use: "Needs min-width: 0 in a flex or grid cell",
      css: `min-width: 0;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;`,
      tailwind: "min-w-0 truncate",
      theme: "min-w-0 truncate",
    },
    {
      name: "Reading width",
      use: "Body paragraphs",
      css: "max-width: 68ch;",
      tailwind: "max-w-[68ch]",
      theme: "max-w-[68ch]",
    },
    {
      name: "Scroll edge fade",
      use: "On the scrolling list",
      css: "mask-image: linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%);",
      tailwind: "[mask-image:linear-gradient(to_bottom,transparent_0,#000_12px,#000_calc(100%-16px),transparent_100%)]",
      theme: "[mask-image:linear-gradient(to_bottom,transparent_0,#000_12px,#000_calc(100%-16px),transparent_100%)]",
    },
    {
      name: "Measure a pane",
      use: "So children can react to its width",
      css: "container: report / inline-size;",
      tailwind: "@container/report",
      theme: "@container/report",
    },
    {
      name: "Two columns when the pane is wide",
      use: "On a child of the measured pane",
      css: `@container report (min-width: 980px) { grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
      tailwind: "@min-[980px]/report:grid-cols-2",
      theme: "@min-[980px]/report:grid-cols-2",
    },
  ],
  status: [
    {
      name: "Green pill",
      use: "Active, validated, done",
      preview: "<span style=\"display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;color:var(--fg-2);box-shadow:inset 0 0 0 1px var(--line);background: rgba(69, 196, 122, 0.1); box-shadow: inset 0 0 0 1px rgba(69, 196, 122, 0.22); color: var(--green);\">Validated</span>",
      css: `background: rgba(69, 196, 122, 0.1);
box-shadow: inset 0 0 0 1px rgba(69, 196, 122, 0.22);
color: var(--green);`,
      tailwind: "bg-[#45c47a]/10 text-[#45c47a] inset-ring inset-ring-[#45c47a]/22",
      theme: "bg-green/10 text-green inset-ring inset-ring-green/22",
    },
    {
      name: "Amber pill",
      use: "Proposed, waiting",
      preview: "<span style=\"display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;color:var(--fg-2);box-shadow:inset 0 0 0 1px var(--line);background: rgba(224, 169, 62, 0.1); box-shadow: inset 0 0 0 1px rgba(224, 169, 62, 0.24); color: var(--amber);\">Proposed</span>",
      css: `background: rgba(224, 169, 62, 0.1);
box-shadow: inset 0 0 0 1px rgba(224, 169, 62, 0.24);
color: var(--amber);`,
      tailwind: "bg-[#e0a93e]/10 text-[#e0a93e] inset-ring inset-ring-[#e0a93e]/24",
      theme: "bg-amber/10 text-amber inset-ring inset-ring-amber/24",
    },
    {
      name: "Orange pill",
      use: "Warning, needs review",
      preview: "<span style=\"display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;color:var(--fg-2);box-shadow:inset 0 0 0 1px var(--line);background: var(--orange-wash); box-shadow: inset 0 0 0 1px rgba(240, 138, 75, 0.2); color: var(--orange);\">Needs review</span>",
      css: `background: var(--orange-wash);
box-shadow: inset 0 0 0 1px rgba(240, 138, 75, 0.2);
color: var(--orange);`,
      tailwind: "bg-[#f08a4b]/8 text-[#f08a4b] inset-ring inset-ring-[#f08a4b]/20",
      theme: "bg-orange-wash text-orange inset-ring inset-ring-orange/20",
    },
    {
      name: "Red pill",
      use: "Danger, unsafe",
      preview: "<span style=\"display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;color:var(--fg-2);box-shadow:inset 0 0 0 1px var(--line);background: var(--red-wash); box-shadow: inset 0 0 0 1px rgba(240, 86, 92, 0.24); color: var(--danger-fg);\">Unsafe</span>",
      css: `background: var(--red-wash);
box-shadow: inset 0 0 0 1px rgba(240, 86, 92, 0.24);
color: var(--danger-fg);`,
      tailwind: "bg-[#f0565c]/8 text-[#f68a8e] inset-ring inset-ring-[#f0565c]/24",
      theme: "bg-red-wash text-danger-fg inset-ring inset-ring-red/24",
    },
    {
      name: "The pill shape",
      use: "Add a colour set from the cards above",
      preview: "<span style=\"display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;color:var(--fg-2);box-shadow:inset 0 0 0 1px var(--line);display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; font-size: 12px; font-weight: 500;\">Shape only</span>",
      css: `display: inline-flex;
align-items: center;
height: 22px;
padding: 0 8px;
border-radius: 999px;
font-size: 12px;
font-weight: 500;`,
      tailwind: "inline-flex h-[22px] items-center rounded-full px-2 text-xs font-medium",
      theme: "inline-flex h-5.5 items-center rounded-full px-2 text-xs font-medium",
    },
    {
      name: "Dot with a halo",
      use: "Status in a list row",
      preview: "<span style=\"width: 8px; height: 8px; border-radius: 999px; background: var(--green); box-shadow: 0 0 0 3px rgba(69, 196, 122, 0.14);\"></span>",
      css: `width: 8px;
height: 8px;
border-radius: 999px;
background: var(--green);
box-shadow: 0 0 0 3px rgba(69, 196, 122, 0.14);`,
      tailwind: "size-2 rounded-full bg-[#45c47a] ring-[3px] ring-[#45c47a]/14",
      theme: "size-2 rounded-full bg-green ring-[3px] ring-green/14",
    },
    {
      name: "Hollow dot",
      use: "Inactive",
      preview: "<span style=\"width: 8px; height: 8px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--fg-3);\"></span>",
      css: `width: 8px;
height: 8px;
border-radius: 999px;
box-shadow: inset 0 0 0 1.5px var(--fg-3);`,
      tailwind: "size-2 rounded-full inset-ring-[1.5px] inset-ring-[#737373]",
      theme: "size-2 rounded-full inset-ring-[1.5px] inset-ring-fg-3",
    },
    {
      name: "A number that is a problem",
      use: "Only the colour changes",
      preview: "<span style=\"font-size:26px;font-weight:600;letter-spacing:-0.03em;color: var(--orange);\">71%</span>",
      css: "color: var(--orange);",
      tailwind: "text-[#f08a4b]",
      theme: "text-orange",
    },
  ],
  motion: [
    {
      name: "Colours fade",
      use: "Hover on tabs, links, nav items",
      css: "transition: background-color 150ms ease, color 150ms ease;",
      tailwind: "transition-colors duration-150",
      theme: "transition-colors duration-150",
    },
    {
      name: "Row hover",
      use: "A little quicker",
      css: "transition: background-color 120ms ease;",
      tailwind: "transition-colors duration-120",
      theme: "transition-colors duration-120",
    },
    {
      name: "Press",
      use: "Buttons shrink to 97% while held",
      css: `transition: transform 160ms var(--ease-out);
/* and on :active */ transform: scale(0.97);`,
      tailwind: "transition-transform duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
      theme: "transition-transform duration-160 ease-out active:scale-[0.97]",
    },
    {
      name: "A whole button",
      use: "Hover and press together",
      css: "transition: transform 160ms var(--ease-out), background-color 150ms ease;",
      tailwind: "transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#242424] active:scale-[0.97]",
      theme: "transition-[transform,background-color] duration-150 ease-out hover:bg-l5 active:scale-[0.97]",
    },
    {
      name: "Arrive",
      use: "The form and panels fading up",
      css: `transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out), filter 220ms var(--ease-out);
@starting-style { opacity: 0;
transform: translateY(8px) scale(0.99);
filter: blur(4px);
}`,
      tailwind: "transition-[opacity,translate,scale,filter] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] starting:translate-y-2 starting:scale-[0.99] starting:opacity-0 starting:blur-xs",
      theme: "transition-[opacity,translate,scale,filter] duration-220 ease-out starting:translate-y-2 starting:scale-[0.99] starting:opacity-0 starting:blur-xs",
    },
    {
      name: "Columns slide",
      use: "Tucking the sidebar away",
      css: "transition: grid-template-columns 240ms var(--ease-out);",
      tailwind: "transition-[grid-template-columns] duration-240 ease-[cubic-bezier(0.23,1,0.32,1)]",
      theme: "transition-[grid-template-columns] duration-240 ease-out",
    },
    {
      name: "Field focus fades in",
      use: "The ring and glow",
      css: "transition: box-shadow 150ms ease;",
      tailwind: "transition-shadow duration-150",
      theme: "transition-shadow duration-150",
    },
    {
      name: "The main curve",
      use: "--ease-out: almost everything",
      css: "transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);",
      tailwind: "ease-[cubic-bezier(0.23,1,0.32,1)]",
      theme: "ease-out",
    },
    {
      name: "The A to B curve",
      use: "--ease-in-out: the tour spotlight",
      css: "transition-timing-function: cubic-bezier(0.77, 0, 0.175, 1);",
      tailwind: "ease-[cubic-bezier(0.77,0,0.175,1)]",
      theme: "ease-in-out",
    },
    {
      name: "The drawer curve",
      use: "--ease-drawer: sheets and drawers",
      css: "transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);",
      tailwind: "ease-[cubic-bezier(0.32,0.72,0,1)]",
      theme: "ease-drawer",
    },
    {
      name: "Less motion",
      use: "For people who ask their system for it",
      css: `@media (prefers-reduced-motion: reduce) { transition: none;
}`,
      tailwind: "motion-reduce:transition-none",
      theme: "motion-reduce:transition-none",
    },
    {
      name: "Hover only with a mouse",
      use: "Tailwind does this for every hover: class",
      css: `@media (hover: hover) and (pointer: fine) { background: var(--l3);
}`,
      tailwind: "hover:bg-[#161616]",
      theme: "hover:bg-l3",
    },
  ],
} satisfies Record<string, Recipe[]>

export const TYPE_SCALE: { name: string; source: string; sample: string; css: string; tailwind: string; theme: string }[] = [
  {
    name: "Hero figure",
    source: ".hc-hero-figure",
    sample: "<div style=\"font-size: 88px; font-weight: 600; line-height: 0.86; letter-spacing: -0.055em;\">64<span style=\"margin-left:3px;font-size:.46em;font-weight:500;letter-spacing:-0.02em;color:var(--fg-3)\">%</span></div>",
    css: `font-size: 88px;
font-weight: 600;
line-height: 0.86;
letter-spacing: -0.055em;`,
    tailwind: "text-[88px] leading-[0.86] font-semibold tracking-[-0.055em]",
    theme: "type-hero",
  },
  {
    name: "Page title",
    source: ".mn-title, .hc-title",
    sample: "<div style=\"font-size: 26px; font-weight: 600; line-height: 1.2; letter-spacing: -0.025em; text-wrap: balance;\">Suppress duplicate disk alerts</div>",
    css: `font-size: 26px;
font-weight: 600;
line-height: 1.2;
letter-spacing: -0.025em;
text-wrap: balance;`,
    tailwind: "text-[26px] leading-[1.2] font-semibold tracking-[-0.025em] text-balance",
    theme: "type-title",
  },
  {
    name: "Chapter heading",
    source: ".hc-chapter-head h2 (list title: 20px)",
    sample: "<div style=\"font-size: 20px; font-weight: 600; line-height: 1.25; letter-spacing: -0.02em;\">Where the noise came from</div>",
    css: `font-size: 20px;
font-weight: 600;
line-height: 1.25;
letter-spacing: -0.02em;`,
    tailwind: "text-[20px] leading-[1.25] font-semibold tracking-[-0.02em]",
    theme: "type-chapter",
  },
  {
    name: "Lead paragraph",
    source: ".hc-headline",
    sample: "<div style=\"font-size: 17px; line-height: 1.62; letter-spacing: -0.005em; color: var(--fg-2); text-wrap: pretty;\">Rules would have caught <span style=\"font-weight:500;color:var(--fg)\">two thirds</span> of it.</div>",
    css: `font-size: 17px;
line-height: 1.62;
letter-spacing: -0.005em;
color: var(--fg-2);
text-wrap: pretty;`,
    tailwind: "text-[17px] leading-[1.62] tracking-[-0.005em] text-[#a3a3a3] text-pretty",
    theme: "type-lead",
  },
  {
    name: "Card title",
    source: ".mn-decide-title",
    sample: "<div style=\"font-size: 15px; font-weight: 600; letter-spacing: -0.01em;\">Approve this rule</div>",
    css: `font-size: 15px;
font-weight: 600;
letter-spacing: -0.01em;`,
    tailwind: "text-[15px] font-semibold tracking-[-0.01em]",
    theme: "type-card-title",
  },
  {
    name: "Section heading",
    source: ".mn-sec h3",
    sample: "<div style=\"font-size: 14px; font-weight: 600; letter-spacing: -0.005em;\">Evidence</div>",
    css: `font-size: 14px;
font-weight: 600;
letter-spacing: -0.005em;`,
    tailwind: "text-[14px] font-semibold tracking-[-0.005em]",
    theme: "type-section",
  },
  {
    name: "Body",
    source: ".mn-p",
    sample: "<div style=\"max-width: 68ch; font-size: 14px; line-height: 1.6; color: var(--fg-2);\">Body copy is the base size in the second tone.</div>",
    css: `max-width: 68ch;
font-size: 14px;
line-height: 1.6;
color: var(--fg-2);`,
    tailwind: "max-w-[68ch] text-[14px] leading-[1.6] text-[#a3a3a3]",
    theme: "type-body max-w-[68ch]",
  },
  {
    name: "Emphasis in a sentence",
    source: "strong inside body or lead text",
    sample: "<div style=\"font-weight: 500; color: var(--fg);\">two thirds</div>",
    css: `font-weight: 500;
color: var(--fg);`,
    tailwind: "font-medium text-[#ededed]",
    theme: "font-medium text-fg",
  },
  {
    name: "Control text",
    source: "buttons, tabs, rows, menu items",
    sample: "<div style=\"font-size: 13px; font-weight: 500;\">Buttons, tabs, rows, menu items</div>",
    css: `font-size: 13px;
font-weight: 500;`,
    tailwind: "text-[13px] font-medium",
    theme: "type-control",
  },
  {
    name: "Meta",
    source: ".mn-subtle",
    sample: "<div style=\"font-size: 12px; color: var(--fg-3);\">Labels, meta lines, timestamps</div>",
    css: `font-size: 12px;
color: var(--fg-3);`,
    tailwind: "text-[12px] text-[#737373]",
    theme: "type-meta",
  },
  {
    name: "Micro",
    source: "chips, key caps, axis labels",
    sample: "<div style=\"font-size: 11px; font-weight: 500; color: var(--fg-2);\">Chips, key caps, axis labels</div>",
    css: `font-size: 11px;
font-weight: 500;
color: var(--fg-2);`,
    tailwind: "text-[11px] font-medium text-[#a3a3a3]",
    theme: "type-micro",
  },
  {
    name: "Identifier",
    source: ".mn-mono",
    sample: "<div style=\"font-family: 'Geist Mono Variable', ui-monospace, monospace; font-size: 12px; color: var(--fg-3);\">RULE-0412 · INC0048213</div>",
    css: `font-family: 'Geist Mono Variable', ui-monospace, monospace;
font-size: 12px;
color: var(--fg-3);`,
    tailwind: "font-mono text-[12px] text-[#737373]",
    theme: "type-id",
  },
  {
    name: "Numbers in a column",
    source: "anywhere digits line up",
    sample: "<div style=\"font-variant-numeric: tabular-nums;\">1,118 · 9,271 · 4,404</div>",
    css: "font-variant-numeric: tabular-nums;",
    tailwind: "tabular-nums",
    theme: "tabular-nums",
  },
]

/** The five ingredients of glass. Shown under the playground in Materials. */
export const GLASS_INGREDIENTS: string[] = [
  "<strong>1. A see-through background.</strong> <code>rgba(24, 24, 24, 0.78)</code>. The last number is how solid it is. Lower shows more of the page.",
  "<strong>2. backdrop-filter: blur().</strong> Blurs what is <em>behind</em> the element (plain <code>filter</code> blurs the element itself). Always write the <code>-webkit-</code> line too, for Safari.",
  "<strong>3. saturate().</strong> Blurring greys colours out. A boost above 1 keeps them alive. The palette uses 1.8 because its tint is the thinnest.",
  "<strong>4. Top edge and ring.</strong> <code>inset 0 1px 0</code> is the lit top edge, <code>0 0 0 1px</code> (no inset) is a ring just outside the shape.",
  "<strong>5. One big soft shadow.</strong> <code>0 20px 48px rgba(0,0,0,0.55)</code>: pushed 20px down, blurred 48px. That is what lifts it off the page.",
  "<strong>Text on glass</strong> is weight 500, a touch heavier than usual, so it holds up over a busy background.",
]

export const TYPE: Lesson = {
  title: "Type",
  lede: "One family, Geist, at a 14px base. Hierarchy comes from size, weight and tone together. Two habits make it look designed: <strong>letter spacing goes negative as text gets bigger</strong>, and <strong>numbers use tabular figures</strong> wherever they sit in a column.",
  entries: [
    {
      title: "The scale",
      parts: [
        {
          k: "p",
          html: "Every text style on the two pages. Each sample is drawn by the CSS beside it, and every line on the right copies when you click it.",
        },
        { k: "type" },
      ],
    },
    {
      title: "The type helpers",
      parts: [
        { k: "p", html: "Small properties that do a lot. Edit them and watch the sample." },
        {
          k: "demo",
          col: true,
          html: `<h4 class="mn-title">Suppress duplicate disk alerts from the storage fleet</h4>
<p class="mn-p">Body copy stops at 68 characters wide, so lines stay easy to read however wide the pane gets.</p>
<div class="demo-nums"><span>1,118</span><span>9,271</span><span>4,404</span></div>
<span class="mn-mono mn-subtle">RULE-0412</span>
<div class="mn-truncate" style="width:220px">A very long rule name that will not fit in its row</div>`,
          markup: `<h4 class="mn-title">Suppress duplicate disk alerts from the storage fleet</h4>
<p class="mn-p">Body copy stops at 68 characters wide, so lines stay easy to read however wide the pane gets.</p>
<div class="demo-nums"><span>1,118</span><span>9,271</span><span>4,404</span></div>
<span class="mn-mono mn-subtle">RULE-0412</span>
<div class="mn-truncate" style="width:220px">A very long rule name that will not fit in its row</div>`,
          css: `.mn-title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.025em; /* tighter as text gets bigger */
  text-wrap: balance;       /* even line lengths in headings */
  max-width: 760px;
}

.mn-p {
  margin: 0;
  max-width: 68ch;          /* ch = width of one "0": caps line length */
  color: var(--fg-2);
  line-height: 1.6;
}

/* digits all the same width, so columns line up */
.demo-nums {
  display: grid;
  width: 60px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.mn-mono {
  font-family: 'Geist Mono Variable', ui-monospace, monospace;
  font-size: 12px;
}

.mn-subtle { color: var(--fg-3); }

/* one line, then an ellipsis. All three lines are needed,
   plus min-width: 0 when it is a flex or grid child. */
.mn-truncate {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}`,
        },
        {
          k: "note",
          html: "<strong>Smoothing.</strong> <code>-webkit-font-smoothing: antialiased</code> on <code>body</code> is what makes light text on dark look thin and crisp instead of bloated. It is in <code>base.css</code> and you only set it once.",
        },
      ],
    },
  ],
}

export const SURFACES: Lesson = {
  title: "Edges and surfaces",
  lede: "Four kinds of surface cover everything that is not floating: flat, card, well and raised. They differ by which rung they sit on and what their edge does.",
  entries: [
    {
      title: "The edge: an inset ring, not a border",
      parts: [
        {
          k: "p",
          html: "Almost nothing uses <code>border</code>. The outline is <code>box-shadow: inset 0 0 0 1px</code>. Read it as: no x offset, no y offset, no blur, 1px of spread, drawn inside. It adds no size, follows the radius, and you can stack several.",
        },
        {
          k: "demo",
          html: `<div class="demo-ring" data-edge="1">--line</div>
<div class="demo-ring" data-edge="2">--line-2</div>
<div class="demo-ring" data-edge="3">--line-3</div>`,
          markup: `<div class="demo-ring" data-edge="1">--line</div>
<div class="demo-ring" data-edge="2">--line-2</div>
<div class="demo-ring" data-edge="3">--line-3</div>`,
          css: `.demo-ring {
  display: grid;
  place-items: center;   /* centre the label both ways */
  width: 112px;
  height: 72px;
  border-radius: 12px;
  background: var(--l3);
  font-size: 12px;
  color: var(--fg-2);
}

.demo-ring[data-edge='1'] { box-shadow: inset 0 0 0 1px var(--line); }
.demo-ring[data-edge='2'] { box-shadow: inset 0 0 0 1px var(--line-2); }
.demo-ring[data-edge='3'] { box-shadow: inset 0 0 0 1px var(--line-3); }`,
        },
        {
          k: "note",
          html: "Real <code>border</code> is kept for <strong>dividers between regions</strong>: <code>border-right: 1px solid var(--line)</code> on the sidebar and list, <code>border-top</code> between table rows and chapters.",
        },
      ],
    },
    {
      title: "Card, well, raised",
      parts: [
        {
          k: "p",
          html: "The three surfaces you will reach for most. A card is lifted (lighter, lit from above). A well is sunk (darker than the page). Raised is a control or a selected row.",
        },
        {
          k: "demo",
          html: `<div class="demo-card">
  <div class="mn-stat-label">Card</div>
  <div class="mn-stat-value">94%</div>
</div>
<div class="demo-well">
  <div class="mn-stat-label">Well</div>
  <div class="mn-stat-value">1,118</div>
</div>
<div class="demo-raised">
  <div class="mn-stat-label">Raised</div>
  <div class="mn-stat-value">12</div>
</div>`,
          markup: `<div class="demo-card">
  <div class="mn-stat-label">Card</div>
  <div class="mn-stat-value">94%</div>
</div>
<div class="demo-well">
  <div class="mn-stat-label">Well</div>
  <div class="mn-stat-value">1,118</div>
</div>
<div class="demo-raised">
  <div class="mn-stat-label">Raised</div>
  <div class="mn-stat-value">12</div>
</div>`,
          css: `/* CARD: one rung above the page, lit along the top */
.demo-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--l3);
  box-shadow:
    inset 0 1px 0 var(--card-edge), /* 1px highlight on the top edge */
    inset 0 0 0 1px var(--line);    /* the ring */
}

/* WELL: darker than the page, so it reads as cut in */
.demo-well {
  padding: 14px 16px;
  border-radius: 9px;
  background: var(--well-2);
  box-shadow: inset 0 0 0 1px var(--line);
}

/* RAISED: two rungs up. Selected rows, active tabs, buttons */
.demo-raised {
  padding: 14px 16px;
  border-radius: 9px;
  background: var(--l4);
  box-shadow: inset 0 0 0 1px var(--line);
}

.mn-stat-label { font-size: 12px; font-weight: 500; color: var(--fg-3); }
.mn-stat-value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.03em;
}`,
        },
        {
          k: "note",
          html: "The important card on a page (<code>.mn-rail-card</code>, <code>.hc-lead</code>) uses the same recipe with <code>--line-2</code> and a 14px radius, so it is a touch more present than the stat cards around it.",
        },
      ],
    },
    {
      title: "Copy the edges and surfaces",
      parts: [
        {
          k: "p",
          html: "Each one as CSS, as a Tailwind class you can paste today, and as the shorter class this guide's theme gives you. Click a line to copy it.",
        },
        { k: "recipes", key: "surfaces" },
      ],
    },
    {
      title: "Corner radius",
      parts: [
        {
          k: "p",
          html: "Radius grows with the size of the thing. Something inside a rounded box gets a smaller radius than the box.",
        },
        { k: "recipes", key: "radius" },
      ],
    },
    {
      title: "Control heights and spacing",
      parts: [
        {
          k: "p",
          html: "Heights are fixed with <code>height</code>, and the text is centred with flexbox, so a row of mixed controls always lines up.",
        },
        { k: "recipes", key: "heights" },
        { k: "label", text: "Spacing" },
        { k: "recipes", key: "spacing" },
        {
          k: "why",
          items: [
            "<strong>Gaps</strong> inside a control are 6 to 8px, between controls 8 to 12px, between cards 10px.",
            "<strong>Card padding</strong> is <code>14px 16px</code>. Lead cards and the composer use 16 to 20px.",
            "<strong>Page padding</strong> is <code>28px 40px 48px</code> in the detail pane, <code>18px 16px 12px</code> in the list header.",
            "<strong>Sections</strong> are 32px apart on Rules. Hindcast chapters are 56px apart with a hairline and 40px of padding above.",
          ],
        },
      ],
    },
  ],
}

export const LAYOUT: Lesson = {
  title: "Layout and position",
  lede: "Five positioning patterns place everything on both pages: a grid for the shell, a flex column with one scrolling child, sticky, absolute inside a relative parent, and fixed for overlays.",
  entries: [
    {
      title: "The shell: three columns, one scrolling pane, a sticky bar and a floating bar",
      parts: [
        {
          k: "p",
          html: "A small working copy of the page frame. Use the two buttons to tuck the columns away, and scroll the right pane.",
        },
        {
          k: "demo",
          flush: true,
          html: `<div class="demo-shell" id="shell">
  <aside class="demo-side">sidebar<br>--l0</aside>
  <div class="demo-list">list<br>--l1</div>
  <section class="demo-detail">
    <div class="demo-scroll">
      <div class="demo-top">
        <button class="mn-icon-btn" data-toggle="data-hide-side" title="Sidebar"><svg class="i" width="15" height="15"><use href="#i-side"></use></svg></button>
        <button class="mn-icon-btn" data-toggle="data-hide-list" title="List"><svg class="i" width="15" height="15"><use href="#i-side"></use></svg></button>
        <span class="mn-subtle" style="font-size:12px">sticky bar</span>
      </div>
      <div class="demo-body">
        <p>detail · --l2</p><p>scrolls on its own</p><p>the columns stay put</p><p>keep going</p><p>the bar above sticks</p><p>the bar below floats</p><p>nearly there</p><p>end</p>
      </div>
    </div>
    <div class="demo-float">floating glass bar</div>
  </section>
</div>`,
          css: `/* 1. THE GRID. Real values: 240px 380px 1fr, height 100vh */
.demo-shell {
  display: grid;
  grid-template-columns: 96px 120px 1fr; /* fixed, fixed, the rest */
  height: 320px;
  overflow: hidden;
  /* column widths can animate */
  transition: grid-template-columns 240ms var(--ease-out);
}
.demo-shell[data-hide-side] { grid-template-columns: 0px 120px 1fr; }
.demo-shell[data-hide-list] { grid-template-columns: 96px 0px 1fr; }
.demo-shell[data-hide-side][data-hide-list] { grid-template-columns: 0px 0px 1fr; }

.demo-side { background: var(--l0); border-right: 1px solid var(--line); }
.demo-list { background: var(--l1); border-right: 1px solid var(--line); }
.demo-side, .demo-list {
  min-width: 0;       /* lets the column shrink to 0 */
  overflow: hidden;
  padding: 12px;
  font-size: 12px;
  color: var(--fg-3);
  white-space: nowrap;
}

/* 2. THE PANE: a flex column and the anchor for floating things */
.demo-detail {
  position: relative;  /* absolute children measure from here */
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* 3. THE SCROLLER: takes the leftover height and scrolls inside it */
.demo-scroll {
  flex: 1;
  min-height: 0;       /* without this it grows instead of scrolling */
  overflow-y: auto;
}

/* 4. STICKY: scrolls with the content until it hits top: 0 */
.demo-top {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px;
  background: var(--l2);  /* must be solid or content shows through */
  border-bottom: 1px solid var(--line);
}

.demo-body { padding: 4px 16px 90px; color: var(--fg-2); }
.demo-body p { margin: 0; padding: 14px 0; border-bottom: 1px solid var(--line); }

/* 5. FLOATING: pinned to the pane, not the content */
.demo-float {
  position: absolute;
  left: 14px;
  right: 14px;         /* left + right = stretch across */
  bottom: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--glass);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  backdrop-filter: blur(20px) saturate(1.2);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    0 0 0 1px var(--line-2),
    var(--shadow-float);
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-2);
}`,
        },
        {
          k: "why",
          items: [
            "<strong>1fr</strong> means \"one share of what is left\". With two fixed columns before it, the detail pane takes everything else.",
            "<strong>min-height: 0 (and min-width: 0)</strong> is the line people miss. Flex and grid children refuse to get smaller than their content unless you say they may.",
            "<strong>position: relative on the parent</strong> does nothing visible. It only makes the parent the thing that <code>absolute</code> children are placed against.",
            "<strong>Bottom padding on the scroller</strong> (90px here, 200px in the app) leaves room so the last line can scroll clear of the floating bar.",
          ],
        },
      ],
    },
    {
      title: "Scroll edge fade",
      parts: [
        {
          k: "p",
          html: "List rows fade out under the header instead of being cut by a hard line. A <code>mask-image</code> gradient does it: black shows the content, transparent hides it.",
        },
        {
          k: "demo",
          flush: true,
          surface: "l1",
          html: `<div class="demo-fade">
  <div class="mn-row" data-selected=""><span class="mn-dot" data-status="proposed"></span><div class="mn-row-main"><div class="mn-row-name">Suppress duplicate disk alerts</div><div class="mn-row-meta"><span class="mn-mono">RULE-0412</span><span>Storage</span></div></div></div>
  <div class="mn-row"><span class="mn-dot" data-status="active"></span><div class="mn-row-main"><div class="mn-row-name">Mute patch-window reboots</div><div class="mn-row-meta"><span class="mn-mono">RULE-0398</span><span>Compute</span></div></div></div>
  <div class="mn-row"><span class="mn-dot" data-status="active"></span><div class="mn-row-main"><div class="mn-row-name">Group flapping link alerts</div><div class="mn-row-meta"><span class="mn-mono">RULE-0377</span><span>Network</span></div></div></div>
  <div class="mn-row"><span class="mn-dot" data-status="inactive"></span><div class="mn-row-main"><div class="mn-row-name">Hold backup job warnings</div><div class="mn-row-meta"><span class="mn-mono">RULE-0351</span><span>Storage</span></div></div></div>
  <div class="mn-row"><span class="mn-dot" data-status="active"></span><div class="mn-row-main"><div class="mn-row-name">Drop certificate renewals</div><div class="mn-row-meta"><span class="mn-mono">RULE-0340</span><span>Security</span></div></div></div>
</div>`,
          css: `.demo-fade {
  height: 200px;
  overflow-y: auto;
  padding: 2px 8px 12px;
  /* transparent at the very top, solid by 12px,
     solid until 16px from the bottom, then out */
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 12px,
    #000 calc(100% - 16px),
    transparent 100%
  );
}`,
        },
      ],
    },
    {
      title: "Centred overlay: the command palette",
      parts: [
        {
          k: "p",
          html: "<code>position: fixed</code> places against the window, ignoring scroll. The scrim covers everything with <code>inset: 0</code>, and the panel is centred with the left 50% plus translate trick.",
        },
        {
          k: "demo",
          flush: true,
          html: `<div class="demo-window">
  <div class="demo-scrim"></div>
  <div class="demo-palette-pos">
    <div class="mn-palette">
      <div class="mn-palette-search"><svg class="i" width="16" height="16"><use href="#i-search"></use></svg><span>Search rules, actions…</span></div>
      <div class="mn-palette-list">
        <div class="mn-palette-item" data-selected="">Approve rule <kbd>A</kbd></div>
        <div class="mn-palette-item">View incidents</div>
      </div>
    </div>
  </div>
</div>`,
          css: `/* In the app both are position: fixed against the window.
   Here they are absolute so they stay inside the demo. */
.demo-window {
  position: relative;
  height: 280px;
  background:
    linear-gradient(90deg, var(--l0) 0 20%, var(--l1) 20% 46%, var(--l2) 46%);
}

.demo-scrim {
  position: absolute;      /* app: fixed */
  inset: 0;                /* top, right, bottom, left all 0 */
  z-index: 50;
  background: var(--scrim);
}

.demo-palette-pos {
  position: absolute;      /* app: fixed */
  top: 16%;                /* app: 16vh, a little above centre */
  left: 50%;               /* left edge at the middle... */
  transform: translateX(-50%); /* ...pulled back half its own width */
  z-index: 51;             /* above the scrim */
  width: 320px;            /* app: 620px */
  max-width: calc(100% - 32px);
}

.mn-palette {
  overflow: hidden;
  border-radius: 14px;
  background: var(--glass-palette);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    0 0 0 1px var(--line-2),
    var(--shadow-palette);
}

.mn-palette-search {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
  color: var(--fg-3);
}

.mn-palette-list { padding: 6px; }

.mn-palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  font-weight: 500;
  color: var(--fg-2);
}
.mn-palette-item[data-selected] { background: var(--tint-2); color: var(--fg); }
.mn-palette-item kbd { margin-left: auto; } /* push to the right */`,
        },
        {
          k: "note",
          html: "<strong>z-index in use:</strong> 2 incident panel, 5 tooltips, 10 sticky bar, 50 scrim, 51 palette, 100 tour. Low numbers with gaps between them.",
        },
      ],
    },
    {
      title: "Rows as a grid, and layouts that answer to their own width",
      parts: [
        {
          k: "p",
          html: "Table-like rows are a grid with fixed columns for the small things and <code>minmax(0, 1fr)</code> for the text that should stretch and truncate. The Hindcast report uses container queries, so it reflows by the width of its own pane, not the window. Drag the corner of the box to resize it.",
        },
        {
          k: "demo",
          col: true,
          html: `<div class="demo-cq">
  <ul class="demo-rows">
    <li><span class="mn-mono mn-subtle">INC0048213</span><span class="mn-truncate">Disk latency above threshold on stg-db-04</span><span class="demo-col3 mn-subtle">Auto-resolved</span><span class="demo-date mn-subtle">2 Oct</span></li>
    <li><span class="mn-mono mn-subtle">INC0048190</span><span class="mn-truncate">Disk latency above threshold on stg-db-02</span><span class="demo-col3 mn-subtle">Worked</span><span class="demo-date mn-subtle">1 Oct</span></li>
  </ul>
  <div class="demo-cq-grid"><div class="demo-card">One</div><div class="demo-card">Two</div></div>
</div>`,
          css: `.demo-cq {
  container: report / inline-size; /* name it, measure its width */
  resize: horizontal;              /* demo only: drag the corner */
  overflow: auto;
  min-width: 260px;
  max-width: 100%;
  padding: 4px;
  border-radius: 12px;
  background: var(--l3);
  box-shadow: inset 0 0 0 1px var(--line);
}

.demo-rows { margin: 0; padding: 0; list-style: none; }

.demo-rows li {
  display: grid;
  /* id | text takes the rest | fits its content | date */
  grid-template-columns: 84px minmax(0, 1fr) auto 52px;
  align-items: center;
  gap: 12px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
}
.demo-rows li + li { margin-top: 1px; }
.demo-date { text-align: right; font-variant-numeric: tabular-nums; }

.demo-cq-grid { display: grid; gap: 10px; padding: 10px 8px 8px; }

/* wide enough: two columns */
@container report (min-width: 440px) {
  .demo-cq-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* narrow: drop the third column */
@container report (max-width: 340px) {
  .demo-rows li { grid-template-columns: 84px minmax(0, 1fr) 52px; }
  .demo-col3 { display: none; }
}`,
        },
        {
          k: "why",
          items: [
            "<strong>minmax(0, 1fr), not 1fr.</strong> Plain <code>1fr</code> will not shrink below its content, so long text pushes the row wide. <code>minmax(0, 1fr)</code> lets it shrink and the ellipsis kick in.",
            "<strong>li + li</strong> means \"every row that follows another row\". It is how gaps and dividers are added between items but not above the first.",
            "<strong>position: sticky; top: 0; align-self: start</strong> is also how the decision rail on a wide Rules page stays put while evidence scrolls.",
            "<strong>grid-column: 1 / -1</strong> makes one child span every column (the wide layout's header).",
          ],
        },
      ],
    },
    {
      title: "Copy the layout patterns",
      parts: [
        { k: "p", html: "The positioning moves from this section, one per card. Click a line to copy it." },
        { k: "recipes", key: "layout" },
      ],
    },
  ],
}

export const COMPONENTS: Lesson = {
  title: "Components",
  lede: "The shared building blocks from <code>src/styles/ui.css</code> and the page folders. Under each demo is the markup to write. In React, a state attribute is written <code>data-active={isActive || undefined}</code> so it disappears when false.",
  entries: [
    {
      title: "Buttons and key caps",
      parts: [
        {
          k: "p",
          html: "One class, variants by attribute. The default is a raised grey control, primary is the white one, danger is a red wash.",
        },
        {
          k: "demo",
          html: `<button class="mn-btn">Deactivate <kbd>D</kbd></button>
<button class="mn-btn" data-variant="primary">Approve <kbd>A</kbd></button>
<button class="mn-btn" data-variant="danger">Reject <kbd>X</kbd></button>
<button class="mn-btn mn-btn-ghost">Cancel</button>
<button class="mn-btn" disabled="">Disabled</button>
<button class="mn-icon-btn" aria-label="Search"><svg class="i" width="15" height="15"><use href="#i-search"></use></svg></button>`,
          markup: `<button class="mn-btn">Deactivate <kbd>D</kbd></button>
<button class="mn-btn" data-variant="primary">Approve <kbd>A</kbd></button>
<button class="mn-btn" data-variant="danger">Reject <kbd>X</kbd></button>
<button class="mn-btn mn-btn-ghost">Cancel</button>
<button class="mn-btn" disabled>Disabled</button>
<button class="mn-icon-btn" aria-label="Search"><Icon /></button>`,
          css: `.mn-btn {
  display: inline-flex;   /* text and key cap side by side */
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px 0 14px; /* less on the right, where the key cap sits */
  border: 0;              /* remove the browser's border */
  border-radius: 9px;
  background: var(--l4);
  box-shadow: inset 0 0 0 1px var(--line-2);
  color: var(--fg);
  font-size: 13px;
  font-weight: 500;
  transition:
    transform 160ms var(--ease-out),
    background-color 150ms ease,
    opacity 150ms ease;
}

/* pressing shrinks it a little: the click feels physical */
.mn-btn:active:not(:disabled) { transform: scale(0.97); }

/* keyboard focus only (not mouse clicks) */
.mn-btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* the one white thing on the screen */
.mn-btn[data-variant='primary'] {
  background: var(--primary);
  box-shadow: none;
  color: var(--primary-fg);
}

.mn-btn[data-variant='danger'] {
  background: var(--red-wash);
  box-shadow: inset 0 0 0 1px rgba(240, 86, 92, 0.35);
  color: var(--danger-fg);
}

.mn-btn-ghost {
  background: transparent;
  box-shadow: none;
  color: var(--fg-2);
}

.mn-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* hover only where there is a real mouse, so it never
   sticks after a tap on a touch screen */
@media (hover: hover) and (pointer: fine) {
  .mn-btn:hover:not(:disabled):not([data-variant]) { background: var(--l5); }
  .mn-btn[data-variant='primary']:hover { background: var(--primary-hover); }
  .mn-btn[data-variant='danger']:hover { background: rgba(240, 86, 92, 0.14); }
  .mn-icon-btn:hover { background: var(--l3); }
}

/* .mn is the app's root element, so this reaches every key cap inside it */
.mn kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 4px;
  background: var(--tint);
  box-shadow: inset 0 0 0 1px var(--line);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: var(--fg-2);
}
.mn-btn[data-variant='primary'] kbd {
  background: rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  color: #404040;
}
.mn-btn[data-variant='danger'] kbd {
  background: rgba(240, 86, 92, 0.12);
  box-shadow: none;
  color: var(--danger-fg);
}

.mn-icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--fg-2);
  transition: background-color 150ms ease, transform 160ms var(--ease-out);
}
.mn-icon-btn:active { transform: scale(0.95); }`,
        },
      ],
    },
    {
      title: "Status dots, badges and chips",
      parts: [
        {
          k: "p",
          html: "A dot carries status in lists. A badge is a dot plus a word in a pill. Chips are small tinted pills.",
        },
        {
          k: "demo",
          html: `<span class="mn-dot" data-status="active"></span>
<span class="mn-dot" data-status="proposed"></span>
<span class="mn-dot" data-status="inactive"></span>
<span class="mn-badge"><span class="mn-dot" data-status="proposed"></span>Proposed</span>
<span class="mn-chip-warn">Low confidence</span>
<span class="hc-kind">Tune</span>
<span class="hc-kind" data-kind="approve">Approve</span>`,
          markup: `<span class="mn-dot" data-status="active"></span>
<span class="mn-dot" data-status="proposed"></span>
<span class="mn-dot" data-status="inactive"></span>
<span class="mn-badge"><span class="mn-dot" data-status="proposed"></span>Proposed</span>
<span class="mn-chip-warn">Low confidence</span>
<span class="hc-kind">Tune</span>
<span class="hc-kind" data-kind="approve">Approve</span>`,
          css: `.mn-dot {
  flex: none;            /* never squash inside a flex row */
  width: 8px;
  height: 8px;
  border-radius: 999px;  /* a huge radius = always a circle */
}

/* filled dot + a soft halo: a spread shadow in the same colour */
.mn-dot[data-status='active'] {
  background: var(--green);
  box-shadow: 0 0 0 3px rgba(69, 196, 122, 0.14);
}
.mn-dot[data-status='proposed'] {
  background: var(--amber);
  box-shadow: 0 0 0 3px rgba(224, 169, 62, 0.14);
}
/* inactive is hollow: an inset ring, no fill */
.mn-dot[data-status='inactive'] {
  box-shadow: inset 0 0 0 1.5px var(--fg-3);
}

.mn-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 24px;
  padding: 0 10px 0 9px;
  border-radius: 999px;
  background: var(--l3);
  box-shadow: inset 0 0 0 1px var(--line);
  font-size: 12px;
  font-weight: 500;
}
/* inside a badge the dot is smaller and loses its halo */
.mn-badge .mn-dot { width: 6px; height: 6px; box-shadow: none; }

.mn-chip-warn,
.hc-kind {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em; /* tiny text gets a little MORE spacing */
}
.mn-chip-warn {
  background: var(--orange-wash);
  box-shadow: inset 0 0 0 1px rgba(240, 138, 75, 0.2);
  color: var(--orange);
}
.hc-kind {
  background: var(--tint);
  box-shadow: inset 0 0 0 1px var(--line);
  color: var(--fg-2);
}
.hc-kind[data-kind='approve'] {
  background: rgba(224, 169, 62, 0.1);
  box-shadow: inset 0 0 0 1px rgba(224, 169, 62, 0.24);
  color: var(--amber);
}`,
        },
      ],
    },
    {
      title: "Tabs, segmented control and search",
      parts: [
        {
          k: "p",
          html: "Tabs are text until one is active, then it becomes a raised pill. Put the same tabs inside a sunken track and you have the Hindcast lookback control. Click them.",
        },
        {
          k: "demo",
          col: true,
          html: `<div class="mn-tabs">
  <button class="mn-tab" data-active="">All <span>42</span></button>
  <button class="mn-tab">Proposed <span>7</span></button>
  <button class="mn-tab">Active <span>31</span></button>
</div>
<div class="mn-tabs demo-segmented">
  <button class="mn-tab">4</button>
  <button class="mn-tab" data-active="">12</button>
  <button class="mn-tab">26</button>
</div>
<label class="mn-search">
  <svg class="i" width="14" height="14"><use href="#i-search"></use></svg>
  <input placeholder="Search rules">
  <kbd>/</kbd>
</label>`,
          markup: `<div class="mn-tabs">
  <button class="mn-tab" data-active>All <span>42</span></button>
  <button class="mn-tab">Proposed <span>7</span></button>
  <button class="mn-tab">Active <span>31</span></button>
</div>
<div class="mn-tabs demo-segmented">
  <button class="mn-tab">4</button>
  <button class="mn-tab" data-active>12</button>
  <button class="mn-tab">26</button>
</div>
<label class="mn-search">
  <Icon />
  <input placeholder="Search rules">
  <kbd>/</kbd>
</label>`,
          css: `.mn-tabs { display: flex; gap: 2px; }

.mn-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 9px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--fg-3);        /* quiet until chosen */
  font-size: 13px;
  font-weight: 500;
  transition: background-color 150ms ease, color 150ms ease;
}
.mn-tab span {               /* the count */
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

/* active = raised surface + ring + brightest text */
.mn-tab[data-active] {
  background: var(--l4);
  box-shadow: inset 0 0 0 1px var(--line);
  color: var(--fg);
}

/* SEGMENTED: a sunken track with the tabs inside it */
.demo-segmented {
  align-self: flex-start;
  padding: 2px;
  border-radius: 9px;        /* tab radius 7 + padding 2 */
  background: var(--well-2);
  box-shadow: inset 0 0 0 1px var(--line);
}
.demo-segmented .mn-tab {
  justify-content: center;
  min-width: 34px;
  height: 26px;
}

.mn-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 8px 0 11px;
  border-radius: 8px;
  background: var(--l3);
  box-shadow: inset 0 0 0 1px var(--line);
  color: var(--fg-3);        /* colours the icon */
  transition: box-shadow 150ms ease;
}

/* the BOX lights up when the input inside it has focus */
.mn-search:focus-within {
  box-shadow:
    inset 0 0 0 1px var(--line-3),   /* brighter ring */
    0 0 0 3px var(--focus-glow);     /* soft 3px glow outside */
}

/* the real input is invisible: no border, no background */
.mn-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--fg);
  font-size: 13px;
}
.mn-search input::placeholder { color: var(--fg-3); }`,
        },
      ],
    },
    {
      title: "List rows and sidebar items",
      parts: [
        {
          k: "p",
          html: "Rows have no border at rest. Hover is one rung up, selected is two rungs up with a ring. The same pattern drives the sidebar navigation.",
        },
        {
          k: "demo",
          col: true,
          surface: "l1",
          html: `<div class="mn-row" data-selected="">
  <span class="mn-dot" data-status="proposed"></span>
  <div class="mn-row-main">
    <div class="mn-row-name">Suppress duplicate disk alerts</div>
    <div class="mn-row-meta"><span class="mn-mono">RULE-0412</span><span>Storage</span></div>
  </div>
  <div class="mn-row-side"><b>94%</b><span class="mn-subtle">2d</span></div>
</div>
<div class="mn-row">
  <span class="mn-dot" data-status="active"></span>
  <div class="mn-row-main">
    <div class="mn-row-name">Mute patch-window reboots</div>
    <div class="mn-row-meta"><span class="mn-mono">RULE-0398</span><span>Compute</span></div>
  </div>
  <div class="mn-row-side"><b>88%</b><span class="mn-subtle">9d</span></div>
</div>
<a class="mn-nav-item" data-active="">Rules</a>
<a class="mn-nav-item">Hindcast</a>`,
          markup: `<div class="mn-row" data-selected>
  <span class="mn-dot" data-status="proposed"></span>
  <div class="mn-row-main">
    <div class="mn-row-name">Suppress duplicate disk alerts</div>
    <div class="mn-row-meta"><span class="mn-mono">RULE-0412</span><span>Storage</span></div>
  </div>
  <div class="mn-row-side"><b>94%</b><span class="mn-subtle">2d</span></div>
</div>
<div class="mn-row">
  <span class="mn-dot" data-status="active"></span>
  <div class="mn-row-main">
    <div class="mn-row-name">Mute patch-window reboots</div>
    <div class="mn-row-meta"><span class="mn-mono">RULE-0398</span><span>Compute</span></div>
  </div>
  <div class="mn-row-side"><b>88%</b><span class="mn-subtle">9d</span></div>
</div>
<a class="mn-nav-item" data-active>Rules</a>
<a class="mn-nav-item">Hindcast</a>`,
          css: `.mn-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 10px 12px;
  border-radius: 9px;
  cursor: default;
  transition: background-color 120ms ease;
}
.mn-row + .mn-row { margin-top: 1px; }

.mn-row[data-selected] {
  background: var(--l4);
  box-shadow: inset 0 0 0 1px var(--line);
}

@media (hover: hover) and (pointer: fine) {
  .mn-row:hover:not([data-selected]) { background: var(--l3); }
  .mn-nav-item:hover { background: var(--l3); color: var(--fg); }
}

.mn-row-main { flex: 1; min-width: 0; } /* takes the room, may truncate */

.mn-row-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: var(--row-name);   /* a touch dimmer until selected */
}
.mn-row[data-selected] .mn-row-name { color: var(--fg); }

.mn-row-meta {
  display: flex;
  gap: 8px;
  margin-top: 1px;
  font-size: 12px;
  color: var(--fg-3);
}
.mn-row-meta .mn-mono { font-size: 11.5px; }

.mn-row-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;    /* right-align the stack */
  flex: none;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.mn-row-side b { font-size: 13px; font-weight: 500; color: var(--fg-2); }

.mn-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 10px;
  border-radius: 7px;
  color: var(--fg-2);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
.mn-nav-item[data-active] {
  background: var(--l4);
  color: var(--fg);
  font-weight: 500;
}`,
        },
      ],
    },
    {
      title: "Stat cards, meters and the metric well",
      parts: [
        {
          k: "p",
          html: "A stat card is a card with a small label, a large tight number and an optional meter. The metric well shows several numbers in one sunken strip, split by hairlines.",
        },
        {
          k: "demo",
          col: true,
          html: `<div class="mn-stats">
  <div class="mn-stat">
    <div class="mn-stat-label">Confidence</div>
    <div class="mn-stat-value">94%</div>
    <div class="mn-meter"><span style="transform: scaleX(0.94)"></span></div>
  </div>
  <div class="mn-stat" data-tone="warn">
    <div class="mn-stat-label">Purity</div>
    <div class="mn-stat-value">71%</div>
    <div class="mn-meter"><span style="transform: scaleX(0.71)"></span></div>
  </div>
  <div class="mn-stat" data-tone="bad">
    <div class="mn-stat-label">Escalated</div>
    <div class="mn-stat-value">3</div>
  </div>
</div>
<div class="mn-backtest">
  <div><b>1,118</b><span>would hide</span></div>
  <div><b>64%</b><span>of tickets</span></div>
  <div data-bad=""><b>3</b><span>escalated</span></div>
</div>`,
          markup: `<div class="mn-stats">
  <div class="mn-stat">
    <div class="mn-stat-label">Confidence</div>
    <div class="mn-stat-value">94%</div>
    <div class="mn-meter"><span style="transform: scaleX(0.94)"></span></div>
  </div>
  <div class="mn-stat" data-tone="warn">
    <div class="mn-stat-label">Purity</div>
    <div class="mn-stat-value">71%</div>
    <div class="mn-meter"><span style="transform: scaleX(0.71)"></span></div>
  </div>
  <div class="mn-stat" data-tone="bad">
    <div class="mn-stat-label">Escalated</div>
    <div class="mn-stat-value">3</div>
  </div>
</div>
<div class="mn-backtest">
  <div><b>1,118</b><span>would hide</span></div>
  <div><b>64%</b><span>of tickets</span></div>
  <div data-bad><b>3</b><span>escalated</span></div>
</div>`,
          css: `.mn-stats {
  display: grid;
  /* equal columns that are allowed to shrink */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mn-stat {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--l3);
  box-shadow:
    inset 0 1px 0 var(--card-edge),
    inset 0 0 0 1px var(--line);
}

/* colour only when the number is a problem */
.mn-stat[data-tone='warn'] .mn-stat-value { color: var(--orange); }
.mn-stat[data-tone='bad'] .mn-stat-value { color: var(--red); }

.mn-meter {
  position: relative;
  height: 4px;
  margin-top: 10px;
  border-radius: 4px;
  background: var(--tint-2);  /* the empty track */
  overflow: hidden;
}
/* the fill covers the whole track, then is scaled from the left.
   scaleX animates more smoothly than changing width. */
.mn-meter span {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background: var(--fg);
  transform-origin: left;
}
.mn-stat[data-tone='warn'] .mn-meter span { background: var(--orange); }

.mn-backtest {
  display: flex;
  min-height: 40px;
  border-radius: 9px;
  background: var(--well-2);
  box-shadow: inset 0 0 0 1px var(--line);
}
.mn-backtest > div {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 8px 14px;
}
/* a hairline between cells, not before the first */
.mn-backtest > div + div { border-left: 1px solid var(--line); }
.mn-backtest b { font-size: 18px; font-weight: 600; line-height: 1.2; font-variant-numeric: tabular-nums; }
.mn-backtest span { font-size: 11px; color: var(--fg-3); }
.mn-backtest > div[data-bad] b { color: var(--red); }`,
        },
      ],
    },
    {
      title: "Callout, code block and text field",
      parts: [
        {
          k: "p",
          html: "Three boxes for content: a tinted warning, a darker block for rule conditions, and a sunken field with the focus glow.",
        },
        {
          k: "demo",
          col: true,
          html: `              <div class="mn-callout">
                <svg class="i" width="15" height="15"><use href="#i-alert"></use></svg>
                <span><strong>3 real incidents</strong> matched this rule in the last 90 days.</span>
              </div>
              <div class="mn-code"><span class="mn-code-kw">when</span> service <span class="mn-code-op">=</span> <span class="mn-code-val">"storage-fleet"</span>
<span class="mn-code-kw">and</span>  alert   <span class="mn-code-op">=</span> <span class="mn-code-val">"disk_latency"</span></div>
              <div class="mn-field">
                <textarea rows="2" placeholder="Why are you approving this rule?"></textarea>
              </div>`,
          markup: `<div class="mn-callout">
  <Icon />
  <span><strong>3 real incidents</strong> matched this rule in the last 90 days.</span>
</div>
<div class="mn-code"><span class="mn-code-kw">when</span> service <span class="mn-code-op">=</span> <span class="mn-code-val">"storage-fleet"</span>
<span class="mn-code-kw">and</span>  alert   <span class="mn-code-op">=</span> <span class="mn-code-val">"disk_latency"</span></div>
<div class="mn-field">
  <textarea rows="2" placeholder="Why are you approving this rule?"></textarea>
</div>`,
          css: `.mn-callout {
  display: flex;
  align-items: flex-start;  /* icon stays on the first line */
  gap: 10px;
  padding: 11px 14px;
  border-radius: 10px;
  background: var(--red-wash);
  box-shadow: inset 0 0 0 1px rgba(240, 86, 92, 0.2);
  font-size: 13px;
  color: var(--red-text);   /* pale red: readable on the wash */
}
.mn-callout svg { flex: none; margin-top: 2px; color: var(--red); }
.mn-callout strong { font-weight: 600; color: var(--red-strong); }

.mn-code {
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--l1);    /* darker than the page: recessed */
  box-shadow: inset 0 0 0 1px var(--line);
  font-family: 'Geist Mono Variable', ui-monospace, monospace;
  font-size: 12.5px;
  line-height: 1.85;
  white-space: pre;         /* keep the spaces and line breaks */
  overflow-x: auto;
}
/* syntax colour is two greys, not a rainbow */
.mn-code-kw, .mn-code-op { color: var(--fg-3); }
.mn-code-val { color: var(--code-val); font-weight: 500; }

.mn-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: var(--well);
  box-shadow: inset 0 0 0 1px var(--line-2);
  outline: none;            /* replaced by the box-shadow below */
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  transition: box-shadow 150ms ease;
}
.mn-field textarea::placeholder { color: var(--fg-3); }
.mn-field textarea:focus {
  box-shadow:
    inset 0 0 0 1px var(--line-3),
    0 0 0 3px var(--focus-glow);
}`,
        },
      ],
    },
    {
      title: "Menu, toast and tooltip",
      parts: [
        {
          k: "p",
          html: "The three small floating things. Menu and toast are glass. The tooltip is solid with the same edge and shadow.",
        },
        {
          k: "demo",
          html: `<div class="mn-menu">
  <div class="mn-menu-label">Sort by</div>
  <div class="mn-menu-item" data-highlighted=""><svg class="i" width="14" height="14"><use href="#i-check"></use></svg><span>Confidence</span></div>
  <div class="mn-menu-item"><i></i><span>Newest</span></div>
  <div class="mn-menu-sep"></div>
  <div class="mn-menu-item"><i></i><span>Name</span></div>
</div>
<div class="mn-toast">
  <div class="mn-toast-icon"><svg class="i" width="13" height="13"><use href="#i-check"></use></svg></div>
  <div>
    <div class="mn-toast-title">Rule approved</div>
    <div class="mn-toast-sub">RULE-0412 is now active</div>
  </div>
</div>
<div class="hc-tip">
  <div class="hc-tip-title">Week of 22 Sep</div>
  <div class="hc-tip-row"><i style="background:var(--hc-rule)"></i><span>By a rule</span><b>212</b></div>
  <div class="hc-tip-row"><i style="background:var(--hc-missed)"></i><span>Not caught</span><b>96</b></div>
</div>`,
          markup: `<div class="mn-menu">
  <div class="mn-menu-label">Sort by</div>
  <div class="mn-menu-item" data-highlighted><Icon /><span>Confidence</span></div>
  <div class="mn-menu-item"><i></i><span>Newest</span></div>
  <div class="mn-menu-sep"></div>
  <div class="mn-menu-item"><i></i><span>Name</span></div>
</div>
<div class="mn-toast">
  <div class="mn-toast-icon"><Icon /></div>
  <div>
    <div class="mn-toast-title">Rule approved</div>
    <div class="mn-toast-sub">RULE-0412 is now active</div>
  </div>
</div>
<div class="hc-tip">
  <div class="hc-tip-title">Week of 22 Sep</div>
  <div class="hc-tip-row"><i style="background:var(--hc-rule)"></i><span>By a rule</span><b>212</b></div>
  <div class="hc-tip-row"><i style="background:var(--hc-missed)"></i><span>Not caught</span><b>96</b></div>
</div>`,
          css: `.mn-menu {
  min-width: 180px;
  padding: 4px;
  border-radius: 10px;
  background: var(--glass-menu);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  backdrop-filter: blur(16px) saturate(1.2);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    0 0 0 1px var(--line-2),
    var(--shadow-pop);
}
.mn-menu-label { padding: 6px 10px 4px; font-size: 12px; font-weight: 500; color: var(--fg-3); }
.mn-menu-item {
  display: grid;
  grid-template-columns: 18px 1fr;  /* a slot for the tick, then the label */
  align-items: center;
  height: 30px;
  padding: 0 10px 0 6px;
  border-radius: 6px;               /* menu radius 10 minus padding 4 */
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-2);
}
/* on glass, hover is a see-through wash, not a ladder step */
.mn-menu-item[data-highlighted] { background: var(--tint-2); color: var(--fg); }
.mn-menu-sep { height: 1px; margin: 4px; background: var(--line); }

.mn-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 260px;                     /* app: 340px */
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--glass-toast);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    0 0 0 1px var(--line-2),
    var(--shadow-pop);
}
.mn-toast-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-fg);
}
.mn-toast-title { font-weight: 600; }
.mn-toast-sub { font-size: 12px; color: var(--fg-2); }

/* In the app the tip is position: absolute above its bar:
   bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%) */
.hc-tip {
  min-width: 176px;
  padding: 9px 11px;
  border-radius: 9px;
  background: var(--l4);            /* solid on purpose */
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    0 0 0 1px var(--line-2),
    var(--shadow-pop);
  font-size: 12px;
  line-height: 1.3;
  color: var(--fg-2);
}
.hc-tip-title { margin-bottom: 6px; font-weight: 500; }
.hc-tip-row {
  display: grid;
  grid-template-columns: 10px auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.hc-tip-row i { width: 10px; height: 2px; border-radius: 2px; }
.hc-tip-row b { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--fg); }`,
        },
      ],
    },
    {
      title: "Timeline and table",
      parts: [
        {
          k: "p",
          html: "Both are drawn with almost nothing: pseudo-elements for the timeline's dots and line, hairlines between table rows.",
        },
        {
          k: "demo",
          col: true,
          html: `<ul class="mn-timeline">
  <li>
    <div class="mn-tl-head"><strong>Admiral Piett</strong><span class="mn-tl-action" data-action="approved">approved</span><span class="mn-tl-time mn-subtle">2h ago</span></div>
    <p>Backtest is clean, no escalations in 90 days.</p>
  </li>
  <li>
    <div class="mn-tl-head"><strong>Rule engine</strong><span class="mn-tl-action">proposed</span><span class="mn-tl-time mn-subtle">2d ago</span></div>
  </li>
</ul>
<div class="hc-table-wrap">
  <table class="hc-table">
    <thead><tr><th>Outcome</th><th>Tickets</th><th>Share</th></tr></thead>
    <tbody>
      <tr><th>Caught by a rule</th><td>1,118</td><td>64%</td></tr>
      <tr><th>Not caught</th><td>404</td><td>23%</td></tr>
    </tbody>
  </table>
</div>`,
          markup: `<ul class="mn-timeline">
  <li>
    <div class="mn-tl-head"><strong>Admiral Piett</strong><span class="mn-tl-action" data-action="approved">approved</span><span class="mn-tl-time mn-subtle">2h ago</span></div>
    <p>Backtest is clean, no escalations in 90 days.</p>
  </li>
  <li>
    <div class="mn-tl-head"><strong>Rule engine</strong><span class="mn-tl-action">proposed</span><span class="mn-tl-time mn-subtle">2d ago</span></div>
  </li>
</ul>
<div class="hc-table-wrap">
  <table class="hc-table">
    <thead><tr><th>Outcome</th><th>Tickets</th><th>Share</th></tr></thead>
    <tbody>
      <tr><th>Caught by a rule</th><td>1,118</td><td>64%</td></tr>
      <tr><th>Not caught</th><td>404</td><td>23%</td></tr>
    </tbody>
  </table>
</div>`,
          css: `.mn-timeline { margin: 0; padding: 0; list-style: none; }
.mn-timeline li {
  position: relative;       /* anchor for the dot and line */
  padding: 0 0 18px 22px;   /* left padding makes room for them */
}

/* ::before draws the dot: an element that only exists in CSS */
.mn-timeline li::before {
  content: '';              /* required, or nothing is drawn */
  position: absolute;
  left: 3px;
  top: 7px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--l2);
  box-shadow: inset 0 0 0 1.5px var(--fg-3);  /* hollow */
}
/* ::after draws the line down to the next item */
.mn-timeline li::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 18px;
  bottom: 2px;              /* top + bottom = stretch to fit */
  width: 1px;
  background: var(--line-2);
}
.mn-timeline li:last-child::after { display: none; }
/* the newest entry gets a filled dot */
.mn-timeline li:first-child::before { background: var(--fg); box-shadow: none; }

.mn-tl-head { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.mn-tl-head strong { font-weight: 500; }
.mn-tl-action { color: var(--fg-2); }
.mn-tl-action[data-action='approved'] { color: var(--green); }
.mn-tl-time { margin-left: auto; font-size: 12px; } /* pushed to the right */
.mn-timeline p { margin: 3px 0 0; font-size: 13px; color: var(--fg-2); }

.hc-table-wrap {
  padding: 4px 4px 2px;
  border-radius: 12px;
  background: var(--l3);
  box-shadow: inset 0 0 0 1px var(--line);
  overflow-x: auto;
}
.hc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.hc-table th, .hc-table td { padding: 8px 12px; white-space: nowrap; }
/* headers are small and quiet, numbers right-aligned */
.hc-table thead th { font-size: 12px; font-weight: 400; text-align: right; color: var(--fg-3); }
.hc-table th:first-child { text-align: left; }
.hc-table tbody th { font-weight: 400; color: var(--fg); }
.hc-table td { text-align: right; color: var(--fg-2); }
.hc-table tbody tr { border-top: 1px solid var(--line); }`,
        },
      ],
    },
  ],
}

export const STATUS: Lesson = {
  title: "Status colour",
  lede: "Colour is never decoration, so when you do need it there is one formula. Take the status colour and use it three ways at three strengths: <strong>about 8 to 10% as the background, 20 to 25% as the ring, 100% as the text</strong>.",
  entries: [
    {
      parts: [
        {
          k: "demo",
          html: `<span class="hc-verdict" data-verdict="validated"><svg class="i" width="12" height="12"><use href="#i-check"></use></svg>Validated</span>
<span class="hc-verdict" data-verdict="review">Needs review</span>
<span class="hc-verdict" data-verdict="unsafe"><svg class="i" width="12" height="12"><use href="#i-alert"></use></svg>Unsafe</span>
<span class="hc-verdict demo-mine">Your own</span>`,
          markup: `<span class="hc-verdict" data-verdict="validated"><Icon />Validated</span>
<span class="hc-verdict" data-verdict="review">Needs review</span>
<span class="hc-verdict" data-verdict="unsafe"><Icon />Unsafe</span>
<span class="hc-verdict demo-mine">Your own</span>`,
          css: `.hc-verdict {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px 0 7px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.hc-verdict[data-verdict='validated'] {
  background: rgba(69, 196, 122, 0.1);                    /* 10% fill */
  box-shadow: inset 0 0 0 1px rgba(69, 196, 122, 0.22);   /* 22% ring */
  color: var(--green);                                    /* full text */
}
.hc-verdict[data-verdict='review'] {
  background: var(--orange-wash);
  box-shadow: inset 0 0 0 1px rgba(240, 138, 75, 0.2);
  color: var(--orange);
}
.hc-verdict[data-verdict='unsafe'] {
  background: var(--red-wash);
  box-shadow: inset 0 0 0 1px rgba(240, 86, 92, 0.24);
  color: var(--danger-fg);
}

/* Try it with any colour. color-mix does the maths for you:
   "10% of my colour, the rest transparent". */
.demo-mine {
  --c: #6ea8ff;
  background: color-mix(in srgb, var(--c) 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 24%, transparent);
  color: var(--c);
}`,
        },
        {
          k: "why",
          items: [
            "<strong>Green</strong> active, validated, approved, done.",
            "<strong>Amber</strong> proposed, waiting on a decision.",
            "<strong>Orange</strong> a warning: low confidence, needs review, an override.",
            "<strong>Red</strong> danger: escalated incidents, reject, unsafe.",
            "<strong>Never colour alone.</strong> Status always comes with a word or an icon too, so it still reads for people who cannot tell the colours apart.",
            "<strong>Numbers</strong> turn orange or red only when they are the problem (<code>data-tone=\"warn\"</code>, <code>data-bad</code>). Good numbers stay white.",
          ],
        },
      ],
      title: "The status formula",
    },
    {
      title: "Copy the status styles",
      parts: [
        { k: "p", html: "A pill is the shape plus one colour set. Click a line to copy it." },
        { k: "recipes", key: "status" },
      ],
    },
  ],
}

export const MOTION: Lesson = {
  title: "Motion",
  lede: "Things used all day do not animate much. Colours fade in 120 to 150ms, presses take 160ms, panels arrive in about 200ms. Nothing bounces.",
  entries: [
    {
      title: "The three curves",
      parts: [
        {
          k: "p",
          html: "An easing curve decides how speed is spread over the animation. All three start fast and settle gently, which feels responsive. Press play to compare them with plain linear.",
        },
        {
          k: "demo",
          id: "ease-stage",
          col: true,
          html: `<div class="demo-track"><span>--ease-out</span><i style="--e: var(--ease-out)"></i></div>
<div class="demo-track"><span>--ease-in-out</span><i style="--e: var(--ease-in-out)"></i></div>
<div class="demo-track"><span>--ease-drawer</span><i style="--e: var(--ease-drawer)"></i></div>
<div class="demo-track"><span>linear</span><i style="--e: linear"></i></div>
<div><button class="mn-btn" id="ease-play">Play</button></div>`,
          css: `/* base.css */
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* almost everything */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* A to B moves (the tour) */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* sheets and drawers */
}

.demo-track {
  position: relative;
  height: 28px;
  border-radius: 8px;
  background: var(--well-2);
  box-shadow: inset 0 0 0 1px var(--line);
}
.demo-track span {
  position: absolute;
  right: 10px;
  top: 5px;
  font-size: 11.5px;
  color: var(--fg-3);
}
.demo-track i {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--fg);
  /* what changes, how long, which curve */
  transition: transform 700ms var(--e);
}
[data-play] .demo-track i { transform: translateX(240px); }`,
        },
      ],
    },
    {
      title: "Arriving: @starting-style",
      parts: [
        {
          k: "p",
          html: "The decision form and menus fade up from slightly below, slightly small and slightly blurred. <code>@starting-style</code> says where an element starts when it first appears, so no JavaScript is needed. Hold the orange button for two seconds to see the timer fill.",
        },
        {
          k: "demo",
          id: "enter-stage",
          col: true,
          html: `<div class="demo-enter">
  <div class="mn-toast-title">Approve this rule</div>
  <div class="mn-toast-sub">It materialises in: opacity, position, size and blur together.</div>
</div>
<div style="display:flex;gap:8px;align-items:center">
  <button class="mn-btn" id="enter-play">Replay</button>
  <button class="mn-hold" id="hold"><span class="mn-hold-label">Hold to override</span><span class="mn-hold-fill">Hold to override</span></button>
</div>`,
          css: `.demo-enter {
  padding: 16px;
  border-radius: 14px;
  background: var(--l3);
  box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line-2);
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out),
    filter 220ms var(--ease-out);
  /* where it comes FROM, the first time it is drawn */
  @starting-style {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
    filter: blur(4px);
  }
}

/* people who ask for less motion get a plain fade */
@media (prefers-reduced-motion: reduce) {
  .demo-enter {
    transition: opacity 150ms ease;
    @starting-style { opacity: 0; transform: none; filter: none; }
  }
}

/* HOLD TO CONFIRM: a solid copy of the button sits on top,
   clipped away from the right. Holding un-clips it. */
.mn-hold {
  position: relative;
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: rgba(240, 138, 75, 0.1);
  box-shadow: inset 0 0 0 1px rgba(240, 138, 75, 0.45);
  color: var(--orange);
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  overflow: hidden;
}
.mn-hold-fill {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--orange);
  color: var(--hold-fg);
  clip-path: inset(0 100% 0 0);            /* hide 100% from the right */
  transition: clip-path 200ms var(--ease-out);  /* letting go: snap back */
}
.mn-hold[data-holding] .mn-hold-fill {
  clip-path: inset(0 0 0 0);               /* fully revealed */
  transition: clip-path 2s linear;         /* linear, like a timer */
}
.mn-hold[data-done] {
  background: rgba(69, 196, 122, 0.1);
  box-shadow: inset 0 0 0 1px rgba(69, 196, 122, 0.4);
  color: var(--green);
}
.mn-hold[data-done] .mn-hold-fill { display: none; }`,
        },
        {
          k: "why",
          items: [
            "<strong>120ms</strong> row hover. <strong>150ms</strong> colour and background changes. <strong>160ms</strong> press scale. <strong>200 to 240ms</strong> panels, columns, the form.",
            "<strong>Only animate transform, opacity, filter and clip-path</strong> where you can. The browser can move those without redoing the layout.",
            "<strong>Menus grow from their button</strong>: <code>transform-origin</code> is set to where they were opened from, and they scale from 0.96.",
            "<strong>The command palette does not animate at all.</strong> It is opened a hundred times a day and anything slower than instant would get in the way.",
          ],
        },
      ],
    },
    {
      title: "Copy the motion",
      parts: [
        { k: "p", html: "Durations, curves and the common transitions. Click a line to copy it." },
        { k: "recipes", key: "motion" },
      ],
    },
  ],
}

export const CHARTS: Lesson = {
  title: "Charts",
  lede: "No chart library. Every mark on the Hindcast page is a <code>div</code> or <code>span</code> sized with flexbox. The data uses three tones of one grey, brightest for the strongest result, which leaves colour free for status.",
  entries: [
    {
      parts: [
        {
          k: "demo",
          col: true,
          html: `<ul class="hc-legend">
  <li><i data-tone="rule"></i>By a rule</li>
  <li><i data-tone="window"></i>By a change window</li>
  <li><i data-tone="missed"></i>Not caught</li>
</ul>
<div class="hc-split">
  <span data-tone="rule" style="flex-grow: 64"></span>
  <span data-tone="window" style="flex-grow: 13"></span>
  <span data-tone="missed" style="flex-grow: 23"></span>
</div>
<div class="hc-cols">
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 40"></span><span data-tone="missed" style="flex-grow: 20"></span><b style="flex-grow: 40"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 55"></span><span data-tone="missed" style="flex-grow: 25"></span><b style="flex-grow: 20"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 30"></span><span data-tone="missed" style="flex-grow: 15"></span><b style="flex-grow: 55"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 70"></span><span data-tone="missed" style="flex-grow: 30"></span><b style="flex-grow: 0"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 48"></span><span data-tone="missed" style="flex-grow: 12"></span><b style="flex-grow: 40"></b></div>
</div>
<div class="hc-heat">
  <i style="--heat: 0.1"></i><i style="--heat: 0.35"></i><i style="--heat: 0"></i><i style="--heat: 0.8"></i><i style="--heat: 0.55"></i><i style="--heat: 1"></i><i style="--heat: 0.2"></i><i style="--heat: 0.65"></i>
</div>`,
          markup: `<ul class="hc-legend">
  <li><i data-tone="rule"></i>By a rule</li>
  <li><i data-tone="window"></i>By a change window</li>
  <li><i data-tone="missed"></i>Not caught</li>
</ul>
<div class="hc-split">
  <span data-tone="rule" style="flex-grow: 64"></span>
  <span data-tone="window" style="flex-grow: 13"></span>
  <span data-tone="missed" style="flex-grow: 23"></span>
</div>
<div class="hc-cols">
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 40"></span><span data-tone="missed" style="flex-grow: 20"></span><b style="flex-grow: 40"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 55"></span><span data-tone="missed" style="flex-grow: 25"></span><b style="flex-grow: 20"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 30"></span><span data-tone="missed" style="flex-grow: 15"></span><b style="flex-grow: 55"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 70"></span><span data-tone="missed" style="flex-grow: 30"></span><b style="flex-grow: 0"></b></div>
  <div class="hc-col"><span data-tone="rule" style="flex-grow: 48"></span><span data-tone="missed" style="flex-grow: 12"></span><b style="flex-grow: 40"></b></div>
</div>
<div class="hc-heat">
  <i style="--heat: 0.1"></i><i style="--heat: 0.35"></i><i style="--heat: 0"></i><i style="--heat: 0.8"></i><i style="--heat: 0.55"></i><i style="--heat: 1"></i><i style="--heat: 0.2"></i><i style="--heat: 0.65"></i>
</div>`,
          css: `/* the three data tones */
[data-tone='rule'] { background: var(--hc-rule); }     /* #ededed */
[data-tone='window'] { background: var(--hc-window); } /* #8c8c8c */
[data-tone='missed'] { background: var(--hc-missed); } /* #4d4d4d */

/* SPLIT BAR: segments share the width by their flex-grow number */
.hc-split {
  display: flex;
  gap: 2px;          /* the page shows through: that is the divider */
  height: 10px;
}
.hc-split span { flex-basis: 0; min-width: 2px; }
.hc-split span:first-child { border-radius: 4px 0 0 4px; }
.hc-split span:last-child { border-radius: 0 4px 4px 0; }

/* COLUMNS: the same idea turned on its side */
.hc-cols {
  display: flex;
  height: 120px;
  border-bottom: 1px solid var(--line-3);  /* the baseline */
}
.hc-col {
  flex: 1;
  display: flex;
  flex-direction: column-reverse;  /* stack upwards from the baseline */
  align-items: center;
  gap: 2px;
}
.hc-col span { flex-basis: 0; width: 62%; max-width: 24px; min-height: 2px; }
.hc-col span:nth-last-of-type(1) { border-radius: 4px 4px 0 0; } /* round the top only */
.hc-col b { flex-basis: 0; }       /* invisible spacer: the empty part */

/* HEAT STRIP: every cell is the same grey, opacity is the value */
.hc-heat {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 2px;
}
.hc-heat i {
  position: relative;
  height: 20px;
  border-radius: 3px;
  background: var(--tint);         /* the empty cell */
}
.hc-heat i::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--hc-rule);
  opacity: var(--heat);            /* set per cell: style="--heat: 0.8" */
}

.hc-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--fg-2);
}
.hc-legend li { display: inline-flex; align-items: center; gap: 7px; }
.hc-legend i { width: 8px; height: 8px; border-radius: 2px; }`,
        },
        {
          k: "why",
          items: [
            "<strong>Bars are square at the baseline and rounded at the data end</strong>, 4px. A full part-to-whole bar is rounded at both ends.",
            "<strong>A 2px gap separates segments</strong>, not a border. The surface behind does the work.",
            "<strong>Gridlines are <code>--line</code></strong>, the baseline is <code>--line-3</code>, axis labels are 11px in <code>--fg-3</code>.",
            "<strong>Passing a number into CSS</strong>: <code>style=\"--heat: 0.8\"</code> on the element, then <code>opacity: var(--heat)</code> in the stylesheet.",
          ],
        },
      ],
      title: "Bars are divs",
    },
  ],
}

export const BUILD: Lesson = {
  title: "Build your own",
  lede: "A blank component to practise on. It starts as a card. Follow the comments to turn it into a well, a raised control or a glass panel, then give it a status.",
  entries: [
    {
      parts: [
        {
          k: "demo",
          col: true,
          html: `<div class="my-thing">
  <div class="my-thing-label">My component</div>
  <div class="my-thing-value">42</div>
  <p class="my-thing-text">Edit the CSS on the right.</p>
</div>`,
          markup: `<div class="my-thing">
  <div class="my-thing-label">My component</div>
  <div class="my-thing-value">42</div>
  <p class="my-thing-text">Edit the CSS on the right.</p>
</div>`,
          css: `.my-thing {
  /* 1. SHAPE: padding and radius (see the radius scale) */
  padding: 14px 16px;
  border-radius: 12px;

  /* 2. SURFACE: pick a rung.
     card: var(--l3)   raised: var(--l4)   well: var(--well-2) */
  background: var(--l3);

  /* 3. EDGE: top highlight + ring.
     For a well or raised control, delete the first line. */
  box-shadow:
    inset 0 1px 0 var(--card-edge),
    inset 0 0 0 1px var(--line);

  /* 4. GLASS instead? Replace steps 2 and 3 with these five lines:
  background: var(--glass);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  backdrop-filter: blur(20px) saturate(1.2);
  box-shadow: inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2), var(--shadow-float);
  border-radius: 14px;
  */

  /* 5. INTERACTIVE? Add a transition, then the three states below */
  transition: background-color 150ms ease, transform 160ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .my-thing:hover { background: var(--l4); }   /* one rung up */
}
.my-thing:active { transform: scale(0.98); }
.my-thing:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* 6. TEXT: label small and quiet, value big and tight */
.my-thing-label { font-size: 12px; font-weight: 500; color: var(--fg-3); }
.my-thing-value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  /* 7. STATUS? color: var(--orange); and nothing else changes */
}
.my-thing-text { margin: 8px 0 0; font-size: 12px; color: var(--fg-2); }`,
        },
      ],
      title: "A blank component",
    },
    {
      title: "I want… so I write…",
      parts: [
        {
          k: "p",
          html: "The lookup table. Left is what you are trying to do, right is the CSS that does it on these pages.",
        },
        {
          k: "lookup",
          head: ["I want","Write"],
          rows: [
            [
              "A card",
              "<code>background: var(--l3)</code> · <code>border-radius: 12px</code> · <code>box-shadow: inset 0 1px 0 var(--card-edge), inset 0 0 0 1px var(--line)</code>",
            ],
            [
              "A sunken area or input",
              "<code>background: var(--well-2)</code> (inputs: <code>--well</code>) · <code>box-shadow: inset 0 0 0 1px var(--line)</code>",
            ],
            [
              "Something floating",
              "The glass recipe from Materials, on a parent with <code>position: relative</code>",
            ],
            [
              "An outline",
              "<code>box-shadow: inset 0 0 0 1px var(--line)</code>, or <code>--line-2</code> for more presence",
            ],
            [
              "A divider",
              "<code>border-top: 1px solid var(--line)</code>, added with <code>.item + .item</code>",
            ],
            [
              "Hover",
              "One rung up (<code>--l3</code> on the page, <code>--l5</code> on a raised control, <code>--tint</code> on a card or glass), inside <code>@media (hover: hover) and (pointer: fine)</code>",
            ],
            [
              "Selected or active",
              "<code>background: var(--l4)</code> · ring <code>var(--line)</code> · <code>color: var(--fg)</code>, switched by <code>[data-active]</code> or <code>[data-selected]</code>",
            ],
            [
              "Pressed",
              "<code>transform: scale(0.97)</code> on <code>:active</code>, with <code>transition: transform 160ms var(--ease-out)</code>",
            ],
            [
              "Keyboard focus",
              "<code>outline: 2px solid var(--focus-ring); outline-offset: 2px</code> on <code>:focus-visible</code> (use <code>-2px</code> for rows inside a list)",
            ],
            [
              "Focus on a field",
              "<code>box-shadow: inset 0 0 0 1px var(--line-3), 0 0 0 3px var(--focus-glow)</code>",
            ],
            [
              "Quieter text",
              "<code>color: var(--fg-2)</code> for sentences, <code>var(--fg-3)</code> for labels and meta",
            ],
            [
              "Emphasis inside a sentence",
              "<code>font-weight: 500; color: var(--fg)</code> on the <code>strong</code>",
            ],
            ["Numbers that line up","<code>font-variant-numeric: tabular-nums</code>, right-aligned"],
            [
              "An ID or code",
              "class <code>mn-mono</code> (Geist Mono 12px), usually with <code>mn-subtle</code>",
            ],
            [
              "One line with an ellipsis",
              "class <code>mn-truncate</code>, and <code>min-width: 0</code> on its flex or grid parent cell",
            ],
            [
              "A status pill",
              "Colour at 10% fill, 22% ring, 100% text, <code>border-radius: 999px</code>, plus a word or icon",
            ],
            [
              "A pane that scrolls on its own",
              "Parent <code>display: flex; flex-direction: column; min-height: 0</code>, child <code>flex: 1; min-height: 0; overflow-y: auto</code>",
            ],
            [
              "A bar that stays at the top",
              "<code>position: sticky; top: 0; z-index: 10</code> and a solid <code>background</code>",
            ],
            [
              "Something pinned to the bottom of a pane",
              "Parent <code>position: relative</code>, child <code>position: absolute; left: 24px; right: 24px; bottom: 80px</code>",
            ],
            [
              "Something centred over the window",
              "<code>position: fixed; top: 16vh; left: 50%; transform: translateX(-50%)</code>",
            ],
            [
              "Push one item to the far right of a row",
              "<code>margin-left: auto</code> on it, or <code>flex: 1</code> on the item before it",
            ],
            [
              "Equal columns",
              "<code>display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px</code>",
            ],
            [
              "A layout that changes with its pane's width",
              "<code>container: report / inline-size</code> on the pane, then <code>@container report (min-width: 980px) { … }</code>",
            ],
            [
              "An element to appear smoothly",
              "<code>transition</code> plus <code>@starting-style { opacity: 0; transform: translateY(8px) }</code>",
            ],
          ],
        },
        {
          k: "note",
          html: "<strong>Where the real code lives.</strong> Tokens: <code>src/styles/theme.css</code>. Shared pieces: <code>src/styles/ui.css</code>. Page frame: <code>src/styles/shell.css</code>. Command palette: <code>src/styles/palette.css</code>. Each component keeps its own CSS file beside its <code>.tsx</code> under <code>src/pages/rule-management/components</code> and <code>src/pages/hindcast/components</code>.",
        },
      ],
    },
  ],
}

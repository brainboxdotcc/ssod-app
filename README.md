# Seven Spells UI — standalone renderer prototype

A desktop-first, mobile-responsive React + TypeScript frontend. It accepts Discord-shaped message JSON and renders embeds, Markdown, fields, attachments, action rows, buttons, string selects, modal text inputs, and a useful subset of Components V2.

## Run

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the address printed by Vite (usually http://localhost:5173). For a production build, run `npm run build`.

## What to test

Use the left navigation to switch between Port Obligan, Inventory, Quest Log, Component Playground and Components V2. Click buttons, select options and submit the modal. The mock transport in `src/mock.ts` returns a replacement message or modal response. Toggle the `<>` icon to inspect the current message JSON.

## Integration boundary

- `src/types.ts`: Discord-shaped JSON types (subset, not a full generated Discord API schema).
- `src/mock.ts`: sample messages and a synchronous fake interaction responder.
- `src/main.tsx`: renderer, interaction dispatch, modal and application shell.
- `src/style.css`: styling and responsive behaviour.

Replace `simulate()` with an asynchronous call to Drogon. The server must derive the user ID from the authenticated session, never from a client-supplied ID. Keep response rendering separate from game state.

## Scope / limitations

This is a prototype, not full Discord API conformance. It supports string selects, but not user/role/channel selects or Discord's entire Components V2 catalogue. Markdown supports a safe subset; nested Markdown, mentions, spoilers and custom emoji assets need further work. The modal demo supports the older action-row-wrapped text-input shape. It does not implement Discord Gateway, authentication, networking, audio playback, persistence, or Capacitor packaging. The harbour scene and crest are original SVG placeholders, not game assets. The audio button is a placeholder.

This version deliberately keeps only the current message, with no Discord channel history.

## Standalone live gameplay

Set `VITE_GAME_WS_URL=ws://localhost:8080/api/game` in `.env.local` for local development, or use `wss://your-host/api/game` behind TLS in production. Rebuild/restart Vite after changing it.

The browser generates a 256-bit installation token, stores it in localStorage, and authenticates on connection. The service dispatches `/start` after authentication. The client displays returned Discord message JSON, sends button/select/modal interactions and applies Discord callback message updates (type 7). Modal callbacks (type 9) open the existing modal renderer. When a live URL is configured the mock navigation and simulator are disabled; without one, the original demo remains available.

The standalone server must send the Discord response envelope (`type` and `data`) or a complete message JSON. The client does not interpret game-specific custom IDs. Clearing browser storage loses the token and access to the standalone identity. No automatic reconnection is implemented.
\n## v8\nMulti-select controls now use Select2-style selected pills, click-to-toggle checkboxes, count and a Confirm action. No Ctrl/Shift selection needed.\n
## v9
Fix Discord type 18 modal labels containing a singular `component` text input.

## v10
Submit Components V2 modal label (type 18) wrappers with nested text-input values, preserving legacy action-row text inputs.

## v11
Render fenced `ansi` code blocks with ANSI SGR colours and styling, including 8/16/256/true-colour codes. Other fenced code blocks remain plain. Emoji CDN support is deliberately deferred.

## v12
Render Discord double-underscore underline markup in rich text.
\n## v13\nNested Discord inline formatting is now parsed recursively, including `__**Chat**__`.\n
## v14
Corrects over-escaped regex and newline handling introduced in v13. Syntax checked with TypeScript transpilation.
\n## v15\nApplication emoji names now resolve to PNG sprites on admin.ssod.org in buttons, select options, embeds, inline Markdown and ANSI text. Single selects use a custom menu to display image sprites. No Discord CDN requests.\n
## v16
Replace placeholder crest and favicon with official SSOD icon.
\n## v17\nLive sidebar navigation for /start, /profile and /lore. Every click sends a fresh slash command; no response caching.\n
## v23
Expanded Discord Markdown: bulleted and numbered lists, italic underscores, nested emphasis, links and autolinks, escaped formatting, quotes, spoilers and subtext.

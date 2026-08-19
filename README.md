# Pokedex — WS101 Prelim Project

A single-page app built with **Vite + TypeScript (strict) + React 18** that
fetches Pokemon from the public [PokeAPI](https://pokeapi.co/) and renders
them with typed components, a generic custom hook, and both `useReducer`
and `useContext` for state management.

## Features

- Search/filter Pokemon by name (client-side)
- "Load more" pagination against the API
- Favorite toggling (`useReducer`, since favorites is a `Set` and needs
  immutable add/remove logic)
- Light/dark theme toggle (`useContext` via `ThemeContext`)
- Loading / error / success states for every fetch, including a separate
  "load more" error state that doesn't wipe out already-loaded data

## API used

**PokeAPI** — `https://pokeapi.co/api/v2/pokemon?limit=20&offset=0`
No key required, unlimited free tier. Sprite images are derived from the
Pokemon's numeric id (parsed out of the API URL) instead of a second
network call per item.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

To type-check without emitting files (used to confirm zero TS errors):

```bash
npx tsc --noEmit
```

To build for production:

```bash
npm run build
```

## Project structure

```
src/
├── components/
│   ├── Card.tsx          # Typed props with children
│   ├── ItemList.tsx      # Generic <T> list renderer, typed .map()
│   └── SearchBar.tsx     # Controlled input, typed change event
├── hooks/
│   └── useFetch.ts       # Generic hook, discriminated-union async state
├── contexts/
│   └── ThemeContext.tsx  # useContext-based shared theme state
├── types/
│   └── api.ts             # Interfaces for the PokeAPI response shapes
├── App.tsx                # Root composition, useReducer for favorites
├── App.css                # Responsive styling, light/dark theme vars
└── main.tsx                # Entry point, wraps App in ThemeProvider
```

## Notes on the TypeScript patterns

- `strict: true` is set in `tsconfig.app.json`; there are no `any` types
  anywhere in `src/`.
- `useFetch<T>` returns a discriminated union
  (`{ status: "idle" | "loading" | "success" | "error" }`) so the compiler
  narrows `data`/`error` availability based on `status` — see the
  conditional rendering in `App.tsx`.
- `ItemList<T>` is a generic component, reusable for any typed array, not
  just Pokemon.

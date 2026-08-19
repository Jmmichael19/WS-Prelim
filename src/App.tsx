import { useEffect, useMemo, useReducer, useState } from "react";
import { useFetch } from "./hooks/useFetch";
import { useTheme } from "./contexts/ThemeContext";
import { Card } from "./components/Card";
import { ItemList } from "./components/ItemList";
import { SearchBar } from "./components/SearchBar";
import {
  toPokemon,
  type Pokemon,
  type PokemonDetailResponse,
  type PokemonListResponse,
  type PokemonSpeciesDetailResponse,
} from "./types/api";
import "./App.css";

const PAGE_SIZE = 20;
const API_BASE = "https://pokeapi.co/api/v2/pokemon";
const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

// ---- useReducer: favorites -------------------------------------------
// A Set is genuinely "complex state" — toggling one favorite must not
// mutate the old set (React needs a new reference to detect the change),
// so this is exactly the kind of update logic useReducer is meant for.

interface FavoritesState {
  favorites: Set<string>;
}

type FavoritesAction = { type: "toggle"; name: string };

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case "toggle": {
      const next = new Set(state.favorites);
      if (next.has(action.name)) {
        next.delete(action.name);
      } else {
        next.add(action.name);
      }
      return { favorites: next };
    }
    default:
      return state;
  }
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [favState, dispatch] = useReducer(favoritesReducer, { favorites: new Set<string>() });

  const [searchTerm, setSearchTerm] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [previewPokemon, setPreviewPokemon] = useState<Pokemon | null>(null);

  const url = `${API_BASE}?limit=${PAGE_SIZE}&offset=${offset}`;
  const fetchState = useFetch<PokemonListResponse>(url);
  const isLoadingScreen = fetchState.status === "loading" && allPokemon.length === 0;

  // Whenever a page finishes loading, fetch the per-Pokemon details for abilities
  // and fold the enriched list into the running state.
  useEffect(() => {
    if (fetchState.status !== "success") {
      return;
    }

    let isMounted = true;

    Promise.all(
      fetchState.data.results.map(async (item) => {
        try {
          const response = await fetch(item.url);
          if (!response.ok) {
            return toPokemon(item);
          }

          const detail = (await response.json()) as PokemonDetailResponse;

          let speciesDetail: PokemonSpeciesDetailResponse | undefined;
          if (detail.species?.url) {
            try {
              const speciesResponse = await fetch(detail.species.url);
              if (speciesResponse.ok) {
                speciesDetail = (await speciesResponse.json()) as PokemonSpeciesDetailResponse;
              }
            } catch {
              speciesDetail = undefined;
            }
          }

          return toPokemon(item, detail, speciesDetail);
        } catch {
          return toPokemon(item);
        }
      }),
    )
      .then((pagePokemon) => {
        if (!isMounted) {
          return;
        }

        setAllPokemon((prev) => {
          const seen = new Set(prev.map((p) => p.name));
          const fresh = pagePokemon.filter((p) => !seen.has(p.name));
          return [...prev, ...fresh];
        });
      })
      .catch(() => {
        if (isMounted) {
          setAllPokemon((prev) => prev);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchState]);

  const hasNextPage = fetchState.status === "success" ? fetchState.data.next !== null : true;

  const favoritePokemon = useMemo(
    () => allPokemon.filter((p) => favState.favorites.has(p.name)),
    [allPokemon, favState.favorites],
  );

  const filtered = useMemo(() => {
    const source = showFavorites ? favoritePokemon : allPokemon;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return source;
    return source.filter((p) => p.name.includes(term));
  }, [allPokemon, favoritePokemon, searchTerm, showFavorites]);

  const isInitialLoad = fetchState.status === "loading" && allPokemon.length === 0;
  const isLoadingMore = fetchState.status === "loading" && allPokemon.length > 0;

  if (isLoadingScreen) {
    return (
      <div className={`app app--${theme} app--loading`}>
        <div className="loading-screen">
          <div className="loading-screen__orb" aria-hidden="true" />
          <div className="loading-screen__text">Loading Pokémon...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app app--${theme}`}>
      <header className="app__header">
        <div className="app__brand">
          <div className="brand-mark" aria-hidden="true" />
          <h1>Choose your favorite Pokémon</h1>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
        </button>
      </header>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search Pokemon by name..."
      />

      <div className="toolbar" aria-label="Pokemon filters">
        <button
          className={`filter-toggle ${!showFavorites ? "filter-toggle--active" : ""}`}
          type="button"
          onClick={() => setShowFavorites(false)}
        >
          All Pokémon
        </button>
        <button
          className={`filter-toggle ${showFavorites ? "filter-toggle--active" : ""}`}
          type="button"
          onClick={() => setShowFavorites(true)}
        >
          Favorites ({favState.favorites.size})
        </button>
      </div>

      {/* ---- discriminated-union-driven conditional rendering ---- */}
      {isInitialLoad && <p className="status status--loading">Loading Pokemon...</p>}

      {fetchState.status === "error" && allPokemon.length === 0 && (
        <p className="status status--error">Something went wrong: {fetchState.error}</p>
      )}

      {!isInitialLoad && (
        <>
          <ItemList
            items={filtered}
            getKey={(p) => p.id}
            emptyMessage={
              showFavorites
                ? "No favorites yet. Tap a card to favorite it."
                : "No Pokemon match your search."
            }
            renderItem={(p) => (
              <Card
                title={capitalize(p.name)}
                subtitle={`#${p.id.toString().padStart(3, "0")}`}
                imageUrl={p.imageUrl}
                onClick={() => dispatch({ type: "toggle", name: p.name })}
              >
                <div className="card__meta">
                  <span>{p.category}</span>
                  <span>H {p.height.toFixed(1)} m</span>
                  <span>W {p.weight.toFixed(1)} kg</span>
                  <span>XP {p.baseExperience}</span>
                </div>

                <div className="card__category" aria-label={`${capitalize(p.name)} category`}>
                  <span className="card__category-label">Category</span>
                  <strong>{p.category}</strong>
                </div>

                <div className="card__abilities" aria-label={`${capitalize(p.name)} abilities`}>
                  {p.abilities.length > 0 ? (
                    p.abilities.map((ability) => (
                      <span key={ability} className="card__ability">
                        {capitalize(ability)}
                      </span>
                    ))
                  ) : (
                    <span className="card__ability card__ability--empty">No abilities</span>
                  )}
                </div>

                <div className="card__actions">
                  <span className={`favorite ${favState.favorites.has(p.name) ? "favorite--on" : ""}`}>
                    {favState.favorites.has(p.name) ? "★ Favorited" : "☆ Tap to favorite"}
                  </span>

                  <button
                    className="view-image-btn"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewPokemon(p);
                    }}
                  >
                    Details
                  </button>
                </div>
              </Card>
            )}
          />

          {!searchTerm && !showFavorites && hasNextPage && (
            <button
              className="load-more"
              disabled={isLoadingMore}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          )}

          {fetchState.status === "error" && allPokemon.length > 0 && (
            <p className="status status--error">
              Couldn't load more: {fetchState.error}
            </p>
          )}
        </>
      )}

      {previewPokemon && (
        <div className="image-modal" onClick={() => setPreviewPokemon(null)} role="dialog" aria-modal="true">
          <div className="image-modal__content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="image-modal__close"
              onClick={() => setPreviewPokemon(null)}
              aria-label="Close image preview"
            >
              ✕
            </button>

            <div className="detail-panel">
              <div className="detail-panel__image-wrap">
                <img
                  className="image-modal__image"
                  src={previewPokemon.imageUrl}
                  alt={capitalize(previewPokemon.name)}
                />
              </div>

              <div className="detail-panel__body">
                <p className="detail-panel__eyebrow">#{previewPokemon.id.toString().padStart(3, "0")}</p>
                <h2>{capitalize(previewPokemon.name)}</h2>

                <div className="detail-panel__row detail-panel__row--accent">
                  <span>Category</span>
                  <strong>{previewPokemon.category}</strong>
                </div>

                <div className="detail-panel__grid">
                  <div className="detail-panel__stat-box">
                    <span>Height</span>
                    <strong>{previewPokemon.height.toFixed(1)} m</strong>
                  </div>
                  <div className="detail-panel__stat-box">
                    <span>Weight</span>
                    <strong>{previewPokemon.weight.toFixed(1)} kg</strong>
                  </div>
                  <div className="detail-panel__stat-box">
                    <span>Base XP</span>
                    <strong>{previewPokemon.baseExperience}</strong>
                  </div>
                </div>

                <div className="detail-panel__stats">
                  {Object.entries(previewPokemon.stats).map(([key, value]) => (
                    <div key={key} className="detail-panel__stat-row">
                      <div className="detail-panel__stat-label">
                        <span>{STAT_LABELS[key] ?? capitalize(key)}</span>
                        <strong>{value}</strong>
                      </div>
                      <div className="detail-panel__bar" aria-hidden="true">
                        <span style={{ width: `${Math.min((value / 180) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="app__footer">
        <p>{favState.favorites.size} favorite(s)</p>
      </footer>
    </div>
  );
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default App;

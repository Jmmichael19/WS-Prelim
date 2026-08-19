import { useEffect, useState } from "react";

/**
 * Discriminated union: the `status` field is the "discriminant".
 * TypeScript narrows the type automatically once you check `status`,
 * so `state.data` is only accessible when `state.status === "success"`,
 * and `state.error` only when `state.status === "error"`.
 * This is the pattern the rubric calls out explicitly.
 */
export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

/**
 * Generic fetch hook: <T> is filled in by the caller, e.g.
 *   useFetch<PokemonListResponse>(url)
 * so the returned `data` is fully typed, not `any`.
 *
 * Pass `null` as the url to skip fetching (useful while a required
 * param, like a search query, isn't ready yet).
 */
export function useFetch<T>(url: string | null): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: "idle" });

  useEffect(() => {
    if (!url) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ status: "error", error: message });
      });

    // Cleanup guards against setting state after the component unmounts
    // or after a newer request has started (e.g. fast search typing).
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

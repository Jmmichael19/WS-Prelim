export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonAbilityEntry {
  ability: {
    name: string;
    url: string;
  };
}

export interface PokemonStatEntry {
  base_stat: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonSpeciesDetailResponse {
  genera?: Array<{
    genus: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokemonDetailResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  abilities: PokemonAbilityEntry[];
  stats: PokemonStatEntry[];
  species: {
    url: string;
  };
  sprites: {
    other?: {
      "official-artwork"?: {
        front_default?: string | null;
      };
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  imageUrl: string;
  abilities: string[];
  category: string;
  height: number;
  weight: number;
  baseExperience: number;
  stats: Record<string, number>;
}

export function toPokemon(
  item: PokemonListItem,
  detail?: PokemonDetailResponse,
  speciesDetail?: PokemonSpeciesDetailResponse,
): Pokemon {
  const pathParts = item.url.split("/").filter(Boolean);
  const rawId = Number(pathParts[pathParts.length - 1] ?? "0");
  const id = Number.isFinite(rawId) && rawId > 0 ? rawId : 0;
  const placeholder = "https://placehold.co/256x256/E2E8F0/475569?text=Pokémon";

  const imageUrl =
    id > 0
      ? `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(id).padStart(3, "0")}.png`
      : placeholder;

  const category =
    speciesDetail?.genera?.find((entry) => entry.language.name === "en")?.genus ?? "Unknown";

  const stats =
    detail?.stats?.reduce<Record<string, number>>((all, entry) => {
      all[entry.stat.name] = entry.base_stat;
      return all;
    }, {}) ?? {};

  return {
    id,
    name: item.name,
    imageUrl,
    abilities: detail?.abilities?.map((entry) => entry.ability.name) ?? [],
    category,
    height: detail ? detail.height / 10 : 0,
    weight: detail ? detail.weight / 10 : 0,
    baseExperience: detail?.base_experience ?? 0,
    stats,
  };
}

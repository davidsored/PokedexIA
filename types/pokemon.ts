export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonSpriteImage {
  front_default?: string | null;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    "official-artwork"?: PokemonSpriteImage;
  } & {
    [key: string]: PokemonSpriteImage | undefined;
  };
}

export interface PokemonAbilityReference {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

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

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: PokemonSprites;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbilityReference[];
}

export interface PokemonSpeciesGenus {
  genus: string;
  language: {
    name: string;
    url: string;
  };
}

export interface PokemonSpecies {
  genera: PokemonSpeciesGenus[];
}

export interface AbilityEffectEntry {
  effect: string;
  short_effect: string;
  language: {
    name: string;
    url: string;
  };
}

export interface Ability {
  effect_entries: AbilityEffectEntry[];
}

import Image from "next/image";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { Press_Start_2P, Space_Mono } from "next/font/google";
import api from "@/lib/axios";
import type {
  Ability,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
} from "@/types/pokemon";
import styles from "./[name].module.css";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

interface PokemonNavigationItem {
  id: number;
  name: string;
}

interface PokemonAbilityDetail {
  name: string;
  isHidden: boolean;
  description: string;
}

interface PokemonPageProps {
  pokemon: Pokemon;
  category: string;
  abilities: PokemonAbilityDetail[];
  previousPokemon: PokemonNavigationItem | null;
  nextPokemon: PokemonNavigationItem | null;
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

const STAT_COLORS: Record<string, string> = {
  hp: "#22c55e",
  attack: "#ef4444",
  defense: "#3b82f6",
  "special-attack": "#facc15",
  "special-defense": "#f97316",
  speed: "#ec4899",
};

const TYPE_COLORS: Record<string, string> = {
  normal: "#a8a77a",
  fire: "#f08030",
  water: "#6890f0",
  electric: "#f8d030",
  grass: "#78c850",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#705848",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

const DEFAULT_ABILITY_DESCRIPTION = "Sin descripcion disponible en PokeAPI.";
const HOME_POKEMON_LIMIT = 251;

function formatName(value: string) {
  return value.replace(/-/g, " ");
}

function formatDisplayName(value: string) {
  return formatName(value).replace(/\b\w/g, (match) => match.toUpperCase());
}

function getStatLabel(statName: string) {
  return STAT_LABELS[statName] ?? formatDisplayName(statName);
}

function getTypeColor(typeName: string) {
  return TYPE_COLORS[typeName] ?? "#5768e6";
}

function getStatWidth(baseStat: number) {
  return `${Math.min((baseStat / 255) * 100, 100)}%`;
}

function getStatColor(statName: string) {
  return STAT_COLORS[statName] ?? "#5768e6";
}

function getEnglishCategory(species: PokemonSpecies) {
  const genusEntry = species.genera.find((entry) => entry.language.name === "en");
  return genusEntry?.genus ?? "Pokemon";
}

function getEnglishAbilityDescription(ability: Ability) {
  const effectEntry = ability.effect_entries.find((entry) => entry.language.name === "en");
  return effectEntry?.short_effect ?? effectEntry?.effect ?? DEFAULT_ABILITY_DESCRIPTION;
}

export default function PokemonDetailPage({
  pokemon,
  category,
  abilities,
  previousPokemon,
  nextPokemon,
}: PokemonPageProps) {
  const officialArtwork =
    pokemon.sprites.front_default ??
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    "/file.svg";

  return (
    <main className={`${styles.page} ${pressStart.variable} ${spaceMono.variable}`}>
      <div className={styles.frame}>
        <Link href="/" className={styles.backLink}>
          Volver a la Pokedex
        </Link>

        <section className={styles.shell}>
          <div className={styles.heroPanel}>
            <div className={styles.artPanel}>
              <Image
                src={officialArtwork}
                alt={`Ilustracion oficial de ${pokemon.name}`}
                width={420}
                height={420}
                priority
                className={styles.heroImage}
              />
            </div>

            <div className={styles.infoPanel}>
              <div className={styles.headingBlock}>
                <span className={styles.badge}>#{pokemon.id.toString().padStart(3, "0")}</span>
                <h1 className={styles.name}>{formatDisplayName(pokemon.name)}</h1>
              </div>

              <div className={styles.typesRow}>
                {pokemon.types.map((item) => (
                  <span
                    key={item.slot}
                    className={styles.typePill}
                    style={{ backgroundColor: getTypeColor(item.type.name) }}
                  >
                    {formatDisplayName(item.type.name)}
                  </span>
                ))}
              </div>

              <div className={styles.infoGrid}>
                <div>
                  <p className={styles.infoLabel}>Altura</p>
                  <p className={styles.infoValue}>{(pokemon.height / 10).toFixed(1)} m</p>
                </div>
                <div>
                  <p className={styles.infoLabel}>Peso</p>
                  <p className={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)} kg</p>
                </div>
                <div className={styles.categoryBlock}>
                  <p className={styles.infoLabel}>Categoria</p>
                  <p className={styles.categoryValue}>{category}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <section className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>Base Stats</h2>
              <div className={styles.statsList}>
                {pokemon.stats.map((item) => (
                  <div key={item.stat.name} className={styles.statItem}>
                    <div className={styles.statHeader}>
                      <span className={styles.statName}>{getStatLabel(item.stat.name)}</span>
                      <span className={styles.statValue}>{item.base_stat}</span>
                    </div>
                    <div className={styles.statBarTrack}>
                      <div
                        className={styles.statBarFill}
                        style={{
                          width: getStatWidth(item.base_stat),
                          backgroundColor: getStatColor(item.stat.name),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.sideColumn}>
              <section className={styles.cardSection}>
                <h2 className={styles.sectionTitle}>Abilities</h2>
                <div className={styles.abilityList}>
                  {abilities.map((ability) => (
                    <article key={ability.name} className={styles.abilityCard}>
                      <p className={styles.abilityName}>
                        {formatDisplayName(ability.name)}
                        {ability.isHidden ? " (Hidden)" : ""}
                      </p>
                      <p className={styles.abilityDescription}>{ability.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <div className={styles.navigationRow}>
                {previousPokemon ? (
                  <Link href={`/pokemon/${previousPokemon.name}`} className={styles.navButtonDark}>
                    <span className={styles.navArrow}>←</span>
                    <span className={styles.navMeta}>
                      #{previousPokemon.id.toString().padStart(3, "0")} {formatDisplayName(previousPokemon.name)}
                    </span>
                  </Link>
                ) : (
                  <div className={`${styles.navButtonDark} ${styles.navButtonDisabled}`}>
                    <span className={styles.navArrow}>←</span>
                    <span className={styles.navMeta}>Sin anterior</span>
                  </div>
                )}

                {nextPokemon ? (
                  <Link href={`/pokemon/${nextPokemon.name}`} className={styles.navButtonAccent}>
                    <span className={styles.navArrow}>→</span>
                    <span className={styles.navMeta}>
                      #{nextPokemon.id.toString().padStart(3, "0")} {formatDisplayName(nextPokemon.name)}
                    </span>
                  </Link>
                ) : (
                  <div className={`${styles.navButtonAccent} ${styles.navButtonDisabled}`}>
                    <span className={styles.navArrow}>→</span>
                    <span className={styles.navMeta}>Sin siguiente</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get<PokemonListResponse>("pokemon", {
    params: { limit: HOME_POKEMON_LIMIT, offset: 0 },
  });

  return {
    paths: data.results.map((pokemon) => ({ params: { name: pokemon.name } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PokemonPageProps> = async ({ params }) => {
  const name = String(params?.name ?? "");

  const [{ data: pokemon }, { data: species }, { data: pokemonList }] = await Promise.all([
    api.get<Pokemon>(`pokemon/${name}`),
    api.get<PokemonSpecies>(`pokemon-species/${name}`),
    api.get<PokemonListResponse>("pokemon", {
      params: { limit: HOME_POKEMON_LIMIT, offset: 0 },
    }),
  ]);

  const abilityResponses = await Promise.allSettled(
    pokemon.abilities.map((item) => api.get<Ability>(`ability/${item.ability.name}`))
  );

  const abilities = pokemon.abilities.map((item, index) => {
    const response = abilityResponses[index];

    return {
      name: item.ability.name,
      isHidden: item.is_hidden,
      description:
        response.status === "fulfilled"
          ? getEnglishAbilityDescription(response.value.data)
          : DEFAULT_ABILITY_DESCRIPTION,
    };
  });

  const currentIndex = pokemonList.results.findIndex((item) => item.name === pokemon.name);
  const previousListItem = currentIndex > 0 ? pokemonList.results[currentIndex - 1] : null;
  const nextListItem =
    currentIndex >= 0 && currentIndex < pokemonList.results.length - 1
      ? pokemonList.results[currentIndex + 1]
      : null;

  return {
    props: {
      pokemon,
      category: getEnglishCategory(species),
      abilities,
      previousPokemon: previousListItem
        ? { id: currentIndex, name: previousListItem.name }
        : null,
      nextPokemon: nextListItem
        ? { id: currentIndex + 2, name: nextListItem.name }
        : null,
    },
    revalidate: 86400,
  };
};

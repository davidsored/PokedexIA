import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import { Press_Start_2P, Space_Mono } from "next/font/google";
import PokemonCard from "@/components/PokemonCard";
import api from "@/lib/axios";
import type { Pokemon, PokemonListResponse } from "@/types/pokemon";
import styles from "./index.module.css";

interface HomePokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  region: "kanto" | "johto";
}

interface HomeProps {
  pokemons: HomePokemon[];
}

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

const TYPE_PRIORITY = ["fire", "water", "grass", "electric", "poison", "psychic"];
const REGION_OPTIONS = ["all", "kanto", "johto"] as const;

type RegionFilter = (typeof REGION_OPTIONS)[number];

const TYPE_CLASS_NAMES: Record<string, string> = {
  bug: "typeBug",
  dragon: "typeDragon",
  electric: "typeElectric",
  fairy: "typeFairy",
  fighting: "typeFighting",
  fire: "typeFire",
  flying: "typeFlying",
  ghost: "typeGhost",
  grass: "typeGrass",
  ground: "typeGround",
  ice: "typeIce",
  normal: "typeNormal",
  poison: "typePoison",
  psychic: "typePsychic",
  rock: "typeRock",
  steel: "typeSteel",
  water: "typeWater",
};

function formatDisplayName(value: string) {
  return value.replace(/-/g, " ").toUpperCase();
}

function sortTypes(types: string[]) {
  return [...types].sort((left, right) => {
    const leftIndex = TYPE_PRIORITY.indexOf(left);
    const rightIndex = TYPE_PRIORITY.indexOf(right);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    }

    return left.localeCompare(right);
  });
}

function formatRegionLabel(region: RegionFilter) {
  if (region === "all") {
    return "ALL REGIONS";
  }

  return region.toUpperCase();
}

function getPokemonRegion(id: number): "kanto" | "johto" {
  return id <= 151 ? "kanto" : "johto";
}

export default function Home({ pokemons }: HomeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("all");

  const availableTypes = useMemo(() => {
    const uniqueTypes = new Set<string>();

    pokemons.forEach((pokemon) => {
      pokemon.types.forEach((type) => uniqueTypes.add(type));
    });

    return sortTypes(Array.from(uniqueTypes));
  }, [pokemons]);

  const filteredPokemons = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return pokemons.filter((pokemon) => {
      const matchesSearch =
        normalizedSearchTerm.length === 0 ||
        pokemon.name.toLowerCase().includes(normalizedSearchTerm) ||
        pokemon.id.toString().includes(normalizedSearchTerm);

      const matchesType =
        selectedType === "all" || pokemon.types.some((type) => type === selectedType);

      const matchesRegion =
        selectedRegion === "all" || pokemon.region === selectedRegion;

      return matchesSearch && matchesType && matchesRegion;
    });
  }, [pokemons, searchTerm, selectedRegion, selectedType]);

  return (
    <div className={`${styles.page} ${pressStart.variable} ${spaceMono.variable}`}>
      <nav className={styles.topBar}>
        <div className={styles.brandBlock}>
          <div className={styles.pokeball} aria-hidden="true">
            <span className={styles.pokeballTop} />
            <span className={styles.pokeballCenter} />
          </div>
          <h1 className={styles.brandTitle}>POKEDEX</h1>
        </div>
      </nav>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>DEX MASTER</h2>
          <p className={styles.sidebarVersion}>V1.0.8-BIT</p>
        </div>

        <div className={styles.regionSection}>
          <p className={styles.regionTitle}>REGIONS</p>
          <div className={styles.regionButtons}>
            {REGION_OPTIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`${styles.regionButton} ${
                  selectedRegion === region ? styles.regionButtonActive : ""
                }`}
              >
                {formatRegionLabel(region)}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <section className={styles.searchSection}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon} aria-hidden="true">
              &gt;
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="SEARCH BY NAME OR ID..."
              className={styles.searchInput}
              aria-label="Buscar Pokemon por nombre o ID"
            />
          </div>

          <div className={styles.filterRow}>
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`${styles.filterButton} ${
                selectedType === "all" ? styles.filterButtonActive : ""
              }`}
            >
              ALL
            </button>

            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`${styles.filterButton} ${styles[TYPE_CLASS_NAMES[type] ?? ""] ?? ""} ${
                  selectedType === type ? styles.filterButtonPressed : ""
                }`}
              >
                {formatDisplayName(type)}
              </button>
            ))}
          </div>

          <p className={styles.resultsCount}>
            MOSTRANDO {filteredPokemons.length} / {pokemons.length} POKEMON
          </p>
        </section>

        {filteredPokemons.length > 0 ? (
          <section className={styles.grid}>
            {filteredPokemons.map((pokemon) => (
              <PokemonCard key={pokemon.id} {...pokemon} />
            ))}
          </section>
        ) : (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>NO DATA FOUND</h2>
            <p className={styles.emptyText}>Prueba con otro nombre, ID o tipo.</p>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerCopy}>©1996-2026 NINTENDO / CREATURES / GAME FREAK</span>
        <div className={styles.footerLinks}>
          <span className={styles.footerLink}>START</span>
          <span className={styles.footerLink}>SELECT</span>
          <span className={styles.footerLink}>RESET</span>
        </div>
      </footer>
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const { data } = await api.get<PokemonListResponse>("pokemon", {
    params: { limit: 251, offset: 0 },
  });

  const pokemonResponses = await Promise.all(
    data.results.map((pokemon) => api.get<Pokemon>(`pokemon/${pokemon.name}`))
  );

  const pokemons = pokemonResponses.map(({ data: pokemon }) => ({
    id: pokemon.id,
    name: pokemon.name,
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
    types: pokemon.types.map((item) => item.type.name),
    region: getPokemonRegion(pokemon.id),
  }));

  return {
    props: { pokemons },
    revalidate: 86400,
  };
};

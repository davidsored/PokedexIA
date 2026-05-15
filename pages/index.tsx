import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import PokemonCard from "@/components/PokemonCard";
import api from "@/lib/axios";
import type { PokemonListResponse } from "@/types/pokemon";
import styles from "./index.module.css";

interface HomePokemon {
  id: number;
  name: string;
  image: string;
}

type ViewMode = "card" | "list";

interface HomeProps {
  pokemons: HomePokemon[];
}

export default function Home({ pokemons }: HomeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const containerClassName = useMemo(
    () => (viewMode === "card" ? styles.grid : styles.list),
    [viewMode]
  );

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pokédex Kanto</h1>
        <p className={styles.subtitle}>Explora los 151 Pokémon originales</p>
      </header>

      <section className={styles.controls} aria-label="Cambiar visualización">
        <button
          type="button"
          onClick={() => setViewMode("card")}
          className={`${styles.controlButton} ${
            viewMode === "card" ? styles.active : ""
          }`}
          aria-pressed={viewMode === "card"}
        >
          Modo Card
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={`${styles.controlButton} ${
            viewMode === "list" ? styles.active : ""
          }`}
          aria-pressed={viewMode === "list"}
        >
          Modo Lista
        </button>
      </section>

      <section className={containerClassName}>
        {pokemons.map((pokemon) => (
          <PokemonCard key={pokemon.id} {...pokemon} viewMode={viewMode} />
        ))}
      </section>
    </main>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const { data } = await api.get<PokemonListResponse>("pokemon", {
    params: { limit: 151, offset: 0 },
  });

  const pokemons = data.results.map((pokemon, index) => ({
    id: index + 1,
    name: pokemon.name,
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${index + 1}.png`,
  }));

  return {
    props: { pokemons },
    revalidate: 86400,
  };
};

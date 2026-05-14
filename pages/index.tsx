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

interface HomeProps {
  pokemons: HomePokemon[];
}

export default function Home({ pokemons }: HomeProps) {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Pokédex (Kanto 151)</h1>
      <section className={styles.grid}>
        {pokemons.map((pokemon) => (
          <PokemonCard key={pokemon.id} {...pokemon} />
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

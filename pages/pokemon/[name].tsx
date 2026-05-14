import Image from "next/image";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import api from "@/lib/axios";
import type { Pokemon, PokemonListResponse } from "@/types/pokemon";
import styles from "./[name].module.css";

interface PokemonPageProps {
  pokemon: Pokemon;
}

export default function PokemonDetailPage({ pokemon }: PokemonPageProps) {
  const officialArtwork =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "/file.svg";

  return (
    <main className={styles.container}>
      <Link href="/">← Volver</Link>
      <h1 className={styles.name}>{pokemon.name}</h1>
      <p className={styles.meta}>ID: #{pokemon.id.toString().padStart(3, "0")}</p>

      <Image src={officialArtwork} alt={pokemon.name} width={240} height={240} priority />

      <h2>Tipos</h2>
      <ul className={styles.list}>
        {pokemon.types.map((item) => (
          <li key={item.slot}>{item.type.name}</li>
        ))}
      </ul>

      <h2>Stats base</h2>
      <ul className={styles.list}>
        {pokemon.stats.map((item) => (
          <li key={item.stat.name}>
            {item.stat.name}: {item.base_stat}
          </li>
        ))}
      </ul>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get<PokemonListResponse>("pokemon", {
    params: { limit: 151, offset: 0 },
  });

  const paths = data.results.map((pokemon) => ({
    params: { name: pokemon.name },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PokemonPageProps> = async ({ params }) => {
  const name = String(params?.name);
  const { data } = await api.get<Pokemon>(`pokemon/${name}`);

  return {
    props: { pokemon: data },
    revalidate: 86400,
  };
};

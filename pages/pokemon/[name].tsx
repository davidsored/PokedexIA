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
      <Link href="/" className={styles.backLink}>
        Volver a la Pokedex
      </Link>

      <h1 className={styles.name}>{pokemon.name}</h1>
      <p className={styles.meta}>ID: #{pokemon.id.toString().padStart(3, "0")}</p>

      <Image src={officialArtwork} alt={pokemon.name} width={220} height={220} priority />

      <h2 className={styles.sectionTitle}>Tipos</h2>
      <ul className={styles.typeList}>
        {pokemon.types.map((item) => (
          <li key={item.slot} className={styles.typePill}>
            {item.type.name}
          </li>
        ))}
      </ul>

      <h2 className={styles.sectionTitle}>Estadisticas base</h2>
      <ul className={styles.simpleStatsList}>
        {pokemon.stats.map((item) => (
          <li key={item.stat.name}>
            <strong>{item.stat.name}:</strong> {item.base_stat}
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

  return {
    paths: data.results.map((pokemon) => ({ params: { name: pokemon.name } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PokemonPageProps> = async ({ params }) => {
  const name = String(params?.name ?? "");
  const { data } = await api.get<Pokemon>(`pokemon/${name}`);

  return {
    props: { pokemon: data },
    revalidate: 86400,
  };
};

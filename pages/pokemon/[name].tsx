import Image from "next/image";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import api from "@/lib/axios";
import type { Pokemon, PokemonListResponse } from "@/types/pokemon";
import styles from "./[name].module.css";

interface PokemonPageProps {
  pokemon: Pokemon;
}

const MAX_BASE_STAT = 255;

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

      <section className={styles.header}>
        <Image src={officialArtwork} alt={pokemon.name} width={220} height={220} priority />
        <div>
          <h1 className={styles.name}>{pokemon.name}</h1>
          <p className={styles.meta}>ID: #{pokemon.id.toString().padStart(3, "0")}</p>

          <h2 className={styles.sectionTitle}>Tipos</h2>
          <ul className={styles.typeList}>
            {pokemon.types.map((item) => (
              <li key={item.slot} className={styles.typePill}>
                {item.type.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Estadisticas base</h2>
        <ul className={styles.statsList}>
          {pokemon.stats.map((item) => {
            const percentage = Math.min((item.base_stat / MAX_BASE_STAT) * 100, 100);

            return (
              <li key={item.stat.name} className={styles.statItem}>
                <span className={styles.statName}>{item.stat.name}</span>
                <span className={styles.statValue}>{item.base_stat}</span>
                <div className={styles.statBarTrack}>
                  <div className={styles.statBarFill} style={{ width: `${percentage}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
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

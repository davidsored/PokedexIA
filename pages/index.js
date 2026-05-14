import Head from 'next/head';
import PokemonCard from '../components/PokemonCard';
import pokeApi from '../lib/axios';
import styles from '../styles/Home.module.css';

export default function Home({ pokemons }) {
  return (
    <>
      <Head>
        <title>Pokédex IA</title>
      </Head>

      <main className={styles.container}>
        <h1 className={styles.title}>Pokédex (Kanto 151)</h1>
        <section className={styles.grid}>
          {pokemons.map((pokemon) => (
            <PokemonCard key={pokemon.name} pokemon={pokemon} />
          ))}
        </section>
      </main>
    </>
  );
}

export async function getStaticProps() {
  // Listado base de los primeros 151 Pokémon.
  const { data } = await pokeApi.get('pokemon?limit=151&offset=0');

  const pokemons = data.results.map((pokemon, index) => ({
    id: index + 1,
    name: pokemon.name,
  }));

  return {
    props: {
      pokemons,
    },
    revalidate: 86400,
  };
}

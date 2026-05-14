import Head from 'next/head';
import pokeApi from '../../lib/axios';
import styles from '../../styles/PokemonDetail.module.css';

export default function PokemonDetail({ pokemon }) {
  const officialImage = pokemon.sprites.other['official-artwork'].front_default;

  return (
    <>
      <Head>
        <title>{pokemon.name} | Pokédex IA</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.card}>
          <img src={officialImage} alt={pokemon.name} className={styles.image} />
          <h1 className={styles.name}>{pokemon.name}</h1>
          <p className={styles.id}>#{String(pokemon.id).padStart(3, '0')}</p>

          <div className={styles.section}>
            <h2>Tipos</h2>
            <ul>
              {pokemon.types.map((typeItem) => (
                <li key={typeItem.type.name}>{typeItem.type.name}</li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h2>Estadísticas base</h2>
            <ul>
              {pokemon.stats.map((statItem) => (
                <li key={statItem.stat.name}>
                  {statItem.stat.name}: {statItem.base_stat}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  // Pre-render de las rutas dinámicas para los 151 Pokémon iniciales.
  const { data } = await pokeApi.get('pokemon?limit=151&offset=0');

  const paths = data.results.map((pokemon) => ({
    params: { name: pokemon.name },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  // Obtención detallada por nombre para la página individual.
  const { data } = await pokeApi.get(`pokemon/${params.name}`);

  return {
    props: {
      pokemon: data,
    },
    revalidate: 86400,
  };
}

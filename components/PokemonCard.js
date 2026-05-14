import Link from 'next/link';
import styles from '../styles/PokemonCard.module.css';

export default function PokemonCard({ pokemon }) {
  const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

  return (
    <Link href={`/pokemon/${pokemon.name}`} className={styles.card}>
      <img className={styles.image} src={image} alt={pokemon.name} loading="lazy" />
      <div className={styles.content}>
        <span className={styles.id}>#{String(pokemon.id).padStart(3, '0')}</span>
        <h2 className={styles.name}>{pokemon.name}</h2>
      </div>
    </Link>
  );
}

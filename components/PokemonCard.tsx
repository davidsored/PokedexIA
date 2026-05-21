import Image from "next/image";
import Link from "next/link";
import styles from "./PokemonCard.module.css";

interface PokemonCardProps {
  id: number;
  name: string;
  image: string;
  types: string[];
}

const TYPE_COLORS: Record<string, { background: string; color: string }> = {
  bug: { background: "#a8b820", color: "#ffffff" },
  dragon: { background: "#7038f8", color: "#ffffff" },
  electric: { background: "#ffcc33", color: "#111111" },
  fairy: { background: "#ee99ac", color: "#111111" },
  fighting: { background: "#c03028", color: "#ffffff" },
  fire: { background: "#ff4422", color: "#ffffff" },
  flying: { background: "#7d8cff", color: "#ffffff" },
  ghost: { background: "#705898", color: "#ffffff" },
  grass: { background: "#77cc55", color: "#111111" },
  ground: { background: "#d4b15d", color: "#111111" },
  ice: { background: "#98d8d8", color: "#111111" },
  normal: { background: "#c4c4a4", color: "#111111" },
  poison: { background: "#aa5599", color: "#ffffff" },
  psychic: { background: "#ff5599", color: "#ffffff" },
  rock: { background: "#b8a038", color: "#111111" },
  steel: { background: "#b8b8d0", color: "#111111" },
  water: { background: "#3399ff", color: "#ffffff" },
};

function formatDisplayName(value: string) {
  return value.replace(/-/g, " ").toUpperCase();
}

function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? { background: "#5768e6", color: "#ffffff" };
}

export default function PokemonCard({ id, name, image, types }: PokemonCardProps) {
  return (
    <Link href={`/pokemon/${name}`} className={styles.card}>
      <div className={styles.topBar}>
        <span className={styles.id}>#{id.toString().padStart(3, "0")}</span>
        <span className={styles.favorite} aria-hidden="true">
          *
        </span>
      </div>

      <div className={styles.imagePanel}>
        <Image
          src={image}
          alt={`Sprite de ${name}`}
          width={160}
          height={160}
          className={styles.image}
          priority={id <= 12}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{formatDisplayName(name)}</h3>
        <div className={styles.typesRow}>
          {types.map((type) => {
            const palette = getTypeColor(type);

            return (
              <span
                key={type}
                className={styles.typeBadge}
                style={{ backgroundColor: palette.background, color: palette.color }}
              >
                {formatDisplayName(type)}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

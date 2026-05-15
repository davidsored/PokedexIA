import Image from "next/image";
import Link from "next/link";
import styles from "./PokemonCard.module.css";

interface PokemonCardProps {
  id: number;
  name: string;
  image: string;
  viewMode?: "card" | "list";
}

export default function PokemonCard({
  id,
  name,
  image,
  viewMode = "card",
}: PokemonCardProps) {
  return (
    <Link
      href={`/pokemon/${name}`}
      className={`${styles.card} ${viewMode === "list" ? styles.listItem : ""}`}
    >
      <Image
        src={image}
        alt={`Ilustración oficial de ${name}`}
        width={120}
        height={120}
        className={styles.image}
        priority={id <= 12}
      />
      <div className={styles.content}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.id}>#{id.toString().padStart(3, "0")}</p>
      </div>
    </Link>
  );
}

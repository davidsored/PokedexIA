import Image from "next/image";
import Link from "next/link";

interface PokemonCardProps {
  id: number;
  name: string;
  image: string;
}

export default function PokemonCard({ id, name, image }: PokemonCardProps) {
  const articleId = `pokemon-card-${id}`;

  return (
    <Link
      href={`/pokemon/${name}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
      aria-labelledby={articleId}
    >
      <article className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-32 w-32">
          <Image
            src={image}
            alt={`Ilustración oficial de ${name}`}
            fill
            sizes="(max-width: 768px) 50vw, 160px"
            className="object-contain"
            priority={id <= 12}
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">#{id.toString().padStart(3, "0")}</p>
        <h2 id={articleId} className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{name}</h2>
      </article>
    </Link>
  );
}

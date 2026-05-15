import Image from "next/image";
import Link from "next/link";

interface PokemonListRowProps {
  id: number;
  name: string;
  image: string;
}

export default function PokemonListRow({ id, name, image }: PokemonListRowProps) {
  const articleId = `pokemon-row-${id}`;

  return (
    <Link
      href={`/pokemon/${name}`}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      aria-labelledby={articleId}
    >
      <div className="relative h-16 w-16 flex-shrink-0">
        <Image src={image} alt={`Ilustración oficial de ${name}`} fill sizes="64px" className="object-contain" priority={id <= 12} />
      </div>
      <article className="flex w-full items-center justify-between gap-4 text-left">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">#{id.toString().padStart(3, "0")}</p>
          <h2 id={articleId} className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{name}</h2>
        </div>
        <span className="hidden text-sm font-medium text-red-500 sm:inline">Ver detalle</span>
      </article>
    </Link>
  );
}

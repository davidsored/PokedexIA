import { useMemo, useState } from "react";
import Head from "next/head";
import type { GetStaticProps } from "next";
import PokemonCard from "@/components/PokemonCard";
import PokemonListRow from "@/components/PokemonListRow";
import api from "@/lib/axios";
import type { PokemonListResponse } from "@/types/pokemon";

interface HomePokemon { id: number; name: string; image: string }
type ViewMode = "card" | "list";
interface HomeProps { pokemons: HomePokemon[] }

export default function Home({ pokemons }: HomeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPokemons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return pokemons;
    return pokemons.filter((pokemon) => pokemon.name.toLowerCase().includes(term));
  }, [pokemons, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-sky-50 pb-16">
      <Head>
        <title>Pokédex Kanto</title>
      </Head>

      <header className="bg-red-500 py-10 text-center text-white shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-wide">Pokédex Kanto</h1>
        <p className="mt-2 text-lg font-medium">Explora los 151 Pokémon originales</p>
      </header>

      <main className="mx-auto mt-12 max-w-6xl px-4">
        <section className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between" aria-label="Controles de visualización y búsqueda">
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="pokemon-search" className="sr-only">Buscar Pokémon por nombre</label>
            <input id="pokemon-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar Pokémon por nombre" className="w-full rounded-full border border-red-200 bg-white px-5 py-3 text-sm text-zinc-700 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-red-800 dark:bg-zinc-900 dark:text-zinc-100" />
          </div>

          <div className="flex justify-end sm:justify-start">
            <div className="inline-flex rounded-full border border-red-200 bg-white p-1 shadow-sm dark:border-red-800 dark:bg-zinc-900" role="group" aria-label="Modo de vista">
              {(["card", "list"] as ViewMode[]).map((mode) => {
                const active = viewMode === mode;
                return (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-pressed={active} className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${active ? "bg-red-500 text-white shadow" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"}`}>
                    {mode === "card" ? "Modo Card" : "Modo Lista"}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {filteredPokemons.length === 0 ? (
          <p className="rounded-3xl bg-white/80 p-8 text-center text-sm font-medium text-red-500 shadow-sm backdrop-blur dark:bg-zinc-900/80 dark:text-red-200">No se encontraron Pokémon para tu búsqueda.</p>
        ) : viewMode === "card" ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPokemons.map((pokemon) => <PokemonCard key={pokemon.id} {...pokemon} />)}
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            {filteredPokemons.map((pokemon) => <PokemonListRow key={pokemon.id} {...pokemon} />)}
          </section>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const { data } = await api.get<PokemonListResponse>("pokemon", { params: { limit: 151, offset: 0 } });
  const pokemons = data.results.map((pokemon, index) => ({ id: index + 1, name: pokemon.name, image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${index + 1}.png` }));
  return { props: { pokemons }, revalidate: 86400 };
};

import Link from "next/link";

import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { ProductTable } from "./_components/produt-table";
import { IngredientTable } from "./_components/ingredient-table";

export default async function Home() {
  // const hello = await api.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.product.getLatest.prefetch();
        void api.ingredient.getAllIngredients.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <Link
        href={"/ingredients"}
        className="mt-2 max-w-xs rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
      >
        Criar Ingredients
      </Link>
      <Link
        href={"/racoes"}
        className="mt-2 max-w-xs rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
      >
        Criar Racoes
      </Link>
      <Link
        href={"/print-pdf"}
        className="mt-2 max-w-xs rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
      >
        Imprimir Formulacoes
      </Link>
      <div className="mx-5 flex flex-row flex-wrap justify-around">
        <ProductTable />
        <IngredientTable />
      </div>
      </main>
    </HydrateClient>
  );
}

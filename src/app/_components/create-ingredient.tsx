"use client";

// import { useRouter } from "next/router";
import { useState } from "react";
// import {trpc} from '../api/trpc/[trpc]'
import { api } from "@/trpc/react";

export function CreateIngredient() {
  // const router = useRouter();
  const [name, setName] = useState("");
  const [costPerKg, setCostPerKg] = useState("");

  const createIngredient = api.ingredient.createIngredient.useMutation({
    onSuccess: () => {
      // router.reload();  // Note: 'reload' is used instead of 'refresh' in newer Next.js versions
      setName("");
      setCostPerKg("");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createIngredient.mutate({ name, costPerKg: parseFloat(costPerKg) });
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="text"
        placeholder="Ingrediente"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full  px-4 py-2 text-black mt-1 rounded-sm bg-gray-300"
      />
      <input
        type="number"
        placeholder="Custo por Kg"
        value={costPerKg}
        onChange={(e) => setCostPerKg(e.target.value)}
        className="w-full  px-4 py-2 text-black mt-1 rounded-sm bg-gray-300"
      />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        disabled={createIngredient.isPending}
      >
        {createIngredient.isPending ? "Submitting..." : "Salvar"}
      </button>
    </form>
  );
}

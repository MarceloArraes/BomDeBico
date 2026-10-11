"use client";

// import { useRouter } from "next/router";
import { useState } from "react";
// import {trpc} from '../api/trpc/[trpc]'
import { toast } from "sonner";
import { api } from "@/trpc/react";

export function CreateIngredient() {
  // const router = useRouter();
  const [name, setName] = useState("");
  const [costPerKg, setCostPerKg] = useState("");

  const utils = api.useUtils();

  const createIngredient = api.ingredient.createIngredient.useMutation({
    onSuccess: async () => {
      setName("");
      setCostPerKg("");
      toast.success("Ingrediente salvo com sucesso!");
      await Promise.all([
        utils.ingredient.getAllIngredients.invalidate(),
        utils.product.getAllProducts.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível salvar o ingrediente.");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsedCost = parseFloat(costPerKg);
        if (!name.trim()) {
          toast.error("Informe o nome do ingrediente.");
          return;
        }
        if (!Number.isFinite(parsedCost) || parsedCost < 0) {
          toast.error("Informe um custo por Kg válido.");
          return;
        }
        createIngredient.mutate({ name: name.trim(), costPerKg: parsedCost });
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

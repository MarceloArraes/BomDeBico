"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { SelectIngredients } from "./select-ingredients";


interface ProductIngredient {
  productId?: number; // productId is now optional
  ingredientId: number;
  quantity: number;
}

interface ExtendedProduct {
  id?: number;
  ingredients: ProductIngredient[];
}

export function CreateProduct() {
  // const router = useRouter();
  const [name, setName] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<ExtendedProduct | undefined| null>()

  // const listOfIngredients = api.ingredient.getAllIngredients.useQuery();

  const utils = api.useUtils();

  const createProduct= api.product.createProduct.useMutation({
    onSuccess: async () => {
      setName("");
      setSellPrice("");
      setSelectedIngredients(null);
      toast.success("Ração salva com sucesso!");
      await Promise.all([
        utils.product.getAllProducts.invalidate(),
        utils.product.getLatest.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível salvar a ração.");
    },
  });

  const prepareIngredientsForSubmission = () => {
    if (!selectedIngredients) {
      return [];
    }
    return selectedIngredients?.ingredients?.map((ingredient) => ({
      ingredientId: ingredient.ingredientId,
      quantity: ingredient.quantity
    }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const preparedIngredients = prepareIngredientsForSubmission();
        const parsedSellPrice = parseFloat(sellPrice);
        if (!name.trim()) {
          toast.error("Informe o nome do produto.");
          return;
        }
        if (!Number.isFinite(parsedSellPrice) || parsedSellPrice < 0) {
          toast.error("Informe um valor de venda por Kg válido.");
          return;
        }
        if (preparedIngredients.length === 0) {
          toast.error("Selecione ao menos um ingrediente.");
          return;
        }
        createProduct.mutate({ name: name.trim(), sellPricePerKg: parsedSellPrice, ingredients: preparedIngredients });
      }}
      className="flex flex-col justify-center items-center gap-2 mt-4"
    >
      <input
        type="text"
        placeholder="Nome do Produto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full  px-4 py-2 text-black mt-1 rounded-sm bg-gray-300"
      />
      <input
        type="number"
        placeholder="Valor de venda por Kg"
        value={sellPrice}
        onChange={(e) => setSellPrice(e.target.value)}
        className="w-full  px-4 py-2 text-black mt-1 rounded-sm bg-gray-300"
      />  

      <SelectIngredients 
            listOfIngredientsOnProduct={selectedIngredients?.ingredients}
             setLocalProductIngredient={setSelectedIngredients}
        />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        disabled={createProduct.isPending}
      >
        {createProduct.isPending ? "Submitting..." : "Salvar"}
      </button>
    </form>
  );
}

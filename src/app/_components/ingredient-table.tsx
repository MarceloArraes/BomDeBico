"use client";

import type { Ingredient } from "@prisma/client";
import { useEffect, type ChangeEvent, useState} from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";

export const IngredientTable = () => {
    const [localIngredients, setLocalIngredients] = useState<Ingredient[]>([])

    const {data, refetch} =  api.ingredient.getAllIngredients.useQuery();
    const utils = api.useUtils();

    const mutationDeleteIngredient = api.ingredient.deleteIngredient.useMutation({
        onSuccess: async() => {
            await Promise.all([
              utils.ingredient.getAllIngredients.invalidate(),
              utils.product.getAllProducts.invalidate(),
            ]);
          },
        onError: (error) => {
            toast.error(error.message || "Não foi possível remover o ingrediente.");
            void refetch();
          },
    })
          
    const mutationUpdateIngredient = api.ingredient.updateIngredient.useMutation({
        onSuccess: async() => {
            toast.success("Custo atualizado!");
            await Promise.all([
              utils.ingredient.getAllIngredients.invalidate(),
              utils.product.getAllProducts.invalidate(),
            ]);
          },
        onError: (error) => {
            toast.error(error.message || "Não foi possível atualizar o custo.");
            void refetch();
          },
    })

    useEffect(() => {
      if(data){
        setLocalIngredients(data)
      }
    
    }, [data, setLocalIngredients])


    
    const handleChangeCost = (e: ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        const ingredientId = Number(e.target.dataset.ingredientid)
        setLocalIngredients((prev: Ingredient[]) => {
            const newArray: Ingredient[] = [...prev];
            const elementIndex = newArray.findIndex(ingredient => ingredient.id == ingredientId);
          
            if (elementIndex !== -1) {
              newArray[elementIndex] = {id:ingredientId,
                 costPerKg: value, 
                 name: data?.find((ingredient:Ingredient) => ingredient.id == ingredientId)?.name} as Ingredient;
            }
          
            return newArray;
          });
    }

    const commitCost = (e: ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        const ingredientId = Number(e.target.dataset.ingredientid);
        const current = data?.find((ingredient: Ingredient) => ingredient.id == ingredientId);
        if (!Number.isFinite(value) || value < 0) {
            toast.error("Informe um custo por Kg válido.");
            void refetch();
            return;
        }
        if (value === current?.costPerKg) return;
        mutationUpdateIngredient.mutate({ id: ingredientId, costPerKg: value, name: current?.name });
    }

    const deleteRow =  (id: number) => {
        const ingredient = localIngredients.find((item) => item.id === id);
        if (!ingredient) return;
        if (!window.confirm(`Remover "${ingredient.name}"? Você poderá desfazer em seguida.`)) {
            return;
        }

        setLocalIngredients((prev: Ingredient[]) => prev.filter((item) => item.id !== id));

        let undone = false;
        let committed = false;
        const commit = () => {
            if (undone || committed) return;
            committed = true;
            mutationDeleteIngredient.mutate({ id });
        };

        toast("Ingrediente removido", {
            description: ingredient.name,
            duration: 6000,
            action: {
                label: "Desfazer",
                onClick: () => {
                    undone = true;
                    toast.success("Remoção desfeita.");
                    void refetch();
                },
            },
            onAutoClose: commit,
            onDismiss: commit,
        });
    } 
    
    return (
<table className="bg-white shadow-md text-black m-1 sm:m-10" >
    <thead className="bg-gray-200">
        <tr >
            <th className="px-2 border">Ingrediente</th>
            <th className="px-2 border">Valor por Kg</th>
            <th className="px-2 border">Delete</th>
        </tr>
    </thead>
    <tbody>
        {localIngredients?.map((ingredient: Ingredient) => {
            return (
                <tr key={ingredient.id} className="border-b justify-center items-center">
                    <td className="px-2 border sm:whitespace-nowrap">{ingredient.name}</td>
                    <td className="px-2 w-20">
                        <div className="flex-row flex flex-1">$<input className="w-full" name="costPerKg" data-ingredientid={ingredient.id} type="number" value={ingredient.costPerKg ?? 0} onChange={handleChangeCost} onBlur={commitCost} />
                        </div>
                    </td>
                    <td className="px-2 border items-center justify-center">
                        <button 
                            type="button"
                            aria-label={`Remover ${ingredient.name}`}
                            className="text-white bg-red-500 hover:bg-red-700 font-bold py-1 px-3 rounded"
                            onClick={() => deleteRow(ingredient.id)}
                        >
                            X
                        </button>
                    </td>
                </tr>
            )
        })}
    </tbody>
</table>
)}
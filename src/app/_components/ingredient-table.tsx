"use client";

import type { Ingredient } from "@prisma/client";
import { useEffect, type ChangeEvent, useState} from "react";
import { api } from "@/trpc/react";

export const IngredientTable = () => {
    const [localIngredients, setLocalIngredients] = useState<Ingredient[]>([])

    const {data, refetch} =  api.ingredient.getAllIngredients.useQuery();
    const mutationDeleteIngredient = api.ingredient.deleteIngredient.useMutation({
        onSuccess: async() => {
            await refetch();
          }
    })
          
    const mutationUpdateIngredient = api.ingredient.updateIngredient.useMutation({
        onSuccess: async() => {
            await refetch();
          }
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
          mutationUpdateIngredient.mutate({id:ingredientId, costPerKg: value, name: data?.find((ingredient:Ingredient) => ingredient.id == ingredientId)?.name})
    }
    const deleteRow =  (id: number) => {
        // array.splice(index, 1); 
        setLocalIngredients((prev: Ingredient[]) => {
            const newArray: Ingredient[] = [...prev];
            const elementIndex = newArray.findIndex(ingredient => ingredient.id == id);
          
            if (elementIndex !== -1) {
              newArray.splice(elementIndex, 1); 
            }
          
            return newArray;
          });

        mutationDeleteIngredient.mutate({id:id})
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
                        <div className="flex-row flex flex-1">$<input className="w-full" name="costPerKg" data-ingredientid={ingredient.id} type="number" value={ingredient.costPerKg ?? 0} onChange={handleChangeCost} />
                        </div>
                    </td>
                    <td className="px-2 border items-center justify-center">
                        <button 
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
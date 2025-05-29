"use client"

import { api } from "@/trpc/react";
import type { Ingredient } from "@prisma/client";
import type {ChangeEvent, Dispatch, SetStateAction} from "react";


interface SelectIngredientsProps2 {
  listOfIngredientsOnProduct: ProductIngredient[] | undefined;
  setLocalProductIngredient: Dispatch<SetStateAction<ExtendedProduct | null | undefined>>;
}

interface ProductIngredient {
  productId?: number; // productId is now optional
  ingredientId: number;
  quantity: number;
}


export interface ExtendedProduct {
  id?: number;
  name?: string;
  sellPricePerKg?: number;
  costPerKg?: number;
  batchSize?: number;
  isArchived?: boolean;
  ingredients: ProductIngredient[];
}

export const SelectIngredients: React.FC<SelectIngredientsProps2> = ({listOfIngredientsOnProduct, setLocalProductIngredient}) => {
  const {data} = api.ingredient.getAllIngredients.useQuery();
  
  const handleIngredientsInProduct = (e: ChangeEvent<HTMLInputElement>) => {
    const ingredientId = parseInt(e.target.dataset.ingredientid??'');
    if (isNaN(ingredientId)) return;
    const isCheckbox = e.target.type === 'checkbox';

    setLocalProductIngredient(prevState => {
        // If prevState is null, return null
        console.log('prevState ', prevState);
        if (!prevState) {
          if (isCheckbox) {
                return {
                  ingredients: [{ ingredientId, quantity: 0}]
              };
          }
          return null;
        }

        // Handle checkbox change
        if (isCheckbox) {
          const ingredientExists = prevState?.ingredients?.some(ingredient => ingredient.ingredientId === ingredientId);

            return {
                ...prevState,
                ingredients: ingredientExists
                    ? prevState?.ingredients?.filter(ingredient => ingredient.ingredientId !== ingredientId)
                    : [...prevState?.ingredients, { ingredientId, quantity: 0, productId: prevState?.id }]
            };
        }

        // Handle quantity change for existing ingredient
        const quantity = parseFloat(e.target.value) || 0;
        return {
            ...prevState,
            ingredients: prevState?.ingredients?.map(ingredient =>
                ingredient.ingredientId === ingredientId ? { ...ingredient, quantity } : ingredient
            )
        };
    });
};

const selectedIngredients = data?.filter((ingredient:Ingredient) =>
  listOfIngredientsOnProduct?.some(productIngredient => productIngredient.ingredientId === ingredient.id)
) ?? [];

const unselectedIngredients = data?.filter((ingredient:Ingredient) =>
  !listOfIngredientsOnProduct?.some(productIngredient => productIngredient.ingredientId === ingredient.id)
) ?? [];

const sortedIngredients = [...selectedIngredients, ...unselectedIngredients];

    return (
    <div className="max-w-4xl mx-auto p-2 columns-2 sm:columns-3 lg:columns-4 gap-x-4 overflow-y-auto max-h-96"> 
        {sortedIngredients?.map((ingredient) => {
          const isSelected = listOfIngredientsOnProduct?.map((ingredient)=>ingredient.ingredientId).includes(ingredient.id);
          return (
              <div 
                key={ingredient.id} 
                className={`break-inside-avoid-column mb-2 p-2 rounded-md shadow-sm transition-all duration-200 ease-in-out 
                            ${isSelected ? 'bg-gray-300 border border-gray-500' : 'bg-white border border-gray-200'}
                            text-gray-900 flex flex-col`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ingredientId"
                    data-ingredientid={ingredient.id}
                    checked={isSelected??false}
                    onChange={handleIngredientsInProduct}
                    className="form-checkbox h-4 w-4 text-gray-600 rounded focus:ring-gray-500"
                  />
                  <label className="ml-2 text-sm font-medium flex-grow">{ingredient.name}</label>
                </div>
                {isSelected && (
                  <div className="flex items-center mt-1">
                    <span className="text-gray-600 text-xs mr-1">Qtd:</span>
                    <input
                      type="number"
                      name="ingredientQuantity"
                      data-ingredientid={ingredient.id}
                      step="0.01"
                      placeholder="Qtd"
                      value={listOfIngredientsOnProduct?.find(productIngredient => productIngredient.ingredientId === ingredient.id)?.quantity.toString() ?? ""}
                      onChange={handleIngredientsInProduct}
                      className="w-full p-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 text-gray-900 bg-gray-50"
                    />
                  </div>
                )}
              </div>
      )})}
    </div>)
}

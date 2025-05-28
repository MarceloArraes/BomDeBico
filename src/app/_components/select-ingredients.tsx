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
        const quantity = parseInt(e.target.value, 10) || 0;
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
    <div className="flex flex-col sm:max-h-[48rem] lg:max-h-96 flex-wrap columns-2 "> 
        {sortedIngredients?.map((ingredient) => {
          const isSelected = listOfIngredientsOnProduct?.map((ingredient)=>ingredient.ingredientId).includes(ingredient.id);
          return (
              <div key={ingredient.id} className="items-start gap-2 flex-col flex min-w-fit flex-nowrap">
                <div className="flex flex-row" >
                <input
                  type="checkbox"
                  name="ingredientId"
                  data-ingredientid={ingredient.id}
                  checked={isSelected??false}
                  onChange={handleIngredientsInProduct}
                  
                />
                <label>{ingredient.name}</label>
                </div>
                {isSelected && (

                  <input
                    type="number"
                    name="ingredientQuantity"
                    data-ingredientid={ingredient.id}
                    placeholder="Quantity"
                    value={listOfIngredientsOnProduct?.find(productIngredient => productIngredient.ingredientId === ingredient.id)?.quantity.toString() ?? ""}
                    onChange={handleIngredientsInProduct}
                    className="flex max-w-[80%] rounded-md px-2 py-1 text-black"
                  />
                )}
              </div>
      )})}
    </div>)
}
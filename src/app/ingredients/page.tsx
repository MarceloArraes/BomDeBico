import { auth } from "@/server/auth";
import { CreateIngredient } from "../_components/create-ingredient";
import {IngredientTable} from "../_components/ingredient-table";
import { api } from "@/trpc/server";

const Ingredients = async() => {
      const session = await auth();
        if (session?.user) {
            void api.product.getLatest.prefetch();
        void api.ingredient.getAllIngredients.prefetch();
          }
    return (
        <main className="flex min-h-screen flex-col bg-gradient-to-b items-center justify-start from-[#2e026d] to-[#15162c] text-white">
            <div className="max-w-sm">
            <CreateIngredient />
            </div>
            <div className="max-w-lg">
            <IngredientTable />
            

            </div>
            
        </main>
      );
}
export default Ingredients


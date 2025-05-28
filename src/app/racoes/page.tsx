import { api } from "@/trpc/server";
import { CreateProduct } from "../_components/create-product";
import { auth } from "@/server/auth";

const Racoes = async() => {
      const session = await auth();
    if (session?.user) {
        void api.product.getLatest.prefetch();
        void api.ingredient.getAllIngredients.prefetch();
      }
  

  if (!session?.user) return null;
    return (
        <main className="flex flex-1 min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
            <div className="justify-center flex  ">
            <CreateProduct />

            </div>
            <div className="max-w-lg">
            {/* <ProductTable /> */}
            

            </div>
            
        </main>
      );
}
export default Racoes

//outline-2 outline-red-500 outline-double
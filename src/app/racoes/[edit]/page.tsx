import { EditProduct } from "@/app/_components/edit-product";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

// type Props = {
//   params: { edit: string };
//   // include this—even if you're not going to read it
//   searchParams: Record<string, string | string[] | undefined>;
// };

const RacaoDetails = async ({
  params,
}: {
  params: Promise<{ edit: string }>
})=> {
      const session = await auth();
      const { edit } = await params
    if (session?.user) {
        void api.product.getLatest.prefetch();
        void api.ingredient.getAllIngredients.prefetch();
      }
  
    if (!session?.user) return null;
  


  // { params: { edit: '1' }, searchParams: {} }
    return (
        <main 
        className="flex min-h-screen flex-col bg-gradient-to-b items-center justify-start
         from-[#2e026d] to-[#15162c] text-white"
         >
            <div className="max-w-full">
            <EditProduct productId={edit}/>

            </div>
            <div className="max-w-lg">
            

            </div>
            
        </main>
      );
}
export default RacaoDetails


"use client";

import type { Product } from "@prisma/client";
import Link from "next/link";
import { api } from "@/trpc/react";

export const ProductTable = () => {

    const {data, refetch} =  api.product.getAllProducts.useQuery();
    const mutationDeleteProduct = api.product.deleteProduct.useMutation({
        onSuccess: async() => {
            await refetch();
          }
    })

    const deleteRow =  (id: number) => {
        mutationDeleteProduct.mutate({id:id})
    } 

    return (
        <>
        {/* <App/> */}
    <table className="bg-white shadow-md text-black m-10 h-fit">
        
        <thead className="bg-gray-200">
            <tr>
                <th className="px-2 border w-48">Produto</th>
                <th className="px-2 border">Custo por Kg</th>
                <th className="px-2 border">Preco por Kg</th>
                <th className="px-2 border">Margem (preco de venda/custo)</th>
                <th className="px-2 border">Delete</th>
            </tr>
        </thead>
    <tbody>
        {data?.map((product: Product) => {
            return (
                <tr key={product.id} className="border-b justify-center items-center">
                    <td className="px-2 border hover:font-bold"><Link href={`/racoes/${product.id}`}>{product.name}</Link></td>
                    <td className="px-2 border w-20">${product.costPerKg?.toFixed(2)}</td>
                    <td className="px-2 border w-20">${product.sellPricePerKg?.toFixed(2)}</td>
                    <td className="px-2 border w-20">{(100*((product.sellPricePerKg / product.costPerKg)-1 )).toFixed(2)}%</td>
                    <td className="px-2 border items-center justify-center">
                        <button 
                            className="text-white bg-red-500 hover:bg-red-700 font-bold py-1 px-3 rounded"
                            onClick={() => deleteRow(product.id)}
                        >
                            X
                        </button>
                    </td>
                </tr>
            )
        })}
    </tbody>
</table>
</>

)}


// const App = () => (
//     <PDFViewer>
//       <MyDocument />
//     </PDFViewer>
//   );
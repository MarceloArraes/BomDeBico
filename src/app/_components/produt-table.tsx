"use client";

import type { Product } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";

export const ProductTable = () => {
    const [localProducts, setLocalProducts] = useState<Product[]>([]);

    const {data, refetch} =  api.product.getAllProducts.useQuery();
    const utils = api.useUtils();

    const mutationDeleteProduct = api.product.deleteProduct.useMutation({
        onSuccess: async() => {
            await Promise.all([
              utils.product.getAllProducts.invalidate(),
              utils.product.getLatest.invalidate(),
            ]);
          },
        onError: (error) => {
            toast.error(error.message || "Não foi possível remover o produto.");
            void refetch();
          },
    })

    useEffect(() => {
        if (data) {
            setLocalProducts(data);
        }
    }, [data]);

    const deleteRow =  (id: number) => {
        const product = localProducts.find((item) => item.id === id);
        if (!product) return;
        if (!window.confirm(`Remover "${product.name}"? Você poderá desfazer em seguida.`)) {
            return;
        }

        setLocalProducts((prev) => prev.filter((item) => item.id !== id));

        let undone = false;
        let committed = false;
        const commit = () => {
            if (undone || committed) return;
            committed = true;
            mutationDeleteProduct.mutate({ id });
        };

        toast("Produto removido", {
            description: product.name,
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
        {localProducts?.map((product: Product) => {
            const margin = product.costPerKg > 0
                ? `${(100 * ((product.sellPricePerKg / product.costPerKg) - 1)).toFixed(2)}%`
                : "—";
            return (
                <tr key={product.id} className="border-b justify-center items-center">
                    <td className="px-2 border hover:font-bold"><Link href={`/racoes/${product.id}`}>{product.name}</Link></td>
                    <td className="px-2 border w-20">${product.costPerKg?.toFixed(2)}</td>
                    <td className="px-2 border w-20">${product.sellPricePerKg?.toFixed(2)}</td>
                    <td className="px-2 border w-20">{margin}</td>
                    <td className="px-2 border items-center justify-center">
                        <button 
                            type="button"
                            aria-label={`Remover ${product.name}`}
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
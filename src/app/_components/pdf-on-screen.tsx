"use client";
import { api } from "@/trpc/react";
import { MyDocument } from "./pdf-generator";
import { PDFViewer } from "@react-pdf/renderer";

const PdfOnScreen = () => {
  const { data: products, isLoading } = api.product.getAllProducts.useSuspenseQuery();
  // const [latestPost] = api.getLatest.useSuspenseQuery();
  console.log('products', products);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!products) {
    return <div>No products found</div>;
  }

  return (
    <PDFViewer height={600} width={550}>
      <MyDocument products={products} />
    </PDFViewer>
  );
};

export default PdfOnScreen;

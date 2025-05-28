"use client";
import type { Ingredient, Product, ProductIngredient } from "@prisma/client";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
// import { api } from '~/trpc/react';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 10,
  },
  productTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  table: {
    // display: 'table',
    width: "auto",
    borderWidth: 1,
    borderStyle: "solid",
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
  },
  // Additional styles for headers, etc.
});

interface ProductIngredientExtended extends ProductIngredient {
  ingredient: Ingredient;
}

interface ProductExtended extends Product {
  ingredients: ProductIngredientExtended[];
}

// Example Document Component (you need to fetch products data and pass it here)
export const MyDocument = ({ products }: { products: ProductExtended[] }) => {
  console.log("products ", products);
  if (!products || products.length < 1) return null;
  return (
    <Document pageLayout="singlePage" pageMode="useOutlines">
      {products?.map((product) => (
        <Page key={product.id} size="A4" style={styles.page}>
          <Text style={styles.productTitle}>{product.name}</Text>
          <View style={styles.table}>
            {/* Table headers */}
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text>Name</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Quantity</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Cost Per Kg</Text>
              </View>
            </View>
            {/* Table rows for ingredients */}
            {product?.ingredients?.map((ingredient, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text>{ingredient?.ingredient?.name}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{ingredient?.quantity}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{ingredient?.ingredient.costPerKg}</Text>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
};

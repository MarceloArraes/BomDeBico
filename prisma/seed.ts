import {db } from '../src/server/db'
import { ingredients, productFormulas, products } from './listsAndFormulas';

async function main() {
  for (const ingredient of ingredients) {
    await db.ingredient.create({
      data: {
        name: ingredient.name,
        costPerKg: ingredient.costPerKg,
      },
    });
  }
  for (const product of products) {
    await db.product.create({
      data: {
        name: product.name,
        sellPricePerKg: product.sellPricePerKg,
        costPerKg: product.costPerKg,
      },
    });
  }
  for (const [name, ingredients] of Object.entries(productFormulas)) {
    try {
        const product = await db.product.findFirst({ where: { name } });
        console.log(`Processing product: ${name}`);
        if (!product) {
            console.log(`Product not found: ${name}`);
            continue;
        }

        for (const ingredient of ingredients) {
            const dbIngredient = await db.ingredient.findFirst({ where: { name: ingredient.name } });
            if (!dbIngredient) {
                console.log(`Ingredient not found: ${ingredient.name}`);
                continue;
            }

            const result = await db.productIngredient.create({
                data: {
                    productId: product.id,
                    ingredientId: dbIngredient.id,
                    quantity: ingredient.quantity
                }
            });
            console.log(`Added ingredient to product: `, result);
        }
    } catch (error) {
        console.error(`Error processing ${name}:`, error);
    }
}


}

main()
  .catch((e) => {
    throw e;
  })
  .finally(() => {
    db.$disconnect()
    .catch((err)=>console.log('Error to disconnect123', err));
  });
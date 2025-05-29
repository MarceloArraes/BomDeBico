import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";



export const productRouter = createTRPCRouter({
  // Fetch a single product by ID
  getProductById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: { id: input.id },
        include: { ingredients: true },
      });
    }),
    
    getAllProducts: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.product.findMany({
        orderBy: { name: 'desc' },
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        }
      });
    }),
  // Create a new product
  // Here will evaluate if > 500kg and make the calculations to get the cost per kg
  createProduct: protectedProcedure
  .input(z.object({ 
    name: z.string().min(1),
    sellPricePerKg: z.number(),
    isArchive: z.boolean().optional(),
    batchSize: z.number().optional(),
    costPerKg: z.number().optional(),
    ingredients: z.array(z.object({
      ingredientId: z.number(),
      quantity: z.number().gt(0)
    })),
  }))
  .mutation(async ({ ctx, input }) => {
    const ingredientsWeight = input.ingredients.reduce((total, ingredient) => total + ingredient.quantity, 0);
    let calculatedCostPerKg = 0;
    // const ingredientCosts = await Promise.all(input.ingredients.map(async (ingredient) => {
    //   const ingredientData = await api.ingredient.getIngredientById({ id: ingredient.ingredientId });

    //   if (!ingredientData) {
    //     throw new Error(`Ingredient with ID ${ingredient.ingredientId} not found`);
    //   }

    //   return ingredientData.costPerKg * ingredient.quantity;
    // }));
    if (ingredientsWeight > 0) {
      const ingredientCosts = await Promise.all(input.ingredients.map(async (ingredientInput) => {
        // OLD: const ingredientData = await api.ingredient.getIngredientById({ id: ingredientInput.ingredientId });
        // NEW: Directly query the database
        const ingredientData = await ctx.db.ingredient.findUnique({
          where: { id: ingredientInput.ingredientId },
          select: { costPerKg: true } // Only fetch the data you need
        });

        if (!ingredientData) {
          throw new Error(`Ingredient with ID ${ingredientInput.ingredientId} not found`);
        }

        return ingredientData.costPerKg * ingredientInput.quantity;
      }));
    


      // Sum up all ingredient costs
    const totalIngredientCost = ingredientCosts.reduce((total, cost) => total + cost, 0);

    // Calculate cost per kg
    calculatedCostPerKg = totalIngredientCost / ingredientsWeight as unknown as number;
    }

    return ctx.db.product.create({
      data: {
        name: input.name,
        sellPricePerKg: input.sellPricePerKg,
        costPerKg: calculatedCostPerKg,
        batchSize: ingredientsWeight,
        isArchived: input.isArchive ?? false,
        ingredients: {
          create: input.ingredients.map(ing => ({
            quantity: ing.quantity,
            ingredient: {
              connect: { id: ing.ingredientId },
            },
          })),
        },
      },
    });
  }),
  

// Update an existing product
updateProduct: protectedProcedure
  .input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    sellPricePerKg: z.number().optional(),
    isArchive: z.boolean().optional(),
    batchSize: z.number().optional(),
    costPerKg: z.number().optional(),
    ingredients: z.array(z.object({
      ingredientId: z.number(),
      quantity: z.number()
    })).optional(),
  }))
  .mutation(async ({ ctx, input }) => {const { id, ingredients: newIngredientsInput, ...productData } = input;

  const dataToUpdate: Prisma.ProductUpdateInput = { ...productData };

  if (newIngredientsInput !== undefined) { // If ingredients array is provided (even if empty)
    let newCalculatedCostPerKg = 0;
    let newBatchSize = 0;

    if (newIngredientsInput.length > 0) {
      newBatchSize = newIngredientsInput.reduce((total, ing) => total + ing.quantity, 0);
      if (newBatchSize <= 0) { // Should be caught by z.object().gt(0) but good to have safeguard
        throw new Error("Total ingredient quantity must be greater than zero if ingredients are provided.");
      }

      const ingredientCosts = await Promise.all(newIngredientsInput.map(async (ingInput) => {
        // OLD: const ingredientData = await api.ingredient.getIngredientById({ id: ingInput.ingredientId });
        // NEW: Directly query the database
        const ingredientData = await ctx.db.ingredient.findUnique({
          where: { id: ingInput.ingredientId },
          select: { costPerKg: true }
        });
        if (!ingredientData) throw new Error(`Ingredient with ID ${ingInput.ingredientId} not found`);
        return ingredientData.costPerKg * ingInput.quantity;
      }));
      const totalIngredientCost = ingredientCosts.reduce((total, cost) => total + cost, 0);
      newCalculatedCostPerKg = totalIngredientCost / newBatchSize;
    }
    // If newIngredientsInput is empty, cost and batchSize will be 0

    dataToUpdate.costPerKg = newCalculatedCostPerKg; // Overwrite with calculated cost
    dataToUpdate.batchSize = newBatchSize;         // Overwrite with calculated batch size

    // Manage ProductIngredient relations
    const currentProductIngredients = await ctx.db.productIngredient.findMany({
      where: { productId: id }
    });

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    // Ingredients to remove
    currentProductIngredients.forEach(currentPI => {
      if (!newIngredientsInput.some(newIng => newIng.ingredientId === currentPI.ingredientId)) {
        operations.push(ctx.db.productIngredient.delete({
          where: { productId_ingredientId: { productId: id, ingredientId: currentPI.ingredientId }}
        }));
      }
    });

    // Ingredients to add or update
    newIngredientsInput.forEach(newIng => {
      const existingPI = currentProductIngredients.find(curr => curr.ingredientId === newIng.ingredientId);
      if (existingPI) {
        // Update existing if quantity changed
        if (existingPI.quantity !== newIng.quantity) {
          operations.push(ctx.db.productIngredient.update({
            where: { productId_ingredientId: { productId: id, ingredientId: newIng.ingredientId }},
            data: { quantity: newIng.quantity }
          }));
        }
      } else {
        // Add new
        operations.push(ctx.db.productIngredient.create({
          data: {
            productId: id,
            ingredientId: newIng.ingredientId,
            quantity: newIng.quantity
          }
        }));
      }
    });
    if (operations.length > 0) {
        await ctx.db.$transaction(operations);
    }
  }
  // If newIngredientsInput is not provided, costPerKg and batchSize from input (if present) are used.

  // Ensure we don't send an empty data object if nothing else changed
  if (Object.keys(dataToUpdate).length === 0 && newIngredientsInput === undefined) {
      // Optionally, fetch and return the current product or throw an error
      // For now, we let it proceed, Prisma might optimize or error if it's truly an empty update
  }

  return ctx.db.product.update({
    where: { id },
    data: dataToUpdate,
  });
}),
  // Delete a product
  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.delete({
        where: { id: input.id },
      });
    }),

  // Your existing procedures can remain as they are or be modified as needed
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.text}` };
    }),

  getLatest: protectedProcedure.query(({ ctx }) => {
    return ctx.db.product.findFirst({ orderBy: { id: "desc" } });
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { api } from "~/trpc/server";



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
      quantity: z.number()
    })),
  }))
  .mutation(async ({ ctx, input }) => {
    const ingredientsWeight = input.ingredients.reduce((total, ingredient) => total + ingredient.quantity, 0);

    const ingredientCosts = await Promise.all(input.ingredients.map(async (ingredient) => {
      const ingredientData = await api.ingredient.getIngredientById.query({ id: ingredient.ingredientId });

      if (!ingredientData) {
        throw new Error(`Ingredient with ID ${ingredient.ingredientId} not found`);
      }

      return ingredientData.costPerKg * ingredient.quantity;
    }));

      // Sum up all ingredient costs
    const totalIngredientCost = ingredientCosts.reduce((total, cost) => total + cost, 0);

    // Calculate cost per kg
    const calculatedCostPerKg = totalIngredientCost / ingredientsWeight as unknown as number;


    return ctx.db.product.create({
      data: {
        name: input.name,
        sellPricePerKg: input.sellPricePerKg,
        costPerKg: calculatedCostPerKg,
        batchSize: ingredientsWeight,
        isArchived: input.isArchive,
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
  .mutation(async ({ ctx, input }) => {
    let calculatedCostPerKg =0;
    let ingredientsWeight = 0;

    if (input.ingredients) {
      ingredientsWeight = input.ingredients.reduce((total, ingredient) => total + ingredient.quantity, 0);

      const ingredientCosts = await Promise.all(input.ingredients.map(async (ingredient) => {
        const ingredientData = await api.ingredient.getIngredientById.query({ id: ingredient.ingredientId });

        if (!ingredientData) {
          throw new Error(`Ingredient with ID ${ingredient.ingredientId} not found`);
        }

        return ingredientData.costPerKg * ingredient.quantity;
      }));

      // Sum up all ingredient costs
      const totalIngredientCost = ingredientCosts.reduce((total, cost) => total + cost, 0);

      // Calculate cost per kg
      calculatedCostPerKg = totalIngredientCost / ingredientsWeight;
    }
    const currentIngredients = await ctx.db.productIngredient.findMany({
      where: { productId: input.id }
    });

    // Determine changes in ingredients
    const newIngredients = input.ingredients ?? [];
    const ingredientsToAdd = newIngredients.filter(ing => !currentIngredients.some(curr => curr.ingredientId === ing.ingredientId));
    const ingredientsToUpdate = currentIngredients.filter(curr => newIngredients.some(ing => ing.ingredientId === curr.ingredientId));
    const ingredientsToRemove = currentIngredients.filter(curr => !newIngredients.some(ing => ing.ingredientId === curr.ingredientId));

    for (const ingredient of ingredientsToAdd) {
      await ctx.db.productIngredient.create({
        data: {
          productId: input.id,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity
        }
      });
    }

    for (const ingredient of ingredientsToUpdate) {
      await ctx.db.productIngredient.update({
        where: {
          productId_ingredientId: {
            productId: input.id,
            ingredientId: ingredient.ingredientId
          }
        },
        data: {
          quantity: newIngredients?.find(ing => ing.ingredientId === ingredient.ingredientId)?.quantity ?? 0
        }
      });
    }

    for (const ingredient of ingredientsToRemove) {
      await ctx.db.productIngredient.delete({
        where: {
          productId_ingredientId: {
            productId: input.id,
            ingredientId: ingredient.ingredientId
          }
        }
      });
    }

    // Update the product with the new calculated fields
    return ctx.db.product.update({
      where: { id: input.id },
      data: {
        name: input.name,
        sellPricePerKg: input.sellPricePerKg,
        costPerKg: calculatedCostPerKg,
        batchSize: input.batchSize,
        isArchived: input.isArchive
        // Note: No need to handle ingredients here since they are updated above
      },
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

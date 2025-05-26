import type { PrismaClient, Prisma } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const ingredientRouter = createTRPCRouter({
  // Create a new ingredient
  createIngredient: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1),
      costPerKg: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ingredient.create({
        data: {
          name: input.name,
          costPerKg: input.costPerKg,
        },
      });
    }),

    //Get all ingredients
    getAllIngredients: protectedProcedure
    .query(async ({ctx})=>{
      return ctx.db.ingredient.findMany({
        orderBy: {name:'asc'}
      });
    }),


  // Get an ingredient by ID
  getIngredientById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ingredient.findUnique({
        where: { id: input.id },
        include: { products: true }, // This will include related products
      });
    }),

  // Update an existing ingredient
  updateIngredient: protectedProcedure
  .input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    costPerKg: z.number().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Update the ingredient
    await ctx.db.ingredient.update({
      where: { id: input.id },
      data: {
        name: input.name,
        costPerKg: input.costPerKg,
      },
    });

    // Find all products using this ingredient
    const relatedProducts = await ctx.db.productIngredient.findMany({
      where: { ingredientId: input.id },
      select: { productId: true }
    });

    // Recalculate cost for each product
    for (const pi of relatedProducts) {
      await recalculateProductCost(pi.productId, ctx);
    }

    // Return the updated ingredient or some other response
    return ctx.db.ingredient.findUnique({
      where: { id: input.id }
    });
  }),

  // Delete an ingredient
  deleteIngredient: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ingredient.delete({
        where: { id: input.id },
      });
    }),
  //get latestIngredient
    getLatestIngredient: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.ingredient.findFirst({
          orderBy: { id: 'desc' },
        });
      }),
      
});

async function recalculateProductCost(productId: number, ctx: { session: { user: { id: string; } & { name?: string | null | undefined; email?: string | null | undefined; image?: string | null | undefined; }; expires: string; }; headers: Headers; db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>; }) {
  const productIngredients = await ctx.db.productIngredient.findMany({
    where: { productId },
    include: { ingredient: true }
  });

  const totalIngredientCost = productIngredients.reduce((total, pi) => {
    return total + (pi.ingredient.costPerKg * pi.quantity);
  }, 0);

  const totalWeight = productIngredients.reduce((total, pi) => total + pi.quantity, 0);

  const newCostPerKg = totalWeight > 0 ? totalIngredientCost / totalWeight : 0;

  await ctx.db.product.update({
    where: { id: productId },
    data: { costPerKg: newCostPerKg }
  });
}
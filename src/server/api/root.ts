// import { postRouter } from "@/server/api/routers/post";
import {productRouter} from "@/server/api/routers/product"
import {ingredientRouter} from "@/server/api/routers/ingredients"
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // post: postRouter,
  product: productRouter,
  ingredient: ingredientRouter,

});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

// import { useRouter } from "next/router";
// import {trpc} from '../api/trpc/[trpc]'
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import Image from "next/image";
import Link from "next/link";

export const SigninComponent = async () => {
    const session = await auth();
    if (session?.user) {
        void api.product.getLatest.prefetch();
        void api.ingredient.getAllIngredients.prefetch();
      }
  

  return (
    <div className="m-10 flex flex-col items-start justify-start gap-4">
      {session && (
        <div className="flex flex-row">
          <Image
            src={session?.user?.image ?? ""}
            alt="user image"
            width={55}
            height={55}
            className="-translate-y-3 rounded-full"
          />
          <p className="ml-3 text-center text-base text-white">
            <span>Logged in as {session.user?.name}</span>
          </p>
        </div>
      )}
      <Link
        href={session ? "/api/auth/signout" : "/api/auth/signin"}
        className="flex-nowrap whitespace-nowrap rounded-full bg-white/10 px-3 py-3 text-base font-semibold text-white no-underline transition hover:bg-white/20"
      >
        {session ? "Sign out" : "Sign in"}
      </Link>
    </div>
  );
};

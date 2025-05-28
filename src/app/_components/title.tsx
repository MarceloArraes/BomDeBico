import Link from "next/link";
import { SigninComponent } from "./Signin-component";

const Title = () => {
  return (
    <div className="flex flex-col items-center justify-between p-4 sm:flex-row">
      <SigninComponent />
      <h1 className="-ml-14 mt-4 w-full text-center text-3xl font-extrabold tracking-tight text-white sm:mt-0  sm:text-5xl md:text-[5rem]">
        <Link href="/">
          Bom{" "}
          <span className="items-center text-[hsl(226,100%,70%)]">de Bico</span>
        </Link>
      </h1>
    </div>
  );
};

export default Title;

// <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">

/* </div>
<div className="flex flex-col items-center gap-2">
  <p className="text-2xl text-white">*/
{
  /* {hello ? hello.greeting : "Loading tRPC query..."} */
}
/*  </p>


</div>  */

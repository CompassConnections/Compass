import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center p-4 shadow-md bg-white">
      <Link href="/" className="flex items-center">
        <Image
          src="/globe.svg"
          alt="Home"
          width={40}
          height={40}
          className="cursor-pointer hover:opacity-80 transition"
        />
      </Link>
      <h1 className="ml-3 text-xl font-bold">BayesBond</h1>
    </header>
  );
}

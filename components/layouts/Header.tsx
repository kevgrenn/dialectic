import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-4">
      <div className="max-w-[1200px] mx-auto px-4">
        <Link href="/" className="inline-block">
          <Image 
            src="/logo.png" 
            alt="Dialectic Logo" 
            width={150} 
            height={40} 
            className="h-auto" 
          />
        </Link>
      </div>
    </header>
  );
} 
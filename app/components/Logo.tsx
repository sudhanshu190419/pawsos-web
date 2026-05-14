import Image from "next/image";
import Link from "next/link";
import logoImg from "./logo.png";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const Logo = ({ 
  className = "", 
  width, 
  height, 
  priority = true 
}: LogoProps) => {
  return (
    <Link 
      href="/" 
      className={`hover:scale-105 transition-transform flex items-center shrink-0 ${className}`}
    >
      <Image
        src={logoImg}
        alt="AnimalSathi Logo"
        width={width}
        height={height}
        priority={priority}
        className="w-auto h-full object-contain"
      />
    </Link>
  );
};

export default Logo;

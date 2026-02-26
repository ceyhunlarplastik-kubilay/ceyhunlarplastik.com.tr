"use client";

import Link from "next/link";
import Image from "next/image";

export const CeyhunlarLogo = () => {
    return (
        <Link
            href="/"
            className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity z-20"
        >
            <div className="relative h-10 w-40 sm:h-12 sm:w-48 lg:h-14 lg:w-56 flex items-center">
                <Image
                    src="/logos/ceyhunlar.png"
                    alt="Ceyhunlar Plastik"
                    width={224}
                    height={56}
                    className="object-contain"
                    priority
                    sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 224px"
                />
            </div>
        </Link>
    );
};

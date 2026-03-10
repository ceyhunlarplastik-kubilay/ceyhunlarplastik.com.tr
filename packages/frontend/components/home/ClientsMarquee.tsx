"use client";

import { Marquee, MarqueeContent, MarqueeItem, MarqueeFade } from "@/components/kibo-ui/marquee/index"
/* import { BusinessBuilding } from "@/components/icons/BusinessBuilding";

const icons = Array.from({ length: 8 }); */

const BRANDS = [
    "ISO 9001",
    "ISO 14001",
    "Automotive",
    "Industrial",
    "Custom Molding",
    "Injection",
    "OEM Supplier",
];

export function ClientsMarquee() {
    return (
        <div className="relative">
            <Marquee>
                <MarqueeFade side="left" />
                <MarqueeFade side="right" />

                <MarqueeContent>
                    {BRANDS.map((item, i) => (
                        <MarqueeItem
                            key={i}
                            className="mx-8 text-sm md:text-base font-medium text-muted-foreground"
                        >
                            {item}
                        </MarqueeItem>
                    ))}
                    {/* {icons.map((_, i) => (
            <MarqueeItem key={i} className="mx-8">
              <BusinessBuilding className="h-10 w-10 text-brand opacity-80" />
            </MarqueeItem>
          ))} */}
                </MarqueeContent>
            </Marquee>
        </div>
    );
}

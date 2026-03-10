"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
    children: React.ReactNode;
    direction?: "left" | "right";
    speed?: number;
    pauseOnHover?: boolean;
    className?: string;
    gap?: string;
}

export function MotionMarquee({
    children,
    direction = "left",
    speed = 40,
    pauseOnHover = true,
    className,
    gap = "gap-8",
}: MarqueeProps) {
    const id = useId().replace(/:/g, ""); // unique ID for keyframes

    return (
        <div
            className={cn("relative overflow-hidden w-full", className)}
            // Enable pause on focus/hover via CSS group
            role="region"
            aria-label="Marquee"
        >
            <style jsx>{`
        @keyframes marquee-${id} {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-reverse-${id} {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .marquee-track {
          animation-name: ${direction === "left"
                    ? `marquee-${id}`
                    : `marquee-reverse-${id}`};
          animation-duration: ${speed}s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: ${pauseOnHover ? "paused" : "running"};
        }
      `}</style>

            <div className="marquee-container flex w-full overflow-hidden">
                <div className="marquee-track flex w-max min-w-full">
                    <div className={`flex ${gap} flex-shrink-0 px-4`}>{children}</div>
                    <div className={`flex ${gap} flex-shrink-0 px-4`}>{children}</div>
                </div>
            </div>
        </div>
    );
}

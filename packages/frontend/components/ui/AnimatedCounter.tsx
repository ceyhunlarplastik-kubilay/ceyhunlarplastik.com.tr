"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
}

export function AnimatedCounter({
    value,
    duration = 1.4,
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement | null>(null);
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    animate(count, value, {
                        duration,
                        ease: "easeOut",
                    });
                    setHasAnimated(true);
                }
            },
            { threshold: 0.4 }
        );

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [value, hasAnimated]);

    return <motion.span ref={ref}>{rounded}</motion.span>;
}

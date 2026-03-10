"use client";

import { motion, Variants } from "motion/react";

interface AnimatedLetterProps {
    letter: string;
    delay?: number;
}

const letterVariants: Variants = {
    rest: { y: 0 },
    hover: { y: "-50%" },
};

export default function AnimatedLetter({
    letter,
    delay = 0,
}: AnimatedLetterProps) {
    return (
        <div className="inline-block h-[1.2em] overflow-hidden font-semibold text-inherit">
            <motion.span
                className="flex min-w-[4px] flex-col"
                variants={letterVariants}
                transition={{ duration: 0.5, delay, ease: "easeInOut" }}
            >
                <span className="flex items-center h-[1.2em]">{letter}</span>
                <span className="flex items-center h-[1.2em]">{letter}</span>
            </motion.span>
        </div>
    );
}

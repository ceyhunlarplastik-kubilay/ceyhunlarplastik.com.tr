"use client";

import { motion, type Variants } from "motion/react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Motion variants */
/* ------------------------------------------------------------------ */

const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 16 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 280,
            damping: 24,
        },
    },
    exit: { opacity: 0, scale: 0.97, y: 12 },
};

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

type MotionDialogProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
};

export function MotionDialog({
    title,
    description,
    children,
    className,
}: MotionDialogProps) {
    return (
        <DialogContent
            forceMount
            className="border-none bg-transparent p-0 shadow-none w-full max-w-3xl p-6 sm:p-8"
        >
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
                className={cn(
                    `
          w-full max-h-[85vh] overflow-y-auto
          rounded-3xl
          bg-white text-neutral-900
          shadow-xl
          p-6 md:p-8
          `,
                    className
                )}
            >
                {/* Header */}
                <DialogHeader className="mb-6 text-left">
                    <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>

                    {description && (
                        <DialogDescription className="text-sm text-neutral-600">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Content */}
                {children}
            </motion.div>
        </DialogContent>
    );
}

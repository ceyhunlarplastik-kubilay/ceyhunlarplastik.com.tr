"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemType {
    label: string;
    href?: string;
}

interface PageHeroProps {
    title: string;
    breadcrumbs?: BreadcrumbItemType[];
    backgroundImage?: string;
}

export function PageHero({
    title,
    breadcrumbs,
    backgroundImage = "/logos/title-bg.webp",
}: PageHeroProps) {
    return (
        <header
            className="
        relative
        h-[100px]
        sm:h-[130px]
        md:h-[160px]
        lg:h-[180px]
        flex items-center justify-center
        overflow-hidden
      "
        >
            {/* Background */}
            <Image
                src={backgroundImage}
                alt={title}
                fill
                priority
                sizes="100vw"
                suppressHydrationWarning
                className="object-cover object-center brightness-100 saturate-100"
            />

            {/* Overlays */}
            <div className="absolute inset-0 bg-[var(--color-brand)]/30 mix-blend-multiply" />
            <div className="absolute inset-0 bg-black/60" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl px-6 mx-auto flex flex-col items-center sm:items-start text-center sm:text-left text-white">
                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-bold
            leading-tight
          "
                >
                    {title}
                </motion.h1>

                {/* Breadcrumb */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-2"
                    >
                        <Breadcrumb>
                            <BreadcrumbList className="text-white/80">
                                {breadcrumbs.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <BreadcrumbItem>
                                            {item.href ? (
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        href={item.href}
                                                        className="hover:text-white transition"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className="text-white">
                                                    {item.label}
                                                </BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>

                                        {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </motion.div>
                )}
            </div>
        </header>
    );
}

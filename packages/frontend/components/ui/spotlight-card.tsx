"use client";

import React, { useEffect, useRef, ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const sizeMap = {
  sm: "w-48 h-64",
  md: "w-64 h-80",
  lg: "w-80 h-96",
};

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  size = "md",
  width,
  height,
  customSize = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;

      if (cardRef.current) {
        cardRef.current.style.setProperty("--x", x.toFixed(2));
        cardRef.current.style.setProperty(
          "--xp",
          (x / window.innerWidth).toFixed(2)
        );
        cardRef.current.style.setProperty("--y", y.toFixed(2));
        cardRef.current.style.setProperty(
          "--yp",
          (y / window.innerHeight).toFixed(2)
        );
      }
    };

    document.addEventListener("pointermove", syncPointer);
    return () => document.removeEventListener("pointermove", syncPointer);
  }, []);

  const getSizeClasses = () => {
    if (customSize) return "";
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles: React.CSSProperties & Record<string, any> = {
      /* 🔥 BRAND BASE */
      "--base": "var(--brand-hue)",
      "--spread": "var(--brand-spread)",

      "--radius": "16",
      "--border": "2",
      "--backdrop": "hsl(0 0% 100% / 0.04)",
      "--backup-border": "var(--backdrop)",
      "--size": "220",
      "--outer": "1",

      "--border-size": "calc(var(--border) * 1px)",
      "--spotlight-size": "calc(var(--size) * 1px)",

      "--hue":
        "calc(var(--base) + (var(--xp, 0) * var(--spread)))",

      /* 🔥 BACKGROUND GLOW */
      backgroundImage: `
        radial-gradient(
          var(--spotlight-size) var(--spotlight-size) at
          calc(var(--x, 0) * 1px)
          calc(var(--y, 0) * 1px),
          hsl(var(--hue) 60% 60% / 0.15),
          transparent
        )
      `,

      backgroundColor: "var(--backdrop)",
      backgroundSize:
        "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
      backgroundPosition: "50% 50%",
      backgroundAttachment: "fixed",

      border: "var(--border-size) solid var(--backup-border)",
      position: "relative",
      touchAction: "none",
    };

    if (width !== undefined) {
      baseStyles.width =
        typeof width === "number" ? `${width}px` : width;
    }

    if (height !== undefined) {
      baseStyles.height =
        typeof height === "number" ? `${height}px` : height;
    }

    return baseStyles;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }

    /* 🔥 BORDER GLOW */
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.7)
        calc(var(--spotlight-size) * 0.7) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue) 70% 55% / 0.9),
        transparent 100%
      );
      filter: brightness(1.3);
    }

    /* 🔥 SOFT LIGHT */
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.4)
        calc(var(--spotlight-size) * 0.4) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 0% 100% / 0.35),
        transparent 100%
      );
    }

    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      filter: blur(calc(var(--border-size) * 8));
      pointer-events: none;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />

      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? "aspect-[3/4]" : ""}
          rounded-2xl
          relative
          grid
          grid-rows-[1fr_auto]
          p-4
          gap-4
          backdrop-blur-md
          transition-all duration-300
          ${className}
        `}
      >
        <div data-glow></div>
        {children}
      </div>
    </>
  );
};

export { GlowCard };
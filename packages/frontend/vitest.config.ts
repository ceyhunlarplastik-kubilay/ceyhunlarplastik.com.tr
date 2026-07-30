import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * tsconfig.json'daki path alias'larının test ortamındaki karşılığı.
 * Bunlar olmadan `@/…` veya `@core/…` import eden bir modül teste sokulamıyor
 * (Next/Turbopack tsconfig'i okuyor, vitest okumuyor).
 */
export default defineConfig({
    resolve: {
        alias: {
            "@core-prisma": fileURLToPath(new URL("../core/prisma", import.meta.url)),
            "@core": fileURLToPath(new URL("../core/src/core", import.meta.url)),
            "@": fileURLToPath(new URL("./", import.meta.url)),
        },
    },
})

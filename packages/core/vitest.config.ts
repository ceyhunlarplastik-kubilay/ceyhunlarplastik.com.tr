import path from "node:path"
import { defineConfig } from "vitest/config"

// Root tsconfig.json'daki "paths" alias'larının vitest karşılığı.
// Bunlar olmadan `@/core/...` gibi runtime importları içeren modüller
// (ör. businessRequests/service.ts) test dosyalarından yüklenemez.
const repoRoot = path.resolve(__dirname, "../..")

export default defineConfig({
    resolve: {
        alias: [
            { find: /^@\/core\//, replacement: path.resolve(repoRoot, "packages/core/src/core") + "/" },
            { find: /^@\/prisma\//, replacement: path.resolve(repoRoot, "packages/core/prisma") + "/" },
            { find: /^@\/functions\//, replacement: path.resolve(repoRoot, "packages/functions/src") + "/" },
            { find: /^@\/scripts\//, replacement: path.resolve(repoRoot, "packages/scripts/src") + "/" },
            { find: /^@\//, replacement: path.resolve(repoRoot, "packages") + "/" },
        ],
    },
})

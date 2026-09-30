import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

/**
 * Koruma (4.4): her üretim YAZMA route'u (a) yayın iznini ve uç noktasını taşıyan
 * `productionMutationRouteOptions` ile tanımlı, (b) `actions.ts`'te `withProductionChange` ile sarılı
 * olmalı. Biri unutulursa hata vermez — yalnız diğer planlayıcıların ekranı o değişiklikte sessizce
 * tazelenmez; bu test o sessiz kopukluğu yakalar.
 */
const repoRoot = new URL("../../../../../", import.meta.url)
const infraSource = readFileSync(new URL("infra/ProtectedApi.ts", repoRoot), "utf8")

type Route = { method: string; path: string; folder: string; action: string; options: string }

const routes: Route[] = [...infraSource.matchAll(
    /protectedApi\.route\('(GET|POST|PUT|PATCH|DELETE) (\/production[^']*)', \{\n\s+handler: `\$\{folderPrefix\}\/(production\w+)\/actions\.(\w+)`,\n\s+\.\.\.(\w+),/g,
)].map(([, method, path, folder, action, options]) => ({ method, path, folder, action, options }))

const mutations = routes.filter((route) => route.method !== "GET")

describe("üretim canlı güncelleme kapsamı", () => {
    it("route listesi okunabiliyor (desen bozulursa test boşa geçmesin)", () => {
        expect(mutations.length).toBeGreaterThanOrEqual(41)
        expect(routes.length).toBeGreaterThan(mutations.length)
    })

    it("her yazma route'u dar yayın iznini taşıyan ayarı kullanır; okuma route'ları kullanmaz", () => {
        expect(mutations.filter((route) => route.options !== "productionMutationRouteOptions").map((route) => `${route.method} ${route.path}`)).toEqual([])
        expect(routes.filter((route) => route.method === "GET" && route.options !== "defaultRouteOptions").map((route) => route.path)).toEqual([])
    })

    it("her yazma ucu withProductionChange ile sarılı", () => {
        const unwrapped = mutations.filter((route) => {
            const actions = readFileSync(
                new URL(`packages/functions/src/ProtectedApi/functions/${route.folder}/actions.ts`, repoRoot),
                "utf8",
            )
            return !new RegExp(`export const ${route.action} = lambdaHandler\\(\\n\\s+withProductionChange\\("`).test(actions)
        })
        expect(unwrapped.map((route) => `${route.folder}.${route.action}`)).toEqual([])
    })
})

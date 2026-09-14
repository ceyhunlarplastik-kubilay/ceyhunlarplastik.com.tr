import { create } from "zustand"

type Store = {
    category?: string
    search: string
    attributes: Record<string, string[]>
    page: number
    limit: number
    /** "Yeni Ürün" penceresi (bkz. core `productFreshness.ts`) — `Product.createdAt`. */
    isNew: boolean
    /** Aynı pencere, ama en az bir varyantı üzerinden (`ProductVariant.createdAt`). */
    hasNewVariant: boolean
    /** En az bir varyantı şu an AKTİF bir kampanyada. Yalnız müşteri portalı
     * "Tüm Ürünler" sayfasında açık (kullanıcı talebiyle) — bkz. ProductFilterSidebar
     * `showCampaignFilter` prop'u. */
    onCampaign: boolean

    setCategory: (c?: string) => void
    setSearch: (value: string) => void
    toggleAttribute: (code: string, value: string) => void
    setAttributes: (attrs: Record<string, string[]>) => void
    setPage: (p: number) => void
    setIsNew: (value: boolean) => void
    setHasNewVariant: (value: boolean) => void
    setOnCampaign: (value: boolean) => void

    toQueryString: () => string
    setFromUrl: (params: URLSearchParams) => void
}

// `toQueryString`/`setFromUrl` ikisinde de KULLANILAN, bilinen (attribute
// olmayan) query key'leri — `setFromUrl` bu listenin DIŞINDAKİ her key'i
// "attribute kodu" sanıyor (bkz. aşağıdaki yorum). Yeni bir düz alan (bu
// dosyadaki `isNew` gibi) eklerken burayı da güncellemek gerekir.
const KNOWN_QUERY_KEYS = ["category", "search", "page", "limit", "isNew", "hasNewVariant", "onCampaign"]

export const useFilterStore = create<Store>((set, get) => ({
    category: undefined,
    search: "",
    attributes: {},
    page: 1,
    limit: 20,
    isNew: false,
    hasNewVariant: false,
    onCampaign: false,

    setCategory: (category) => set({ category, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),

    toggleAttribute: (code, value) => {
        const attrs = { ...get().attributes }
        const list = attrs[code] ?? []

        if (list.includes(value)) {
            attrs[code] = list.filter((v) => v !== value)
        } else {
            attrs[code] = [...list, value]
        }

        set({ attributes: attrs, page: 1 })
    },

    setAttributes: (attributes) => set({ attributes, page: 1 }),

    setPage: (page) => set({ page }),

    setIsNew: (isNew) => set({ isNew, page: 1 }),
    setHasNewVariant: (hasNewVariant) => set({ hasNewVariant, page: 1 }),
    setOnCampaign: (onCampaign) => set({ onCampaign, page: 1 }),

    toQueryString: () => {
        const { category, search, attributes, page, limit, isNew, hasNewVariant, onCampaign } = get()

        const params = new URLSearchParams()

        if (category) params.set("category", category)
        if (search.trim()) params.set("search", search.trim())
        params.set("page", String(page))
        params.set("limit", String(limit))
        if (isNew) params.set("isNew", "true")
        if (hasNewVariant) params.set("hasNewVariant", "true")
        if (onCampaign) params.set("onCampaign", "true")

        Object.entries(attributes).forEach(([k, v]) => {
            if (v.length) params.set(k, v.join(","))
        })

        return params.toString()
    },

    setFromUrl: (params) => {
        const attrs: Record<string, string[]> = {}

        // `isNew`/`hasNewVariant`/`onCampaign` KNOWN_QUERY_KEYS'te — bunlar aşağıda
        // ayrıca okunuyor. Dışlanmazsa burada `attrs.isNew = ["true"]` gibi hayali
        // bir "attribute" satırı üretilir ve gerçek boolean state'e hiç yansımaz
        // (backend'deki aynı sınıf tuzağın frontend eşdeğeri — bkz. listProductsHandler.ts).
        params.forEach((value, key) => {
            if (KNOWN_QUERY_KEYS.includes(key)) return
            attrs[key] = value.split(",")
        })

        set({
            category: params.get("category") ?? undefined,
            search: params.get("search") ?? "",
            page: Number(params.get("page") ?? 1),
            limit: Number(params.get("limit") ?? 20),
            attributes: attrs,
            isNew: params.get("isNew") === "true",
            hasNewVariant: params.get("hasNewVariant") === "true",
            onCampaign: params.get("onCampaign") === "true",
        })
    },
}))

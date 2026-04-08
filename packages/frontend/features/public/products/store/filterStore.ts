import { create } from "zustand"

type Store = {
    category?: string
    attributes: Record<string, string[]>
    page: number
    limit: number

    setCategory: (c?: string) => void
    toggleAttribute: (code: string, value: string) => void
    setAttributes: (attrs: Record<string, string[]>) => void
    setPage: (p: number) => void

    toQueryString: () => string
    setFromUrl: (params: URLSearchParams) => void
}

export const useFilterStore = create<Store>((set, get) => ({
    category: undefined,
    attributes: {},
    page: 1,
    limit: 20,

    setCategory: (category) => set({ category, page: 1 }),

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

    toQueryString: () => {
        const { category, attributes, page, limit } = get()

        const params = new URLSearchParams()

        if (category) params.set("category", category)
        params.set("page", String(page))
        params.set("limit", String(limit))

        Object.entries(attributes).forEach(([k, v]) => {
            if (v.length) params.set(k, v.join(","))
        })

        return params.toString()
    },

    setFromUrl: (params) => {
        const attrs: Record<string, string[]> = {}

        params.forEach((value, key) => {
            if (["category", "page", "limit"].includes(key)) return
            attrs[key] = value.split(",")
        })

        set({
            category: params.get("category") ?? undefined,
            page: Number(params.get("page") ?? 1),
            limit: Number(params.get("limit") ?? 20),
            attributes: attrs,
        })
    },
}))

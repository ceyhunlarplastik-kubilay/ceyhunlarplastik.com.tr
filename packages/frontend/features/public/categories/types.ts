import type { Asset } from "@/features/public/assets/types"

export type Category = {
    id: string
    code: number
    name: string
    slug: string
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}
import type { Asset } from "@/features/public/assets/types"

export type PublicMaterial = {
    id: string
    name: string
    code?: string | null
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}

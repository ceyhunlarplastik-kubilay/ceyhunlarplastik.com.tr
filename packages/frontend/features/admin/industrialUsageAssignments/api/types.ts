import type { ApiEnvelope } from "@/lib/http/types"

export type IndustrialUsageAssignmentFilter = "all" | "assigned" | "unassigned"

export type IndustrialUsageHierarchyValue = {
    id: string
    name: string
    slug: string
    parentValueId: string | null
    displayOrder: number
    isActive: boolean
    attribute: {
        id: string
        code: string
        name: string
    } | null
}

export type IndustrialUsageAssignmentHierarchy = {
    sector: IndustrialUsageHierarchyValue
    productionGroup: IndustrialUsageHierarchyValue
    usageArea: IndustrialUsageHierarchyValue
}

export type IndustrialUsageAssignmentProduct = {
    id: string
    code: string
    name: string
    slug: string
    category: {
        id: string
        name: string
        slug: string
        code: number
    } | null
    primaryImageUrl: string | null
    isAssigned: boolean
    assignedUsageId: string | null
    industrialUsageCount: number
}

export type ListIndustrialUsageAssignmentProductsParams = {
    page?: number
    limit?: number
    search?: string
    assignment?: IndustrialUsageAssignmentFilter
}

export type ListIndustrialUsageAssignmentProductsPayload = {
    hierarchy: IndustrialUsageAssignmentHierarchy
    assignedTotal: number
    data: IndustrialUsageAssignmentProduct[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export type ListIndustrialUsageAssignmentProductsResponse =
    ApiEnvelope<ListIndustrialUsageAssignmentProductsPayload>

export type PatchIndustrialUsageAssignmentProductsBody = {
    addProductIds: string[]
    removeProductIds: string[]
}

export type PatchIndustrialUsageAssignmentProductsPayload = {
    hierarchy: IndustrialUsageAssignmentHierarchy
    added: number
    removed: number
    kept: number
    assignedTotal: number
}

export type PatchIndustrialUsageAssignmentProductsResponse =
    ApiEnvelope<PatchIndustrialUsageAssignmentProductsPayload>

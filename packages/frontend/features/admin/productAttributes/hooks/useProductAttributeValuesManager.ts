"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/features/admin/productAttributes/api/errorHelpers"
import { productAttributeKeys } from "@/features/admin/productAttributes/api/productAttributeKeys"
import {
    createProductAttributeValue,
    deleteProductAttributeValue,
    deleteProductAttributeValueAsset,
    listProductAttributeValues,
    updateProductAttributeValue,
    uploadProductAttributeValuePrimaryImage,
    validateAttributeValueImage,
} from "@/features/admin/productAttributes/api/productAttributeValueApi"
import {
    ATTRIBUTE_CODES,
    getAttributeLabel,
    getParentAttributeCode,
    VALUE_PAGE_SIZE_OPTIONS,
} from "@/features/admin/productAttributes/constants"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type CreateValueInput = {
    name: string
    parentValueId?: string
    file?: File | null
}

type UpdateValueInput = {
    id: string
    name: string
    parentValueId?: string
}

type AssetDeleteTarget = {
    value: ProductAttributeValue
    asset: NonNullable<ProductAttributeValue["assets"]>[number]
}

type ValueDeleteTarget = ProductAttributeValue

type Props = {
    attributeId: string
    attributeCode: string
}

export function useProductAttributeValuesManager({ attributeId, attributeCode }: Props) {
    const queryClient = useQueryClient()
    const parentAttributeCode = getParentAttributeCode(attributeCode)
    const parentLabel = getAttributeLabel(parentAttributeCode)
    const currentLabel = getAttributeLabel(attributeCode)
    const [selectedSectorValueId, setSelectedSectorValueId] = useState<string | null>(null)
    const [search, setSearchState] = useState("")
    const [parentFilterValueId, setParentFilterValueIdState] = useState("")
    const [page, setPageState] = useState(1)
    const [limit, setLimitState] = useState<(typeof VALUE_PAGE_SIZE_OPTIONS)[number]>(12)
    const [uploadingValueId, setUploadingValueId] = useState<string | null>(null)
    const [updatingValueId, setUpdatingValueId] = useState<string | null>(null)
    const [deletingValueId, setDeletingValueId] = useState<string | null>(null)
    const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
    const [valueDeleteTarget, setValueDeleteTarget] = useState<ValueDeleteTarget | null>(null)
    const [assetDeleteTarget, setAssetDeleteTarget] = useState<AssetDeleteTarget | null>(null)

    const valuesQuery = useQuery({
        queryKey: productAttributeKeys.values(attributeId),
        queryFn: () => listProductAttributeValues(attributeId),
    })

    const attributesForFilterQuery = useAttributesForFilter()

    const attributesForFilter = useMemo(
        () => attributesForFilterQuery.data ?? [],
        [attributesForFilterQuery.data],
    )
    const parentValues = parentAttributeCode
        ? attributesForFilter.find((attribute) => attribute.code === parentAttributeCode)?.values ?? []
        : []
    const productionGroupValues = useMemo(
        () => attributesForFilter.find((attribute) => attribute.code === ATTRIBUTE_CODES.productionGroup)?.values ?? [],
        [attributesForFilter],
    )

    const linkedProductionGroups = useMemo(() => {
        if (attributeCode !== ATTRIBUTE_CODES.sector || !selectedSectorValueId) return []
        return productionGroupValues.filter((value) => value.parentValueId === selectedSectorValueId)
    }, [attributeCode, productionGroupValues, selectedSectorValueId])

    const values = useMemo(
        () => valuesQuery.data ?? [],
        [valuesQuery.data],
    )
    const filteredValues = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR")

        return values.filter((value) => {
            if (parentFilterValueId && value.parentValueId !== parentFilterValueId) return false
            if (!normalizedSearch) return true

            return `${value.name} ${value.parentValue?.name ?? ""}`
                .toLocaleLowerCase("tr-TR")
                .includes(normalizedSearch)
        })
    }, [parentFilterValueId, search, values])

    const totalPages = Math.max(1, Math.ceil(filteredValues.length / limit))
    const currentPage = Math.min(page, totalPages)
    const paginatedValues = filteredValues.slice((currentPage - 1) * limit, currentPage * limit)
    const visualCount = filteredValues.filter((value) => (value.assets?.length ?? 0) > 0).length
    const hasActiveFilters = Boolean(search.trim() || parentFilterValueId)

    function invalidateValueQueries() {
        void queryClient.invalidateQueries({ queryKey: productAttributeKeys.values(attributeId) })
        void queryClient.invalidateQueries({ queryKey: productAttributeKeys.withValues() })
    }

    function resetListContext() {
        setPageState(1)
        setSelectedSectorValueId(null)
    }

    const createMutation = useMutation({
        mutationFn: async ({ name, parentValueId: parentId, file }: CreateValueInput) => {
            const createdValue = await createProductAttributeValue({
                name,
                attributeId,
                ...(parentAttributeCode && { parentValueId: parentId }),
            })

            let assetUploadFailed = false
            if (file) {
                try {
                    await uploadProductAttributeValuePrimaryImage({
                        valueId: createdValue.id,
                        file,
                    })
                } catch (error) {
                    assetUploadFailed = true
                    console.error(error)
                }
            }

            return { assetUploadFailed }
        },
        onSuccess({ assetUploadFailed }) {
            toast.success(assetUploadFailed
                ? "Değer oluşturuldu ancak görsel yüklenemedi."
                : "Değer oluşturuldu.")
            resetListContext()
            invalidateValueQueries()
        },
        onError(error) {
            toast.error(getApiErrorMessage(error, "Değer oluşturulamadı."))
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, name, parentValueId: parentId }: UpdateValueInput) => {
            setUpdatingValueId(id)
            await updateProductAttributeValue(id, {
                name,
                ...(parentAttributeCode && { parentValueId: parentId }),
            })
        },
        onSuccess() {
            toast.success("Değer güncellendi.")
            setSelectedSectorValueId(null)
            invalidateValueQueries()
        },
        onError(error) {
            toast.error(getApiErrorMessage(error, "Değer güncellenemedi."))
        },
        onSettled() {
            setUpdatingValueId(null)
        },
    })

    const uploadAssetMutation = useMutation({
        mutationFn: async ({ valueId, file }: { valueId: string; file: File }) => {
            setUploadingValueId(valueId)
            await uploadProductAttributeValuePrimaryImage({ valueId, file })
        },
        onSuccess() {
            toast.success("Görsel güncellendi.")
            invalidateValueQueries()
        },
        onError(error) {
            toast.error(getApiErrorMessage(error, "Görsel yüklenemedi."))
        },
        onSettled() {
            setUploadingValueId(null)
        },
    })

    const deleteAssetMutation = useMutation({
        mutationFn: async (target: AssetDeleteTarget) => {
            setDeletingAssetId(target.asset.id)
            await deleteProductAttributeValueAsset(target.asset.id)
        },
        onSuccess() {
            toast.success("Görsel silindi.")
            setAssetDeleteTarget(null)
            invalidateValueQueries()
        },
        onError(error) {
            toast.error(getApiErrorMessage(error, "Görsel silinemedi."))
        },
        onSettled() {
            setDeletingAssetId(null)
        },
    })

    const deleteValueMutation = useMutation({
        mutationFn: async (target: ValueDeleteTarget) => {
            setDeletingValueId(target.id)
            await deleteProductAttributeValue(target.id)
        },
        onSuccess() {
            toast.success("Değer silindi.")
            setValueDeleteTarget(null)
            setSelectedSectorValueId(null)
            invalidateValueQueries()
        },
        onError(error) {
            toast.error(getApiErrorMessage(error, "Değer silinemedi."))
        },
        onSettled() {
            setDeletingValueId(null)
        },
    })

    function setSearch(value: string) {
        setSearchState(value)
        resetListContext()
    }

    function setParentFilterValueId(value: string) {
        setParentFilterValueIdState(value)
        resetListContext()
    }

    function clearFilters() {
        setSearchState("")
        setParentFilterValueIdState("")
        resetListContext()
    }

    function setLimit(nextLimit: number) {
        const normalized = VALUE_PAGE_SIZE_OPTIONS.includes(nextLimit as (typeof VALUE_PAGE_SIZE_OPTIONS)[number])
            ? nextLimit as (typeof VALUE_PAGE_SIZE_OPTIONS)[number]
            : 12

        setLimitState(normalized)
        resetListContext()
    }

    function setPage(nextPage: number) {
        setPageState(nextPage)
        setSelectedSectorValueId(null)
    }

    function toggleLinkedGroups(valueId: string) {
        setSelectedSectorValueId((current) => current === valueId ? null : valueId)
    }

    function uploadAsset(valueId: string, file?: File | null) {
        if (!file) return

        const validationError = validateAttributeValueImage(file)
        if (validationError) {
            toast.error(validationError)
            return
        }

        uploadAssetMutation.mutate({ valueId, file })
    }

    return {
        attributeCode,
        parentAttributeCode,
        parentLabel,
        currentLabel,
        parentValues,
        linkedProductionGroups,
        values,
        filteredValues,
        paginatedValues,
        visualCount,
        currentPage,
        totalPages,
        limit,
        search,
        parentFilterValueId,
        hasActiveFilters,
        selectedSectorValueId,
        valueDeleteTarget,
        assetDeleteTarget,
        isInitialLoading: valuesQuery.isLoading,
        isFetching: valuesQuery.isFetching,
        createMutation,
        updateMutation,
        uploadAssetMutation,
        deleteAssetMutation,
        deleteValueMutation,
        uploadingValueId,
        updatingValueId,
        deletingValueId,
        deletingAssetId,
        setSearch,
        setParentFilterValueId,
        clearFilters,
        setPage,
        setLimit,
        toggleLinkedGroups,
        createValue: (input: CreateValueInput) => createMutation.mutateAsync(input).then(() => undefined),
        updateValue: (input: UpdateValueInput) => updateMutation.mutateAsync(input),
        uploadAsset,
        requestDeleteValue: setValueDeleteTarget,
        requestDeleteAsset: setAssetDeleteTarget,
        cancelDeleteValue: () => setValueDeleteTarget(null),
        cancelDeleteAsset: () => setAssetDeleteTarget(null),
        confirmDeleteValue: () => {
            if (valueDeleteTarget) deleteValueMutation.mutate(valueDeleteTarget)
        },
        confirmDeleteAsset: () => {
            if (assetDeleteTarget) deleteAssetMutation.mutate(assetDeleteTarget)
        },
    }
}

export type ProductAttributeValuesManagerState = ReturnType<typeof useProductAttributeValuesManager>

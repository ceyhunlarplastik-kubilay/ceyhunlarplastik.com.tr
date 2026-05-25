"use client"

import { useReducer } from "react"

type SupplierWorkspaceState = {
    selectedCategoryId: string
    productSearch: string
    productPage: number
    productLimit: number
    selectedProductId: string
    detailSearch: string
    detailPage: number
    detailLimit: number
}

type Action =
    | { type: "supplier-selected" }
    | { type: "category-changed"; value: string }
    | { type: "product-search-changed"; value: string }
    | { type: "product-page-changed"; value: number }
    | { type: "product-limit-changed"; value: number }
    | { type: "product-selected"; value: string }
    | { type: "detail-search-changed"; value: string }
    | { type: "detail-page-changed"; value: number }
    | { type: "detail-limit-changed"; value: number }

const INITIAL_STATE: SupplierWorkspaceState = {
    selectedCategoryId: "",
    productSearch: "",
    productPage: 1,
    productLimit: 12,
    selectedProductId: "",
    detailSearch: "",
    detailPage: 1,
    detailLimit: 20,
}

function supplierWorkspaceReducer(
    state: SupplierWorkspaceState,
    action: Action,
): SupplierWorkspaceState {
    switch (action.type) {
        case "supplier-selected":
            return {
                ...state,
                selectedCategoryId: "",
                productSearch: "",
                selectedProductId: "",
                productPage: 1,
                detailPage: 1,
            }
        case "category-changed":
            return {
                ...state,
                selectedCategoryId: action.value,
                selectedProductId: "",
                productPage: 1,
                detailPage: 1,
            }
        case "product-search-changed":
            return {
                ...state,
                productSearch: action.value,
                selectedProductId: "",
                productPage: 1,
            }
        case "product-page-changed":
            return {
                ...state,
                productPage: action.value,
            }
        case "product-limit-changed":
            return {
                ...state,
                productLimit: action.value,
                productPage: 1,
            }
        case "product-selected":
            return {
                ...state,
                selectedProductId: action.value,
                detailPage: 1,
            }
        case "detail-search-changed":
            return {
                ...state,
                detailSearch: action.value,
                detailPage: 1,
            }
        case "detail-page-changed":
            return {
                ...state,
                detailPage: action.value,
            }
        case "detail-limit-changed":
            return {
                ...state,
                detailLimit: action.value,
                detailPage: 1,
            }
        default:
            return state
    }
}

export function useSupplierWorkspaceState() {
    const [state, dispatch] = useReducer(supplierWorkspaceReducer, INITIAL_STATE)

    return {
        state,
        resetForSupplierSelection: () => dispatch({ type: "supplier-selected" }),
        setSelectedCategoryId: (value: string) => dispatch({ type: "category-changed", value }),
        setProductSearch: (value: string) => dispatch({ type: "product-search-changed", value }),
        setProductPage: (value: number | ((previous: number) => number)) =>
            dispatch({
                type: "product-page-changed",
                value: typeof value === "function" ? value(state.productPage) : value,
            }),
        setProductLimit: (value: number) => dispatch({ type: "product-limit-changed", value }),
        setSelectedProductId: (value: string) => dispatch({ type: "product-selected", value }),
        setDetailSearch: (value: string) => dispatch({ type: "detail-search-changed", value }),
        setDetailPage: (value: number | ((previous: number) => number)) =>
            dispatch({
                type: "detail-page-changed",
                value: typeof value === "function" ? value(state.detailPage) : value,
            }),
        setDetailLimit: (value: number) => dispatch({ type: "detail-limit-changed", value }),
    }
}

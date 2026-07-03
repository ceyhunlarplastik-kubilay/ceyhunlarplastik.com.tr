import axios from "axios"
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form"

type ApiValidationError = {
    field?: string
    message?: string
}

function normalizeFieldName(field?: string) {
    if (!field) return null
    return field.replace(/^body\./, "").replace(/^payload\./, "")
}

export function getApiErrorMessage(error: unknown, fallback = "İşlem tamamlanamadı") {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error && error.message ? error.message : fallback
    }

    const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        fallback

    if (message === "Validation failed") {
        return "Lütfen formdaki alanları kontrol edin."
    }

    if (message === "Code must be lower snake_case") {
        return "Kod küçük harf ve snake_case formatında olmalıdır."
    }

    return message
}

export function mapApiErrorToFormErrors<TFieldValues extends FieldValues>(
    error: unknown,
    setError: UseFormSetError<TFieldValues>,
    allowedFields: readonly FieldPath<TFieldValues>[],
) {
    if (!axios.isAxiosError(error)) return false

    const errors = error.response?.data?.error?.errors as ApiValidationError[] | undefined
    if (!errors?.length) return false

    const allowed = new Set<string>(allowedFields)
    let applied = false

    for (const apiError of errors) {
        const field = normalizeFieldName(apiError.field)
        if (!field || !allowed.has(field)) continue

        setError(field as FieldPath<TFieldValues>, {
            type: "server",
            message: apiError.message === "Code must be lower snake_case"
                ? "Kod küçük harf ve snake_case formatında olmalıdır."
                : apiError.message || "Bu alanı kontrol edin.",
        })
        applied = true
    }

    return applied
}

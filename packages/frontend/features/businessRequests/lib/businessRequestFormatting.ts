export function renderDataValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "-"
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "boolean") return value ? "Evet" : "Hayır"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
}

export function formatDateValue(value: unknown) {
    if (typeof value !== "string" || !value) return "-"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

export function formatMoneyValue(value: unknown, currency = "TRY") {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-"

    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value)
    } catch {
        return `${value.toFixed(2)} ${currency}`
    }
}

export function formatPercentValue(value: number) {
    return value.toLocaleString("tr-TR", {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })
}

export function getDocumentTypeLabel(value: string) {
    const labels: Record<string, string> = {
        TECHNICAL_DRAWING: "Teknik Çizim",
        CERTIFICATE: "Sertifika",
        CATALOG: "Katalog",
        TEST_REPORT: "Test Raporu",
        MATERIAL_DECLARATION: "Malzeme Beyanı",
        THREE_D_MODEL: "3D Model",
        OTHER: "Diğer",
    }

    return labels[value] ?? value
}

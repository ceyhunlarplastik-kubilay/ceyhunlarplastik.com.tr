export const safeNumber = (value?: string): number | undefined => {
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}
 
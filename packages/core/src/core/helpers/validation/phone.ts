export const PHONE_INPUT_REGEX = /^[+\d\s()-]{8,24}$/

export function normalizePhoneNumberToE164(input: string): string | null {
    const trimmed = input.trim()
    if (!trimmed || !PHONE_INPUT_REGEX.test(trimmed)) {
        return null
    }

    const plusCount = (trimmed.match(/\+/g) ?? []).length
    if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith("+"))) {
        return null
    }

    if (trimmed.startsWith("+")) {
        const digits = trimmed.slice(1).replace(/\D/g, "")
        if (digits.length < 8 || digits.length > 15) {
            return null
        }

        return `+${digits}`
    }

    const digits = trimmed.replace(/\D/g, "")
    if (!digits) {
        return null
    }

    if (digits.startsWith("00")) {
        const internationalDigits = digits.slice(2)
        if (internationalDigits.length < 8 || internationalDigits.length > 15) {
            return null
        }

        return `+${internationalDigits}`
    }

    // Turkey-local inputs: 5xx..., 0 5xx..., 90 5xx..., and landline equivalents.
    if (digits.length === 10 && /^[2345]/.test(digits)) {
        return `+90${digits}`
    }

    if (digits.length === 11 && digits.startsWith("0") && /^[2345]/.test(digits[1] ?? "")) {
        return `+90${digits.slice(1)}`
    }

    if (digits.length === 12 && digits.startsWith("90") && /^[2345]/.test(digits[2] ?? "")) {
        return `+${digits}`
    }

    return null
}

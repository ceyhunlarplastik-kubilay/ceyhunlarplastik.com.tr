type ColorLabelInput = {
    name?: string | null
    system?: string | null
    code?: string | number | null
}

export function formatColorLabel(color?: ColorLabelInput | null) {
    if (!color) return "-"

    const name = String(color.name ?? "").trim()
    const system = String(color.system ?? "").trim()
    const code = String(color.code ?? "").trim()
    const systemCode = `${system}${code}`.trim()

    if (systemCode && name) return `${systemCode} ${name}`
    if (name) return name
    if (systemCode) return systemCode
    return "-"
}


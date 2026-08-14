import {
    parseProductModel3dConfig,
    validateProductModel3dConfigReferences,
    type ProductModel3dConfig,
} from "@core/helpers/products/model3dConfig"

const GLB_MAGIC = 0x46546c67
const GLB_JSON_CHUNK = 0x4e4f534a
const GLB_BIN_CHUNK = 0x004e4942
const CONFIG_EXTRAS_KEY = "ceyhunlarModel3d"

type GltfNamedItem = {
    name?: string
    extras?: Record<string, unknown>
}

type GltfJson = {
    asset?: {
        version?: string
        extras?: Record<string, unknown>
    }
    scene?: number
    scenes?: GltfNamedItem[]
    nodes?: GltfNamedItem[]
    meshes?: GltfNamedItem[]
    materials?: GltfNamedItem[]
    animations?: GltfNamedItem[]
    buffers?: Array<{ byteLength?: number; uri?: string }>
    images?: Array<{ uri?: string; bufferView?: number }>
}

export class Model3dGlbValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "Model3dGlbValidationError"
    }
}

export type Model3dGlbInspection = {
    json: GltfJson
    model3dConfig: ProductModel3dConfig | null
    nodeNames: string[]
    materialNames: string[]
    animationNames: string[]
}

function collectUniqueNames(items: GltfNamedItem[] | undefined, label: string) {
    const names = (items ?? [])
        .map((item) => item.name?.trim())
        .filter((name): name is string => Boolean(name))
    const seen = new Set<string>()

    for (const name of names) {
        if (seen.has(name)) {
            throw new Model3dGlbValidationError(`${label} adı birden fazla kullanılmış: ${name}`)
        }
        seen.add(name)
    }

    return names
}

function parseEmbeddedConfig(value: unknown): ProductModel3dConfig | null {
    if (value === undefined || value === null) return null

    let candidate = value
    if (typeof candidate === "string") {
        try {
            candidate = JSON.parse(candidate)
        } catch {
            throw new Model3dGlbValidationError("GLB içindeki parametrik yapılandırma geçerli JSON değil")
        }
    }

    const parsed = parseProductModel3dConfig(candidate)
    if (!parsed) {
        throw new Model3dGlbValidationError("GLB içindeki ceyhunlarModel3d yapılandırması v1 şemasına uymuyor")
    }

    return parsed
}

function readEmbeddedConfig(json: GltfJson) {
    const sceneConfig = json.scenes?.[json.scene ?? 0]?.extras?.[CONFIG_EXTRAS_KEY]
    const configNode = json.nodes?.find((node) => node.name === "CEYHUNLAR_CONFIG")

    return json.asset?.extras?.[CONFIG_EXTRAS_KEY]
        ?? sceneConfig
        ?? configNode?.extras?.[CONFIG_EXTRAS_KEY]
}

export function inspectModel3dGlb(arrayBuffer: ArrayBuffer): Model3dGlbInspection {
    if (arrayBuffer.byteLength < 20) {
        throw new Model3dGlbValidationError("Dosya geçerli bir GLB başlığı içermiyor")
    }

    const view = new DataView(arrayBuffer)
    if (view.getUint32(0, true) !== GLB_MAGIC) {
        throw new Model3dGlbValidationError("Yalnız tek dosyalık GLB formatı kabul edilir")
    }
    if (view.getUint32(4, true) !== 2) {
        throw new Model3dGlbValidationError("Yalnız glTF 2.0 GLB dosyaları desteklenir")
    }

    const declaredLength = view.getUint32(8, true)
    if (declaredLength !== arrayBuffer.byteLength) {
        throw new Model3dGlbValidationError("GLB dosya uzunluğu başlık bilgisiyle eşleşmiyor")
    }

    let offset = 12
    let jsonChunk: Uint8Array | null = null
    let hasBinaryChunk = false

    while (offset + 8 <= declaredLength) {
        const chunkLength = view.getUint32(offset, true)
        const chunkType = view.getUint32(offset + 4, true)
        const chunkStart = offset + 8
        const chunkEnd = chunkStart + chunkLength

        if (chunkEnd > declaredLength) {
            throw new Model3dGlbValidationError("GLB chunk uzunluğu dosya sınırını aşıyor")
        }

        if (chunkType === GLB_JSON_CHUNK && !jsonChunk) {
            jsonChunk = new Uint8Array(arrayBuffer, chunkStart, chunkLength)
        }
        if (chunkType === GLB_BIN_CHUNK) hasBinaryChunk = true

        offset = chunkEnd
    }

    if (!jsonChunk) {
        throw new Model3dGlbValidationError("GLB JSON sahne bilgisi bulunamadı")
    }

    let json: GltfJson
    try {
        const jsonText = new TextDecoder().decode(jsonChunk).replace(/[\u0000\s]+$/g, "")
        json = JSON.parse(jsonText) as GltfJson
    } catch {
        throw new Model3dGlbValidationError("GLB JSON sahne bilgisi okunamadı")
    }

    if (json.asset?.version !== "2.0" || !(json.scenes?.length && json.nodes?.length && json.meshes?.length)) {
        throw new Model3dGlbValidationError("GLB geçerli bir glTF 2.0 sahnesi ve mesh içermelidir")
    }

    const externalBuffer = json.buffers?.find((buffer) => buffer.uri && !buffer.uri.startsWith("data:"))
    const externalImage = json.images?.find((image) => image.uri && !image.uri.startsWith("data:"))
    if (externalBuffer || externalImage) {
        throw new Model3dGlbValidationError("GLB harici buffer veya texture dosyasına bağımlı olamaz")
    }
    if (json.buffers?.some((buffer) => (buffer.byteLength ?? 0) > 0 && !buffer.uri) && !hasBinaryChunk) {
        throw new Model3dGlbValidationError("GLB binary buffer chunk'ı eksik")
    }

    const nodeNames = collectUniqueNames(json.nodes, "Node")
    const materialNames = collectUniqueNames(json.materials, "Materyal")
    const animationNames = collectUniqueNames(json.animations, "Animasyon")
    const model3dConfig = parseEmbeddedConfig(readEmbeddedConfig(json))

    if (model3dConfig) {
        const referenceIssues = validateProductModel3dConfigReferences(model3dConfig, {
            nodeNames,
            materialNames,
            animationNames,
        })
        if (referenceIssues.length > 0) {
            throw new Model3dGlbValidationError(referenceIssues.join("; "))
        }
    }

    return {
        json,
        model3dConfig,
        nodeNames,
        materialNames,
        animationNames,
    }
}

export async function validateModel3dGlbFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".glb")) {
        throw new Model3dGlbValidationError("3D model yüklemelerinde yalnız .glb dosyası kabul edilir")
    }

    return inspectModel3dGlb(await file.arrayBuffer())
}

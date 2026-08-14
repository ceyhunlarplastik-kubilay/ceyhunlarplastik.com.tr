import { describe, expect, it } from "vitest"

import { inspectModel3dGlb, Model3dGlbValidationError } from "./validateModel3dGlb"

function createGlb(json: Record<string, unknown>, includeBinaryChunk = true) {
    const encoded = new TextEncoder().encode(JSON.stringify(json))
    const paddedJsonLength = Math.ceil(encoded.length / 4) * 4
    const binaryLength = includeBinaryChunk ? 4 : 0
    const totalLength = 12 + 8 + paddedJsonLength + (includeBinaryChunk ? 8 + binaryLength : 0)
    const buffer = new ArrayBuffer(totalLength)
    const view = new DataView(buffer)

    view.setUint32(0, 0x46546c67, true)
    view.setUint32(4, 2, true)
    view.setUint32(8, totalLength, true)
    view.setUint32(12, paddedJsonLength, true)
    view.setUint32(16, 0x4e4f534a, true)

    const jsonBytes = new Uint8Array(buffer, 20, paddedJsonLength)
    jsonBytes.fill(0x20)
    jsonBytes.set(encoded)

    if (includeBinaryChunk) {
        const chunkOffset = 20 + paddedJsonLength
        view.setUint32(chunkOffset, binaryLength, true)
        view.setUint32(chunkOffset + 4, 0x004e4942, true)
    }

    return buffer
}

const baseJson = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "Body", mesh: 0 }],
    meshes: [{ name: "BodyMesh", primitives: [] }],
    materials: [{ name: "Plastic" }],
    buffers: [{ byteLength: 4 }],
}

describe("inspectModel3dGlb", () => {
    it("accepts a self-contained static GLB", () => {
        const result = inspectModel3dGlb(createGlb(baseJson))

        expect(result.model3dConfig).toBeNull()
        expect(result.nodeNames).toEqual(["Body"])
    })

    it("reads and validates embedded parametric configuration", () => {
        const result = inspectModel3dGlb(createGlb({
            ...baseJson,
            asset: {
                version: "2.0",
                extras: {
                    ceyhunlarModel3d: {
                        version: 1,
                        renderer: "r3f-parametric",
                        measurementUnit: "millimeter",
                        parameters: [{
                            measurementCode: "L",
                            baseValue: 100,
                            rules: [{ kind: "scale", node: "Body", axis: "x" }],
                        }],
                        materialSlots: [{
                            id: "body",
                            materialNames: ["Plastic"],
                            colorFromVariant: true,
                            materialPresets: {},
                        }],
                        animations: [],
                    },
                },
            },
        }))

        expect(result.model3dConfig?.parameters[0]?.baseValue).toBe(100)
    })

    it("rejects external resources and missing binary chunks", () => {
        expect(() => inspectModel3dGlb(createGlb({
            ...baseJson,
            buffers: [{ byteLength: 4, uri: "scene.bin" }],
        }))).toThrow(Model3dGlbValidationError)

        expect(() => inspectModel3dGlb(createGlb(baseJson, false))).toThrow("binary buffer")
    })

    it("rejects configuration references that are not in the GLB", () => {
        expect(() => inspectModel3dGlb(createGlb({
            ...baseJson,
            asset: {
                version: "2.0",
                extras: {
                    ceyhunlarModel3d: {
                        version: 1,
                        renderer: "r3f-parametric",
                        parameters: [{
                            measurementCode: "L",
                            baseValue: 100,
                            rules: [{ kind: "scale", node: "Missing", axis: "x" }],
                        }],
                    },
                },
            },
        }))).toThrow("Missing")
    })
})

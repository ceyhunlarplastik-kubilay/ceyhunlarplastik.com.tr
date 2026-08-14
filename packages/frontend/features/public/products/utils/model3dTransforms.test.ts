import { describe, expect, it } from "vitest"
import { Box3, Vector3 } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { productModel3dConfigSchema } from "@core/helpers/products/model3dConfig"
import {
    calculateParametricNodeTransforms,
    ParametricMeasurementError,
} from "./model3dTransforms"

const config = productModel3dConfigSchema.parse({
    version: 1,
    renderer: "r3f-parametric",
    parameters: [
        {
            measurementCode: "L",
            baseValue: 100,
            min: 80,
            max: 200,
            rules: [
                { kind: "scale", node: "Stretch", axis: "x" },
                { kind: "translate", node: "End", axis: "x", factor: 1 },
            ],
        },
        {
            measurementCode: "H",
            baseValue: 20,
            rules: [{ kind: "scale", node: "Stretch", axis: "y" }],
        },
    ],
})

function createParametricFixtureGlb() {
    // 100 mm × 20 mm üçgen: gerçek GLTFLoader ile parse edilen self-contained GLB.
    const positions = new Float32Array([
        0, 0, 0,
        0.1, 0, 0,
        0, 0.02, 0,
    ])
    const indices = new Uint16Array([0, 1, 2])
    const binaryChunk = new Uint8Array(44)
    binaryChunk.set(new Uint8Array(positions.buffer), 0)
    binaryChunk.set(new Uint8Array(indices.buffer), 36)

    const json = {
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ name: "Stretch", mesh: 0 }, { name: "End" }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
        buffers: [{ byteLength: 42 }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
            { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 },
        ],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [0, 0, 0],
                max: [0.1, 0.02, 0],
            },
            { bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" },
        ],
    }
    const jsonBytes = new TextEncoder().encode(JSON.stringify(json))
    const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4
    const totalLength = 12 + 8 + paddedJsonLength + 8 + binaryChunk.byteLength
    const buffer = new ArrayBuffer(totalLength)
    const view = new DataView(buffer)

    view.setUint32(0, 0x46546c67, true)
    view.setUint32(4, 2, true)
    view.setUint32(8, totalLength, true)
    view.setUint32(12, paddedJsonLength, true)
    view.setUint32(16, 0x4e4f534a, true)
    const paddedJson = new Uint8Array(buffer, 20, paddedJsonLength)
    paddedJson.fill(0x20)
    paddedJson.set(jsonBytes)
    const binaryOffset = 20 + paddedJsonLength
    view.setUint32(binaryOffset, binaryChunk.byteLength, true)
    view.setUint32(binaryOffset + 4, 0x004e4942, true)
    new Uint8Array(buffer, binaryOffset + 8, binaryChunk.byteLength).set(binaryChunk)

    return buffer
}

describe("calculateParametricNodeTransforms", () => {
    it("produces exact scale ratios and millimeter-to-meter translations", () => {
        const result = calculateParametricNodeTransforms(config, { L: 150, H: 25 })

        expect(result.get("Stretch")).toEqual({
            scale: { x: 1.5, y: 1.25, z: 1 },
            translationMeters: { x: 0, y: 0, z: 0 },
        })
        expect(result.get("End")?.translationMeters.x).toBeCloseTo(0.05, 10)

        // 100 mm temel parça 1.5 ölçekle 150 mm olur; hata 0.1 mm'nin altındadır.
        const resultingLengthMm = 100 * (result.get("Stretch")?.scale.x ?? 0)
        expect(Math.abs(resultingLengthMm - 150)).toBeLessThanOrEqual(0.1)
    })

    it("uses base values when a measurement is not supplied", () => {
        const result = calculateParametricNodeTransforms(config, {})
        expect(result.get("Stretch")?.scale).toEqual({ x: 1, y: 1, z: 1 })
        expect(result.get("End")?.translationMeters.x).toBe(0)
    })

    it("rejects measurements outside the authored range", () => {
        expect(() => calculateParametricNodeTransforms(config, { L: 240 }))
            .toThrow(ParametricMeasurementError)
    })

    it("deforms a GLB fixture to the target measurement within 0.1 mm", async () => {
        const gltf = await new GLTFLoader().parseAsync(createParametricFixtureGlb(), "")
        const stretchNode = gltf.scene.getObjectByName("Stretch")
        const transform = calculateParametricNodeTransforms(config, { L: 150 }).get("Stretch")

        expect(stretchNode).toBeDefined()
        expect(transform).toBeDefined()
        stretchNode!.scale.x *= transform!.scale.x
        gltf.scene.updateMatrixWorld(true)

        const resultingLengthMm = new Box3()
            .setFromObject(gltf.scene)
            .getSize(new Vector3()).x * 1000
        expect(Math.abs(resultingLengthMm - 150)).toBeLessThanOrEqual(0.1)
    })
})

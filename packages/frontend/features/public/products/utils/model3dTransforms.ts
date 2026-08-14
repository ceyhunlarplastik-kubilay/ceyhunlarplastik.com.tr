import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"

export type AxisVector = {
    x: number
    y: number
    z: number
}

export type ParametricNodeTransform = {
    scale: AxisVector
    translationMeters: AxisVector
}

export class ParametricMeasurementError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ParametricMeasurementError"
    }
}

function emptyNodeTransform(): ParametricNodeTransform {
    return {
        scale: { x: 1, y: 1, z: 1 },
        translationMeters: { x: 0, y: 0, z: 0 },
    }
}

/**
 * Manifest kurallarını temel GLB transformlarına uygulanacak bağıl değerlere çevirir.
 * Sonuç her seferinde base transformlara uygulanmalıdır; kümülatif mutasyon yapılmaz.
 */
export function calculateParametricNodeTransforms(
    config: ProductModel3dConfig,
    measurements: Readonly<Record<string, number | undefined>>,
) {
    const transforms = new Map<string, ParametricNodeTransform>()

    for (const parameter of config.parameters) {
        const targetValue = measurements[parameter.measurementCode] ?? parameter.baseValue

        if (!Number.isFinite(targetValue) || targetValue <= 0) {
            throw new ParametricMeasurementError(
                `${parameter.measurementCode} ölçüsü pozitif ve sonlu olmalıdır`,
            )
        }
        if (parameter.min !== undefined && targetValue < parameter.min) {
            throw new ParametricMeasurementError(
                `${parameter.measurementCode} ölçüsü minimum ${parameter.min} olmalıdır`,
            )
        }
        if (parameter.max !== undefined && targetValue > parameter.max) {
            throw new ParametricMeasurementError(
                `${parameter.measurementCode} ölçüsü maksimum ${parameter.max} olmalıdır`,
            )
        }

        const ratio = targetValue / parameter.baseValue
        const deltaMeters = (targetValue - parameter.baseValue) / 1000

        for (const rule of parameter.rules) {
            const transform = transforms.get(rule.node) ?? emptyNodeTransform()

            if (rule.kind === "scale") {
                transform.scale[rule.axis] *= ratio
            } else {
                transform.translationMeters[rule.axis] += deltaMeters * rule.factor
            }

            transforms.set(rule.node, transform)
        }
    }

    return transforms
}

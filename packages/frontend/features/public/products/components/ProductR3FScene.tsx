"use client"

import { useEffect, useMemo, useRef } from "react"
import { Bounds, ContactShadows, OrbitControls, useAnimations, useBounds, useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import {
    Box3,
    Color,
    Material,
    Mesh,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    Object3D,
    Vector3,
} from "three"
import { clone as cloneSkinnedScene } from "three/addons/utils/SkeletonUtils.js"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"
import { calculateParametricNodeTransforms } from "@/features/public/products/utils/model3dTransforms"

type Props = {
    src: string
    config: ProductModel3dConfig
    measurements: Readonly<Record<string, number | undefined>>
    colorHex?: string
    materialCodes: string[]
    animationName?: string | null
    animationPlaying: boolean
    resetToken: number
    reduceMotion: boolean
    onReady: (animationNames: string[]) => void
    onDimensionsChange: (dimensions: Vector3) => void
}

type BaseTransform = {
    object: Object3D
    position: Vector3
    scale: Vector3
}

function isPbrMaterial(material: Material): material is MeshStandardMaterial | MeshPhysicalMaterial {
    return material instanceof MeshStandardMaterial || material instanceof MeshPhysicalMaterial
}

function ModelCameraControls({ resetToken, reduceMotion }: Pick<Props, "resetToken" | "reduceMotion">) {
    const bounds = useBounds()
    const invalidate = useThree((state) => state.invalidate)
    const controlsRef = useRef<OrbitControlsImpl>(null)

    useEffect(() => {
        controlsRef.current?.reset()
        bounds.refresh().clip().fit()
        invalidate()
    }, [bounds, invalidate, resetToken])

    return (
        <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping={!reduceMotion}
            dampingFactor={0.08}
            minDistance={0.05}
            maxDistance={100}
        />
    )
}

export default function ProductR3FScene({
    src,
    config,
    measurements,
    colorHex,
    materialCodes,
    animationName,
    animationPlaying,
    resetToken,
    reduceMotion,
    onReady,
    onDimensionsChange,
}: Props) {
    const invalidate = useThree((state) => state.invalidate)
    const gltf = useGLTF(src)
    const scene = useMemo(() => {
        const nextScene = cloneSkinnedScene(gltf.scene)

        // useGLTF URL bazlı cache kullanır. Materyal değişikliklerinin başka bir
        // viewer'a sızmaması için her mesh kendi materyal kopyasını alır.
        nextScene.traverse((object) => {
            if (!(object instanceof Mesh)) return
            object.castShadow = true
            object.receiveShadow = true
            object.material = Array.isArray(object.material)
                ? object.material.map((material) => material.clone())
                : object.material.clone()
        })

        return nextScene
    }, [gltf.scene])

    const baseTransforms = useMemo(() => {
        const transforms = new Map<string, BaseTransform>()
        scene.traverse((object) => {
            if (!object.name) return
            transforms.set(object.name, {
                object,
                position: object.position.clone(),
                scale: object.scale.clone(),
            })
        })
        return transforms
    }, [scene])

    const materialRegistry = useMemo(() => {
        const materials = new Map<string, Material[]>()
        const baselines = new Map<Material, Material>()

        scene.traverse((object) => {
            if (!(object instanceof Mesh)) return
            const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
            for (const material of meshMaterials) {
                baselines.set(material, material.clone())
                if (!material.name) continue
                const entries = materials.get(material.name) ?? []
                entries.push(material)
                materials.set(material.name, entries)
            }
        })

        return { materials, baselines }
    }, [scene])

    const { actions, names: animationNames } = useAnimations(gltf.animations, scene)

    useEffect(() => {
        const transforms = calculateParametricNodeTransforms(config, measurements)

        for (const base of baseTransforms.values()) {
            base.object.position.copy(base.position)
            base.object.scale.copy(base.scale)
        }

        for (const [nodeName, transform] of transforms) {
            const base = baseTransforms.get(nodeName)
            if (!base) throw new Error(`Parametrik GLB node'u bulunamadı: ${nodeName}`)

            base.object.scale.set(
                base.scale.x * transform.scale.x,
                base.scale.y * transform.scale.y,
                base.scale.z * transform.scale.z,
            )
            base.object.position.set(
                base.position.x + transform.translationMeters.x,
                base.position.y + transform.translationMeters.y,
                base.position.z + transform.translationMeters.z,
            )
        }

        scene.updateMatrixWorld(true)
        onDimensionsChange(new Box3().setFromObject(scene).getSize(new Vector3()))
        invalidate()
    }, [baseTransforms, config, invalidate, measurements, onDimensionsChange, scene])

    useEffect(() => {
        for (const [material, baseline] of materialRegistry.baselines) {
            material.copy(baseline)
        }

        for (const slot of config.materialSlots) {
            const preset = materialCodes
                .map((code) => slot.materialPresets[code])
                .find((candidate) => candidate !== undefined)

            for (const materialName of slot.materialNames) {
                for (const material of materialRegistry.materials.get(materialName) ?? []) {
                    if (!isPbrMaterial(material)) continue

                    const resolvedColor = slot.colorFromVariant && colorHex
                        ? colorHex
                        : preset?.color
                    if (resolvedColor) material.color.copy(new Color(resolvedColor))
                    if (preset?.metalness !== undefined) material.metalness = preset.metalness
                    if (preset?.roughness !== undefined) material.roughness = preset.roughness
                    if (preset?.opacity !== undefined) {
                        material.opacity = preset.opacity
                        material.transparent = preset.opacity < 1
                    }
                    if (material instanceof MeshPhysicalMaterial && preset?.transmission !== undefined) {
                        material.transmission = preset.transmission
                    }
                    material.needsUpdate = true
                }
            }
        }

        invalidate()
    }, [colorHex, config.materialSlots, invalidate, materialCodes, materialRegistry])

    useEffect(() => {
        for (const action of Object.values(actions)) action?.stop()
        if (!animationPlaying || !animationName) return

        const action = actions[animationName]
        action?.reset().fadeIn(0.15).play()
        invalidate()

        return () => {
            action?.fadeOut(0.15)
        }
    }, [actions, animationName, animationPlaying, invalidate])

    useEffect(() => {
        const allowedNames = config.animations.length > 0
            ? config.animations.map((animation) => animation.clipName)
            : animationNames
        onReady(allowedNames)

        return () => {
            scene.traverse((object) => {
                if (!(object instanceof Mesh)) return
                const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
                meshMaterials.forEach((material) => material.dispose())
            })
            materialRegistry.baselines.forEach((material) => material.dispose())
        }
    }, [animationNames, config.animations, materialRegistry.baselines, onReady, scene])

    return (
        <>
            <ambientLight intensity={1.4} />
            <directionalLight position={[4, 5, 3]} intensity={3.2} castShadow />
            <directionalLight position={[-3, 2, -4]} intensity={1.2} />

            <Bounds fit clip observe margin={1.2}>
                <primitive object={scene} />
                <ModelCameraControls resetToken={resetToken} reduceMotion={reduceMotion} />
            </Bounds>

            <ContactShadows
                position={[0, -1.05, 0]}
                opacity={0.28}
                scale={8}
                blur={2.4}
                far={5}
                frames={1}
            />
        </>
    )
}

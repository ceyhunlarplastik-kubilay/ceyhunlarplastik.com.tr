import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { IProductVariantTableDependencies, IGetProductVariantTableEvent } from "@/functions/PublicApi/types/products"

export const getProductVariantTableHandler = ({ productVariantRepository }: IProductVariantTableDependencies) => {
    return async (event: IGetProductVariantTableEvent) => {
        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("productId required")

        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ["id"], // Custom sorting handled in memory
                defaultSort: "id",
            })

        try {
            // 1. Fetch all variants without pagination to deduplicate
            const rawVariants = await productVariantRepository.getProductVariantTableData(productId)

            // 2. Deduplicate variants
            // Rules: Same product, same dimensions, same color/material = same table row
            const uniqueRows = new Map()

            rawVariants.forEach(v => {
                // Generate a unique fingerprint for this variant's configuration
                // Sort dimensions to ensure order independence in the key
                const measurementsKey = v.measurements
                    .map((m: any) => `${m.measurementType.code}:${m.value}`)
                    .sort()
                    .join("|")

                const colorKey = v.color?.id ?? "no-color"
                const materialKeys = v.materials.map((mat: any) => mat.id).sort().join("|")
                const versionKey = v.versionCode

                const fingerprint = `${versionKey}#${measurementsKey}#${colorKey}#${materialKeys}`

                if (!uniqueRows.has(fingerprint)) {
                    // Extract unique dimension codes used across all variants
                    // to dynamically calculate columns if needed by frontend
                    uniqueRows.set(fingerprint, v)
                }
            })

            let deduped = Array.from(uniqueRows.values())

            // 3. Search text
            if (search) {
                const s = search.toLowerCase()
                deduped = deduped.filter(v =>
                    v.versionCode.toLowerCase().includes(s) ||
                    v.fullCode.toLowerCase().includes(s)
                )
            }

            // 4. Sort dynamically based on dimension displayOrder
            // We sort by the first dimension (lowest displayOrder), then second, etc.
            deduped.sort((a, b) => {
                // Ensure measurements are sorted by measurementType.displayOrder
                const aM = [...a.measurements].sort((m1, m2) => m1.measurementType.displayOrder - m2.measurementType.displayOrder)
                const bM = [...b.measurements].sort((m1, m2) => m1.measurementType.displayOrder - m2.measurementType.displayOrder)

                // Compare dimension by dimension
                const len = Math.max(aM.length, bM.length)
                for (let i = 0; i < len; i++) {
                    const valA = aM[i]?.value ?? 0
                    const valB = bM[i]?.value ?? 0
                    if (valA !== valB) {
                        return valA - valB // Standard asc
                    }
                }

                // If dimensions match (Should be prevented by deduping, but just in case),
                // fallback to version code sort
                return a.versionCode.localeCompare(b.versionCode)
            })

            // If user requested desc
            if (order === "desc") {
                deduped.reverse()
            }

            // 5. Paginate in-memory
            const total = deduped.length
            const totalPages = Math.ceil(total / limit)
            const paginated = deduped.slice((page - 1) * limit, page * limit)

            // Calculate dynamic columns (all unique measurement codes found in paginated results)
            const dynamicColumns = Array.from(
                new Set(
                    paginated.flatMap(v => v.measurements.map((m: any) => m.measurementType.code))
                )
            )

            // Return standardized api pattern
            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: paginated, // Matches list endpoints structure
                    meta: {
                        page,
                        limit,
                        total,
                        totalPages,
                        columns: dynamicColumns // Bonus for frontend rendering
                    }
                }
            })

        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get variant table")
        }
    }
}



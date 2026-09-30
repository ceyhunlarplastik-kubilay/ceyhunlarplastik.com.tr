import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import { toMeasurementLabel } from "@/core/helpers/productVariants/measurementDisplay"
import { buildProductSizeCode, formatVersionCode } from "@/core/helpers/productVariants/variantCode"

/**
 * Üretim planlamanın DAR ürün sözlüğü: kalıp göz grubu seçerken ürün modeli → ölçü.
 * Katalog uçlarının yetkisi genişletilmedi (onlar fiyat, tedarikçi, asset taşıyor);
 * burası yalnız kimlik + ölçü etiketi döner (AGENTS.md: dar, amaca özel uç).
 */

export const productSizeLabelSelect = {
    id: true,
    code: true,
    values: {
        select: {
            id: true,
            value: true,
            rawValue: true,
            requirement: {
                select: {
                    label: true,
                    unit: true,
                    isRequired: true,
                    measurementType: {
                        select: { id: true, code: true, name: true, baseUnit: true, displayOrder: true },
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductSizeSelect

type ProductSizeLabelRecord = Prisma.ProductSizeGetPayload<{ select: typeof productSizeLabelSelect }>

export type ProductSizeRefDto = {
    id: string
    code: number
    /** "10.5.8" */
    sizeCode: string
    /** "Elcik Çapı: 10 mm · Boy: 30 mm" */
    label: string
}

export function toProductSizeRef(productCode: string, size: ProductSizeLabelRecord): ProductSizeRefDto {
    return {
        id: size.id,
        code: size.code,
        sizeCode: buildProductSizeCode(productCode, size.code),
        label: toMeasurementLabel(size.values.map((value) => ({
            id: value.id,
            value: value.value,
            rawValue: value.rawValue,
            label: value.requirement.label,
            unit: value.requirement.unit,
            isRequired: value.requirement.isRequired,
            measurementType: value.requirement.measurementType,
        }))),
    }
}

export type ReferenceProductDto = {
    id: string
    code: string
    name: string
    sizeCount: number
}

export type ReferenceProductSizesDto = {
    product: { id: string; code: string; name: string }
    sizes: Array<ProductSizeRefDto & {
        /** Katalogdaki varyant sayısı — 0 ise ölçü yalnız kalıp yüzünden duruyor. */
        variantCount: number
        /** Bu ölçüyü basan kalıp sayısı. */
        moldCount: number
    }>
}

/**
 * İÇ ÜRETİM varyantı: "kendi üretimimiz" işaretli tedarikçiye (`Supplier.isInHouseProduction`) bağlı.
 * Tedarikçi ADINA bakılmaz. Bağlantının aktifliği aranmaz: pasif = satışa kapalı, üretilebilir.
 */
export const inHouseVariantWhere = {
    variantSuppliers: { some: { supplier: { isInHouseProduction: true } } },
} satisfies Prisma.ProductVariantWhereInput

/**
 * Kalıba bağlanabilir ölçü: iç üretim varyantı olan, ya da ZATEN kalıbı olan (işaret gelmeden önce
 * tanımlanmış kalıplar düzenlenebilir kalsın).
 */
export const moldAssignableSizeWhere = {
    OR: [{ variants: { some: inHouseVariantWhere } }, { moldOutputs: { some: {} } }],
} satisfies Prisma.ProductSizeWhereInput

/** Kullanım dışı olmayan kalıbın gözü — üretilebilir ölçünün ölçütü. */
export const usableMoldOutputWhere = {
    mold: { status: { not: "RETIRED" } },
} satisfies Prisma.MoldOutputWhereInput

export const moldOutputSummarySelect = {
    cavities: true,
    mold: { select: { id: true, code: true, name: true, status: true } },
} satisfies Prisma.MoldOutputSelect

type MoldOutputSummaryRecord = Prisma.MoldOutputGetPayload<{ select: typeof moldOutputSummarySelect }>

export type MoldSummaryDto = { id: string; code: string; name: string; status: string; cavities: number }

export function toMoldSummary(output: MoldOutputSummaryRecord): MoldSummaryDto {
    return { ...output.mold, cavities: output.cavities }
}

export const variantVersionSelect = {
    code: true,
    signature: true,
    color: { select: { name: true, hex: true } },
    materials: { select: { id: true, name: true, code: true }, orderBy: { name: "asc" } },
} satisfies Prisma.VariantVersionSelect

type VariantVersionRecord = Prisma.VariantVersionGetPayload<{ select: typeof variantVersionSelect }>

export type VariantVersionDto = {
    /** "V1" */
    code: string
    colorName: string | null
    colorHex: string | null
    /** Kısa hammadde adları: kodu varsa kod ("PP"), yoksa ad. */
    materials: string[]
    /** Hammadde kimlikleri — planlamada çevrim katsayısı için. */
    materialIds: string[]
    /** "color:<id>|materials:<id>,…" — işin baskı ayarı (aile kalıbında aynı imza). */
    signature: string
}

export function toVariantVersion(version: VariantVersionRecord): VariantVersionDto {
    return {
        code: formatVersionCode(version.code),
        colorName: version.color?.name ?? null,
        colorHex: version.color?.hex ?? null,
        materials: version.materials.map((material) => material.code || material.name),
        materialIds: version.materials.map((material) => material.id),
        signature: version.signature,
    }
}

export type ReferenceVariantDto = { id: string; fullCode: string; version: VariantVersionDto }

export type ReferenceProductVariantsDto = {
    product: { id: string; code: string; name: string }
    /** Yalnız ÜRETİLEBİLİR ölçüler: kullanım dışı olmayan en az bir kalıbı olan. */
    sizes: Array<ProductSizeRefDto & { molds: MoldSummaryDto[]; variants: ReferenceVariantDto[] }>
}

/** Emir açarken gereken varyant bilgisi: ölçüsü ve üretilebilir kalıp sayısı. */
export type VariantForOrderDto = {
    id: string
    fullCode: string
    productSizeId: string
    usableMoldCount: number
    /** İç üretim tedarikçisine bağlı mı — değilse üretim emri açılamaz. */
    isInHouse: boolean
}

export type ReferenceCustomerDto = { id: string; name: string }

export function customerDisplayName(customer: { id: string; companyName: string | null; fullName: string | null }) {
    return customer.companyName?.trim() || customer.fullName?.trim() || "Adsız müşteri"
}

export interface IPrismaProductionReferenceRepository {
    /** `moldableOnly`: yalnız üretilebilir (kalıplı) ölçüsü ve varyantı olan ürün modelleri. */
    listProductsWithSizes(options?: { moldableOnly?: boolean }): Promise<ReferenceProductDto[]>
    getProductSizes(productId: string): Promise<ReferenceProductSizesDto | null>
    getProductVariants(productId: string): Promise<ReferenceProductVariantsDto | null>
    getVariantForOrder(variantId: string): Promise<VariantForOrderDto | null>
    findExistingProductSizeIds(ids: string[]): Promise<Set<string>>
    /** Verilenlerden kalıba bağlanabilir olanlar (`moldAssignableSizeWhere`). */
    findMoldAssignableProductSizeIds(ids: string[]): Promise<Set<string>>
    /** Gerçek müşteriler (aday değil), ada göre; en fazla 20. */
    searchCustomers(search: string): Promise<ReferenceCustomerDto[]>
    customerExists(id: string): Promise<boolean>
}

export const productionReferenceRepository = (): IPrismaProductionReferenceRepository => {
    const listProductsWithSizes = async ({ moldableOnly = false }: { moldableOnly?: boolean } = {}) => {
        const products = await prisma.product.findMany({
            where: moldableOnly
                ? { sizes: { some: { moldOutputs: { some: usableMoldOutputWhere }, variants: { some: inHouseVariantWhere } } } }
                : { sizes: { some: moldAssignableSizeWhere } },
            orderBy: { code: "asc" },
            select: { id: true, code: true, name: true, _count: { select: { sizes: true } } },
        })
        return products.map(({ _count, ...product }) => ({ ...product, sizeCount: _count.sizes }))
    }

    const getProductSizes = async (productId: string) => {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                code: true,
                name: true,
                sizes: {
                    where: moldAssignableSizeWhere,
                    // Ölçü KODU append-only, sıralı değil — küçükten büyüğe sıra `sortKey` ile.
                    orderBy: { sortKey: "asc" },
                    select: {
                        ...productSizeLabelSelect,
                        _count: { select: { variants: true, moldOutputs: true } },
                    },
                },
            },
        })
        if (!product) return null

        return {
            product: { id: product.id, code: product.code, name: product.name },
            sizes: product.sizes.map(({ _count, ...size }) => ({
                ...toProductSizeRef(product.code, size),
                variantCount: _count.variants,
                moldCount: _count.moldOutputs,
            })),
        }
    }

    const getProductVariants = async (productId: string) => {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                code: true,
                name: true,
                sizes: {
                    where: { moldOutputs: { some: usableMoldOutputWhere }, variants: { some: inHouseVariantWhere } },
                    orderBy: { sortKey: "asc" },
                    select: {
                        ...productSizeLabelSelect,
                        moldOutputs: {
                            where: usableMoldOutputWhere,
                            orderBy: { mold: { code: "asc" } },
                            select: moldOutputSummarySelect,
                        },
                        variants: {
                            where: inHouseVariantWhere,
                            orderBy: { version: { code: "asc" } },
                            select: { id: true, fullCode: true, version: { select: variantVersionSelect } },
                        },
                    },
                },
            },
        })
        if (!product) return null

        return {
            product: { id: product.id, code: product.code, name: product.name },
            sizes: product.sizes.map(({ moldOutputs, variants, ...size }) => ({
                ...toProductSizeRef(product.code, size),
                molds: moldOutputs.map(toMoldSummary),
                variants: variants.map((variant) => ({
                    id: variant.id,
                    fullCode: variant.fullCode,
                    version: toVariantVersion(variant.version),
                })),
            })),
        }
    }

    const getVariantForOrder = async (variantId: string) => {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            select: {
                id: true,
                fullCode: true,
                productSizeId: true,
                size: { select: { _count: { select: { moldOutputs: { where: usableMoldOutputWhere } } } } },
                _count: { select: { variantSuppliers: { where: { supplier: { isInHouseProduction: true } } } } },
            },
        })
        if (!variant) return null
        return {
            id: variant.id,
            fullCode: variant.fullCode,
            productSizeId: variant.productSizeId,
            usableMoldCount: variant.size._count.moldOutputs,
            isInHouse: variant._count.variantSuppliers > 0,
        }
    }

    const searchCustomers = async (search: string) => {
        const needle = search.trim()
        const customers = await prisma.customer.findMany({
            where: {
                status: "CUSTOMER",
                ...(needle
                    ? {
                        OR: [
                            { companyName: { contains: needle, mode: "insensitive" } },
                            { fullName: { contains: needle, mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            orderBy: [{ companyName: "asc" }, { fullName: "asc" }],
            take: 20,
            select: { id: true, companyName: true, fullName: true },
        })
        return customers.map((customer) => ({ id: customer.id, name: customerDisplayName(customer) }))
    }

    const customerExists = async (id: string) => {
        const customer = await prisma.customer.findFirst({ where: { id, status: "CUSTOMER" }, select: { id: true } })
        return Boolean(customer)
    }

    const findExistingProductSizeIds = async (ids: string[]) => {
        if (ids.length === 0) return new Set<string>()
        const rows = await prisma.productSize.findMany({ where: { id: { in: ids } }, select: { id: true } })
        return new Set(rows.map((row) => row.id))
    }

    const findMoldAssignableProductSizeIds = async (ids: string[]) => {
        if (ids.length === 0) return new Set<string>()
        const rows = await prisma.productSize.findMany({
            where: { id: { in: ids }, ...moldAssignableSizeWhere },
            select: { id: true },
        })
        return new Set(rows.map((row) => row.id))
    }

    return {
        listProductsWithSizes,
        getProductSizes,
        getProductVariants,
        getVariantForOrder,
        findExistingProductSizeIds,
        findMoldAssignableProductSizeIds,
        searchCustomers,
        customerExists,
    }
}

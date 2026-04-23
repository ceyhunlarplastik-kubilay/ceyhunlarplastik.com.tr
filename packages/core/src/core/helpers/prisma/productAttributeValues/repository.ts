import { prisma } from "@/core/db/prisma"
import { Prisma, ProductAttributeValue } from "@/prisma/generated/prisma/client"

export type ProductAttributeValueWithParent = Prisma.ProductAttributeValueGetPayload<{
    include: { parentValue: true, assets: true }
}>

export type ProductAttributeValueWithAttribute = Prisma.ProductAttributeValueGetPayload<{
    include: {
        attribute: true
        parentValue: {
            include: {
                attribute: true
                parentValue: {
                    include: {
                        attribute: true
                    }
                }
            }
        }
        assets: true
    }
}>

export interface IPrismaProductAttributeValueRepository {
    listValues(attributeId: string): Promise<ProductAttributeValueWithParent[]>
    getValueById(id: string): Promise<ProductAttributeValueWithAttribute | null>
    createValue(data: Prisma.ProductAttributeValueCreateInput): Promise<ProductAttributeValue>
    updateValue(id: string, data: Prisma.ProductAttributeValueUpdateInput): Promise<ProductAttributeValue>
    deleteValue(id: string): Promise<ProductAttributeValue>
}

export const productAttributeValueRepository = (): IPrismaProductAttributeValueRepository => {

    const listValues = (attributeId: string) =>
        prisma.productAttributeValue.findMany({
            where: {
                attributeId,
                isActive: true
            },
            orderBy: {
                displayOrder: "asc"
            },
            include: {
                parentValue: true,
                assets: true,
            },
        })

    const getValueById = (id: string) =>
        prisma.productAttributeValue.findUnique({
            where: { id },
            include: {
                attribute: true,
                parentValue: {
                    include: {
                        attribute: true,
                        parentValue: {
                            include: {
                                attribute: true,
                            },
                        },
                    },
                },
                assets: true,
            },
        })

    const createValue = (data: Prisma.ProductAttributeValueCreateInput) =>
        prisma.productAttributeValue.create({
            data
        })

    const updateValue = (id: string, data: Prisma.ProductAttributeValueUpdateInput) =>
        prisma.productAttributeValue.update({
            where: { id },
            data
        })

    const deleteValue = (id: string) =>
        prisma.productAttributeValue.delete({
            where: { id }
        })

    return {
        listValues,
        getValueById,
        createValue,
        updateValue,
        deleteValue
    }
}

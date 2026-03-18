import { prisma } from "@/core/db/prisma"
import { Prisma, ProductAttributeValue } from "@/prisma/generated/prisma/client"

export interface IPrismaProductAttributeValueRepository {
    listValues(attributeId: string): Promise<ProductAttributeValue[]>
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
            }
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
        createValue,
        updateValue,
        deleteValue
    }
}

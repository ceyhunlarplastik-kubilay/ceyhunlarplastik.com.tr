import { prisma } from "@/core/db/prisma";
export const productAttributeValueRepository = () => {
    const listValues = (attributeId) => prisma.productAttributeValue.findMany({
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
    });
    const getValueById = (id) => prisma.productAttributeValue.findUnique({
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
    });
    const createValue = (data) => prisma.productAttributeValue.create({
        data
    });
    const updateValue = (id, data) => prisma.productAttributeValue.update({
        where: { id },
        data
    });
    const deleteValue = (id) => prisma.productAttributeValue.delete({
        where: { id }
    });
    return {
        listValues,
        getValueById,
        createValue,
        updateValue,
        deleteValue
    };
};

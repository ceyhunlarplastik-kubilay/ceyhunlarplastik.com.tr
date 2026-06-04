import { prisma } from "../src/core/db/prisma.js"

const INDUSTRIAL_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"] as const

type BackfillValue = {
  id: string
  name: string
  attribute: {
    code: string
  }
  parentValueId: string | null
  parentValue: BackfillValue | null
}

function getAttributeCode(value?: BackfillValue | null) {
  return value?.attribute?.code ?? ""
}

function buildUsageRows(attributeValues: BackfillValue[]) {
  const sectorValues = attributeValues.filter((value) => getAttributeCode(value) === "sector")
  const productionGroupValues = attributeValues.filter((value) => getAttributeCode(value) === "production_group")
  const usageAreaValues = attributeValues.filter((value) => getAttributeCode(value) === "usage_area")

  const rows: Array<{
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValueId: string | null
  }> = []

  for (const usageAreaValue of usageAreaValues) {
    const productionGroup =
      getAttributeCode(usageAreaValue.parentValue) === "production_group"
        ? usageAreaValue.parentValue
        : null
    const sector =
      getAttributeCode(productionGroup?.parentValue) === "sector"
        ? productionGroup?.parentValue
        : null

    rows.push({
      sectorValueId: sector?.id ?? null,
      productionGroupValueId: productionGroup?.id ?? null,
      usageAreaValueId: usageAreaValue.id,
    })
  }

  const usageAreaParentIds = new Set(usageAreaValues.map((value) => value.parentValueId).filter(Boolean))
  for (const productionGroupValue of productionGroupValues) {
    if (usageAreaParentIds.has(productionGroupValue.id)) continue

    const sector =
      getAttributeCode(productionGroupValue.parentValue) === "sector"
        ? productionGroupValue.parentValue
        : null

    rows.push({
      sectorValueId: sector?.id ?? null,
      productionGroupValueId: productionGroupValue.id,
      usageAreaValueId: null,
    })
  }

  const productionGroupParentIds = new Set(productionGroupValues.map((value) => value.parentValueId).filter(Boolean))
  const usageAreaSectorIds = new Set(
    usageAreaValues
      .map((value) => value.parentValue?.parentValueId)
      .filter(Boolean),
  )

  for (const sectorValue of sectorValues) {
    if (productionGroupParentIds.has(sectorValue.id) || usageAreaSectorIds.has(sectorValue.id)) continue

    rows.push({
      sectorValueId: sectorValue.id,
      productionGroupValueId: null,
      usageAreaValueId: null,
    })
  }

  return rows
}

async function main() {
  const industrialAttributeValues = await prisma.productAttributeValue.findMany({
    where: {
      attribute: {
        code: {
          in: [...INDUSTRIAL_ATTRIBUTE_CODES],
        },
      },
    },
    select: {
      id: true,
    },
  })

  const industrialValueIds = new Set(industrialAttributeValues.map((value) => value.id))

  const products = await prisma.product.findMany({
    include: {
      attributeValues: {
        where: {
          attribute: {
            code: {
              in: [...INDUSTRIAL_ATTRIBUTE_CODES],
            },
          },
        },
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
        },
      },
    },
  })

  let createdRows = 0
  let disconnectedValues = 0

  for (const product of products) {
    const attributeValues = product.attributeValues as BackfillValue[]
    if (attributeValues.length === 0) continue

    const rows = buildUsageRows(attributeValues)

    for (const [index, row] of rows.entries()) {
      const existing = await prisma.productIndustrialUsage.findFirst({
        where: {
          productId: product.id,
          sectorValueId: row.sectorValueId,
          productionGroupValueId: row.productionGroupValueId,
          usageAreaValueId: row.usageAreaValueId,
          usageFunction: null,
        },
      })

      if (existing) continue

      await prisma.productIndustrialUsage.create({
        data: {
          productId: product.id,
          sectorValueId: row.sectorValueId,
          productionGroupValueId: row.productionGroupValueId,
          usageAreaValueId: row.usageAreaValueId,
          displayOrder: index,
        },
      })
      createdRows += 1
    }

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        attributeValues: {
          disconnect: attributeValues.map((value) => ({ id: value.id })),
        },
      },
    })
    disconnectedValues += attributeValues.length
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      allowedAttributeValueIds: true,
    },
  })

  let cleanedCategories = 0
  for (const category of categories) {
    const nextAllowedIds = (category.allowedAttributeValueIds ?? []).filter((id) => !industrialValueIds.has(id))
    if (nextAllowedIds.length === (category.allowedAttributeValueIds ?? []).length) continue

    await prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        allowedAttributeValueIds: nextAllowedIds,
      },
    })
    cleanedCategories += 1
  }

  console.log("Product industrial usage backfill completed.", {
    products: products.length,
    createdRows,
    disconnectedValues,
    cleanedCategories,
  })
}

main()
  .catch((error) => {
    console.error("Product industrial usage backfill failed", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

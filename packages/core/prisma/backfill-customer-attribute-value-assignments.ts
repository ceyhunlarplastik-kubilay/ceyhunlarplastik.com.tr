import { prisma } from "../src/core/db/prisma.js"

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      sectorValueId: true,
      productionGroupValueId: true,
      usageAreaValues: {
        select: {
          id: true,
        },
      },
    },
  })

  let createdCount = 0

  for (const customer of customers) {
    const attributeValueIds = Array.from(new Set([
      customer.sectorValueId,
      customer.productionGroupValueId,
      ...customer.usageAreaValues.map((value) => value.id),
    ].filter((value): value is string => Boolean(value))))

    if (attributeValueIds.length === 0) continue

    for (const attributeValueId of attributeValueIds) {
      await prisma.customerAttributeValueAssignment.upsert({
        where: {
          customerId_attributeValueId: {
            customerId: customer.id,
            attributeValueId,
          },
        },
        update: {},
        create: {
          customerId: customer.id,
          attributeValueId,
          source: "LEGACY_BACKFILL",
        },
      })

      createdCount += 1
    }
  }

  console.log("Customer attribute assignment backfill completed.", {
    customers: customers.length,
    touchedAssignments: createdCount,
  })
}

main()
  .catch((error) => {
    console.error("Customer attribute assignment backfill failed", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

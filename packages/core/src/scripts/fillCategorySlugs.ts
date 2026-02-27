import slugify from "slugify";
import { prisma } from "@/core/db/prisma";

function makeSlug(input: string) {
    return slugify(input, { lower: true, strict: true, locale: "tr" });
}

// Aynı slug çıkarsa -2, -3 diye unique yap
async function ensureUniqueCategorySlug(base: string, categoryId: string) {
    let candidate = base;
    let i = 2;

    while (true) {
        const conflict = await prisma.category.findFirst({
            where: {
                slug: candidate,
                NOT: { id: categoryId },
            },
            select: { id: true },
        });

        if (!conflict) return candidate;
        candidate = `${base}-${i++}`;
    }
}

async function main() {
    const categories = await prisma.category.findMany({
        where: { OR: [{ slug: null }, { slug: "" }] },
        select: { id: true, name: true },
    });

    console.log(`Found ${categories.length} categories to backfill...`);

    for (const c of categories) {
        const base = makeSlug(c.name);
        const unique = await ensureUniqueCategorySlug(base, c.id);

        await prisma.category.update({
            where: { id: c.id },
            data: { slug: unique },
        });

        console.log(`✅ ${c.name} -> ${unique}`);
    }

    // ekstra kontrol: hala null var mı?
    const remaining = await prisma.category.count({ where: { slug: null } });
    if (remaining > 0) {
        throw new Error(`Backfill incomplete. Remaining null slugs: ${remaining}`);
    }

    console.log("🎉 All category slugs filled.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
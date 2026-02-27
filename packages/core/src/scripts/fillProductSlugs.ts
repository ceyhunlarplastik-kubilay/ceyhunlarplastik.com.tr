import { prisma } from "../core/db/prisma"
import slugify from "slugify"

async function main() {
    const products = await prisma.product.findMany({
        where: { slug: null }
    })

    console.log(products);

    for (const product of products) {

        const slug = slugify(product.name, {
            lower: true,
            strict: true,
            locale: "tr"
        })

        await prisma.product.update({
            where: { id: product.id },
            data: { slug }
        })

        console.log(`Slug created: ${product.name} -> ${slug}`)
    }
}

main()
    .then(() => {
        console.log("Slug migration complete")
        process.exit(0)
    })
    .catch(e => {
        console.error(e)
        process.exit(1)
    })

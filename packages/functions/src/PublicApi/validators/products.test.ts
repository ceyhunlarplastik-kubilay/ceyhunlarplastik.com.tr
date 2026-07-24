import { describe, expect, it } from "vitest"

import {
    listProductsResponseValidator,
    productResponseValidator,
} from "./products"
import {
    productResponseValidator as adminProductResponseValidator,
} from "@/functions/AdminApi/validators/products"

const localizedProductFields = [
    "locale",
    "resolvedLocale",
    "translationMissing",
    "alternateSlugs",
    "translations",
]

type JsonSchemaNode = {
    properties: Record<string, JsonSchemaNode>
    items?: JsonSchemaNode
}

function productProperties(schema: object, list: boolean) {
    const root = schema as JsonSchemaNode
    const payload = root.properties.body.properties.payload
    const product = list
        ? payload.properties.data.items!
        : payload.properties.product

    return product.properties as Record<string, unknown>
}

describe("Product response validators", () => {
    it("accepts localized fields for public product detail responses", () => {
        const properties = productProperties(productResponseValidator, false)

        for (const field of localizedProductFields) {
            expect(properties).toHaveProperty(field)
        }
    })

    it("accepts localized fields for public product list items", () => {
        const properties = productProperties(listProductsResponseValidator, true)

        for (const field of localizedProductFields) {
            expect(properties).toHaveProperty(field)
        }
    })

    it("keeps Admin Product responses compatible with localized fields", () => {
        const properties = productProperties(adminProductResponseValidator, false)

        for (const field of localizedProductFields) {
            expect(properties).toHaveProperty(field)
        }
    })
})

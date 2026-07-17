import { describe, expect, it } from "vitest"

import {
    categoryResponseValidator,
    listCategoryResponseValidator,
} from "./categories"
import { productResponseValidator } from "./products"
import {
    categoryResponseValidator as adminCategoryResponseValidator,
} from "@/functions/AdminApi/validators/categories"

const localizedCategoryFields = [
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

function categoryProperties(schema: object, list: boolean) {
    const root = schema as JsonSchemaNode
    const payload = root.properties.body.properties.payload
    const category = list
        ? payload.properties.data.items!
        : payload.properties.category

    return category.properties as Record<string, unknown>
}

function productCategoryProperties(schema: object) {
    const root = schema as JsonSchemaNode
    return root
        .properties.body
        .properties.payload
        .properties.product
        .properties.category
        .properties
}

describe("Public Category response validators", () => {
    it("accepts localized fields for category detail responses", () => {
        const properties = categoryProperties(categoryResponseValidator, false)

        for (const field of localizedCategoryFields) {
            expect(properties).toHaveProperty(field)
        }
    })

    it("accepts localized fields for category list items", () => {
        const properties = categoryProperties(listCategoryResponseValidator, true)

        for (const field of localizedCategoryFields) {
            expect(properties).toHaveProperty(field)
        }
    })

    it("accepts localized fields for nested product categories", () => {
        const properties = productCategoryProperties(productResponseValidator)

        for (const field of localizedCategoryFields) {
            expect(properties).toHaveProperty(field)
        }
    })

    it("keeps Admin Category responses compatible with localized fields", () => {
        const properties = categoryProperties(adminCategoryResponseValidator, false)

        for (const field of localizedCategoryFields) {
            expect(properties).toHaveProperty(field)
        }
    })
})

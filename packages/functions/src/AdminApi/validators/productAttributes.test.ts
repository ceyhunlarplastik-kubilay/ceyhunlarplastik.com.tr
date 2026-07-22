import { describe, expect, it } from "vitest"

import { listAttributesWithValuesResponseValidator } from "./productAttributes"

type JsonSchemaNode = {
    additionalProperties?: unknown
    properties: Record<string, JsonSchemaNode>
    items?: JsonSchemaNode
}

function productAttributeWithValuesItemSchema() {
    const root = listAttributesWithValuesResponseValidator as JsonSchemaNode

    return root
        .properties.body
        .properties.payload
        .properties.data
        .items!
}

describe("Admin ProductAttribute response validators", () => {
    it("accepts localized metadata and repository scalar fields for with-values responses", () => {
        const attribute = productAttributeWithValuesItemSchema()
        const value = attribute.properties.values.items!

        expect(attribute.properties).toHaveProperty("values")
        expect(value.properties).toHaveProperty("locale")
        expect(value.properties).toHaveProperty("resolvedLocale")
        expect(value.properties).toHaveProperty("translationMissing")
        expect(value.properties).toHaveProperty("alternateSlugs")
        expect(value.properties).toHaveProperty("translations")
        expect(value.additionalProperties).not.toBe(false)
    })
})

import { z, ZodType } from "zod"

export function validatorWrapper<T extends ZodType>(
    schema: T,
    options?: {
        requiredRootFields?: string[]
        requiredBodyFields?: string[]
        requiredPathParametersFields?: string[]
    }
) {
    const { requiredRootFields = ["body"], requiredBodyFields, requiredPathParametersFields } = options ?? {}

    return z.toJSONSchema(schema, {
        override: (ctx) => {
            if ((ctx.zodSchema as unknown) === (schema as unknown)) {
                ctx.jsonSchema.required = requiredRootFields
                ctx.jsonSchema.additionalProperties = true
            }

            if (
                requiredBodyFields &&
                ctx.path.length === 1 &&
                ctx.path[0] === "body"
            ) {
                ctx.jsonSchema.required = requiredBodyFields
            }

            if (
                requiredPathParametersFields &&
                ctx.path.length === 1 &&
                ctx.path[0] === "pathParameters"
            ) {
                ctx.jsonSchema.required = requiredPathParametersFields
            }
        },
    })
}

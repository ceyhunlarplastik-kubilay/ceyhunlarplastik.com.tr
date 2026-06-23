import { z } from "zod";
export function validatorWrapper(schema, options) {
    const {
        requiredRootFields = ["body"],
        requiredBodyFields,
        requiredPathParametersFields,
        requiredQueryStringParametersFields,
    } = options ?? {};
    return z.toJSONSchema(schema, {
        override: (ctx) => {
            if (ctx.zodSchema === schema) {
                ctx.jsonSchema.required = requiredRootFields;
                ctx.jsonSchema.additionalProperties = true;
            }
            if (requiredBodyFields &&
                ctx.path.length === 1 &&
                ctx.path[0] === "body") {
                ctx.jsonSchema.required = requiredBodyFields;
            }
            if (requiredPathParametersFields &&
                ctx.path.length === 1 &&
                ctx.path[0] === "pathParameters") {
                ctx.jsonSchema.required = requiredPathParametersFields;
            }
            if (requiredQueryStringParametersFields &&
                ctx.path.length === 1 &&
                ctx.path[0] === "queryStringParameters") {
                ctx.jsonSchema.required = requiredQueryStringParametersFields;
            }
        },
    });
}

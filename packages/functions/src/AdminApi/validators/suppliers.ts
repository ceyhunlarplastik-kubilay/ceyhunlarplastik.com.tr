import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createSupplierValidator = validatorWrapper(
  z.object({
    body: z.object({
      name: z.string().min(2).max(100),
      isActive: z.boolean().optional(),
    }),
  }),
  {
    requiredRootFields: ["body"],
    requiredBodyFields: ["name"],
  }
)

export const getSupplierValidator = validatorWrapper(
  z.object({
    pathParameters: z.object({
      id: z.uuid(),
    }),
  }),
  {
    requiredRootFields: ["pathParameters"],
  }
)

export const deleteSupplierValidator = validatorWrapper(
  z.object({
    pathParameters: z.object({
      id: z.uuid(),
    }),
  }),
  {
    requiredRootFields: ["pathParameters"],
  }
)

export const updateSupplierValidator = validatorWrapper(
  z.object({
    pathParameters: z.object({
      id: z.uuid(),
    }),
    body: z.object({
      name: z.string().min(2).max(100).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
  {
    requiredRootFields: ["pathParameters", "body"],
  }
)

// Response Validators
export const supplierResponseValidator = z.toJSONSchema(
  z.object({
    statusCode: z.number(),
    body: z.object({
      statusCode: z.number(),
      payload: z.object({
        supplier: z.object({
          id: z.uuid(),
          name: z.string(),
          isActive: z.boolean(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
      })
    })
  }).loose()
)

export const listSuppliersResponseValidator = z.toJSONSchema(
  z.object({
    statusCode: z.number(),
    body: z.object({
      statusCode: z.number(),
      payload: z.object({
        data: z.array(
          z.object({
            id: z.uuid(),
            name: z.string(),
            isActive: z.boolean(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })
        ),
        meta: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          totalPages: z.number(),
        })
      })
    })
  }).loose()
)
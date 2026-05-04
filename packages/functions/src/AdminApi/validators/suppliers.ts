import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createSupplierValidator = validatorWrapper(
  z.object({
    body: z.object({
      name: z.string().min(2).max(100),
      contactName: z.string().min(2).max(100).optional(),
      phone: z.string().min(5).max(50).optional(),
      address: z.string().min(2).max(2000).optional(),
      taxNumber: z.string().min(2).max(50).optional(),
      defaultPaymentTermDays: z.number().int().min(0).optional(),
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
      contactName: z.string().min(2).max(100).optional(),
      phone: z.string().min(5).max(50).optional(),
      address: z.string().min(2).max(2000).optional(),
      taxNumber: z.string().min(2).max(50).optional(),
      defaultPaymentTermDays: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
  {
    requiredRootFields: ["pathParameters", "body"],
  }
)

// Response Validators
export const supplierSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  contactName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  taxNumber: z.string().nullable().optional(),
  defaultPaymentTermDays: z.number().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const supplierResponseValidator = z.toJSONSchema(
  z.object({
    statusCode: z.number(),
    body: z.object({
      statusCode: z.number(),
      payload: z.object({
        supplier: supplierSchema,
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
        data: z.array(supplierSchema),
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

import { z, ZodType } from "zod"
import { PHONE_INPUT_REGEX } from "@/core/helpers/validation/phone"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/* export const addUserToGroupValidator = validatorWrapper(
    z.object({
        body: z.object({
            group: z.enum(["owner", "admin", "user", "supplier"]),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["group"],
    },
) */

export const listUsersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        email: z.string(),
                        identifier: z.string(),
                        firstName: z.string().nullable().optional(),
                        lastName: z.string().nullable().optional(),
                        phone: z.string().nullable().optional(),
                        groups: z.array(z.string()),
                        accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]),
                        accessStatusChangedAt: z.string().nullable().optional(),
                        accessStatusReason: z.string().nullable().optional(),
                        supplierId: z.uuid().nullable().optional(),
                        customerId: z.uuid().nullable().optional(),
                        customerContactTitle: z.string().nullable().optional(),
                        customerContactDepartment: z.string().nullable().optional(),
                        isPrimaryCustomerContact: z.boolean().optional(),
                        supplier: z.object({
                            id: z.uuid(),
                            name: z.string(),
                        }).nullable().optional(),
                        customer: z.object({
                            id: z.uuid(),
                            fullName: z.string(),
                            companyName: z.string().nullable().optional(),
                            status: z.enum(["LEAD", "CUSTOMER"]),
                        }).nullable().optional(),
                        assignedSalesCustomers: z.array(
                            z.object({
                                id: z.uuid(),
                                fullName: z.string(),
                                companyName: z.string().nullable().optional(),
                                status: z.enum(["LEAD", "CUSTOMER"]),
                            }).loose()
                        ).optional(),
                        assignedPurchasingSuppliers: z.array(
                            z.object({
                                id: z.uuid(),
                                name: z.string(),
                            }).loose()
                        ).optional(),
                        isActive: z.boolean(),
                        createdAt: z.string(),
                        updatedAt: z.string(),
                    }).loose()
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

export const getUserResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                user: z.object({
                    id: z.uuid(),
                    email: z.string(),
                    identifier: z.string(),
                    firstName: z.string().nullable().optional(),
                    lastName: z.string().nullable().optional(),
                    phone: z.string().nullable().optional(),
                    groups: z.array(z.string()),
                    accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]),
                    accessStatusChangedAt: z.string().nullable().optional(),
                    accessStatusReason: z.string().nullable().optional(),
                    supplierId: z.uuid().nullable().optional(),
                    customerId: z.uuid().nullable().optional(),
                    customerContactTitle: z.string().nullable().optional(),
                    customerContactDepartment: z.string().nullable().optional(),
                    isPrimaryCustomerContact: z.boolean().optional(),
                    supplier: z.object({
                        id: z.uuid(),
                        name: z.string(),
                    }).nullable().optional(),
                    customer: z.object({
                        id: z.uuid(),
                        fullName: z.string(),
                        companyName: z.string().nullable().optional(),
                        status: z.enum(["LEAD", "CUSTOMER"]),
                    }).nullable().optional(),
                    assignedSalesCustomers: z.array(
                        z.object({
                            id: z.uuid(),
                            fullName: z.string(),
                            companyName: z.string().nullable().optional(),
                            status: z.enum(["LEAD", "CUSTOMER"]),
                        }).loose()
                    ).optional(),
                    assignedPurchasingSuppliers: z.array(
                        z.object({
                            id: z.uuid(),
                            name: z.string(),
                        }).loose()
                    ).optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                }).loose()
            })
        })
    }).loose()
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateUserSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            supplierId: z.uuid().nullable().optional(),
            customerId: z.uuid().nullable().optional(),
            assignedSupplierIds: z.array(z.uuid()).max(500).optional(),
            assignedCustomerIds: z.array(z.uuid()).max(500).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const updateUserRoleValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            group: z.enum(["owner", "admin", "user", "supplier", "purchasing", "sales", "sales_director", "customer"]),
            accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
            supplierId: z.uuid().nullable().optional(),
            customerId: z.uuid().nullable().optional(),
            reason: z.string().trim().max(500).nullable().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const updateUserProfileValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            email: z.email().trim().optional(),
            identifier: z.string().trim().min(2).max(120).optional(),
            firstName: z.string().trim().min(2).max(120).optional(),
            lastName: z.string().trim().min(2).max(120).optional(),
            phone: z.string().trim().regex(
                PHONE_INPUT_REGEX,
                "Telefon numarasi yalnizca rakam, bosluk, parantez, tire ve + karakteri icerebilir.",
            ).nullable().optional(),
            customerContactTitle: z.string().trim().max(120).nullable().optional(),
            customerContactDepartment: z.string().trim().max(120).nullable().optional(),
            isPrimaryCustomerContact: z.boolean().optional(),
        }).superRefine((value, ctx) => {
            const hasFirstName = value.firstName !== undefined
            const hasLastName = value.lastName !== undefined

            if (hasFirstName !== hasLastName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [hasFirstName ? "lastName" : "firstName"],
                    message: "Ad ve soyad birlikte guncellenmelidir.",
                })
            }
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const updateUserSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                user: z.object({
                    id: z.uuid(),
                    email: z.string(),
                    identifier: z.string(),
                    firstName: z.string().nullable().optional(),
                    lastName: z.string().nullable().optional(),
                    phone: z.string().nullable().optional(),
                    groups: z.array(z.string()),
                    accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]),
                    accessStatusChangedAt: z.string().nullable().optional(),
                    accessStatusReason: z.string().nullable().optional(),
                    supplierId: z.uuid().nullable().optional(),
                    customerId: z.uuid().nullable().optional(),
                    customerContactTitle: z.string().nullable().optional(),
                    customerContactDepartment: z.string().nullable().optional(),
                    isPrimaryCustomerContact: z.boolean().optional(),
                    supplier: z.object({
                        id: z.uuid(),
                        name: z.string(),
                    }).nullable().optional(),
                    customer: z.object({
                        id: z.uuid(),
                        fullName: z.string(),
                        companyName: z.string().nullable().optional(),
                        status: z.enum(["LEAD", "CUSTOMER"]),
                    }).nullable().optional(),
                    assignedSalesCustomers: z.array(
                        z.object({
                            id: z.uuid(),
                            fullName: z.string(),
                            companyName: z.string().nullable().optional(),
                            status: z.enum(["LEAD", "CUSTOMER"]),
                        }).loose()
                    ).optional(),
                    assignedPurchasingSuppliers: z.array(
                        z.object({
                            id: z.uuid(),
                            name: z.string(),
                        }).loose()
                    ).optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                }).loose()
            })
        })
    }).loose()
)

export const updateUserRoleResponseValidator = updateUserSupplierResponseValidator
export const updateUserProfileResponseValidator = updateUserSupplierResponseValidator

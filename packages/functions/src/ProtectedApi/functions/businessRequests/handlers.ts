import { SFNClient, SendTaskSuccessCommand, StartExecutionCommand } from "@aws-sdk/client-sfn"
import createError from "http-errors"

import { approveBusinessRequestDecision, assertAllowedCustomerRequestType, counterBusinessRequestDecision, createCustomerBusinessRequest, createSupplierBusinessRequest, rejectBusinessRequestDecision } from "@/core/helpers/businessRequests/service"
import { normalizeSupplierProfileApprovalPayload, normalizeSupplierVariantPricingApprovalPayload, snapshotSupplierProfile, snapshotSupplierVariantPricing } from "@/core/helpers/businessRequests/supplierPayloads"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreatePortalBusinessRequestEvent,
    ICreateSupplierBusinessRequestEvent,
    IDecideBusinessRequestEvent,
    IGetSupplierVariantRequestReferencesEvent,
    IListPortalBusinessRequestsEvent,
    IListSupplierBusinessRequestsEvent,
    IProtectedBusinessRequestDependencies,
    IRequestSupplierProfileBusinessRequestEvent,
    IRequestSupplierVariantPricingBusinessRequestEvent,
} from "@/functions/ProtectedApi/types/businessRequests"

const sfn = new SFNClient({})

async function startBusinessWorkflow(input: {
    workflowArn: string
    businessRequestRepository: IProtectedBusinessRequestDependencies["businessRequestRepository"]
    request: Awaited<ReturnType<IProtectedBusinessRequestDependencies["businessRequestRepository"]["getRequest"]>>
}) {
    const request = input.request
    if (!request) {
        throw new createError.InternalServerError("Business request could not be loaded")
    }

    const execution = await sfn.send(new StartExecutionCommand({
        stateMachineArn: input.workflowArn,
        name: `business-request-${request.id}`,
        input: JSON.stringify({
            requestId: request.id,
            domain: request.domain,
            type: request.type,
            title: request.title,
            customerId: request.customerId,
            supplierId: request.supplierId,
            requestedByUserId: request.requestedByUserId,
            requestedByEmail: request.requestedByUser.email,
            requesterRole: request.requesterRole,
        }),
    }))

    if (execution.executionArn) {
        await input.businessRequestRepository.setWorkflowExecutionArn(request.id, execution.executionArn)
    }
}

export const listPortalBusinessRequestsHandler =
    ({ businessRequestRepository }: IProtectedBusinessRequestDependencies) =>
        async (event: IListPortalBusinessRequestsEvent) => {
            const user = event.user
            if (!user?.customerId) {
                throw new createError.Forbidden("Customer portal context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
                allowedSortFields: ["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"],
                defaultSort: "createdAt",
            })

            const query = event.queryStringParameters ?? {}
            const result = await businessRequestRepository.listRequests({
                page,
                limit,
                search,
                sort,
                order,
                customerId: user.customerId,
                domain: "SALES",
                status: query.status,
                type: query.type,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }

export const createPortalBusinessRequestHandler =
    ({ businessRequestRepository, customerRepository, workflowArn }: IProtectedBusinessRequestDependencies) =>
        async (event: ICreatePortalBusinessRequestEvent) => {
            const user = event.user
            if (!user?.customerId || !user.isCustomer) {
                throw new createError.Forbidden("Customer portal context missing")
            }
            if (!workflowArn) {
                throw new createError.InternalServerError("Business workflow configuration is missing")
            }

            const body = event.body
            assertAllowedCustomerRequestType(body.type)

            const customer = await customerRepository.getCustomer(user.customerId)
            if (!customer) {
                throw new createError.NotFound("Customer profile not found")
            }

            const created = await createCustomerBusinessRequest({
                requester: user,
                customer,
                type: body.type,
                title: body.title,
                description: body.description,
                entityType: body.entityType,
                entityId: body.entityId,
                priority: body.priority,
                requestedData: body.requestedData,
                items: body.items,
            })

            try {
                const execution = await sfn.send(new StartExecutionCommand({
                    stateMachineArn: workflowArn,
                    name: `business-request-${created.id}`,
                    input: JSON.stringify({
                        requestId: created.id,
                        domain: created.domain,
                        type: created.type,
                        title: created.title,
                        customerId: created.customerId,
                        supplierId: created.supplierId,
                        requestedByUserId: created.requestedByUserId,
                        requestedByEmail: created.requestedByUser.email,
                        requesterRole: created.requesterRole,
                    }),
                }))

                if (execution.executionArn) {
                    await businessRequestRepository.setWorkflowExecutionArn(created.id, execution.executionArn)
                }
            } catch (error) {
                await businessRequestRepository.deleteRequest(created.id)
                console.error(error)
                throw new createError.InternalServerError("Business workflow could not be started")
            }

            const reloaded = await businessRequestRepository.getRequest(created.id)
            if (!reloaded) {
                throw new createError.InternalServerError("Created request could not be reloaded")
            }

            return apiResponseDTO({
                statusCode: 202,
                payload: {
                    request: reloaded,
                },
            })
        }

export const listSalesBusinessRequestsHandler =
    ({ businessRequestRepository }: IProtectedBusinessRequestDependencies) =>
        async (event: IListPortalBusinessRequestsEvent) => {
            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
                allowedSortFields: ["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"],
                defaultSort: "createdAt",
            })
            const query = event.queryStringParameters ?? {}

            const result = await businessRequestRepository.listRequests({
                page,
                limit,
                search,
                sort,
                order,
                domain: "SALES",
                status: query.status,
                type: query.type,
                ...(user.isSales && !user.isSalesDirector && !user.isAdmin && !user.isOwner
                    ? { customerAssignedSalesUserId: user.id }
                    : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }

export const listSupplierBusinessRequestsHandler =
    ({ businessRequestRepository }: IProtectedBusinessRequestDependencies) =>
        async (event: IListSupplierBusinessRequestsEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
                allowedSortFields: ["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"],
                defaultSort: "createdAt",
            })
            const query = event.queryStringParameters ?? {}

            const result = await businessRequestRepository.listRequests({
                page,
                limit,
                search,
                sort,
                order,
                domain: "PURCHASING",
                supplierId: user.supplierId,
                status: query.status,
                type: query.type,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }

export const listPurchasingBusinessRequestsHandler =
    ({ businessRequestRepository }: IProtectedBusinessRequestDependencies) =>
        async (event: IListPortalBusinessRequestsEvent) => {
            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
                allowedSortFields: ["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"],
                defaultSort: "createdAt",
            })
            const query = event.queryStringParameters ?? {}

            const result = await businessRequestRepository.listRequests({
                page,
                limit,
                search,
                sort,
                order,
                domain: "PURCHASING",
                status: query.status,
                type: query.type,
                ...(user.isPurchasing && !user.isAdmin && !user.isOwner
                    ? { supplierAssignedPurchasingUserId: user.id }
                    : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }

export const requestSupplierProfileBusinessRequestHandler =
    ({ businessRequestRepository, supplierRepository, workflowArn }: IProtectedBusinessRequestDependencies) =>
        async (event: IRequestSupplierProfileBusinessRequestEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }
            if (!workflowArn) {
                throw new createError.InternalServerError("Business workflow configuration is missing")
            }

            const supplier = await supplierRepository.getSupplier(user.supplierId)
            if (!supplier) {
                throw new createError.NotFound("Supplier profile not found")
            }

            const payload = normalizeSupplierProfileApprovalPayload(event.body ?? {})
            if (Object.keys(payload).length === 0) {
                throw new createError.BadRequest("At least one field must be provided")
            }

            const existingPending = await businessRequestRepository.listRequests({
                page: 1,
                limit: 1,
                supplierId: supplier.id,
                domain: "PURCHASING",
                type: "SUPPLIER_PROFILE_CHANGE",
                status: "PENDING_APPROVAL",
            })
            if (existingPending.data.length > 0) {
                throw new createError.Conflict("Bu tedarikçi profili için bekleyen bir iş talebi zaten var")
            }

            const created = await createSupplierBusinessRequest({
                requester: user,
                supplier,
                type: "SUPPLIER_PROFILE_CHANGE",
                title: "Tedarikçi profil değişikliği talebi",
                entityType: "SUPPLIER",
                entityId: supplier.id,
                requestedData: payload,
                currentSnapshot: snapshotSupplierProfile(supplier),
            })

            try {
                await startBusinessWorkflow({
                    workflowArn,
                    businessRequestRepository,
                    request: created,
                })
            } catch (error) {
                await businessRequestRepository.deleteRequest(created.id)
                console.error(error)
                throw new createError.InternalServerError("Business workflow could not be started")
            }

            const reloaded = await businessRequestRepository.getRequest(created.id)
            if (!reloaded) {
                throw new createError.InternalServerError("Created request could not be reloaded")
            }

            return apiResponseDTO({
                statusCode: 202,
                payload: {
                    request: reloaded,
                },
            })
        }

export const requestSupplierVariantPricingBusinessRequestHandler =
    ({ businessRequestRepository, productVariantSupplierRepository, supplierRepository, workflowArn }: IProtectedBusinessRequestDependencies) =>
        async (event: IRequestSupplierVariantPricingBusinessRequestEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }
            if (!workflowArn) {
                throw new createError.InternalServerError("Business workflow configuration is missing")
            }

            const supplier = await supplierRepository.getSupplier(user.supplierId)
            if (!supplier) {
                throw new createError.NotFound("Supplier profile not found")
            }

            const productVariantSupplier = await productVariantSupplierRepository.getProductVariantSupplier(event.pathParameters.id)
            if (!productVariantSupplier) {
                throw new createError.NotFound("Variant supplier record not found")
            }
            if (productVariantSupplier.supplierId !== user.supplierId) {
                throw new createError.Forbidden("You can only request updates for your own supplier prices")
            }
            if (event.body.profitRate !== undefined || event.body.listPrice !== undefined) {
                throw new createError.Forbidden("You are not allowed to request profit or list price changes")
            }

            const existingPending = await businessRequestRepository.listRequests({
                page: 1,
                limit: 1,
                supplierId: supplier.id,
                domain: "PURCHASING",
                type: "SUPPLIER_PRICING_CHANGE",
                status: "PENDING_APPROVAL",
                search: productVariantSupplier.variant.fullCode,
            })
            if (existingPending.data.some((request) => request.entityId === productVariantSupplier.id)) {
                throw new createError.Conflict("Bu varyant için bekleyen bir iş talebi zaten var")
            }

            const payload = normalizeSupplierVariantPricingApprovalPayload(event.body)
            const created = await createSupplierBusinessRequest({
                requester: user,
                supplier,
                type: "SUPPLIER_PRICING_CHANGE",
                title: `${productVariantSupplier.variant.fullCode} varyantı için fiyat değişikliği talebi`,
                entityType: "PRODUCT_VARIANT",
                entityId: productVariantSupplier.id,
                requestedData: {
                    ...payload,
                    productVariantSupplierId: productVariantSupplier.id,
                    productVariantId: productVariantSupplier.variantId,
                    productId: productVariantSupplier.variant.productId,
                    variantFullCode: productVariantSupplier.variant.fullCode,
                },
                currentSnapshot: {
                    ...snapshotSupplierVariantPricing(productVariantSupplier),
                    productVariantSupplierId: productVariantSupplier.id,
                    productVariantId: productVariantSupplier.variantId,
                    productId: productVariantSupplier.variant.productId,
                    variantFullCode: productVariantSupplier.variant.fullCode,
                },
                items: [
                    {
                        productVariantId: productVariantSupplier.variantId,
                        quantity: 1,
                        data: {
                            productId: productVariantSupplier.variant.productId,
                            productName: productVariantSupplier.variant.product.name,
                            productCode: productVariantSupplier.variant.product.code,
                            variantFullCode: productVariantSupplier.variant.fullCode,
                            listUnitPrice: productVariantSupplier.listPrice ?? null,
                            targetUnitPrice: payload.price,
                            currency: payload.currency ?? productVariantSupplier.currency ?? "TRY",
                        },
                    },
                ],
            })

            try {
                await startBusinessWorkflow({
                    workflowArn,
                    businessRequestRepository,
                    request: created,
                })
            } catch (error) {
                await businessRequestRepository.deleteRequest(created.id)
                console.error(error)
                throw new createError.InternalServerError("Business workflow could not be started")
            }

            const reloaded = await businessRequestRepository.getRequest(created.id)
            if (!reloaded) {
                throw new createError.InternalServerError("Created request could not be reloaded")
            }

            return apiResponseDTO({
                statusCode: 202,
                payload: {
                    request: reloaded,
                },
            })
        }

export const createSupplierBusinessRequestHandler =
    ({ businessRequestRepository, supplierRepository, categoryRepository, productRepository, colorRepository, materialRepository, measurementTypeRepository, workflowArn }: IProtectedBusinessRequestDependencies) =>
        async (event: ICreateSupplierBusinessRequestEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }
            if (!workflowArn) {
                throw new createError.InternalServerError("Business workflow configuration is missing")
            }

            const supplier = await supplierRepository.getSupplier(user.supplierId)
            if (!supplier) {
                throw new createError.NotFound("Supplier profile not found")
            }

            const { type, requestedData, title, description, priority } = event.body

            if (type === "SUPPLIER_CATEGORY_CREATE") {
                const name = typeof requestedData.name === "string" ? requestedData.name.trim() : ""
                const code = typeof requestedData.code === "number" ? requestedData.code : null
                if (!name || code === null) {
                    throw new createError.BadRequest("Kategori talebi için kod ve ad gerekli")
                }
            }

            if (type === "SUPPLIER_PRODUCT_CREATE") {
                const categoryId = typeof requestedData.categoryId === "string" ? requestedData.categoryId : ""
                const code = typeof requestedData.code === "string" ? requestedData.code.trim() : ""
                const name = typeof requestedData.name === "string" ? requestedData.name.trim() : ""
                if (!categoryId || !code || !name) {
                    throw new createError.BadRequest("Ürün talebi için kategori, kod ve ad gerekli")
                }

                const category = await categoryRepository.getCategory(categoryId).catch(() => null)
                if (!category) {
                    throw new createError.NotFound("Kategori bulunamadı")
                }
            }

            if (type === "SUPPLIER_VARIANT_CREATE") {
                const productId = typeof requestedData.productId === "string" ? requestedData.productId : ""
                if (!productId) {
                    throw new createError.BadRequest("Varyant talebi için ürün seçilmelidir")
                }

                const product = await productRepository.getProduct(productId).catch(() => null)
                if (!product) {
                    throw new createError.NotFound("Ürün bulunamadı")
                }

                const colorId = typeof requestedData.colorId === "string" ? requestedData.colorId : null
                if (colorId) {
                    const color = await colorRepository.getColor(colorId).catch(() => null)
                    if (!color) {
                        throw new createError.NotFound("Renk bulunamadı")
                    }
                }

                const materialIds = Array.isArray(requestedData.materialIds) ? requestedData.materialIds : []
                for (const materialId of materialIds) {
                    if (typeof materialId !== "string") continue
                    const material = await materialRepository.getMaterial(materialId).catch(() => null)
                    if (!material) {
                        throw new createError.NotFound("Malzeme referansı bulunamadı")
                    }
                }

                const measurements = Array.isArray(requestedData.measurements) ? requestedData.measurements : []
                for (const measurement of measurements) {
                    if (!measurement || typeof measurement !== "object") continue
                    const record = measurement as Record<string, unknown>
                    if (typeof record.measurementTypeId !== "string") continue
                    const measurementType = await measurementTypeRepository.getMeasurementType(record.measurementTypeId).catch(() => null)
                    if (!measurementType) {
                        throw new createError.NotFound("Ölçü tipi bulunamadı")
                    }
                }
            }

            const created = await createSupplierBusinessRequest({
                requester: user,
                supplier,
                type,
                title,
                description,
                priority,
                entityType: type === "SUPPLIER_CATEGORY_CREATE"
                    ? "CATEGORY"
                    : type === "SUPPLIER_PRODUCT_CREATE"
                        ? "PRODUCT"
                        : "PRODUCT_VARIANT",
                requestedData,
                currentSnapshot: {},
            })

            try {
                await startBusinessWorkflow({
                    workflowArn,
                    businessRequestRepository,
                    request: created,
                })
            } catch (error) {
                await businessRequestRepository.deleteRequest(created.id)
                console.error(error)
                throw new createError.InternalServerError("Business workflow could not be started")
            }

            const reloaded = await businessRequestRepository.getRequest(created.id)
            if (!reloaded) {
                throw new createError.InternalServerError("Created request could not be reloaded")
            }

            return apiResponseDTO({
                statusCode: 202,
                payload: {
                    request: reloaded,
                },
            })
        }

export const getSupplierVariantRequestReferencesHandler =
    ({ colorRepository, materialRepository, measurementTypeRepository }: IProtectedBusinessRequestDependencies) =>
        async (_event: IGetSupplierVariantRequestReferencesEvent) => {
            const [colors, materials, measurementTypes] = await Promise.all([
                colorRepository.listColors({ limit: 1000 }),
                materialRepository.listMaterials({ limit: 1000 }),
                measurementTypeRepository.listMeasurementTypes({ limit: 1000 }),
            ])

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    colors: colors.data,
                    materials: materials.data,
                    measurementTypes: measurementTypes.data,
                },
            })
        }

export const decideBusinessRequestHandler =
    ({ businessRequestRepository }: IProtectedBusinessRequestDependencies) =>
        async (event: IDecideBusinessRequestEvent) => {
            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const existing = await businessRequestRepository.getRequest(event.pathParameters.id)
            if (!existing) {
                throw new createError.NotFound("Business request not found")
            }
            if (existing.status !== "PENDING_APPROVAL") {
                throw new createError.Conflict("This request has already been finalized")
            }
            if (!existing.workflowTaskToken) {
                throw new createError.Conflict("Workflow task token is missing for this request")
            }

            const action = event.body.action ?? (event.body.approved === false ? "REJECT" : "APPROVE")
            const currentStep = existing.approvalSteps.find((step) => step.status === "PENDING") ?? null

            if (action === "COUNTER") {
                const result = await counterBusinessRequestDecision({
                    requestId: existing.id,
                    user,
                    note: event.body.note,
                    counterOfferItems: event.body.counterOfferItems ?? [],
                })

                if (result.shouldResumeWorkflow) {
                    try {
                        await sfn.send(new SendTaskSuccessCommand({
                            taskToken: existing.workflowTaskToken,
                            output: JSON.stringify({
                                requestId: result.request.id,
                                domain: result.request.domain,
                                type: result.request.type,
                                title: result.request.title,
                                status: result.request.status,
                                customerId: result.request.customerId,
                                supplierId: result.request.supplierId,
                                requestedByUserId: result.request.requestedByUserId,
                                requestedByEmail: result.request.requestedByUser.email,
                                requesterRole: result.request.requesterRole,
                                decidedStepId: currentStep?.id ?? null,
                                decidedStepOrder: currentStep?.stepOrder ?? null,
                                decidedRequiredRole: currentStep?.requiredRole ?? null,
                                decidedByUserId: user.id,
                                decidedByEmail: user.email,
                                note: event.body.note?.trim() || null,
                                approved: true,
                                completed: false,
                            }),
                        }))
                    } catch (error) {
                        console.error(error)
                    }
                }

                return apiResponseDTO({
                    statusCode: 200,
                    payload: {
                        accepted: true,
                        request: result.request,
                    },
                })
            }

            const approved = action === "APPROVE"
            const decision = approved
                ? await approveBusinessRequestDecision({
                    requestId: existing.id,
                    user,
                    note: event.body.note,
                })
                : await rejectBusinessRequestDecision({
                    requestId: existing.id,
                    user,
                    note: event.body.note,
                })

            try {
                await sfn.send(new SendTaskSuccessCommand({
                    taskToken: existing.workflowTaskToken,
                    output: JSON.stringify({
                        requestId: decision.request.id,
                        domain: decision.request.domain,
                        type: decision.request.type,
                        title: decision.request.title,
                        status: decision.request.status,
                        customerId: decision.request.customerId,
                        supplierId: decision.request.supplierId,
                        requestedByUserId: decision.request.requestedByUserId,
                        requestedByEmail: decision.request.requestedByUser.email,
                        requesterRole: decision.request.requesterRole,
                        decidedStepId: decision.decidedStep.id,
                        decidedStepOrder: decision.decidedStep.stepOrder,
                        decidedRequiredRole: decision.decidedStep.requiredRole,
                        decidedByUserId: user.id,
                        decidedByEmail: user.email,
                        note: event.body.note?.trim() || null,
                        approved,
                        completed: decision.completed,
                    }),
                }))
            } catch (error) {
                console.error(error)
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    accepted: true,
                    request: decision.request,
                },
            })
        }

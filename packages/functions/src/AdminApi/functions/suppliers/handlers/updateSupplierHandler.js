import createError, { HttpError } from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const updateSupplierHandler = ({ supplierRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        const body = event.body;
        if (!body || Object.keys(body).length === 0)
            throw new createError.BadRequest("At least one field must be provided");
        const allowedFields = ["name", "contactName", "phone", "address", "taxNumber", "defaultPaymentTermDays", "isActive", "assignedPurchasingUserId"];
        const invalidFields = Object.keys(body).filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0)
            throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`);
        const { name, contactName, phone, address, taxNumber, defaultPaymentTermDays, isActive, assignedPurchasingUserId } = body;
        const updateData = {
            ...(name !== undefined && { name }),
            ...(contactName !== undefined && { contactName }),
            ...(phone !== undefined && { phone }),
            ...(address !== undefined && { address }),
            ...(taxNumber !== undefined && { taxNumber }),
            ...(defaultPaymentTermDays !== undefined && { defaultPaymentTermDays }),
            ...(isActive !== undefined && { isActive }),
            ...(assignedPurchasingUserId !== undefined
                ? assignedPurchasingUserId
                    ? { assignedPurchasingUser: { connect: { id: assignedPurchasingUserId } } }
                    : { assignedPurchasingUser: { disconnect: true } }
                : {}),
        };
        try {
            const supplier = await supplierRepository.updateSupplier(id, updateData);
            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025")
                    throw new createError.NotFound("Supplier not found");
                if (err.code === "P2002")
                    throw new createError.Conflict("Supplier name already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update supplier");
        }
    };
};

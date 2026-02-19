import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMaterialDependencies, ICreateMaterialEvent } from "@/functions/AdminApi/types/materials"

export const createMaterialHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: ICreateMaterialEvent) => {
        const { name, code } = event.body;

        try {
            const material = await materialRepository.createMaterial({
                name,
                code,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { material },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Material name already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create material");
        }
    }
}

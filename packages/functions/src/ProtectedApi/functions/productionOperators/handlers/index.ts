import createError from "http-errors"

import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import type { ProductionOperatorWriteInput } from "@/core/helpers/prisma/productionOperators/repository"
import { normalizeProductionCode } from "@/core/helpers/production/productionMasterData"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, requireText, withoutUndefined } from "@/functions/shared/production/input"
import type {
    ICreateProductionOperatorEvent,
    IDeleteProductionOperatorEvent,
    IListProductionOperatorsEvent,
    IProductionOperatorBody,
    IProductionOperatorDependencies,
    IUpdateProductionOperatorEvent,
} from "@/functions/ProtectedApi/types/productionOperators"

/**
 * Sicil numarası bir koddur: "cp-0123" ile "CP-0123" aynı kişi sayılsın diye kodlarla
 * aynı biçimde normalleştirilir. Boş → `null` (unique index birden çok boş değere izin verir).
 */
function normalizeEmployeeNo(value: string | null | undefined): string | null | undefined {
    const text = optionalText(value)
    return typeof text === "string" ? normalizeProductionCode(text) : text
}

function mapOperatorBody(body: Partial<IProductionOperatorBody>): Partial<ProductionOperatorWriteInput> {
    return withoutUndefined({
        firstName: body.firstName === undefined ? undefined : requireText(body.firstName, "Ad"),
        lastName: body.lastName === undefined ? undefined : requireText(body.lastName, "Soyad"),
        employeeNo: normalizeEmployeeNo(body.employeeNo),
        phone: optionalText(body.phone),
        isActive: body.isActive,
        notes: optionalText(body.notes),
    })
}

function conflictOnDuplicateEmployeeNo(error: unknown, employeeNo: string | null | undefined): never {
    if (isPrismaErrorCode(error, "P2002")) {
        throw new createError.Conflict(`"${employeeNo ?? ""}" sicil numarası başka bir operatörde kayıtlı.`)
    }
    throw error
}

export const listProductionOperatorsHandler = ({ productionOperatorRepository }: IProductionOperatorDependencies) => {
    return async (_event: IListProductionOperatorsEvent) => {
        const operators = await productionOperatorRepository.listOperators()
        return apiResponseDTO({ statusCode: 200, payload: { operators } })
    }
}

export const createProductionOperatorHandler = ({ productionOperatorRepository }: IProductionOperatorDependencies) => {
    return async (event: ICreateProductionOperatorEvent) => {
        const body = event.body
        // Varsayılanlar şemada değil burada (ajv union altındaki default'u uygulayamıyor).
        const input: ProductionOperatorWriteInput = {
            employeeNo: null,
            phone: null,
            isActive: true,
            notes: null,
            ...mapOperatorBody(body),
            firstName: requireText(body.firstName, "Ad"),
            lastName: requireText(body.lastName, "Soyad"),
        }

        try {
            const operator = await productionOperatorRepository.createOperator(input)
            return apiResponseDTO({ statusCode: 201, payload: { operator } })
        } catch (error) {
            conflictOnDuplicateEmployeeNo(error, input.employeeNo)
        }
    }
}

export const updateProductionOperatorHandler = ({ productionOperatorRepository }: IProductionOperatorDependencies) => {
    return async (event: IUpdateProductionOperatorEvent) => {
        const { id } = event.pathParameters
        const existing = await productionOperatorRepository.getOperator(id)
        if (!existing) throw new createError.NotFound("Operatör bulunamadı.")

        const input = mapOperatorBody(event.body)

        try {
            const operator = await productionOperatorRepository.updateOperator(id, input)
            return apiResponseDTO({ statusCode: 200, payload: { operator } })
        } catch (error) {
            conflictOnDuplicateEmployeeNo(error, input.employeeNo ?? existing.employeeNo)
        }
    }
}

export const deleteProductionOperatorHandler = ({ productionOperatorRepository }: IProductionOperatorDependencies) => {
    return async (event: IDeleteProductionOperatorEvent) => {
        const { id } = event.pathParameters
        const existing = await productionOperatorRepository.getOperator(id)
        if (!existing) throw new createError.NotFound("Operatör bulunamadı.")

        // Vardiya ekibi, lot ekibi ve lot notu operatörü Restrict ile tutar: geçmişi olan
        // operatör silinmez, pasife alınır (FK hatası genel bir 500'e düşmesin).
        const references = await productionOperatorRepository.countReferences(id)
        if (references.shiftAssignments + references.lotOperators + references.lotNotes > 0) {
            throw new createError.Conflict(
                `${existing.firstName} ${existing.lastName} vardiya ekibinde, lot kayıtlarında ya da notlarda geçiyor; silmek yerine pasife alın.`,
            )
        }
        await productionOperatorRepository.deleteOperator(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}

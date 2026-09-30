import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ProductionOperator, ProductionOperatorInput } from "@/features/production/operators/api/types"

export async function listProductionOperators(): Promise<ProductionOperator[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ operators: ProductionOperator[] }>>("/production/operators")
    return res.data.payload.operators
}

export async function createProductionOperator(input: ProductionOperatorInput): Promise<ProductionOperator> {
    const res = await protectedApiClient.post<ApiEnvelope<{ operator: ProductionOperator }>>("/production/operators", input)
    return res.data.payload.operator
}

export async function updateProductionOperator(
    id: string,
    input: Partial<ProductionOperatorInput>,
): Promise<ProductionOperator> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ operator: ProductionOperator }>>(
        `/production/operators/${id}`,
        input,
    )
    return res.data.payload.operator
}

export async function deleteProductionOperator(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/operators/${id}`)
}

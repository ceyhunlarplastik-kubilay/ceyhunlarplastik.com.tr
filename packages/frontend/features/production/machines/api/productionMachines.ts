import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ProductionMachine, ProductionMachineInput } from "@/features/production/machines/api/types"

export async function listProductionMachines(): Promise<ProductionMachine[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ machines: ProductionMachine[] }>>("/production/machines")
    return res.data.payload.machines
}

export async function createProductionMachine(input: ProductionMachineInput): Promise<ProductionMachine> {
    const res = await protectedApiClient.post<ApiEnvelope<{ machine: ProductionMachine }>>("/production/machines", input)
    return res.data.payload.machine
}

export async function updateProductionMachine(
    id: string,
    input: Partial<ProductionMachineInput>,
): Promise<ProductionMachine> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ machine: ProductionMachine }>>(`/production/machines/${id}`, input)
    return res.data.payload.machine
}

export async function deleteProductionMachine(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/machines/${id}`)
}

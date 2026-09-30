import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane"

import { buildProductionChangeMessage, type ProductionChangeScope } from "@/core/helpers/production/productionRealtime"
import type { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { logger } from "@/core/logger"
import { iotDataEndpointUrl } from "@/functions/shared/realtime/iotDataEndpoint"

/** Yayın en çok bu kadar beklenir: canlı güncelleme yazma isteğini yavaşlatmamalı. */
const PUBLISH_TIMEOUT_MS = 1_500

type PublishInput = { scopes: ProductionChangeScope[]; actorUserId: string | null }

type PublishDeps = {
    env?: Partial<Record<"PRODUCTION_REALTIME_ENDPOINT" | "PRODUCTION_REALTIME_TOPIC", string>>
    send?: (command: PublishCommand, abortSignal: AbortSignal) => Promise<unknown>
    now?: () => Date
}

let cachedClient: { endpoint: string; client: IoTDataPlaneClient } | null = null

function iotClient(endpoint: string): IoTDataPlaneClient {
    if (!cachedClient || cachedClient.endpoint !== endpoint) {
        cachedClient = { endpoint, client: new IoTDataPlaneClient({ endpoint: iotDataEndpointUrl(endpoint) }) }
    }
    return cachedClient.client
}

/**
 * `/uretim` ekranlarına "şu alan değişti" ipucu yayınlar (4.4; sözleşme
 * `core/helpers/production/productionRealtime.ts`). Ortam ayarı yoksa (test, eksik yapılandırma)
 * sessizce atlar. Yayın hatası yazma isteğini ASLA başarısız kılmaz — yalnız loglanır; ekranlar
 * otomatik yenilemeyle yine güncellenir.
 */
export async function publishProductionChange(input: PublishInput, deps: PublishDeps = {}): Promise<boolean> {
    const env = deps.env ?? process.env
    const endpoint = env.PRODUCTION_REALTIME_ENDPOINT
    const topic = env.PRODUCTION_REALTIME_TOPIC
    if (!endpoint || !topic) return false

    const message = buildProductionChangeMessage({ ...input, occurredAt: deps.now ? deps.now() : new Date() })
    const command = new PublishCommand({ topic, qos: 0, payload: Buffer.from(JSON.stringify(message)) })
    const abortSignal = AbortSignal.timeout(PUBLISH_TIMEOUT_MS)
    try {
        if (deps.send) await deps.send(command, abortSignal)
        else await iotClient(endpoint).send(command, { abortSignal })
        return true
    } catch (error) {
        logger.warn("Üretim canlı güncellemesi yayınlanamadı", { error, scopes: input.scopes })
        return false
    }
}

/**
 * Üretim yazma ucunu sarar: işlem BAŞARIYLA dönünce değişikliği yayınlar; hata fırlatan istek yayın
 * yapmaz. Her üretim yazma ucu (`actions.ts`) bununla sarılır — yeni bir yazma ucu eklerken unutma,
 * yoksa diğer planlayıcıların ekranı o değişiklikte tazelenmez.
 */
export function withProductionChange<TResponse>(
    scope: ProductionChangeScope,
    run: (event: IAPIGatewayProxyEventWithUser) => Promise<TResponse>,
    publish: (input: PublishInput) => Promise<boolean> = publishProductionChange,
) {
    return async (event: IAPIGatewayProxyEventWithUser): Promise<TResponse> => {
        const response = await run(event)
        await publish({ scopes: [scope], actorUserId: event.user?.id ?? null })
        return response
    }
}

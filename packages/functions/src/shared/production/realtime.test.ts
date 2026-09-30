import { describe, expect, it, vi } from "vitest"
import type { PublishCommand } from "@aws-sdk/client-iot-data-plane"

import { publishProductionChange, withProductionChange } from "./realtime"
import { iotDataEndpointUrl } from "@/functions/shared/realtime/iotDataEndpoint"

const env = { PRODUCTION_REALTIME_ENDPOINT: "abc-ats.iot.eu-west-1.amazonaws.com", PRODUCTION_REALTIME_TOPIC: "app/kubi/production/changes" }
const now = () => new Date("2026-09-28T11:00:00.000Z")

describe("IoT uç noktası", () => {
    it("şemasız host adına https eklenir; şemalı adres olduğu gibi kalır", () => {
        expect(iotDataEndpointUrl("abc-ats.iot.eu-west-1.amazonaws.com")).toBe("https://abc-ats.iot.eu-west-1.amazonaws.com")
        expect(iotDataEndpointUrl(" https://abc-ats.iot.eu-west-1.amazonaws.com ")).toBe("https://abc-ats.iot.eu-west-1.amazonaws.com")
    })
})

describe("publishProductionChange", () => {
    it("konuya yalnız ipucu yayınlar (QoS 0, veri yok)", async () => {
        const send = vi.fn().mockResolvedValue({})
        expect(await publishProductionChange({ scopes: ["plan"], actorUserId: "u-1" }, { env, send, now })).toBe(true)
        const [command] = send.mock.calls[0] as [PublishCommand]
        expect(command.input.topic).toBe("app/kubi/production/changes")
        expect(command.input.qos).toBe(0)
        expect(JSON.parse(Buffer.from(command.input.payload as Uint8Array).toString())).toEqual({
            type: "production.changed", scopes: ["plan"], occurredAt: "2026-09-28T11:00:00.000Z", actorUserId: "u-1",
        })
    })

    it("yapılandırma yoksa atlar; yayın hatası fırlatılmaz", async () => {
        const send = vi.fn().mockRejectedValue(new Error("iot kapalı"))
        expect(await publishProductionChange({ scopes: ["plan"], actorUserId: null }, { env: {}, send })).toBe(false)
        expect(send).not.toHaveBeenCalled()
        expect(await publishProductionChange({ scopes: ["plan"], actorUserId: null }, { env, send })).toBe(false)
    })
})

describe("withProductionChange", () => {
    it("başarılı işlemden SONRA yayınlar ve yanıtı aynen döner; hata fırlatan işlem yayın yapmaz", async () => {
        const publish = vi.fn().mockResolvedValue(true)
        const ok = withProductionChange("roster", async () => ({ statusCode: 200 }), publish)
        expect(await ok({ user: { id: "u-2" } } as never)).toEqual({ statusCode: 200 })
        expect(publish).toHaveBeenCalledWith({ scopes: ["roster"], actorUserId: "u-2" })

        const failing = withProductionChange("plan", async () => { throw new Error("409") }, publish)
        await expect(failing({} as never)).rejects.toThrow("409")
        expect(publish).toHaveBeenCalledTimes(1)
    })
})

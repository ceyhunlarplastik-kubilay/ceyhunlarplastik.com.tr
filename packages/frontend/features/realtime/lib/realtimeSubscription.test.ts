import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { REALTIME_RETRY_DELAY_MS, startRealtimeSubscription } from "./realtimeSubscription"

type Listener = (...args: unknown[]) => void
type SubscribeCallback = (error: Error | null, granted?: Array<{ qos: number; reasonCode?: number }>) => void

/** mqtt istemcisinin bu modülün kullandığı yüzeyi. */
class FakeClient {
    listeners = new Map<string, Listener[]>()
    ended = false
    connected = false
    subscribed: { topic: string; qos: number; callback: SubscribeCallback } | null = null

    constructor(public url: string, public options: { password: string }) {}

    on(event: string, listener: Listener) {
        this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener])
        return this
    }

    emit(event: string, ...args: unknown[]) {
        for (const listener of this.listeners.get(event) ?? []) listener(...args)
    }

    subscribe(topic: string, options: { qos: number }, callback: SubscribeCallback) {
        this.subscribed = { topic, qos: options.qos, callback }
        return this
    }

    connect() {
        this.connected = true
        return this
    }

    end() {
        this.ended = true
        return this
    }
}

const TOPIC = "app/kubi/production/changes"
const NOW = new Date("2026-09-28T11:00:00.000Z").getTime()

function jwt(expSeconds: number) {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
    return `${encode({ alg: "RS256" })}.${encode({ exp: expSeconds })}.imza`
}

function setup(tokens: Array<string | null>) {
    const clients: FakeClient[] = []
    const getToken = vi.fn(async () => (tokens.length > 1 ? tokens.shift()! : tokens[0]))
    const onStatus = vi.fn()
    const onMessage = vi.fn()
    const onSubscribed = vi.fn()
    const stop = startRealtimeSubscription({
        config: { endpoint: "abc-ats.iot.eu-west-1.amazonaws.com", authorizer: "Auth" },
        topic: TOPIC,
        qos: 0,
        getToken,
        loadConnect: async () => ((url: string, options: { password: string }) => {
            const client = new FakeClient(url, options)
            clients.push(client)
            return client
        }) as never,
        onStatus,
        onMessage,
        onSubscribed,
        logError: () => undefined,
    })
    return { clients, getToken, onStatus, onMessage, onSubscribed, stop }
}

function acceptSubscription(client: FakeClient) {
    client.emit("connect")
    client.subscribed?.callback(null, [{ qos: 0 }])
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
})

afterEach(() => {
    vi.useRealTimers()
})

describe("startRealtimeSubscription", () => {
    it("taze jetonla bağlanır, abone olur; yalnız kendi konusunun mesajını iletir", async () => {
        const token = jwt(NOW / 1000 + 3_600)
        const { clients, onStatus, onMessage, onSubscribed } = setup([token])
        await vi.advanceTimersByTimeAsync(0)

        const [client] = clients
        expect(client.options.password).toBe(token)
        expect(client.url).toBe("wss://abc-ats.iot.eu-west-1.amazonaws.com/mqtt?x-amz-customauthorizer-name=Auth")
        expect(client.connected).toBe(true)

        acceptSubscription(client)
        expect(client.subscribed).toMatchObject({ topic: TOPIC, qos: 0 })
        expect(onStatus).toHaveBeenLastCalledWith("live")
        expect(onSubscribed).toHaveBeenCalledWith({ resumed: false })

        client.emit("message", TOPIC, new Uint8Array([1]))
        client.emit("message", "baska/konu", new Uint8Array([2]))
        expect(onMessage).toHaveBeenCalledTimes(1)
    })

    it("jeton dolmadan 2 dk önce YENİ jetonla yeniden bağlanır; eski bağlantının olayları yok sayılır", async () => {
        const first = jwt(NOW / 1000 + 3_600)
        const second = jwt(NOW / 1000 + 7_200)
        const { clients, getToken, onStatus, onSubscribed } = setup([first, second])
        await vi.advanceTimersByTimeAsync(0)
        acceptSubscription(clients[0])

        await vi.advanceTimersByTimeAsync(58 * 60_000)
        expect(getToken).toHaveBeenCalledTimes(2)
        expect(clients[0].ended).toBe(true)
        expect(clients[1].options.password).toBe(second)

        onStatus.mockClear()
        clients[0].emit("offline")
        expect(onStatus).not.toHaveBeenCalled()

        acceptSubscription(clients[1])
        expect(onSubscribed).toHaveBeenLastCalledWith({ resumed: true })
    })

    it("yetki hatası ya da abonelik reddi: bağlantı bırakılır, 15 sn sonra taze jetonla yeniden denenir", async () => {
        const { clients, getToken, onStatus } = setup([jwt(NOW / 1000 + 3_600)])
        await vi.advanceTimersByTimeAsync(0)

        clients[0].emit("error", new Error("Connection refused: Not authorized"))
        expect(clients[0].ended).toBe(true)
        expect(onStatus).toHaveBeenLastCalledWith("offline")
        await vi.advanceTimersByTimeAsync(REALTIME_RETRY_DELAY_MS)
        expect(getToken).toHaveBeenCalledTimes(2)
        expect(clients).toHaveLength(2)

        clients[1].emit("connect")
        clients[1].subscribed?.callback(null, [{ qos: 0, reasonCode: 0x87 }])
        expect(clients[1].ended).toBe(true)
        expect(onStatus).toHaveBeenLastCalledWith("offline")
        await vi.advanceTimersByTimeAsync(REALTIME_RETRY_DELAY_MS)
        expect(clients).toHaveLength(3)
    })

    it("jeton yoksa bağlanmaz ve yeniden dener; durdurulunca her şey biter", async () => {
        const { clients, getToken, onStatus, stop } = setup([null])
        await vi.advanceTimersByTimeAsync(0)
        expect(clients).toHaveLength(0)
        expect(onStatus).toHaveBeenLastCalledWith("offline")

        await vi.advanceTimersByTimeAsync(REALTIME_RETRY_DELAY_MS)
        expect(getToken).toHaveBeenCalledTimes(2)

        stop()
        await vi.advanceTimersByTimeAsync(10 * REALTIME_RETRY_DELAY_MS)
        expect(getToken).toHaveBeenCalledTimes(2)
    })

    it("durdurma açık bağlantıyı kapatır; geç gelen jeton bağlantı açtırmaz", async () => {
        const live = setup([jwt(NOW / 1000 + 3_600)])
        await vi.advanceTimersByTimeAsync(0)
        live.stop()
        expect(live.clients[0].ended).toBe(true)

        const late = setup([jwt(NOW / 1000 + 3_600)])
        late.stop()
        await vi.advanceTimersByTimeAsync(0)
        expect(late.clients).toHaveLength(0)
    })
})

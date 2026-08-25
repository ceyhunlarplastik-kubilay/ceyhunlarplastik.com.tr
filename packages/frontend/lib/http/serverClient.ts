import axios from "axios";
import { endpoints } from "./endpoints";
import http from "node:http";
import https from "node:https";

import { handleApiError } from "@/lib/http/error-handler"
import { getServerAuthToken } from "@/lib/auth/getServerAuthToken"

const keepAliveHttpAgent = new http.Agent({ keepAlive: true });
const keepAliveHttpsAgent = new https.Agent({ keepAlive: true });

function attachInterceptors(client: ReturnType<typeof axios.create>) {
    client.interceptors.request.use((config) => {
        if (process.env.NODE_ENV !== "production") {
            const method = config.method?.toUpperCase() ?? "GET"
            console.log(`[SERVER API] ${method} ${config.baseURL ?? ""}${config.url ?? ""}`)
        }
        return config
    })

    client.interceptors.response.use(
        (res) => res,
        (error) => handleApiError(error)
    )
}

function createServerClient(baseURL: string, token?: string) {
    const client = axios.create({
        baseURL,
        timeout: 60_000,
        withCredentials: false,
        httpAgent: keepAliveHttpAgent,
        httpsAgent: keepAliveHttpsAgent,
    })

    if (token) {
        client.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    attachInterceptors(client)
    return client
}

const publicClient = createServerClient(endpoints.publicApi);

export function publicServerClient() {
    return publicClient;
}

export async function adminServerClient() {
    const idToken = await getServerAuthToken()
    return createServerClient(endpoints.adminApi, idToken ?? undefined);
}

export async function protectedServerClient() {
    const idToken = await getServerAuthToken()
    return createServerClient(endpoints.protectedApi, idToken ?? undefined);
}

/**
 * Token'ı AÇIKÇA alan protected istemci.
 *
 * `protectedServerClient()` token'ı oturumdan okur; auth callback'lerinin İÇİNDE
 * bu döngüsel olur (oturum daha kurulmamıştır). Giriş ve token yenileme
 * yollarında elde zaten taze bir idToken var, o doğrudan verilir.
 */
export function protectedServerClientWithToken(idToken: string) {
    return createServerClient(endpoints.protectedApi, idToken);
}

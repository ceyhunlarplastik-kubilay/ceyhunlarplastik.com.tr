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

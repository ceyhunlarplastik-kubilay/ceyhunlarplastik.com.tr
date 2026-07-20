import axios from "axios";
import { getSession } from "next-auth/react";
import { endpoints } from "@/lib/http/endpoints";
import { handleApiError } from "@/lib/http/error-handler"

// Sonra ileride admin çağrılarında Authorization: Bearer <access_token> eklemek için interceptor koyarız.
function createClient(baseURL: string) {
    /* return axios.create({
        baseURL,
        // cross-origin + cookie auth kullanmıyoruz şimdilik:
        withCredentials: false,
        timeout: 20_000,
    }); */
    const client = axios.create({
        baseURL,
        // cross-origin + cookie auth kullanmıyoruz şimdilik:
        withCredentials: false,
        timeout: 20_000,
    });

    client.interceptors.response.use(
        (res) => res,
        (error) => handleApiError(error)
    );

    return client;
}

export const publicApiClient = createClient(endpoints.publicApi);
export const adminApiClient = createClient(endpoints.adminApi);
export const protectedApiClient = createClient(endpoints.protectedApi);

/**
 * ID token cache (panel ilk-yük pattern'i).
 *
 * next-auth v4 `getSession()` her çağrıda /api/auth/session'a HTTP round-trip
 * yapar (SessionProvider context'ini KULLANMAZ) — eski interceptor'lar bunu her
 * API isteğinde çağırdığı için her panel çağrısının önüne +1 seri istek biniyordu.
 * Token, JWT `exp`'ine (60sn marjla) kadar module-level cache'te tutulur;
 * eşzamanlı istekler tek getSession uçuşunu paylaşır (single-flight). 401'de
 * cache düşürülür → sonraki istek taze session alır (client-side signOut
 * senaryosunu da telafi eder; tam sayfa geçişinde module state zaten sıfırlanır).
 */
let cachedIdToken: string | null = null;
let cachedIdTokenExpMs = 0;
let idTokenInflight: Promise<string | null> | null = null;

function decodeJwtExpMs(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    } catch {
        // exp okunamazsa cache hiç taze sayılmaz → her istekte getSession
        // (eski davranışa güvenli düşüş).
        return 0;
    }
}

async function getCachedIdToken(): Promise<string | null> {
    if (cachedIdToken && Date.now() < cachedIdTokenExpMs - 60_000) {
        return cachedIdToken;
    }

    if (!idTokenInflight) {
        idTokenInflight = getSession()
            .then((session) => {
                const idToken = (session as any)?.idToken ?? null;
                cachedIdToken = idToken;
                cachedIdTokenExpMs = idToken ? decodeJwtExpMs(idToken) : 0;
                return idToken;
            })
            .finally(() => {
                idTokenInflight = null;
            });
    }

    return idTokenInflight;
}

function invalidateIdTokenCache() {
    cachedIdToken = null;
    cachedIdTokenExpMs = 0;
}

for (const client of [adminApiClient, protectedApiClient]) {
    client.interceptors.request.use(async (config) => {
        const idToken = await getCachedIdToken();

        if (idToken) {
            config.headers?.set("Authorization", `Bearer ${idToken}`);
        }

        return config;
    });

    client.interceptors.response.use(
        (res) => res,
        (error) => {
            if (error?.response?.status === 401) invalidateIdTokenCache();
            return Promise.reject(error);
        },
    );
}

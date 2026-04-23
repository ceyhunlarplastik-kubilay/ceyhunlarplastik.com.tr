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

// ✅ Admin isteklerine Authorization ekle
adminApiClient.interceptors.request.use(async (config) => {
    const session = await getSession();

    const idToken = (session as any)?.idToken;

    if (idToken) {
        config.headers?.set("Authorization", `Bearer ${idToken}`);
    }

    return config;
});

protectedApiClient.interceptors.request.use(async (config) => {
    const session = await getSession();
    const idToken = (session as any)?.idToken;

    if (idToken) {
        config.headers?.set("Authorization", `Bearer ${idToken}`);
    }

    return config;
});

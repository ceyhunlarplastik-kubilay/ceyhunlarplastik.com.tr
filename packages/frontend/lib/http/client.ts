import axios from "axios";
import { endpoints } from "./endpoints";
import { getSession } from "next-auth/react";

// Sonra ileride admin çağrılarında Authorization: Bearer <access_token> eklemek için interceptor koyarız.
function createClient(baseURL: string) {
    return axios.create({
        baseURL,
        // cross-origin + cookie auth kullanmıyoruz şimdilik:
        withCredentials: false,
        timeout: 20_000,
    });
}

export const publicApiClient = createClient(endpoints.publicApi);
export const adminApiClient = createClient(endpoints.adminApi);

// ✅ Admin isteklerine Authorization ekle
adminApiClient.interceptors.request.use(async (config) => {
    const session = await getSession();

    const idToken = (session as any)?.idToken;

    if (idToken) {
        config.headers?.set("Authorization", `Bearer ${idToken}`);
    }

    return config;
});

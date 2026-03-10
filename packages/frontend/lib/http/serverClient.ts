import axios from "axios";
import { endpoints } from "./endpoints";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

export async function adminServerClient() {

    const session = await getServerSession(authOptions);

    const idToken = (session as any)?.idToken;

    const client = axios.create({
        baseURL: endpoints.adminApi,
        timeout: 20000,
    });

    if (idToken) {
        client.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;
    }

    return client;
}

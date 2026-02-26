import type { HrFormValues } from "../schema";

export async function submitHrForm(data: HrFormValues) {
    // TODO: backend hazır olunca publicApiClient.post("/hr", formData)
    await new Promise((r) => setTimeout(r, 800));
    return { ok: true };
}

/* import { HrFormValues } from "../schema";
import { publicApiClient } from "@/lib/http/client";

export async function submitHrForm(data: HrFormValues) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value);
        } else {
            formData.append(key, String(value));
        }
    });

    return publicApiClient.post("/hr", formData);
} */
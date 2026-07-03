import { deleteS3Object } from "@/core/helpers/s3/deleteObject"

export async function deleteS3Objects(keys: string[]) {

    if (!keys.length) return

    await Promise.all(keys.map((key) => deleteS3Object(key)))
}

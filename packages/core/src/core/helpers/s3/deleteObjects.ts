import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({})

export async function deleteS3Objects(keys: string[]) {

    if (!keys.length) return

    const bucket = process.env.BUCKET_NAME!

    const command = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
            Objects: keys.map(key => ({ Key: key })),
            Quiet: true
        }
    })

    const result = await s3.send(command)

    if (result.Errors && result.Errors.length > 0) {
        console.error("S3 delete errors:", result.Errors)
        throw new Error("Failed to delete some S3 objects")
    }
}

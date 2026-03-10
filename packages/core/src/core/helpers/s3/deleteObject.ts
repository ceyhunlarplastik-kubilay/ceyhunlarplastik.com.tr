import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({})

export async function deleteS3Object(key: string) {

    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME!,
            Key: key,
        })
    )
}

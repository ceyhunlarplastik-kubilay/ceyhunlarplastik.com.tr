const isPermanentStage = ["prod", "dev"].includes($app.stage);

export const publicBucket = new sst.aws.Bucket("CeyhunlarWebBucket", {
    access: isPermanentStage ? "cloudfront" : "public"
});

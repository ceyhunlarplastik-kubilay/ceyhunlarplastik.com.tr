import config from "../config";
// import { publicBucket } from "./storage";
// import { appRouter } from "./router";

export const frontend = new sst.aws.Nextjs("Ceyhunlar-Frontend", {
    path: "packages/frontend",

    // ✅ Router BURADA
    /* router: appRouter
      ? {
        instance: appRouter,
      }
      : undefined,
  
    link: [publicBucket], */

    environment: {
        STAGE: $app.stage,
        DOMAIN: config.DOMAIN,
        /* CLERK_SECRET_KEY: config.CLERK_SECRET_KEY,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: config.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        GOOGLE_EMAIL: config.GOOGLE_EMAIL,
        GOOGLE_APP_PASSWORD: config.GOOGLE_APP_PASSWORD,
        GOOGLE_CLIENT_EMAIL: config.GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY: config.GOOGLE_PRIVATE_KEY,
        MONGO_URI: config.MONGO_URI,
        MONGO_GEO_URI: config.MONGO_GEO_URI,
        SPREADSHEET_ID: config.SPREADSHEET_ID,
        NEXT_PUBLIC_BUCKET_NAME: publicBucket.name,
        TURKIYE_API_URL: config.TURKIYE_API_URL, */
    },
});

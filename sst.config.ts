/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ceyhunlarweb",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    // const storage = await import("./infra/storage");
    const { DATABASE_URL } = await import ("./infra/db");
    await import ("./infra/PublicApi");
    await import ("./infra/ProtectedApi");
    await import ("./infra/AdminApi");
    await import ("./infra/OwnerApi");

    /* return {
      MyBucket: storage.bucket.name,
    }; */
    return { DATABASE_URL };
  },
});

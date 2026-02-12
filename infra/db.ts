export const vpc = new sst.aws.Vpc("MyVpc");

export const rds = new sst.aws.Postgres("MyPostgres", {
  vpc,
  dev: {
    username: "postgres",
    password: "password",
    database: "local",
    host: "localhost",
    port: 5432,
  },
});

export const DATABASE_URL = $interpolate`postgresql://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.database}`;

new sst.x.DevCommand("Prisma", {
  environment: { DATABASE_URL },
  dev: {
    autostart: false,
    command: 'bash -lc "cd packages/core && npx prisma studio"',
  },
});

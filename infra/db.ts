import config from "../config"

export const vpc = new sst.aws.Vpc("MyVpc", {
  nat: "ec2",
  bastion: true,
});

export const rds = new sst.aws.Postgres("MyPostgres", {
  vpc,
  // instance: "db.t4g.micro",
  instance: "t4g.micro",
  multiAz: false, // Todo: true yap
  storage: "20 GB", // Todo: konuşulacak
  // password: "password", // Todo: s3 secret manager ile saklanacak
  // TIP: The RDS Proxy allows serverless environments to reliably connect to RDS.
  proxy: true,
  password: config.RDS_PASSWORD,
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
  link: [rds],
  environment: { DATABASE_URL },
  dev: {
    autostart: false,
    command: 'bash -lc "cd packages/core && npx prisma studio"',
  },
});


/* ⚠️ Important Constraints to Remember:

No Internet Access: Your Lambdas inside this VPC effectively have NO internet access.
Breaking Changes: If you later add code to:
Send emails (SES/Gmail)
Upload files to S3 (unless using Gateway Endpoints or presigned URLs generated elsewhere)
Perform Admin User operations (e.g., adminCreateUser, adminAddUserToGroup) ...these will timeout and fail because they cannot reach the AWS public endpoints. */
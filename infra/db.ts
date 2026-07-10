import config from "../config"

const isProd = $app.stage === "prod";
const isNeonStage = !isProd;

export const databaseProvider = isProd ? "aws-rds" : "neon";

export const vpc = isProd
  ? new sst.aws.Vpc("MyVpc", {
    // nat: "ec2",
    nat: {
      ec2: {
        instance: "t4g.small", // prod için biraz daha güçlü bir instance
      },
    },
    bastion: true,
  })
  : undefined;

const neonDatabaseUrl = isNeonStage
  ? new sst.Secret("NeonDatabaseUrl")
  : undefined;

const neonDirectUrl = isNeonStage
  ? new sst.Secret("NeonDirectUrl")
  : undefined;

const prodRds = isProd
  ? new sst.aws.Postgres("MyPostgres", {
    vpc: vpc!,
    instance: "t4g.micro",
    multiAz: false, // Todo: true yap, maliyete bakılacak
    storage: "20 GB", // Todo: konuşulacak
    // password: "password", // Todo: s3 secret manager ile saklanacak
    // RDS Proxy protects the small prod database from serverless connection spikes.
    proxy: true,
    password: config.RDS_PASSWORD,
    /*   transform: {
        subnetGroup: (_args, opts) => {
          if (isProd) opts.retainOnDelete = true;
        },
        parameterGroup: (_args, opts) => {
          if (isProd) opts.retainOnDelete = true;
        },
        instance: (_args, opts) => {
          if (isProd) {
            opts.protect = true;
            opts.import = "ceyhunlarweb-prod-mypostgresinstance-zfwoarbk";
          }
        },
      }, */
  })
  : undefined;

const neonRds = isNeonStage
  ? new sst.Linkable("MyPostgres", {
    properties: {
      url: neonDatabaseUrl!.value,
    },
  })
  : undefined;

export const rds = prodRds ?? neonRds!;

export const DATABASE_URL = isProd
  ? $interpolate`postgresql://${prodRds!.username}:${prodRds!.password}@${prodRds!.host}:${prodRds!.port}/${prodRds!.database}`
  : neonDatabaseUrl!.value;

export const DIRECT_URL = isProd
  ? DATABASE_URL
  : neonDirectUrl!.value;

new sst.x.DevCommand("Prisma", {
  link: [rds],
  environment: {
    DATABASE_URL,
    DIRECT_URL,
  },
  dev: {
    autostart: false,
    command: 'bash -lc "cd packages/core && npx prisma studio"',
  },
});


/* ⚠️ Important Constraints to Remember:

Lambdas in this VPC depend on NAT or VPC endpoints for AWS public service APIs.
For critical runtime dependencies, prefer explicit interface/gateway endpoints where available
so auth, storage, and notification flows do not rely only on public egress.
Do not add a cognito-idp private DNS endpoint while the user pool uses ManagedLogin;
Cognito rejects that path with "PrivateLink access is disabled for the user pool". */

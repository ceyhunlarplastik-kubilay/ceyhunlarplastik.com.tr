import config from "../config"

const isProd = $app.stage === "prod";

export const vpc = new sst.aws.Vpc("MyVpc", {
  // nat: "ec2",
  nat: {
    ec2: {
      instance: "t4g.small", // prod için biraz daha güçlü bir instance
    },
  },
  /* nat: isProd
  ? "managed"
  : {
    ec2: {
      instance: "t4g.micro",
    },
  }, */
  bastion: true,
});

export const rds = new sst.aws.Postgres("MyPostgres", {
  vpc,
  instance: "t4g.micro",
  multiAz: false, // Todo: true yap, maliyete bakılacak
  storage: "20 GB", // Todo: konuşulacak
  // password: "password", // Todo: s3 secret manager ile saklanacak
  // RDS Proxy protects the small prod database from serverless connection spikes.
  proxy: isProd,
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

Lambdas in this VPC depend on NAT or VPC endpoints for AWS public service APIs.
For critical runtime dependencies, prefer explicit interface/gateway endpoints where available
so auth, storage, and notification flows do not rely only on public egress.
Do not add a cognito-idp private DNS endpoint while the user pool uses ManagedLogin;
Cognito rejects that path with "PrivateLink access is disabled for the user pool". */

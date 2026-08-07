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

const rdsPassword = isProd
  ? new sst.Secret("RdsPassword")
  : undefined;

const deeplApiKey = new sst.Secret("DeeplApiKey");

const prodRds = isProd
  ? new sst.aws.Postgres("MyPostgres", {
    vpc: vpc!,
    instance: "t4g.micro",
    multiAz: false, // Todo: true yap, maliyete bakılacak
    storage: "20 GB", // Todo: konuşulacak
    // RDS Proxy protects the small prod database from serverless connection spikes.
    proxy: true,
    password: rdsPassword!.value,
    // multiAz: false → tek AZ. Otomatik yedek + PITR zaten var (SST default
    // backupRetentionPeriod: 7). P2.4-B iki UCUZ (maliyet=0) sertleştirme ekler:
    transform: {
      instance: (args) => {
        // (1) RDS-native silme koruması. Stage-level `protect: true` yalnız
        // Pulumi/sst remove'u durdurur; konsol/CLI/API'den elle silmeyi DURDURMAZ.
        // deletionProtection o boşluğu kapatır.
        args.deletionProtection = true;
        // (2) Silme olursa (önce deletionProtection kapatılmalı) son yedek alınsın.
        // skipFinalSnapshot=false, finalSnapshotIdentifier'ı ZORUNLU kılar; sabit
        // ad diff churn'ü önler (yalnız gerçek silmede kullanılır — o an hesapta
        // aynı adlı snapshot varsa silme sırasında yeniden adlandırılır).
        args.skipFinalSnapshot = false;
        args.finalSnapshotIdentifier = "ceyhunlarweb-prod-mypostgres-final";
        // (3) SST 4 bunu `false`'a çekiyor (postgres.ts, v3'te yoktu). Bilinçli
        // olarak GERİ ALINDI: `false`, Postgres minor yamalarının (17.9 → 17.10 …
        // yalnız hata/güvenlik düzeltmesi, şema veya API kırılması yok) hiç
        // uygulanmaması demek. Bu projede CVE takip edip elle yükseltecek bir
        // rutin yok → pratikte "hiç yamalanmaz"a dönerdi. Bakım penceresi
        // Pazartesi 00:33-01:03 UTC (TR 03:33-04:03), B2B katalog için ölü saat;
        // tek AZ olduğumuz için yamada birkaç dakika kesinti olur, kabul edildi.
        // Not: SST 4 ayrıca `applyImmediately: true` ekliyor — ileride sürüm ELLE
        // değiştirilirse pencere beklenmez, anında uygulanır.
        args.autoMinorVersionUpgrade = true;
      },
    },
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
  ? $interpolate`postgresql://${prodRds!.username}:${prodRds!.password}@${config.DIRECT_RDS_HOST}:${prodRds!.port}/${prodRds!.database}`
  : neonDirectUrl!.value;

new sst.x.DevCommand("Prisma", {
  link: [rds],
  environment: {
    DATABASE_URL,
    DIRECT_URL,
    // translate-*.ts CLI'ları bunu process.env'den okur (bkz. deeplApiKey notu).
    DEEPL_API_KEY: deeplApiKey.value,
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

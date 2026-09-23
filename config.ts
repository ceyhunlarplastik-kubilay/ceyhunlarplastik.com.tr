interface ENV {
    AWS_REGION: string | undefined;
    HOSTED_ZONE_ID: string | undefined;
    DOMAIN: string | undefined;
    DOMAIN_CERTIFICATE_ARN: string | undefined;
    DIRECT_RDS_HOST: string | undefined;
    GOOGLE_LOGIN_ENABLED: string | undefined;
}

interface Config {
    AWS_REGION: string;
    HOSTED_ZONE_ID: string;
    DOMAIN: string;
    DOMAIN_CERTIFICATE_ARN: string;
    DIRECT_RDS_HOST: string;
    /** Stage-özel bayrak: yalnız `.env`'de açıkça "true" ise Google girişi altyapıya eklenir. */
    GOOGLE_LOGIN_ENABLED: boolean;
}

const getConfig = (): ENV => {
    return {
        AWS_REGION: process.env.AWS_REGION,
        HOSTED_ZONE_ID: process.env.HOSTED_ZONE_ID,
        DOMAIN: process.env.DOMAIN,
        DOMAIN_CERTIFICATE_ARN: process.env.DOMAIN_CERTIFICATE_ARN,
        DIRECT_RDS_HOST: process.env.DIRECT_RDS_HOST,
        GOOGLE_LOGIN_ENABLED: process.env.GOOGLE_LOGIN_ENABLED,
    };
};

const getSanitizedConfig = (config: ENV): Config => {
    if (!config.AWS_REGION) {
        throw new Error("Missing key AWS_REGION from environment variables");
    }

    return {
        AWS_REGION: config.AWS_REGION,
        HOSTED_ZONE_ID: config.HOSTED_ZONE_ID ?? "",
        DOMAIN: config.DOMAIN ?? "",
        DOMAIN_CERTIFICATE_ARN: config.DOMAIN_CERTIFICATE_ARN ?? "",
        DIRECT_RDS_HOST: config.DIRECT_RDS_HOST ?? "",
        GOOGLE_LOGIN_ENABLED: config.GOOGLE_LOGIN_ENABLED === "true",
    } as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;

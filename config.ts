interface ENV {
    AWS_REGION: string | undefined;
    HOSTED_ZONE_ID: string | undefined;
    DOMAIN: string | undefined;
}

interface Config {
    AWS_REGION: string;
    HOSTED_ZONE_ID: string;
    DOMAIN: string;
}

const getConfig = (): ENV => {
    return {
        AWS_REGION: process.env.AWS_REGION,
        HOSTED_ZONE_ID: process.env.HOSTED_ZONE_ID,
        DOMAIN: process.env.DOMAIN,
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
    } as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;
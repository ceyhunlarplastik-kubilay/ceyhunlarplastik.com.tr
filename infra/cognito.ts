import config from "../config";
import { rds } from "./db";

const isPermanentStage = ['prod', 'dev'].includes($app.stage)

// Helper functions
const getFrontendDomain = () => {
    if ($app.stage === 'prod') return config.DOMAIN
    if ($app.stage === 'dev') return `dev.${config.DOMAIN}`
    return 'localhost:3000'
}

const getBaseUrl = () => (isPermanentStage ? `https://${getFrontendDomain()}` : 'http://localhost:3000')
const getCallbackUrls = () => [`${getBaseUrl()}/api/auth/callback/cognito`]
const getLogoutUrls = () => [getBaseUrl()]

const folderPrefix = 'packages/functions/src/Cognito/functions';

const userPool = new sst.aws.CognitoUserPool('CeyhunlarUserPool', {
    usernames: ['email'],
    verify: {
        emailSubject: 'Ceyhunlar Plastik - Email Doğrulama',
        emailMessage: 'Kayıt olduğunuz için teşekkür ederiz. Giriş kodu: {####}',
    },
    triggers: {
        postConfirmation: {
            handler: `${folderPrefix}/triggers/postConfirmation.handler`,
            runtime: 'nodejs20.x',
            link: [rds],
        }
    }
})

const ownerGroup = new aws.cognito.UserGroup('CeyhunlarOwners', {
    userPoolId: userPool.id,
    name: 'owner',
    description: 'Owners users',
    precedence: 1,
});

const adminGroup = new aws.cognito.UserGroup('CeyhunlarAdmins', {
    userPoolId: userPool.id,
    name: 'admin',
    description: 'Admin users',
    precedence: 2,
});

const userGroup = new aws.cognito.UserGroup('CeyhunlarUsers', {
    userPoolId: userPool.id,
    name: 'user',
    description: 'Regular users',
    precedence: 3,
});

if (isPermanentStage) {
    const hostedZoneId = config.HOSTED_ZONE_ID

    const subdomain = $app.stage === 'prod' ? 'auth' : `auth-${$app.stage}` // exp: auth-dev

    const amazonIssued = aws.acm.getCertificate(
        {
            domain: `${config.DOMAIN}`,
            statuses: ['ISSUED'],
            mostRecent: true,
        },
        {
            provider: new aws.Provider('us-east-1', { region: 'us-east-1' }),
        },
    )

    userPool.id.apply(id => {
        const userPoolDomain = new aws.cognito.UserPoolDomain('CeyhunlarUserPoolDomain', {
            domain: `${subdomain}.${config.DOMAIN}`,
            certificateArn: amazonIssued.then(c => c.arn),
            userPoolId: id,
        })

        new aws.route53.Record('auth-cognito-A', {
            name: userPoolDomain.domain,
            type: aws.route53.RecordType.A,
            zoneId: hostedZoneId,
            aliases: [
                {
                    evaluateTargetHealth: false,
                    name: userPoolDomain.cloudfrontDistribution,
                    zoneId: userPoolDomain.cloudfrontDistributionZoneId,
                },
            ],
        })
    })
}

// User Pool Client
const userPoolClient = userPool.addClient('CeyhunlarClient', {
    transform: {
        client: {
            allowedOauthFlows: ['code'],
            allowedOauthFlowsUserPoolClient: true,
            allowedOauthScopes: [
                'phone',
                'email',
                'openid',
                'profile',
                // ❌ TEHLİKELİ - Tüm kullanıcıları okuma/yazma yetkisi
                // "aws.cognito.signin.user.admin"
            ],
            callbackUrls: getCallbackUrls(),
            logoutUrls: getLogoutUrls(),
            generateSecret: false,
            supportedIdentityProviders: ['COGNITO'],
            explicitAuthFlows: [
                'ALLOW_USER_SRP_AUTH', // Secure Remote Password
                'ALLOW_REFRESH_TOKEN_AUTH',
                'ALLOW_USER_PASSWORD_AUTH',
            ],
            accessTokenValidity: 60,
            idTokenValidity: 60,
            refreshTokenValidity: 30,
            tokenValidityUnits: {
                accessToken: 'minutes',
                idToken: 'minutes',
                refreshToken: 'days',
            },
        },
    },
})

export { userPool, userPoolClient }
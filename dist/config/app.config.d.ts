export declare const appConfig: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
    allowedOrigins: string[];
    maxUploadMb: number;
    defaultCurrency: string;
    supportedCurrencies: string[];
    cronSecret: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
    allowedOrigins: string[];
    maxUploadMb: number;
    defaultCurrency: string;
    supportedCurrencies: string[];
    cronSecret: string;
}>;
export declare const dbConfig: (() => {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    sync: boolean;
    logging: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    sync: boolean;
    logging: boolean;
}>;
export declare const redisConfig: (() => {
    host: string;
    port: number;
    password: string;
    ttl: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string;
    ttl: number;
}>;
export declare const jwtConfig: (() => {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
}>;
export declare const googleConfig: (() => {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}>;
export declare const anthropicConfig: (() => {
    apiKey: string;
    model: string;
    advisorModel: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    apiKey: string;
    model: string;
    advisorModel: string;
}>;
export declare const openaiConfig: (() => {
    apiKey: string;
    model: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    apiKey: string;
    model: string;
}>;
export declare const emailConfig: (() => {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
}>;
export declare const paystackConfig: (() => {
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
}>;
export declare const stripeConfig: (() => {
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
}>;
export declare const flutterwaveConfig: (() => {
    secretKey: string;
    publicKey: string;
    webhookHash: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secretKey: string;
    publicKey: string;
    webhookHash: string;
}>;
export declare const paddleConfig: (() => {
    apiKey: string;
    clientToken: string;
    webhookSecret: string;
    productId: string;
    environment: "sandbox" | "production";
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    apiKey: string;
    clientToken: string;
    webhookSecret: string;
    productId: string;
    environment: "sandbox" | "production";
}>;
export declare const cloudinaryConfig: (() => {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    cloudName: string;
    apiKey: string;
    apiSecret: string;
}>;
export declare const throttleConfig: (() => {
    ttl: number;
    limit: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    ttl: number;
    limit: number;
}>;
export declare const firebaseConfig: (() => {
    serviceAccountKey: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    serviceAccountKey: string;
}>;

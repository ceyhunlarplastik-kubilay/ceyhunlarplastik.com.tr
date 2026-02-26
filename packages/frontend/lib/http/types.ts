export type ApiEnvelope<TPayload> = {
    statusCode: number;
    payload: TPayload;
};
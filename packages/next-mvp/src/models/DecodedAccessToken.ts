export interface DecodedAccessToken {
    iss: string;
    aud: string;
    sub: string;
    jti: string;
    iat: number;
    nbf: number;
    exp: number;
    user_id: string;
    client_id: string;
    token_type: string;
    scope: string;
    roles: string[];
    amr: string[];
    acr: string;
    [key: string]: any;
}
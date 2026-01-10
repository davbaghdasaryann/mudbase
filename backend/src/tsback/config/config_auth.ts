import { ConfigDatabase } from "@/tsback/config/config_database";

export type ConfigAuthLocation = string
export type ConfigAuthContainer = Map<string, ConfigAuthCredentials>;

export interface ConfigAuth {
    auth: ConfigAuthCredentials[]
    frontUrl: string;
    sessdb: ConfigDatabase;
    authSecret: string;
    google: ConfigAuthGoogle;
}

export interface ConfigAuthCredentials {
    key: string
    user?: string
    pswd?: string

    access_key?: string
    secret_key?: string
}


export interface ConfigAuthGoogle {
    clientId: string;
    clientSecret: string;
}

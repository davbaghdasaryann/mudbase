
export interface ConfigAws {
    storage: ConfigS3;
    credentials: ConfigAwsCredentials;
    cognito: ConfigCognito;
    cloudfront: ConfigCloudFront;
    ses: ConfigSes;
}


export interface ConfigS3 {
    region: string;
    bucket: string;
    dir?: string;
    credentials?: ConfigAwsCredentials;
}

export interface ConfigSes {
    region: string;
    credentials?: ConfigAwsCredentials;
}

export interface ConfigCognito {
    region: string;
    user_pool_id: string;
    user_pool_client_id: string;
}

export interface ConfigAwsCredentials {
    access_key: string;
    secret_key: string;
}

export interface ConfigCloudFront {
    distribution_id: string;
    credentials?: ConfigAwsCredentials;
}

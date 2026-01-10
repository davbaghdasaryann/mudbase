export interface ConfigServer {
    host: string;
    port: number;
    base: string;
    api: string;
    discovery?: ConfigServerDiscovery;
}

export interface ConfigServerDiscovery {
    enabled?: boolean;
    port: number;
    protocolName: string;
    protocolVersion: string;
    appName: string;
    appVersion: string;

}

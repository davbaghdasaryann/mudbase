import pkg from 'pg';
// const { Client } = pkg;

export class PgDb {
    private client: pkg.Client;

    constructor(
        host: string,
        port: number = 5432,
        user: string,
        password: string,
        database: string
    ) {
        this.client = new pkg.Client({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database,
            // Adjust SSL settings based on your network security
            // ssl: {
            //     rejectUnauthorized: false, // Use carefully
            // },
        });
    }

    async connect() {
        console.log('connecting to pg...');
        // try {

        //this.client.on(event: "drain", listener: () => void): this;
        this.client.on('error', (err: Error) => {
            console.error(err);
        });
        // on(event: "notice", listener: (notice: NoticeMessage) => void): this;
        // on(event: "notification", listener: (message: Notification) => void): this;
        // // tslint:disable-next-line unified-signatures
        // on(event: "end", listener: () => void): this;

        await this.client.connect();
        console.log('pg connected.');
        //     console.log('Connected to remote PostgreSQL database');
        // } catch (error) {
        //     console.error('Connection failed:', error);
        //     throw error;
        // }
    }

    async query(text: string, params?: any[]) {
        // try {
        const result = await this.client.query(text, params);
        return result.rows;
        // } catch (error) {
        //     console.error('Query error:', error);
        //     throw error;
        // }
    }

    async disconnect() {
        await this.client.end();
    }
}

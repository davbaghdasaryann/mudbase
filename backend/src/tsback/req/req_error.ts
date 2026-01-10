
export class ResponseError {
    code?: string;
    message?: string;
    data?: string;

    constructor(c?: string, m?: string) {
        this.code = c;
        this.message = m;
    }
};


export class ResponseErrorContainer {
    error!: ResponseError;
};


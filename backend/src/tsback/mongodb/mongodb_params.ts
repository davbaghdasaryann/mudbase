import { getQueryParam, requireQueryIntParam, requireQueryParam } from "@/tsback/req/req_params";
import {Request as ExpressReq} from "express";

import * as MongoDb from 'mongodb';


export interface DbRecordParams<Entity> {
    query?: string[];  // Query fields
    required?: string[];  // Requied query fields
    allowed?: string[];
    //values?: Record<string, string | number>;  // Provided values
    values?: Partial<Entity>;
};


class DbParamsBase<EntityT> {
    values: Partial<EntityT> = {};

    constructor(req: ExpressReq, params: DbRecordParams<EntityT>) {

        if (params.allowed) {
            if (req.body) {
                for (let [key, value] of Object.entries(req.body)) {
                    // console.log(key, value);
                    // values[key] = value;
                    if (!params.allowed.includes(key))
                        throw new Error(`Update denied for key: ${key}`);
                }
            }
        }


        if (params.query) {
            for (let field of params.query) {
                if (req.query[field] !== undefined) {
                    this.setValue(field, req.query[field]);
                } else if (req.body[field] !== undefined) {
                    this.setValue(field, req.body[field]);
                }
            }
        }

        if (params.required) {
            for (let field of params.required) {
                if (req.query[field] === undefined)
                    throw new Error("Required query param missing: " + field); 

                this.setValue(field, req.query[field]);
            }
        }

        if (params.values) {
            for (let key in params.values) {
                this.setValue(key, params.values[key]);
            }
        }

    }

    setValue(key: string, value: any) {
        if (value === undefined) return;
        (this.values as any)[key] = (value as string).trim();
    }

    getObject() {
        return this.values as EntityT;
    }
}



export interface DbFindRecordOptions {
    map?: Record<string, string>;
    select?: string[];
    allowed?: string[];
}

export class DbFindParams {
    limit?: number;  // Maximum number of records to retrieve
    skip?: number;

    orderBy?: string;
    orderAscending?: boolean;


    //search?: WhereCondition[];
    //searchFields?: string[];

    fields?: string[];

    options: DbFindRecordOptions;
  
    constructor(req: ExpressReq, options: DbFindRecordOptions) {
        this.options = options;

        if (req.query.limit) {
            this.limit = +req.query.limit;
        }

        if (req.query.skip) {
            this.skip = +req.query.skip;
        }


        // Search string is given in the following format:
        // search=name1:value1;name2:value2;
        if (req.query.search) {
            let search = req.query.search as string;
            let parsed = search.split(';');
            //this.search = [];
            for (let pair of parsed) {
                if (pair.length === 0)
                    continue;
                let valname = pair.split(':', 2);
                //this.search.push(new WhereCondition(valname[0], valname[1]));

            }
        }

        if (req.query.fields) {
            this.fields = (req.query.fields as string).split(',');
            if (options.allowed) {
                for (let field of this.fields) {
                    if (!options.allowed.includes(field))
                        throw new Error(`Fetch field not allowed: ${field}`);
                }
            }
        } else {
            this.fields = options.allowed;
        }



        // if (this.fields) {

        // }
       
    }

    getMongoProjection() {
    }

    getFindOptions(): MongoDb.FindOptions {
        let projection: MongoDb.Document | undefined = undefined;
        
        if (this.options.select) {
            projection = {
                //_id: 1,
            };

            for (let field of this.options.select) {
                projection[field] = 1;
            }
        }

        if (this.fields) {
            if (!projection) {
                projection = {};
            }

            for (let field of this.fields) {
                projection[field] = 1;
            }
        }

        let options: MongoDb.FindOptions = {
            limit: this.limit ?? undefined,
            skip: this.skip ?? undefined,
            projection: projection,
        }

        return options;
    }

    processResult(entity: any) {
        if (this.options.map) {
            //let ent = entity as any;
            let entries = Object.entries(this.options.map);
            for (let [key, val] of entries) {
                entity[val] = entity[key];
            }

            for (let [key, val] of entries) {
                entity[key] = undefined;
            }
        }
        return entity;
    }

}




//
// Updating data
//
export class DbUpdateParams<Entity> extends DbParamsBase<Entity> {
    // keyValue: string;

    constructor(req: ExpressReq, params: DbRecordParams<Entity>) {
        super(req, params);
        // this.keyValue = keyValue;
    }

};



//
// Inserting data
//

export class DbInsertParams<Entity> extends DbParamsBase<Entity> {
    constructor(req: ExpressReq, params: DbRecordParams<Entity>) {
        super(req, params);
    }
};


export function requireMongoIdParam(req: ExpressReq, name: string) {
    const value = requireQueryParam(req, name);
    return new MongoDb.ObjectId(value);
}

export function getMongoIdParam(req: ExpressReq, name: string) {
    const value = getQueryParam(req, name);
    if (value === undefined) return undefined;
    if (!MongoDb.ObjectId.isValid(value)) return undefined;
    return new MongoDb.ObjectId(value);
}

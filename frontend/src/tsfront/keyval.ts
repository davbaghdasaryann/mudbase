'use client';

// Stores the data and keyval manner

let db_: IDBDatabase;
const databaseName_ = 'keyval';
const keyvalStore_ = 'data';

interface KeyValRecord<T> {
    key: string;
    val: T;
};

//let debug_ = new Debug({enabled: false, name: "KeyValDB"});


export function keyvalInit(): Promise<void>
{
    //console.debug("check");


    return new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined")
            return reject("You browser doesn't support indexedDB.");
    
        if (!window.indexedDB)
            return reject("You browser doesn't support indexedDB.");

        if (db_)
            return resolve();

        let openReq = indexedDB.open(databaseName_);

        openReq.onerror = event => {
            console.error("Error loading database.", event);
            reject("KeyValDB::Error loading");
        };
        
        openReq.onsuccess = function (this: IDBRequest<IDBDatabase>, ev: Event) {
            //debug_.check("Open Success.");
            db_ = this.result;
            resolve();
        }

        openReq.onupgradeneeded = function (this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) {
            //debug_.check("Upgrading...");

            let db = this.result;
            let keyPath = ["key"]; 

            let store = db.createObjectStore(keyvalStore_, {keyPath: keyPath});

            store.transaction.onerror = function(this: IDBTransaction, ev: Event) {
                console.error("KeyValDB::upgradeneeded::error", this.error);
                reject(this.error);
            };

            store.transaction.oncomplete = function(this: IDBTransaction, ev: Event) {
                //debug_.check("Upgrade Complete.");
            }

            store.createIndex("key", ["key"], {unique: true});
        }
    });
    
}

export function keyvalSet<T>(key: string, val: T): Promise<void>
{
    return new Promise<void>((resolve, reject) => {

        let rec: KeyValRecord<T> = {
            key: key,
            val: val,
        };

        // let rec = {
        //     key: key,
        //     val: val,
        // };

        // Initialize the database if it's not yet initialized
        if (!db_) {
            keyvalInit().then(() => {
                if (db_) {
                    keyvalSet(key, val);
                }
            });
            return;
        }

        let req = db_.transaction(keyvalStore_, 'readwrite')
                     .objectStore(keyvalStore_)
                     .put(rec);

        req.onerror = function(ev) {
            reject("KeyValDB::Error:Put.");
        };

        req.onsuccess = function(ev) {
            resolve();
        };

    });

}

export function keyvalGet<T>(key: string): Promise<T | null>
{
    return new Promise<T | null>((resolve, reject) => {

        //console.debug(db_);

        // Initialize the database if it's not yet initialized
        if (!db_) {
            keyvalInit().then(() => {
                if (db_) {
                    resolve(keyvalGet(key));
                }
            });
            return;
        }


        let req = db_.transaction(keyvalStore_, 'readonly')
                     .objectStore(keyvalStore_)
                     .get([key]);

        req.onerror = function(ev) {
            reject("KeyValDB::Error:Get()");
        };

        req.onsuccess = function(this: IDBRequest<KeyValRecord<T>>) {
            //console.debug(this.result);

            if (!this.result)
                return resolve(null);

            let result = this.result;

            resolve(result.val);
        };
    });
}

export function getVal<T>(key: string, defVal: T): Promise<T> {
    return new Promise(resolve => {
        keyvalGet<T>(key).then(val => {
            resolve(val ?? defVal);
        }).catch(() => resolve(defVal));
    });
}

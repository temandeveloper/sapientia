import {Connection} from 'jsstore'
import workerInjector from "jsstore/dist/worker_injector";
const connection = new Connection();
connection.addPlugin(workerInjector);

// Helper untuk IndexedDB
export const idb = {  // Helper untuk IndexedDB legacy version
    openDB: () => new Promise((resolve, reject) => {
        const request = indexedDB.open('SapientiaDB', 1);
        request.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains('KeyStore')) e.target.result.createObjectStore('KeyStore'); };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    }),
    setItem: async (key, value) => {
        const db = await idb.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('KeyStore', 'readwrite');
            const request = tx.objectStore('KeyStore').put(value, key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    },
    getItem: async (key) => {
        const db = await idb.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('KeyStore', 'readonly');
            const request = tx.objectStore('KeyStore').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    }
};


export const initDatabase = async () => {
    try {
        // create database schema
        const tbMemories = {
            name: 'tbMemories',
            columns: {
                id       : { primaryKey: true, autoIncrement: true},
                datetime : { notNull: true, dataType: "number" },
                request  : { notNull: false, dataType: "string" },
                response : { notNull: false, dataType: "string" },
                vectors  : { notNull: false, dataType: "string" },
            }
        };

        const tbSettings = {
            name: 'tbSettings',
            columns: {
                id              : { primaryKey: true, autoIncrement: true},
                datetime        : { notNull: true, dataType: "number" },
                settingName     : { notNull: true, dataType: "string" },
                value           : { notNull: true, dataType: "object" },
            }
        };

        var db = {
            name: 'sapientia_system_storage',
            tables: [tbMemories,tbSettings]
        }

        const isDbCreated = await connection.initDb(db);
        if(isDbCreated === true){

            insertDataTable("tbSettings",{
                datetime    : Date.now(),
                settingName : "base-model",
                value       : {
                    modelName   : "gemma-3n-E2B-it-Q4_K_M.gguf",
                    modelPath   : "",
                    modelUri    : "hf:AhmadFadil/gemma-3n-E2B-it-text-GGUF/gemma-3n-E2B-it-Q4_K_M.gguf",
                    source      : "https://huggingface.co/google/gemma-3n-E2B-it",
                    statusDownloaded : false,
                },
            })

            insertDataTable("tbSettings",{
                datetime    : Date.now(),
                settingName : "embedding-model",
                value       : {
                    modelName   : "bge-small-en-v1.5-q8_0.gguf",
                    modelPath    : "",
                    modelUri    : "hf:CompendiumLabs/bge-small-en-v1.5-gguf/bge-small-en-v1.5-q8_0.gguf",
                    source      : "https://huggingface.co/BAAI/bge-small-en-v1.5",
                    statusDownloaded : false,
                },
            })

            console.log("db created");
            return true;
        }else {
            console.log("db opened");
            return false;
        }
    } catch (error) {
        console.log("database initialization failed", error);
        return false;
    }
    
}

export const insertDataTable = async (table,data) => {
    var inserted = await connection.insert({
        into: table,
        values: [data],
        return: true
    });

    return inserted
}

export const getDataTable = async (table,whereStn = {id : {'>' : 0}},order = {by: 'datetime',type: 'desc'}) =>{ // get all data if where statement is not filled
    var results = await connection.select({
        from: table,
        where: whereStn,
        order: order
    });

    return results //results will be array of objects.
}

export const updateDataTable = async (table,setValues,whereStn) => {
    var noOfRowsUpdated = await connection.update({
        in: table,
        set: setValues,
        where: whereStn
    })
    return noOfRowsUpdated
}

export const deleteDataTable = async (table,whereStn) => {
    var rowsDeleted = await connection.remove({
        from: table,
        where: whereStn
    });
    return rowsDeleted //results will contains no of rows deleted.
}
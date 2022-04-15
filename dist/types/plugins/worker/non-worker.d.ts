import { Observable } from 'rxjs';
import type { RxJsonSchema, RxStorage, RxStorageInstanceCreationParams, RxStorageInstance, BulkWriteRow, RxDocumentData, RxStorageBulkWriteResponse, RxStorageChangeEvent, RxStorageQueryResult, EventBulk, RxStorageStatics } from '../../types';
import { InWorkerStorage } from './in-worker';
declare type WorkerStorageInternals = {
    rxStorage: RxStorageWorker;
    instanceId: number;
    worker: InWorkerStorage;
};
declare type RxStorageWorkerSettings = {
    statics: RxStorageStatics;
    workerInput: any;
};
export declare class RxStorageWorker implements RxStorage<WorkerStorageInternals, any> {
    readonly settings: RxStorageWorkerSettings;
    readonly statics: RxStorageStatics;
    name: string;
    readonly workerPromise: Promise<InWorkerStorage>;
    constructor(settings: RxStorageWorkerSettings, statics: RxStorageStatics);
    createStorageInstance<RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, any>): Promise<RxStorageInstanceWorker<RxDocType>>;
}
export declare class RxStorageInstanceWorker<RxDocType> implements RxStorageInstance<RxDocType, WorkerStorageInternals, any> {
    readonly storage: RxStorage<WorkerStorageInternals, any>;
    readonly databaseName: string;
    readonly collectionName: string;
    readonly schema: Readonly<RxJsonSchema<RxDocumentData<RxDocType>>>;
    readonly internals: WorkerStorageInternals;
    readonly options: Readonly<any>;
    /**
     * threads.js uses observable-fns instead of rxjs
     * so we have to transform it.
     */
    private changes$;
    private subs;
    constructor(storage: RxStorage<WorkerStorageInternals, any>, databaseName: string, collectionName: string, schema: Readonly<RxJsonSchema<RxDocumentData<RxDocType>>>, internals: WorkerStorageInternals, options: Readonly<any>);
    bulkWrite(documentWrites: BulkWriteRow<RxDocType>[]): Promise<RxStorageBulkWriteResponse<RxDocType>>;
    findDocumentsById(ids: string[], deleted: boolean): Promise<{
        [documentId: string]: RxDocumentData<RxDocType>;
    }>;
    query(preparedQuery: any): Promise<RxStorageQueryResult<RxDocType>>;
    getAttachmentData(documentId: string, attachmentId: string): Promise<string>;
    getChangedDocumentsSince(limit: number, checkpoint?: any): Promise<{
        document: RxDocumentData<RxDocType>;
        checkpoint: any;
    }[]>;
    changeStream(): Observable<EventBulk<RxStorageChangeEvent<RxDocumentData<RxDocType>>>>;
    cleanup(minDeletedTime: number): Promise<boolean>;
    close(): Promise<void>;
    remove(): Promise<void>;
}
export declare function getRxStorageWorker(settings: RxStorageWorkerSettings): RxStorageWorker;
export {};

import type { MangoQuery, PreparedQuery, RxDocumentData, RxJsonSchema, RxStorageQueryResult } from '../../../types';
import type { RxStorageInstanceDexie } from '../rx-storage-instance-dexie';
/**
 * Use the pouchdb query planner to determine which index
 * must be used to get the correct documents.
 * @link https://www.bennadel.com/blog/3258-understanding-the-query-plan-explained-by-the-find-plugin-in-pouchdb-6-2-0.htm
 *
 *
 * TODO use batched cursor
 * @link https://nolanlawson.com/2021/08/22/speeding-up-indexeddb-reads-and-writes/
 */
export declare function getPouchQueryPlan<RxDocType>(schema: RxJsonSchema<RxDocumentData<RxDocType>>, query: MangoQuery<RxDocType>): {
    queryOpts: any;
    index: any;
    inMemoryFields: any[];
};
export declare function getDexieKeyRange(queryPlan: any, low: any, height: any, 
/**
 * The window.IDBKeyRange object.
 * Can be swapped out in other environments
 */
IDBKeyRange?: any): any;
/**
 * Runs mango queries over the Dexie.js database.
 */
export declare function dexieQuery<RxDocType>(instance: RxStorageInstanceDexie<RxDocType>, preparedQuery: PreparedQuery<RxDocType>): Promise<RxStorageQueryResult<RxDocType>>;

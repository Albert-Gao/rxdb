import type {
    RxCollection,
    RxDocumentData,
    InternalStoreReplicationPullDocType,
    InternalStoreReplicationPushDocType,
    DeepReadonlyObject
} from '../../types';
import {
    getSingleDocument,
    writeSingle
} from '../../rx-storage-helper';
import {
    createRevision,
    flatClone,
    getDefaultRevision,
    lastOfArray,
    now
} from '../../util';
import { wasLastWriteFromPullReplication } from './revision-flag';
import {
    getPrimaryKeyOfInternalDocument,
    INTERNAL_CONTEXT_REPLICATION_PRIMITIVES
} from '../../rx-database-internal-store';

//
// things for the push-checkpoint
//

const pushSequenceDocumentKey = (replicationIdentifierHash: string) => 'replication-checkpoint-push-' + replicationIdentifierHash;
const pullLastDocumentKey = (replicationIdentifierHash: string) => 'replication-checkpoint-pull-' + replicationIdentifierHash;

/**
 * Get the last push checkpoint
 */
export function getLastPushCheckpoint(
    collection: RxCollection,
    replicationIdentifierHash: string
): Promise<any | undefined> {
    return getSingleDocument<InternalStoreReplicationPushDocType>(
        collection.database.internalStore,
        getPrimaryKeyOfInternalDocument(
            pushSequenceDocumentKey(replicationIdentifierHash),
            INTERNAL_CONTEXT_REPLICATION_PRIMITIVES
        )
    ).then(doc => {
        if (!doc) {
            return undefined;
        } else {
            return doc.data.checkpoint;
        }
    });
}

export async function setLastPushCheckpoint(
    collection: RxCollection,
    replicationIdentifierHash: string,
    checkpoint: any
): Promise<RxDocumentData<InternalStoreReplicationPushDocType>> {
    const docId = getPrimaryKeyOfInternalDocument(
        pushSequenceDocumentKey(replicationIdentifierHash),
        INTERNAL_CONTEXT_REPLICATION_PRIMITIVES
    );

    const doc = await getSingleDocument<InternalStoreReplicationPushDocType>(
        collection.database.internalStore,
        docId
    );
    if (!doc) {
        const insertData = {
            id: docId,
            key: pushSequenceDocumentKey(replicationIdentifierHash),
            context: INTERNAL_CONTEXT_REPLICATION_PRIMITIVES,
            data: {
                checkpoint
            },
            _deleted: false,
            _meta: {
                lwt: now()
            },
            _rev: getDefaultRevision(),
            _attachments: {}
        };
        insertData._rev = createRevision(insertData);
        const res = await writeSingle(
            collection.database.internalStore,
            {
                document: insertData
            }
        );
        return res;
    } else {
        const docData = {
            id: docId,
            key: pushSequenceDocumentKey(replicationIdentifierHash),
            context: INTERNAL_CONTEXT_REPLICATION_PRIMITIVES,
            data: {
                checkpoint
            },
            _meta: {
                lwt: now()
            },
            _rev: getDefaultRevision(),
            _deleted: false,
            _attachments: {}
        };
        docData._rev = createRevision(docData, doc);
        const res = await writeSingle<InternalStoreReplicationPushDocType>(
            collection.database.internalStore,
            {
                previous: doc,
                document: docData
            }
        );
        return res;
    }
}

export async function getChangesSinceLastPushCheckpoint<RxDocType>(
    collection: RxCollection<RxDocType, any>,
    replicationIdentifierHash: string,
    /**
     * A function that returns true
     * when the underlaying RxReplication is stopped.
     * So that we do not run requests against a close RxStorageInstance.
     */
    isStopped: () => boolean,
    batchSize = 10
): Promise<{
    // for better performance we also store the ids of the changed docs.
    changedDocIds: Set<string>,
    changedDocs: Map<string, {
        id: string;
        doc: RxDocumentData<RxDocType>;
    }>;
    checkpoint: any;
}> {
    const primaryPath = collection.schema.primaryPath;
    let lastPushCheckpoint = await getLastPushCheckpoint(
        collection,
        replicationIdentifierHash
    );
    let retry = true;
    let lastCheckpoint: any = lastPushCheckpoint;
    const changedDocs: Map<string, {
        id: string;
        doc: RxDocumentData<RxDocType>;
    }> = new Map();
    const changedDocIds: Set<string> = new Set();

    /**
     * it can happen that all docs in the batch
     * do not have to be replicated.
     * Then we have to continue grapping the feed
     * until we reach the end of it
     */
    while (retry && !isStopped()) {
        const changesResults = await collection.storageInstance.getChangedDocumentsSince(
            batchSize,
            lastPushCheckpoint
        );

        if (changesResults.length > 0) {
            lastCheckpoint = lastOfArray(changesResults).checkpoint;
        }

        // optimisation shortcut, do not proceed if there are no changed documents
        if (changesResults.length === 0) {
            retry = false;
            continue;
        }


        if (isStopped()) {
            break;
        }


        changesResults.forEach(row => {
            const docData = row.document;
            const docId: string = docData[primaryPath] as any;
            if (changedDocs.has(docId)) {
                return;
            }

            /**
             * filter out changes with revisions resulting from the pull-stream
             * so that they will not be upstreamed again
             */
            if (
                wasLastWriteFromPullReplication(
                    replicationIdentifierHash,
                    docData
                )
            ) {
                return false;
            }
            changedDocIds.add(docId);
            changedDocs.set(docId, {
                id: docId,
                doc: docData
            });
        });

        if (
            changedDocs.size < batchSize &&
            changesResults.length === batchSize
        ) {
            // no pushable docs found but also not reached the end -> re-run
            lastPushCheckpoint = lastCheckpoint;
            retry = true;
        } else {
            retry = false;
        }
    }
    return {
        changedDocIds,
        changedDocs,
        checkpoint: lastCheckpoint
    };
}



//
// things for pull-checkpoint
//

export function getLastPullDocument<RxDocType>(
    collection: RxCollection<RxDocType>,
    replicationIdentifierHash: string,
): Promise<RxDocumentData<RxDocType> | null> {

    return getSingleDocument<InternalStoreReplicationPullDocType<RxDocType>>(
        collection.database.internalStore,
        getPrimaryKeyOfInternalDocument(
            pullLastDocumentKey(replicationIdentifierHash),
            INTERNAL_CONTEXT_REPLICATION_PRIMITIVES
        )
    ).then(lastPullCheckpoint => {
        if (!lastPullCheckpoint) {
            return null;
        } else {
            return lastPullCheckpoint.data.lastPulledDoc;
        }
    });
}

export async function setLastPullDocument<RxDocType>(
    collection: RxCollection,
    replicationIdentifierHash: string,
    lastPulledDoc: RxDocumentData<RxDocType> | DeepReadonlyObject<RxDocumentData<RxDocType>>
): Promise<RxDocumentData<InternalStoreReplicationPullDocType<RxDocType>>> {
    const pullCheckpointId = getPrimaryKeyOfInternalDocument(
        pullLastDocumentKey(replicationIdentifierHash),
        INTERNAL_CONTEXT_REPLICATION_PRIMITIVES
    );

    const lastPullCheckpointDoc = await getSingleDocument<InternalStoreReplicationPullDocType<RxDocType>>(
        collection.database.internalStore,
        pullCheckpointId
    );

    if (!lastPullCheckpointDoc) {
        const insertData = {
            id: pullCheckpointId,
            key: pullLastDocumentKey(replicationIdentifierHash),
            context: INTERNAL_CONTEXT_REPLICATION_PRIMITIVES,
            data: {
                lastPulledDoc: lastPulledDoc as any
            },
            _meta: {
                lwt: now()
            },
            _rev: getDefaultRevision(),
            _deleted: false,
            _attachments: {}
        };
        insertData._rev = createRevision(insertData);
        return writeSingle<InternalStoreReplicationPullDocType<RxDocType>>(
            collection.database.internalStore,
            {
                document: insertData
            }
        );
    } else {
        const newDoc = flatClone(lastPullCheckpointDoc);
        newDoc.data = { lastPulledDoc: lastPulledDoc as any };
        newDoc._rev = createRevision(newDoc, lastPullCheckpointDoc);
        newDoc._meta = { lwt: now() };
        return writeSingle<InternalStoreReplicationPullDocType<RxDocType>>(
            collection.database.internalStore,
            {
                previous: lastPullCheckpointDoc,
                document: newDoc
            }
        );
    }
}

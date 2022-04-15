import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import type { PullRunResult, ReplicationOptions, ReplicationPullOptions, ReplicationPushOptions, RxCollection, RxDocumentData, RxReplicationState } from '../../types';
import { RxReplicationError } from './rx-replication-error';
export declare const REPLICATION_STATE_BY_COLLECTION: WeakMap<RxCollection, RxReplicationStateBase<any>[]>;
export declare class RxReplicationStateBase<RxDocType> {
    /**
     * hash of the identifier, used to flag revisions
     * and to identify which documents state came from the remote.
     */
    readonly replicationIdentifierHash: string;
    readonly collection: RxCollection<RxDocType>;
    readonly pull?: ReplicationPullOptions<RxDocType> | undefined;
    readonly push?: ReplicationPushOptions<RxDocType> | undefined;
    readonly live?: boolean | undefined;
    liveInterval?: number | undefined;
    retryTime?: number | undefined;
    readonly subs: Subscription[];
    initialReplicationComplete$: Observable<true>;
    readonly subjects: {
        received: Subject<RxDocumentData<RxDocType>>;
        send: Subject<unknown>;
        error: Subject<RxReplicationError<RxDocType>>;
        canceled: BehaviorSubject<boolean>;
        active: BehaviorSubject<boolean>;
        initialReplicationComplete: BehaviorSubject<boolean>;
    };
    /**
     * Queue promise to ensure that run()
     * does not run in parallel
     */
    runningPromise: Promise<void>;
    runQueueCount: number;
    /**
     * Counts how many times the run() method
     * has been called. Used in tests.
     */
    runCount: number;
    /**
     * Amount of pending retries of the run() cycle.
     * Increase when a pull or push fails to retry after retryTime.
     * Decrease when the retry-cycle started to run.
     */
    pendingRetries: number;
    constructor(
    /**
     * hash of the identifier, used to flag revisions
     * and to identify which documents state came from the remote.
     */
    replicationIdentifierHash: string, collection: RxCollection<RxDocType>, pull?: ReplicationPullOptions<RxDocType> | undefined, push?: ReplicationPushOptions<RxDocType> | undefined, live?: boolean | undefined, liveInterval?: number | undefined, retryTime?: number | undefined);
    isStopped(): boolean;
    awaitInitialReplication(): Promise<true>;
    /**
     * Returns a promise that resolves when:
     * - All local data is repliacted with the remote
     * - No replication cycle is running or in retry-state
     */
    awaitInSync(): Promise<true>;
    cancel(): Promise<any>;
    /**
     * Ensures that this._run() does not run in parallel
     */
    run(retryOnFail?: boolean): Promise<void>;
    /**
     * Runs the whole cycle once,
     * first pushes the local changes to the remote,
     * then pulls the remote changes to the local.
     * Returns true if a retry must be done
     */
    _run(retryOnFail?: boolean): Promise<boolean>;
    /**
     * Pull all changes from the server,
     * start from the last pulled change.
     * @return true if successfully, false if something errored
     */
    runPull(): Promise<PullRunResult>;
    /**
     * Pushes unreplicated local changes to the remote.
     * @return true if successfull, false if not
     */
    runPush(): Promise<boolean>;
}
export declare function replicateRxCollection<RxDocType>({ replicationIdentifier, collection, pull, push, live, liveInterval, retryTime, waitForLeadership }: ReplicationOptions<RxDocType>): RxReplicationState<RxDocType>;
export * from './replication-checkpoint';
export * from './revision-flag';
export * from './rx-replication-error';

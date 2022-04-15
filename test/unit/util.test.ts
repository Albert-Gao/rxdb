/**
 * this tests the behaviour of util.js
 */
import assert from 'assert';
import AsyncTestUtil from 'async-test-util';
import {
    fastUnsecureHash,
    randomCouchString,
    sortObject,
    now,
    blobBufferUtil,
    createRevision,
    sortDocumentsByLastWriteTime,
    RxDocumentData
} from '../../';

import {
    validateDatabaseName,
    deepFreezeWhenDevMode
} from '../../plugins/dev-mode';
import {
    rev as pouchCreateRevisison
} from 'pouchdb-utils';
import { EXAMPLE_REVISION_1 } from '../helper/revisions';

describe('util.test.js', () => {
    describe('.fastUnsecureHash()', () => {
        it('should work with a string', () => {
            const hash = fastUnsecureHash('foobar');
            assert.strictEqual(typeof hash, 'number');
            assert.ok(hash > 0);
        });
        it('should work on object', () => {
            const hash = fastUnsecureHash({
                foo: 'bar'
            });
            assert.strictEqual(typeof hash, 'number');
            assert.ok(hash > 0);
        });
        it('should get the same hash twice', () => {
            const str = randomCouchString(10);
            const hash = fastUnsecureHash(str);
            const hash2 = fastUnsecureHash(str);
            assert.strictEqual(hash, hash2);
        });
        it('should work with a very large string', () => {
            const str = randomCouchString(5000);
            const hash = fastUnsecureHash(str);
            assert.strictEqual(typeof hash, 'number');
            assert.ok(hash > 0);
        });
    });
    describe('.createRevision()', () => {
        it('should return the same values for the same document data', async () => {
            const hash1 = createRevision({
                foo: 'bar',
                bar: 'foo',
                _deleted: false,
                _attachments: {},
                _meta: {
                    lwt: 1
                }
            } as any);
            const hash2 = createRevision({
                foo: 'bar',
                bar: 'foo',
                // _rev_tree and _rev must be ignored from hashing
                _rev: '1-asdf',
                _rev_tree: 'foobar',
                _deleted: false,
                _attachments: {},
                _meta: {
                    lwt: 1
                }
            });
            assert.strictEqual(hash1, hash2);
        });
        it('should return the same value as pouchdb', async () => {
            const docData = {
                foo: 'bar',
                bar: 'foo',
                _rev_tree: '1-asdfasdf'
            };
            const ownRev = createRevision(docData as any);
            const pouchRev = '1-' + pouchCreateRevisison(docData, true);
            assert.strictEqual(ownRev, pouchRev);
        });
    });
    describe('.sortObject()', () => {
        it('should sort when regex in object', () => {
            const obj = {
                color: {
                    '$regex': /foobar/g
                }
            };
            const sorted = sortObject(obj);
            assert.ok(sorted.color.$regex instanceof RegExp);
        });
    });
    describe('.validateDatabaseName()', () => {
        describe('positive', () => {
            it('should validate a normal string', () => {
                validateDatabaseName('foobar');
            });
            it('should allow _ and $ after the first character', () => {
                validateDatabaseName('foo_bar');
                validateDatabaseName('foobar_');
                validateDatabaseName('foobar$');
            });
            it('should not allow _ and $ as the first character', async () => {
                await AsyncTestUtil.assertThrows(
                    () => validateDatabaseName('$foobar'),
                    'RxError',
                    'UT2'
                );
                await AsyncTestUtil.assertThrows(
                    () => validateDatabaseName('_foobar'),
                    'RxError',
                    'UT2'
                );
            });
            it('should validate foldernames', () => {
                validateDatabaseName('./foobar'); // unix
                validateDatabaseName('.\\foobar'); // windows
            });
        });
        describe('negative', () => {
            it('should not validate a spaced string', async () => {
                await AsyncTestUtil.assertThrows(
                    () => validateDatabaseName('foo bar'),
                    'RxError',
                    'UT2'
                );
            });
        });
    });
    describe('.now()', () => {
        it('should increase the returned value each time', () => {
            const values: number[] = [];
            new Array(100)
                .fill(0)
                .forEach(() => {
                    values.push(now());
                });

            let last = 0;
            values.forEach(value => {
                assert.ok(value > last);
                last = value;
            });
        });
    });
    describe('blobBufferUtil', () => {
        it('should be able to run all functions', async () => {
            const text = 'foobar';
            const blobBuffer = blobBufferUtil.createBlobBuffer(text, 'plain/text');
            assert.ok(blobBufferUtil.isBlobBuffer(blobBuffer));
            const asString = await blobBufferUtil.toString(blobBuffer);
            assert.strictEqual(text, asString);
        });
        it('should be able to run often in circle', async () => {
            const text = 'foobar';
            let blobBuffer = blobBufferUtil.createBlobBuffer(text, 'plain/text');
            let asString = await blobBufferUtil.toString(blobBuffer);
            blobBuffer = blobBufferUtil.createBlobBuffer(asString, 'plain/text');
            asString = await blobBufferUtil.toString(blobBuffer);
            blobBuffer = blobBufferUtil.createBlobBuffer(asString, 'plain/text');
            asString = await blobBufferUtil.toString(blobBuffer);

            assert.strictEqual(text, asString);
        });
        it('.size() should return a deterministic value', () => {
            const amount = 30;
            const str = randomCouchString(amount);
            const blobBuffer = blobBufferUtil.createBlobBuffer(str, 'plain/text');
            const size = blobBufferUtil.size(blobBuffer);
            assert.strictEqual(size, amount);
        });
        it('should do the correct base64 conversion', async () => {
            const plain = 'aaa';
            const base64 = 'YWFh';

            const blobBuffer = blobBufferUtil.createBlobBuffer(plain, 'plain/text');
            assert.strictEqual(
                await blobBufferUtil.toBase64String(blobBuffer),
                base64
            );
            assert.strictEqual(
                await blobBufferUtil.toString(blobBuffer),
                plain
            );

            const blobBufferFromb64 = await blobBufferUtil.createBlobBufferFromBase64(base64, 'plain/text');
            assert.strictEqual(
                await blobBufferUtil.toBase64String(blobBufferFromb64),
                base64
            );
            assert.strictEqual(
                await blobBufferUtil.toString(blobBufferFromb64),
                plain
            );
        });
        it('should work with non latin-1 chars', async () => {
            const plain = 'aäß';
            const base64 = 'YcOkw58=';
            const blobBuffer = blobBufferUtil.createBlobBuffer(plain, 'plain/text');
            assert.strictEqual(
                await blobBufferUtil.toBase64String(blobBuffer),
                base64
            );
            assert.strictEqual(
                await blobBufferUtil.toString(blobBuffer),
                plain
            );
            const blobBufferFromb64 = await blobBufferUtil.createBlobBufferFromBase64(base64, 'plain/text');
            assert.strictEqual(
                await blobBufferUtil.toString(blobBufferFromb64),
                plain
            );
            assert.strictEqual(
                await blobBufferUtil.toBase64String(blobBufferFromb64),
                base64
            );
            assert.strictEqual(
                await blobBufferUtil.toString(blobBufferFromb64),
                plain
            );
        });
    });
    describe('.deepFreezeWhenDevMode()', () => {
        it('should not allow to mutate the object', () => {
            const obj = {
                foo: 'bar'
            };
            const frozen = deepFreezeWhenDevMode(obj);
            assert.throws(
                () => (frozen as any).foo = 'xxx'
            );
        });
        it('should freeze the given object and not create a new frozen one', () => {
            const obj = {
                foo: 'bar'
            };
            const frozen = deepFreezeWhenDevMode(obj);
            assert.ok(obj === frozen);
        });
    });
    describe('.sortDocumentsByLastWriteTime()', () => {
        type SortDocType = { id: string };
        const sortDocPrimary = 'id';
        it('should sort correctly by lwt', () => {
            const docs: RxDocumentData<SortDocType>[] = [
                {
                    id: 'a',
                    _meta: {
                        lwt: 1000
                    },
                    _deleted: false,
                    _attachments: {},
                    _rev: EXAMPLE_REVISION_1
                },
                {
                    id: 'a',
                    _meta: {
                        lwt: 999
                    },
                    _deleted: false,
                    _attachments: {},
                    _rev: EXAMPLE_REVISION_1
                },
                {
                    id: 'a',
                    _meta: {
                        lwt: 1001
                    },
                    _deleted: false,
                    _attachments: {},
                    _rev: EXAMPLE_REVISION_1
                }
            ];
            const sorted = sortDocumentsByLastWriteTime(sortDocPrimary, docs);
            assert.strictEqual(sorted[0]._meta.lwt, 999);
            assert.strictEqual(sorted[1]._meta.lwt, 1000);
        });
        it('should sort correctly by id', () => {
            const docs: RxDocumentData<SortDocType>[] = [
                {
                    id: 'b',
                    _meta: {
                        lwt: 1000
                    },
                    _deleted: false,
                    _attachments: {},
                    _rev: EXAMPLE_REVISION_1
                },
                {
                    id: 'a',
                    _meta: {
                        lwt: 999
                    },
                    _deleted: false,
                    _attachments: {},
                    _rev: EXAMPLE_REVISION_1
                },
                {
                    id: 'c',
                    _meta: {
                        lwt: 1001
                    },
                    _deleted: false,
                    _attachments: {},
                    _rev: EXAMPLE_REVISION_1
                }
            ];
            const sorted = sortDocumentsByLastWriteTime(sortDocPrimary, docs);
            assert.strictEqual(sorted[0].id, 'a');
            assert.strictEqual(sorted[1].id, 'b');
        });
    });
});

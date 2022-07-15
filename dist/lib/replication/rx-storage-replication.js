"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.awaitRxStorageReplicationIdle = exports.awaitRxStorageReplicationFirstInSync = void 0;
exports.replicateRxStorageInstance = replicateRxStorageInstance;
exports.rxStorageInstanceToReplicationHandler = rxStorageInstanceToReplicationHandler;

var _rxjs = require("rxjs");

var _rxSchemaHelper = require("../rx-schema-helper");

var _util = require("../util");

var _checkpoint = require("./checkpoint");

var _downstream = require("./downstream");

var _helper = require("./helper");

var _upstream = require("./upstream");

function _settle(pact, state, value) {
  if (!pact.s) {
    if (value instanceof _Pact) {
      if (value.s) {
        if (state & 1) {
          state = value.s;
        }

        value = value.v;
      } else {
        value.o = _settle.bind(null, pact, state);
        return;
      }
    }

    if (value && value.then) {
      value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
      return;
    }

    pact.s = state;
    pact.v = value;
    var observer = pact.o;

    if (observer) {
      observer(pact);
    }
  }
}

var _Pact = /*#__PURE__*/function () {
  function _Pact() {}

  _Pact.prototype.then = function (onFulfilled, onRejected) {
    var result = new _Pact();
    var state = this.s;

    if (state) {
      var callback = state & 1 ? onFulfilled : onRejected;

      if (callback) {
        try {
          _settle(result, 1, callback(this.v));
        } catch (e) {
          _settle(result, 2, e);
        }

        return result;
      } else {
        return this;
      }
    }

    this.o = function (_this) {
      try {
        var value = _this.v;

        if (_this.s & 1) {
          _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
        } else if (onRejected) {
          _settle(result, 1, onRejected(value));
        } else {
          _settle(result, 2, value);
        }
      } catch (e) {
        _settle(result, 2, e);
      }
    };

    return result;
  };

  return _Pact;
}();

function _isSettledPact(thenable) {
  return thenable instanceof _Pact && thenable.s & 1;
}

function _for(test, update, body) {
  var stage;

  for (;;) {
    var shouldContinue = test();

    if (_isSettledPact(shouldContinue)) {
      shouldContinue = shouldContinue.v;
    }

    if (!shouldContinue) {
      return result;
    }

    if (shouldContinue.then) {
      stage = 0;
      break;
    }

    var result = body();

    if (result && result.then) {
      if (_isSettledPact(result)) {
        result = result.s;
      } else {
        stage = 1;
        break;
      }
    }

    if (update) {
      var updateValue = update();

      if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
        stage = 2;
        break;
      }
    }
  }

  var pact = new _Pact();

  var reject = _settle.bind(null, pact, 2);

  (stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
  return pact;

  function _resumeAfterBody(value) {
    result = value;

    do {
      if (update) {
        updateValue = update();

        if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
          updateValue.then(_resumeAfterUpdate).then(void 0, reject);
          return;
        }
      }

      shouldContinue = test();

      if (!shouldContinue || _isSettledPact(shouldContinue) && !shouldContinue.v) {
        _settle(pact, 1, result);

        return;
      }

      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
        return;
      }

      result = body();

      if (_isSettledPact(result)) {
        result = result.v;
      }
    } while (!result || !result.then);

    result.then(_resumeAfterBody).then(void 0, reject);
  }

  function _resumeAfterTest(shouldContinue) {
    if (shouldContinue) {
      result = body();

      if (result && result.then) {
        result.then(_resumeAfterBody).then(void 0, reject);
      } else {
        _resumeAfterBody(result);
      }
    } else {
      _settle(pact, 1, result);
    }
  }

  function _resumeAfterUpdate() {
    if (shouldContinue = test()) {
      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
      } else {
        _resumeAfterTest(shouldContinue);
      }
    } else {
      _settle(pact, 1, result);
    }
  }
}

/**
 * Replicates two RxStorageInstances
 * with each other.
 * 
 * Compared to the 'normal' replication plugins,
 * this one is made for internal use where:
 * - No permission handling is needed.
 * - It is made so that the write amount on the master is less but might increase on the child.
 * - It does not have to be easy to implement a compatible backend.
 *   Here we use another RxStorageImplementation as replication goal
 *   so it has to exactly behave like the RxStorage interface defines.
 * 
 * This is made to be used internally by plugins
 * to get a really fast replication performance.
 * 
 * The replication works like git, where the fork contains all new writes
 * and must be merged with the master before it can push it's new state to the master.
 */
var awaitRxStorageReplicationIdle = function awaitRxStorageReplicationIdle(state) {
  return Promise.resolve(awaitRxStorageReplicationFirstInSync(state)).then(function () {
    var _exit = false;
    return _for(function () {
      return !_exit;
    }, void 0, function () {
      var _state$streamQueue = state.streamQueue,
          down = _state$streamQueue.down,
          up = _state$streamQueue.up;
      return Promise.resolve(Promise.all([up, down])).then(function () {
        if (down === state.streamQueue.down && up === state.streamQueue.up) {
          _exit = true;
        }
      });
      /**
       * If the Promises have not been reasigned
       * after awaiting them, we know that the replication
       * is in idle state at this point in time.
       */
    });
  });
};

exports.awaitRxStorageReplicationIdle = awaitRxStorageReplicationIdle;

var awaitRxStorageReplicationFirstInSync = function awaitRxStorageReplicationFirstInSync(state) {
  try {
    return Promise.resolve((0, _rxjs.firstValueFrom)((0, _rxjs.combineLatest)([state.firstSyncDone.down.pipe((0, _rxjs.filter)(function (v) {
      return !!v;
    })), state.firstSyncDone.up.pipe((0, _rxjs.filter)(function (v) {
      return !!v;
    }))])));
  } catch (e) {
    return Promise.reject(e);
  }
};

exports.awaitRxStorageReplicationFirstInSync = awaitRxStorageReplicationFirstInSync;

function replicateRxStorageInstance(input) {
  var checkpointKey = (0, _checkpoint.getCheckpointKey)(input);
  var state = {
    primaryPath: (0, _rxSchemaHelper.getPrimaryFieldOfPrimaryKey)(input.forkInstance.schema.primaryKey),
    input: input,
    checkpointKey: checkpointKey,
    downstreamBulkWriteFlag: 'replication-downstream-' + checkpointKey,
    events: {
      canceled: new _rxjs.BehaviorSubject(false),
      active: {
        down: new _rxjs.BehaviorSubject(true),
        up: new _rxjs.BehaviorSubject(true)
      },
      processed: {
        down: new _rxjs.Subject(),
        up: new _rxjs.Subject()
      },
      resolvedConflicts: new _rxjs.Subject()
    },
    stats: {
      down: {
        addNewTask: 0,
        downstreamProcessChanges: 0,
        downstreamResyncOnce: 0,
        masterChangeStreamEmit: 0,
        persistFromMaster: 0
      },
      up: {
        forkChangeStreamEmit: 0,
        persistToMaster: 0,
        persistToMasterConflictWrites: 0,
        persistToMasterHadConflicts: 0,
        processTasks: 0,
        upstreamInitialSync: 0
      }
    },
    firstSyncDone: {
      down: new _rxjs.BehaviorSubject(false),
      up: new _rxjs.BehaviorSubject(false)
    },
    streamQueue: {
      down: _util.PROMISE_RESOLVE_VOID,
      up: _util.PROMISE_RESOLVE_VOID
    },
    lastCheckpointDoc: {}
  };
  (0, _downstream.startReplicationDownstream)(state);
  (0, _upstream.startReplicationUpstream)(state);
  return state;
}

function rxStorageInstanceToReplicationHandler(instance, conflictHandler) {
  var primaryPath = (0, _rxSchemaHelper.getPrimaryFieldOfPrimaryKey)(instance.schema.primaryKey);
  var replicationHandler = {
    masterChangeStream$: instance.changeStream().pipe((0, _rxjs.map)(function (eventBulk) {
      var ret = {
        id: eventBulk.id,
        checkpoint: eventBulk.checkpoint,
        events: eventBulk.events.map(function (event) {
          if (event.change.doc) {
            return (0, _helper.writeDocToDocState)(event.change.doc);
          } else {
            return (0, _helper.writeDocToDocState)(event.change.previous);
          }
        }),
        context: eventBulk.context
      };
      return ret;
    })),
    masterChangesSince: function masterChangesSince(checkpoint, bulkSize) {
      return instance.getChangedDocumentsSince(bulkSize, checkpoint).then(function (result) {
        return {
          checkpoint: result.documents.length > 0 ? result.checkpoint : checkpoint,
          documentsData: result.documents.map(function (d) {
            return (0, _helper.writeDocToDocState)(d);
          })
        };
      });
    },
    masterWrite: function masterWrite(rows) {
      try {
        var rowById = {};
        rows.forEach(function (row) {
          var docId = row.newDocumentState[primaryPath];
          rowById[docId] = row;
        });
        var ids = Object.keys(rowById);
        return Promise.resolve(instance.findDocumentsById(ids, true)).then(function (masterDocsState) {
          var conflicts = [];
          var writeRows = [];
          return Promise.resolve(Promise.all(Object.entries(rowById).map(function (_ref) {
            try {
              var id = _ref[0],
                  row = _ref[1];
              var masterState = masterDocsState[id];

              var _temp4 = function () {
                if (!masterState) {
                  writeRows.push({
                    document: (0, _helper.docStateToWriteDoc)(row.newDocumentState)
                  });
                } else {
                  var _temp5 = function () {
                    if (masterState && !row.assumedMasterState) {
                      conflicts.push((0, _helper.writeDocToDocState)(masterState));
                    } else return Promise.resolve(conflictHandler({
                      realMasterState: (0, _helper.writeDocToDocState)(masterState),
                      newDocumentState: (0, _util.ensureNotFalsy)(row.assumedMasterState)
                    }, 'rxStorageInstanceToReplicationHandler-masterWrite')).then(function (_conflictHandler) {
                      if (_conflictHandler.isEqual === true) {
                        writeRows.push({
                          previous: masterState,
                          document: (0, _helper.docStateToWriteDoc)(row.newDocumentState, masterState)
                        });
                      } else {
                        conflicts.push((0, _helper.writeDocToDocState)(masterState));
                      }
                    });
                  }();

                  if (_temp5 && _temp5.then) return _temp5.then(function () {});
                }
              }();

              return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(function () {}) : void 0);
            } catch (e) {
              return Promise.reject(e);
            }
          }))).then(function () {
            var _temp = function () {
              if (writeRows.length > 0) {
                return Promise.resolve(instance.bulkWrite(writeRows, 'replication-master-write')).then(function (result) {
                  Object.values(result.error).forEach(function (err) {
                    if (err.status !== 409) {
                      throw new Error('non conflict error');
                    } else {
                      conflicts.push((0, _helper.writeDocToDocState)((0, _util.ensureNotFalsy)(err.documentInDb)));
                    }
                  });
                });
              }
            }();

            return _temp && _temp.then ? _temp.then(function () {
              return conflicts;
            }) : conflicts;
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }
  };
  return replicationHandler;
}
//# sourceMappingURL=rx-storage-replication.js.map
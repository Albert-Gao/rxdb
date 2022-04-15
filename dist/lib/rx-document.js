"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.basePrototype = void 0;
exports.createRxDocumentConstructor = createRxDocumentConstructor;
exports.createWithConstructor = createWithConstructor;
exports.defineGetterSetter = defineGetterSetter;
exports.isRxDocument = isRxDocument;

var _objectPath = _interopRequireDefault(require("object-path"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _util = require("./util");

var _rxError = require("./rx-error");

var _hooks = require("./hooks");

var _rxChangeEvent = require("./rx-change-event");

var _overwritable = require("./overwritable");

var _rxSchemaHelper = require("./rx-schema-helper");

var _rxStorageHelper = require("./rx-storage-helper");

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

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

var basePrototype = {
  /**
   * TODO
   * instead of appliying the _this-hack
   * we should make these accesors functions instead of getters.
   */
  get _data() {
    var _this = this;
    /**
     * Might be undefined when vuejs-devtools are used
     * @link https://github.com/pubkey/rxdb/issues/1126
     */


    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }

    return _this._dataSync$.getValue();
  },

  get primaryPath() {
    var _this = this;

    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }

    return _this.collection.schema.primaryPath;
  },

  get primary() {
    var _this = this;

    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }

    return _this._data[_this.primaryPath];
  },

  get revision() {
    var _this = this;

    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }

    return _this._data._rev;
  },

  get deleted$() {
    var _this = this;

    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }

    return _this._isDeleted$.asObservable();
  },

  get deleted() {
    var _this = this;

    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }

    return _this._isDeleted$.getValue();
  },

  /**
   * returns the observable which emits the plain-data of this document
   */
  get $() {
    var _this = this;

    return _this._dataSync$.asObservable().pipe((0, _operators.map)(function (docData) {
      return _overwritable.overwritable.deepFreezeWhenDevMode(docData);
    }));
  },

  _handleChangeEvent: function _handleChangeEvent(changeEvent) {
    if (changeEvent.documentId !== this.primary) {
      return;
    } // ensure that new _rev is higher then current


    var docData = (0, _rxChangeEvent.getDocumentDataOfRxChangeEvent)(changeEvent);
    var newRevNr = (0, _util.getHeightOfRevision)(docData._rev);
    var currentRevNr = (0, _util.getHeightOfRevision)(this._data._rev);
    if (currentRevNr > newRevNr) return;

    switch (changeEvent.operation) {
      case 'INSERT':
        break;

      case 'UPDATE':
        var newData = changeEvent.documentData;

        this._dataSync$.next(newData);

        break;

      case 'DELETE':
        // remove from docCache to assure new upserted RxDocuments will be a new instance
        this.collection._docCache["delete"](this.primary);

        this._isDeleted$.next(true);

        break;
    }
  },

  /**
   * returns observable of the value of the given path
   */
  get$: function get$(path) {
    if (path.includes('.item.')) {
      throw (0, _rxError.newRxError)('DOC1', {
        path: path
      });
    }

    if (path === this.primaryPath) throw (0, _rxError.newRxError)('DOC2'); // final fields cannot be modified and so also not observed

    if (this.collection.schema.finalFields.includes(path)) {
      throw (0, _rxError.newRxError)('DOC3', {
        path: path
      });
    }

    var schemaObj = (0, _rxSchemaHelper.getSchemaByObjectPath)(this.collection.schema.jsonSchema, path);

    if (!schemaObj) {
      throw (0, _rxError.newRxError)('DOC4', {
        path: path
      });
    }

    return this._dataSync$.pipe((0, _operators.map)(function (data) {
      return _objectPath["default"].get(data, path);
    }), (0, _operators.distinctUntilChanged)());
  },

  /**
   * populate the given path
   */
  populate: function populate(path) {
    var schemaObj = (0, _rxSchemaHelper.getSchemaByObjectPath)(this.collection.schema.jsonSchema, path);
    var value = this.get(path);

    if (!value) {
      return _util.PROMISE_RESOLVE_NULL;
    }

    if (!schemaObj) {
      throw (0, _rxError.newRxError)('DOC5', {
        path: path
      });
    }

    if (!schemaObj.ref) {
      throw (0, _rxError.newRxError)('DOC6', {
        path: path,
        schemaObj: schemaObj
      });
    }

    var refCollection = this.collection.database.collections[schemaObj.ref];

    if (!refCollection) {
      throw (0, _rxError.newRxError)('DOC7', {
        ref: schemaObj.ref,
        path: path,
        schemaObj: schemaObj
      });
    }

    if (schemaObj.type === 'array') {
      return refCollection.findByIds(value).then(function (res) {
        var valuesIterator = res.values();
        return Array.from(valuesIterator);
      });
    } else {
      return refCollection.findOne(value).exec();
    }
  },

  /**
   * get data by objectPath
   */
  get: function get(objPath) {
    if (!this._data) return undefined;

    var valueObj = _objectPath["default"].get(this._data, objPath); // direct return if array or non-object


    if (typeof valueObj !== 'object' || Array.isArray(valueObj)) {
      return _overwritable.overwritable.deepFreezeWhenDevMode(valueObj);
    }
    /**
     * TODO find a way to deep-freeze together with defineGetterSetter
     * so we do not have to do a deep clone here.
     */


    valueObj = (0, _util.clone)(valueObj);
    defineGetterSetter(this.collection.schema, valueObj, objPath, this);
    return valueObj;
  },
  toJSON: function toJSON() {
    var withMetaFields = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (!withMetaFields) {
      var data = (0, _util.flatClone)(this._data);
      delete data._rev;
      delete data._attachments;
      delete data._deleted;
      delete data._meta;
      return _overwritable.overwritable.deepFreezeWhenDevMode(data);
    } else {
      return _overwritable.overwritable.deepFreezeWhenDevMode(this._data);
    }
  },
  toMutableJSON: function toMutableJSON() {
    var withMetaFields = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return (0, _util.clone)(this.toJSON(withMetaFields));
  },

  /**
   * set data by objectPath
   * This can only be called on temporary documents
   */
  set: function set(objPath, value) {
    // setters can only be used on temporary documents
    if (!this._isTemporary) {
      throw (0, _rxError.newRxTypeError)('DOC16', {
        objPath: objPath,
        value: value
      });
    }

    if (typeof objPath !== 'string') {
      throw (0, _rxError.newRxTypeError)('DOC15', {
        objPath: objPath,
        value: value
      });
    } // if equal, do nothing


    if (Object.is(this.get(objPath), value)) return; // throw if nested without root-object

    var pathEls = objPath.split('.');
    pathEls.pop();
    var rootPath = pathEls.join('.');

    if (typeof _objectPath["default"].get(this._data, rootPath) === 'undefined') {
      throw (0, _rxError.newRxError)('DOC10', {
        childpath: objPath,
        rootPath: rootPath
      });
    }

    _objectPath["default"].set(this._data, objPath, value);

    return this;
  },

  /**
   * updates document
   * @overwritten by plugin (optinal)
   * @param updateObj mongodb-like syntax
   */
  update: function update(_updateObj) {
    throw (0, _util.pluginMissing)('update');
  },
  putAttachment: function putAttachment() {
    throw (0, _util.pluginMissing)('attachments');
  },
  getAttachment: function getAttachment() {
    throw (0, _util.pluginMissing)('attachments');
  },
  allAttachments: function allAttachments() {
    throw (0, _util.pluginMissing)('attachments');
  },

  get allAttachments$() {
    throw (0, _util.pluginMissing)('attachments');
  },

  /**
   * runs an atomic update over the document
   * @param function that takes the document-data and returns a new data-object
   */
  atomicUpdate: function atomicUpdate(mutationFunction) {
    var _this2 = this;

    return new Promise(function (res, rej) {
      _this2._atomicQueue = _this2._atomicQueue.then(function () {
        try {
          var _temp4 = function _temp4(_result2) {
            if (_exit2) return _result2;
            res(_this2);
          };

          var _exit2 = false;
          var done = false; // we need a hacky while loop to stay incide the chain-link of _atomicQueue
          // while still having the option to run a retry on conflicts

          var _temp5 = _for(function () {
            return !_exit2 && !done;
          }, void 0, function () {
            var oldData = _this2._dataSync$.getValue();

            var _temp = _catch(function () {
              // always await because mutationFunction might be async
              return Promise.resolve(mutationFunction((0, _util.clone)(_this2._dataSync$.getValue()), _this2)).then(function (newData) {
                if (_this2.collection) {
                  newData = _this2.collection.schema.fillObjectWithDefaults(newData);
                }

                return Promise.resolve(_this2._saveData(newData, oldData)).then(function () {
                  done = true;
                });
              });
            }, function (err) {
              if ((0, _rxError.isPouchdbConflictError)(err)) {} else {
                rej(err);
                _exit2 = true;
              }
            });

            if (_temp && _temp.then) return _temp.then(function () {});
          });

          return Promise.resolve(_temp5 && _temp5.then ? _temp5.then(_temp4) : _temp4(_temp5));
        } catch (e) {
          return Promise.reject(e);
        }
      });
    });
  },

  /**
   * patches the given properties
   */
  atomicPatch: function atomicPatch(patch) {
    return this.atomicUpdate(function (docData) {
      Object.entries(patch).forEach(function (_ref) {
        var k = _ref[0],
            v = _ref[1];
        docData[k] = v;
      });
      return docData;
    });
  },

  /**
   * saves the new document-data
   * and handles the events
   */
  _saveData: function _saveData(newData, oldData) {
    try {
      var _this4 = this;

      newData = newData; // deleted documents cannot be changed

      if (_this4._isDeleted$.getValue()) {
        throw (0, _rxError.newRxError)('DOC11', {
          id: _this4.primary,
          document: _this4
        });
      } // ensure modifications are ok


      _this4.collection.schema.validateChange(oldData, newData);

      return Promise.resolve(_this4.collection._runHooks('pre', 'save', newData, _this4)).then(function () {
        _this4.collection.schema.validate(newData);

        return Promise.resolve(_this4.collection.storageInstance.bulkWrite([{
          previous: oldData,
          document: newData
        }])).then(function (writeResult) {
          var isError = writeResult.error[_this4.primary];
          (0, _rxStorageHelper.throwIfIsStorageWriteError)(_this4.collection, _this4.primary, newData, isError);
          (0, _util.ensureNotFalsy)(writeResult.success[_this4.primary]);
          return _this4.collection._runHooks('post', 'save', newData, _this4);
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },

  /**
   * saves the temporary document and makes a non-temporary out of it
   * Saving a temporary doc is basically the same as RxCollection.insert()
   * @return false if nothing to save
   */
  save: function save() {
    var _this5 = this;

    // .save() cannot be called on non-temporary-documents
    if (!this._isTemporary) {
      throw (0, _rxError.newRxError)('DOC17', {
        id: this.primary,
        document: this
      });
    }

    return this.collection.insert(this).then(function () {
      _this5._isTemporary = false;

      _this5.collection._docCache.set(_this5.primary, _this5); // internal events


      _this5._dataSync$.next(_this5._data);

      return true;
    });
  },

  /**
   * remove the document,
   * this not not equal to a pouchdb.remove(),
   * instead we keep the values and only set _deleted: true
   */
  remove: function remove() {
    var _this6 = this;

    var collection = this.collection;

    if (this.deleted) {
      return Promise.reject((0, _rxError.newRxError)('DOC13', {
        document: this,
        id: this.primary
      }));
    }

    var deletedData = (0, _util.flatClone)(this._data);
    return collection._runHooks('pre', 'remove', deletedData, this).then(function () {
      try {
        deletedData._deleted = true;
        return Promise.resolve(collection.storageInstance.bulkWrite([{
          previous: _this6._data,
          document: deletedData
        }])).then(function (writeResult) {
          var isError = writeResult.error[_this6.primary];
          (0, _rxStorageHelper.throwIfIsStorageWriteError)(collection, _this6.primary, deletedData, isError);
          return (0, _util.ensureNotFalsy)(writeResult.success[_this6.primary]);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }).then(function () {
      return _this6.collection._runHooks('post', 'remove', deletedData, _this6);
    }).then(function () {
      return _this6;
    });
  },
  destroy: function destroy() {
    throw (0, _rxError.newRxError)('DOC14');
  }
};
exports.basePrototype = basePrototype;

function createRxDocumentConstructor() {
  var proto = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : basePrototype;

  var constructor = function RxDocumentConstructor(collection, jsonData) {
    this.collection = collection; // if true, this is a temporary document

    this._isTemporary = false; // assume that this is always equal to the doc-data in the database

    this._dataSync$ = new _rxjs.BehaviorSubject(jsonData);
    this._isDeleted$ = new _rxjs.BehaviorSubject(false);
    this._atomicQueue = _util.PROMISE_RESOLVE_VOID;
    /**
     * because of the prototype-merge,
     * we can not use the native instanceof operator
     */

    this.isInstanceOfRxDocument = true;
  };

  constructor.prototype = proto;
  return constructor;
}

function defineGetterSetter(schema, valueObj) {
  var objPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var thisObj = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  if (valueObj === null) return;
  var pathProperties = (0, _rxSchemaHelper.getSchemaByObjectPath)(schema.jsonSchema, objPath);
  if (typeof pathProperties === 'undefined') return;
  if (pathProperties.properties) pathProperties = pathProperties.properties;
  Object.keys(pathProperties).forEach(function (key) {
    var fullPath = (0, _util.trimDots)(objPath + '.' + key); // getter - value

    valueObj.__defineGetter__(key, function () {
      var _this = thisObj ? thisObj : this;

      if (!_this.get || typeof _this.get !== 'function') {
        /**
         * When an object gets added to the state of a vuejs-component,
         * it happens that this getter is called with another scope.
         * To prevent errors, we have to return undefined in this case
         */
        return undefined;
      }

      var ret = _this.get(fullPath);

      return ret;
    }); // getter - observable$


    Object.defineProperty(valueObj, key + '$', {
      get: function get() {
        var _this = thisObj ? thisObj : this;

        return _this.get$(fullPath);
      },
      enumerable: false,
      configurable: false
    }); // getter - populate_

    Object.defineProperty(valueObj, key + '_', {
      get: function get() {
        var _this = thisObj ? thisObj : this;

        return _this.populate(fullPath);
      },
      enumerable: false,
      configurable: false
    }); // setter - value

    valueObj.__defineSetter__(key, function (val) {
      var _this = thisObj ? thisObj : this;

      return _this.set(fullPath, val);
    });
  });
}

function createWithConstructor(constructor, collection, jsonData) {
  var primary = jsonData[collection.schema.primaryPath];

  if (primary && primary.startsWith('_design')) {
    return null;
  }

  var doc = new constructor(collection, jsonData);
  (0, _hooks.runPluginHooks)('createRxDocument', doc);
  return doc;
}

function isRxDocument(obj) {
  if (typeof obj === 'undefined') return false;
  return !!obj.isInstanceOfRxDocument;
}
//# sourceMappingURL=rx-document.js.map
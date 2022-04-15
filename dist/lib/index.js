"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  addRxPlugin: true,
  createRxDatabase: true,
  removeRxDatabase: true,
  isRxDatabase: true,
  dbCount: true,
  _collectionNamePrimary: true,
  INTERNAL_CONTEXT_COLLECTION: true,
  INTERNAL_CONTEXT_ENCRYPTION: true,
  INTERNAL_CONTEXT_REPLICATION_PRIMITIVES: true,
  getPrimaryKeyOfInternalDocument: true,
  STORAGE_TOKEN_DOCUMENT_KEY: true,
  overwritable: true,
  isRxCollection: true,
  RxCollectionBase: true,
  createRxCollection: true,
  fillObjectDataBeforeInsert: true,
  isRxDocument: true,
  flattenEvents: true,
  getDocumentOrmPrototype: true,
  getDocumentPrototype: true,
  isRxQuery: true,
  isRxSchema: true,
  createRxSchema: true,
  RxSchema: true,
  getIndexes: true,
  getPreviousVersions: true,
  toTypedRxJsonSchema: true,
  getPseudoSchemaForVersion: true,
  getSchemaByObjectPath: true,
  fillPrimaryKey: true,
  getPrimaryFieldOfPrimaryKey: true,
  getComposedPrimaryKeyOfDocumentData: true,
  normalizeRxJsonSchema: true,
  fillWithDefaultSettings: true,
  RX_META_SCHEMA: true,
  getFinalFields: true,
  _clearHook: true
};
Object.defineProperty(exports, "INTERNAL_CONTEXT_COLLECTION", {
  enumerable: true,
  get: function get() {
    return _rxDatabaseInternalStore.INTERNAL_CONTEXT_COLLECTION;
  }
});
Object.defineProperty(exports, "INTERNAL_CONTEXT_ENCRYPTION", {
  enumerable: true,
  get: function get() {
    return _rxDatabaseInternalStore.INTERNAL_CONTEXT_ENCRYPTION;
  }
});
Object.defineProperty(exports, "INTERNAL_CONTEXT_REPLICATION_PRIMITIVES", {
  enumerable: true,
  get: function get() {
    return _rxDatabaseInternalStore.INTERNAL_CONTEXT_REPLICATION_PRIMITIVES;
  }
});
Object.defineProperty(exports, "RX_META_SCHEMA", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.RX_META_SCHEMA;
  }
});
Object.defineProperty(exports, "RxCollectionBase", {
  enumerable: true,
  get: function get() {
    return _rxCollection.RxCollectionBase;
  }
});
Object.defineProperty(exports, "RxSchema", {
  enumerable: true,
  get: function get() {
    return _rxSchema.RxSchema;
  }
});
Object.defineProperty(exports, "STORAGE_TOKEN_DOCUMENT_KEY", {
  enumerable: true,
  get: function get() {
    return _rxDatabaseInternalStore.STORAGE_TOKEN_DOCUMENT_KEY;
  }
});
Object.defineProperty(exports, "_clearHook", {
  enumerable: true,
  get: function get() {
    return _hooks._clearHook;
  }
});
Object.defineProperty(exports, "_collectionNamePrimary", {
  enumerable: true,
  get: function get() {
    return _rxDatabase._collectionNamePrimary;
  }
});
Object.defineProperty(exports, "addRxPlugin", {
  enumerable: true,
  get: function get() {
    return _plugin.addRxPlugin;
  }
});
Object.defineProperty(exports, "createRxCollection", {
  enumerable: true,
  get: function get() {
    return _rxCollection.createRxCollection;
  }
});
Object.defineProperty(exports, "createRxDatabase", {
  enumerable: true,
  get: function get() {
    return _rxDatabase.createRxDatabase;
  }
});
Object.defineProperty(exports, "createRxSchema", {
  enumerable: true,
  get: function get() {
    return _rxSchema.createRxSchema;
  }
});
Object.defineProperty(exports, "dbCount", {
  enumerable: true,
  get: function get() {
    return _rxDatabase.dbCount;
  }
});
Object.defineProperty(exports, "fillObjectDataBeforeInsert", {
  enumerable: true,
  get: function get() {
    return _rxCollectionHelper.fillObjectDataBeforeInsert;
  }
});
Object.defineProperty(exports, "fillPrimaryKey", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.fillPrimaryKey;
  }
});
Object.defineProperty(exports, "fillWithDefaultSettings", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.fillWithDefaultSettings;
  }
});
Object.defineProperty(exports, "flattenEvents", {
  enumerable: true,
  get: function get() {
    return _rxChangeEvent.flattenEvents;
  }
});
Object.defineProperty(exports, "getComposedPrimaryKeyOfDocumentData", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.getComposedPrimaryKeyOfDocumentData;
  }
});
Object.defineProperty(exports, "getDocumentOrmPrototype", {
  enumerable: true,
  get: function get() {
    return _rxDocumentPrototypeMerge.getDocumentOrmPrototype;
  }
});
Object.defineProperty(exports, "getDocumentPrototype", {
  enumerable: true,
  get: function get() {
    return _rxDocumentPrototypeMerge.getDocumentPrototype;
  }
});
Object.defineProperty(exports, "getFinalFields", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.getFinalFields;
  }
});
Object.defineProperty(exports, "getIndexes", {
  enumerable: true,
  get: function get() {
    return _rxSchema.getIndexes;
  }
});
Object.defineProperty(exports, "getPreviousVersions", {
  enumerable: true,
  get: function get() {
    return _rxSchema.getPreviousVersions;
  }
});
Object.defineProperty(exports, "getPrimaryFieldOfPrimaryKey", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.getPrimaryFieldOfPrimaryKey;
  }
});
Object.defineProperty(exports, "getPrimaryKeyOfInternalDocument", {
  enumerable: true,
  get: function get() {
    return _rxDatabaseInternalStore.getPrimaryKeyOfInternalDocument;
  }
});
Object.defineProperty(exports, "getPseudoSchemaForVersion", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.getPseudoSchemaForVersion;
  }
});
Object.defineProperty(exports, "getSchemaByObjectPath", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.getSchemaByObjectPath;
  }
});
Object.defineProperty(exports, "isRxCollection", {
  enumerable: true,
  get: function get() {
    return _rxCollection.isRxCollection;
  }
});
Object.defineProperty(exports, "isRxDatabase", {
  enumerable: true,
  get: function get() {
    return _rxDatabase.isRxDatabase;
  }
});
Object.defineProperty(exports, "isRxDocument", {
  enumerable: true,
  get: function get() {
    return _rxDocument.isRxDocument;
  }
});
Object.defineProperty(exports, "isRxQuery", {
  enumerable: true,
  get: function get() {
    return _rxQuery.isInstanceOf;
  }
});
Object.defineProperty(exports, "isRxSchema", {
  enumerable: true,
  get: function get() {
    return _rxSchema.isInstanceOf;
  }
});
Object.defineProperty(exports, "normalizeRxJsonSchema", {
  enumerable: true,
  get: function get() {
    return _rxSchemaHelper.normalizeRxJsonSchema;
  }
});
Object.defineProperty(exports, "overwritable", {
  enumerable: true,
  get: function get() {
    return _overwritable.overwritable;
  }
});
Object.defineProperty(exports, "removeRxDatabase", {
  enumerable: true,
  get: function get() {
    return _rxDatabase.removeRxDatabase;
  }
});
Object.defineProperty(exports, "toTypedRxJsonSchema", {
  enumerable: true,
  get: function get() {
    return _rxSchema.toTypedRxJsonSchema;
  }
});

require("./types/modules/graphql-client.d");

require("./types/modules/mocha.parallel.d");

require("./types/modules/modifiyjs.d");

var _plugin = require("./plugin");

var _rxDatabase = require("./rx-database");

var _rxDatabaseInternalStore = require("./rx-database-internal-store");

var _overwritable = require("./overwritable");

var _rxCollection = require("./rx-collection");

var _rxCollectionHelper = require("./rx-collection-helper");

var _rxDocument = require("./rx-document");

var _rxChangeEvent = require("./rx-change-event");

var _rxDocumentPrototypeMerge = require("./rx-document-prototype-merge");

var _rxQuery = require("./rx-query");

var _rxQueryHelper = require("./rx-query-helper");

Object.keys(_rxQueryHelper).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _rxQueryHelper[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _rxQueryHelper[key];
    }
  });
});

var _rxSchema = require("./rx-schema");

var _rxSchemaHelper = require("./rx-schema-helper");

var _rxStorageHelper = require("./rx-storage-helper");

Object.keys(_rxStorageHelper).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _rxStorageHelper[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _rxStorageHelper[key];
    }
  });
});

var _customIndex = require("./custom-index");

Object.keys(_customIndex).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _customIndex[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _customIndex[key];
    }
  });
});

var _hooks = require("./hooks");

var _queryCache = require("./query-cache");

Object.keys(_queryCache).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _queryCache[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _queryCache[key];
    }
  });
});

var _util = require("./util");

Object.keys(_util).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _util[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _util[key];
    }
  });
});
//# sourceMappingURL=index.js.map
/**
 * this plugin adds the leader-election-capabilities to rxdb
 */
import { createLeaderElection } from 'broadcast-channel';
import { ensureNotFalsy, PROMISE_RESOLVE_TRUE } from '../util';
var LEADER_ELECTORS_OF_DB = new WeakMap();
var LEADER_ELECTOR_BY_BROADCAST_CHANNEL = new WeakMap();
/**
 * Returns the leader elector of a broadcast channel.
 * Used to ensure we reuse the same elector for the channel each time.
 */

export function getLeaderElectorByBroadcastChannel(broadcastChannel) {
  var elector = LEADER_ELECTOR_BY_BROADCAST_CHANNEL.get(broadcastChannel);

  if (!elector) {
    elector = createLeaderElection(broadcastChannel);
    LEADER_ELECTOR_BY_BROADCAST_CHANNEL.set(broadcastChannel, elector);
  }

  return elector;
}
export function getForDatabase() {
  var broadcastChannel = ensureNotFalsy(this.broadcastChannel);
  var elector = getLeaderElectorByBroadcastChannel(broadcastChannel);

  if (!elector) {
    elector = getLeaderElectorByBroadcastChannel(broadcastChannel);
    LEADER_ELECTORS_OF_DB.set(this, elector);
  }

  return elector;
}
export function isLeader() {
  if (!this.multiInstance) {
    return true;
  }

  return this.leaderElector().isLeader;
}
export function waitForLeadership() {
  if (!this.multiInstance) {
    return PROMISE_RESOLVE_TRUE;
  } else {
    return this.leaderElector().awaitLeadership().then(function () {
      return true;
    });
  }
}
/**
 * runs when the database gets destroyed
 */

export function onDestroy(db) {
  var has = LEADER_ELECTORS_OF_DB.get(db);

  if (has) {
    has.die();
  }
}
export var rxdb = true;
export var prototypes = {
  RxDatabase: function RxDatabase(proto) {
    proto.leaderElector = getForDatabase;
    proto.isLeader = isLeader;
    proto.waitForLeadership = waitForLeadership;
  }
};
export var RxDBLeaderElectionPlugin = {
  name: 'leader-election',
  rxdb: rxdb,
  prototypes: prototypes,
  hooks: {
    preDestroyRxDatabase: {
      after: onDestroy
    }
  }
};
//# sourceMappingURL=leader-election.js.map
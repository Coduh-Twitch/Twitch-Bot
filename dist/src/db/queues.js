"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInQueue = exports.isBanned = exports.queueUnban = exports.queueBan = exports.clearParticipants = exports.deleteQueue = exports.removeQueueMember = exports.addQueueMember = exports.getQueueMembers = exports.getQueueById = exports.getQueue = exports.updateQueue = exports.createQueue = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const _1 = require(".");
const schema_1 = require("./schema");
const createQueue = (data) => {
    let queueExists = _1.db.select().from(schema_1.queues).all();
    if (queueExists.length > 0) {
        return (0, exports.updateQueue)(queueExists[0].id, data);
    }
    else
        return _1.db.insert(schema_1.queues).values(data).returning().get();
};
exports.createQueue = createQueue;
const updateQueue = (queueId, changes) => {
    return _1.db.update(schema_1.queues).set(changes).where((0, drizzle_orm_1.eq)(schema_1.queues.id, queueId)).returning().get() || null;
};
exports.updateQueue = updateQueue;
const getQueue = () => {
    return _1.db.select().from(schema_1.queues).all()?.[0] || null;
};
exports.getQueue = getQueue;
const getQueueById = (queueId) => {
    return _1.db.select().from(schema_1.queues).where((0, drizzle_orm_1.eq)(schema_1.queues.id, queueId)).get() || null;
};
exports.getQueueById = getQueueById;
const getQueueMembers = (queueId) => {
    return _1.db.select().from(schema_1.participants).where((0, drizzle_orm_1.eq)(schema_1.participants.queueId, queueId)).all() || [];
};
exports.getQueueMembers = getQueueMembers;
const addQueueMember = (queueId, member) => {
    let role = member.role || schema_1.DBRoles.DEFAULT;
    let allParticipants = _1.db.select().from(schema_1.participants).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.participants.id, member.id), (0, drizzle_orm_1.eq)(schema_1.participants.queueId, queueId))).all().sort((a, b) => a.position - b.position) || [];
    let maxPosition = allParticipants.length;
    if (role === schema_1.DBRoles.MOD)
        maxPosition = allParticipants.filter(p => p.role !== schema_1.DBRoles.MOD).length;
    if (role === schema_1.DBRoles.VIP)
        maxPosition = allParticipants.filter(p => p.role === schema_1.DBRoles.MOD || p.role !== schema_1.DBRoles.VIP).length;
    return _1.db.insert(schema_1.participants).values({ queueId, ...member, position: maxPosition }).returning().get();
};
exports.addQueueMember = addQueueMember;
const removeQueueMember = (queueId, memberId) => {
    return _1.db.delete(schema_1.participants).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.participants.queueId, queueId), (0, drizzle_orm_1.eq)(schema_1.participants.id, memberId))).returning().get() || null;
};
exports.removeQueueMember = removeQueueMember;
const deleteQueue = (queueId) => {
    return _1.db.delete(schema_1.queues).where((0, drizzle_orm_1.eq)(schema_1.queues.id, queueId)).returning().get() || null;
};
exports.deleteQueue = deleteQueue;
const clearParticipants = (queueId, excludeStatuses = false) => {
    if (excludeStatuses) {
        return _1.db.delete(schema_1.participants).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.participants.queueId, queueId), (0, drizzle_orm_1.eq)(schema_1.participants.role, schema_1.DBRoles.DEFAULT))).returning().all() || [];
    }
    else {
        return _1.db.delete(schema_1.participants).where((0, drizzle_orm_1.eq)(schema_1.participants.queueId, queueId)).returning().all() || [];
    }
};
exports.clearParticipants = clearParticipants;
const queueBan = (memberId) => {
    _1.db.insert(schema_1.banned_users).values({ id: memberId }).returning().get();
};
exports.queueBan = queueBan;
const queueUnban = (memberId) => {
    _1.db.delete(schema_1.banned_users).where((0, drizzle_orm_1.eq)(schema_1.banned_users.id, memberId)).returning().get();
};
exports.queueUnban = queueUnban;
const isBanned = (memberId) => {
    return (_1.db.select().from(schema_1.banned_users).where((0, drizzle_orm_1.eq)(schema_1.banned_users.id, memberId)).get() || null) !== null;
};
exports.isBanned = isBanned;
const isInQueue = (memberId) => {
    return (_1.db.select().from(schema_1.participants).where((0, drizzle_orm_1.eq)(schema_1.participants.id, memberId)).get() || null) !== null;
};
exports.isInQueue = isInQueue;
//# sourceMappingURL=queues.js.map
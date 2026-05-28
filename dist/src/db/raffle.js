"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRaffleParticipant = exports.deleteAllRaffleParticipants = exports.getRaffleParticipants = exports.createRaffleParticipant = exports.deleteRaffle = exports.updateRaffle = exports.getAllRaffles = exports.getRaffleById = exports.createRaffle = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const _1 = require(".");
const schema_1 = require("./schema");
const createRaffle = (data) => {
    return _1.db.insert(schema_1.raffles).values(data).returning().get();
};
exports.createRaffle = createRaffle;
const getRaffleById = (raffleId) => {
    let raffle = _1.db.select().from(schema_1.raffles).where((0, drizzle_orm_1.eq)(schema_1.raffles.id, raffleId)).get();
    return { raffle, participants: (0, exports.getRaffleParticipants)(raffle.id) };
};
exports.getRaffleById = getRaffleById;
const getAllRaffles = () => {
    return _1.db.select().from(schema_1.raffles).all();
};
exports.getAllRaffles = getAllRaffles;
const updateRaffle = (raffleId, data) => {
    return _1.db.update(schema_1.raffles).set(data).where((0, drizzle_orm_1.eq)(schema_1.raffles.id, raffleId)).returning().get();
};
exports.updateRaffle = updateRaffle;
const deleteRaffle = (raffleId) => {
    (0, exports.deleteAllRaffleParticipants)(raffleId);
    return _1.db.delete(schema_1.raffles).where((0, drizzle_orm_1.eq)(schema_1.raffles.id, raffleId)).returning().get();
};
exports.deleteRaffle = deleteRaffle;
const createRaffleParticipant = (data) => {
    return _1.db.insert(schema_1.raffle_participants).values(data).returning().get();
};
exports.createRaffleParticipant = createRaffleParticipant;
const getRaffleParticipants = (raffleId) => {
    return _1.db.select().from(schema_1.raffle_participants).where((0, drizzle_orm_1.eq)(schema_1.raffle_participants.raffle_id, raffleId)).all();
};
exports.getRaffleParticipants = getRaffleParticipants;
const deleteAllRaffleParticipants = (raffleId) => {
    return _1.db.delete(schema_1.raffle_participants).where((0, drizzle_orm_1.eq)(schema_1.raffle_participants.raffle_id, raffleId)).returning().all();
};
exports.deleteAllRaffleParticipants = deleteAllRaffleParticipants;
const deleteRaffleParticipant = (raffleId, userId) => {
    return _1.db.delete(schema_1.raffle_participants).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.raffle_participants.raffle_id, raffleId), (0, drizzle_orm_1.eq)(schema_1.raffle_participants.id, userId))).returning().get();
};
exports.deleteRaffleParticipant = deleteRaffleParticipant;
//# sourceMappingURL=raffle.js.map
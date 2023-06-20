import { MongoClient } from "mongodb";

const mongo = new MongoClient(
  process.env.MONGO_URL || "mongodb://localhost:27017"
);

const db = mongo.db(process.env.MONGO_DB || "test_db");

export const sessions = db.collection("sessions");

export async function newSession(agent) {
  return await sessions.insertOne({ agent: agent, created: new Date() });
}

export function listSessions(limit = 5) {
  return sessions.find(_, { sort: { _id: -1 } }).limit(limit);
}

export async function close() {
  await mongo.close()
}

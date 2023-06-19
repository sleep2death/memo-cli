import { MongoClient } from "mongodb";

export function connect(url, db) {
  const client = new MongoClient(url);
  return new MClient(client, db);
}

class MClient {
  constructor(client, db) {
    this.client = client;
    this.db = client.db(db);

    this.sessions = this.db.collection("sessions");
  }

  async newSession(agent) {
    const res = await this.sessions.insertOne({ agent: agent });
    return res;
  }
}

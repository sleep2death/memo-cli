import { readFile } from "fs/promises";
import toml from "@iarna/toml";
import { connect as m_connect } from "./mongo.js";

export async function fromConfig(file) {
  const content = await readFile(file, "utf8");
  const config = toml.parse(content);

  const mongo = m_connect(config.database.mongo.url, config.database.mongo.db);
  const res = await mongo.newSession(config.agent);
  return res.insertedId;
}

import { readFile } from "fs/promises";
import toml from "@iarna/toml";
import { connect as m_connect } from "./mongo.js";

export async function fromConfig(file) {
  const content = await readFile(file, "utf8");
  const config = toml.parse(content);
  console.log(config)

  const mongo = m_connect(process.env.MONGO_URL, process.env.MONGO_DB);
  const res = await mongo.newSession(config.agent);
  return res.insertedId;
}

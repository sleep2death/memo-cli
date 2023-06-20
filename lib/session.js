import { readFile } from "fs/promises";
import toml from "@iarna/toml";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { DateTime } from "luxon";

import { close as m_close, sessions } from "./mongo.js";
import { ensureCollection } from "./qdrant.js";
import { selectActions } from "./actions.js";
import { ObjectId } from "mongodb";

export let current = null;

export async function newSession(config, _) {
  const content = await readFile(config, "utf8");
  const parsed = toml.parse(content);

  const res = await sessions.insertOne({
    agent: parsed.agent,
    created: new Date(),
  });
  current = res.insertedId.toHexString();

  // create qdrant collection
  await ensureCollection(current);

  console.log(chalk.green("对话已创建:", current));
  await selectActions();
}

// load session by id
export async function loadSession(id) {
  if (!id) {
    return await listSessions();
  }

  current = ObjectId.createFromHexString(id)
  // create qdrant collection
  await ensureCollection(current);

  console.log(chalk.green("对话已加载：", current));
  await selectActions();
}

export async function listSessions(skip = null, limit = 5) {
  let cursor;
  if (skip) {
    cursor = sessions
      .find({ _id: { $lt: skip } })
      .sort({ _id: -1 })
      .limit(limit);
  } else {
    cursor = sessions.find({}).sort({ _id: -1 }).limit(limit);
  }

  const choices = [];
  for await (const sess of cursor) {
    choices.push({
      name: sess.agent.name,
      value: sess._id,
      description: DateTime.fromJSDate(sess.created).toLocaleString(
        DateTime.DATETIME_MED
      ),
    });
  }

  if (choices.length === 0) {
    console.log(chalk.bold.red("找不到对话。"));
    await close();
    return;
  }

  if (choices.length === limit) {
    choices.push({
      name: "下一页",
      value: choices[choices.length - 1].value.toHexString(),
      description: "继续翻页",
    });
  }
  const answer = await select({
    message: "请选择下面的对话（esc退出）：",
    choices: choices,
  });

  if (typeof answer === "string") {
    const nextId = ObjectId.createFromHexString(answer);
    return await listSessions(nextId);
  }

  await loadSession(answer.toHexString())
}

export async function close() {
  await m_close();
}

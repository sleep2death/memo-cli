import { fromConfig } from "./session.js";
import { select, input } from "@inquirer/prompts";

import chalk from "chalk";
import ora from "ora";

import readline from "readline";
import { embedding } from "./embedding.js";
import { addPoints, ensureCollection, scrollPoints } from "./qdrant.js";

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode != null) {
  process.stdin.setRawMode(true);
}

let current = null; // current action
let session = null;

// using esc key to cancel input action, and return to the root menu
process.stdin.on("keypress", async (_, key) => {
  if (key.name === "escape") {
    if (current !== null) {
      current.cancel();
      console.log(chalk.gray("\nuser canceled..."));

      printSeparator();
      await selectActions();
    }
  }
});

export async function newSession(config, _) {
  const sessionId = await fromConfig(config);
  session = sessionId.toHexString();

  // create qdrant collection
  await ensureCollection(session);

  console.log(chalk.green("Session created:", session));
  printSeparator();

  await selectActions();
}

export async function loadSession(name) {
  if (!name) {
    return await listSessions()
  }
}

export async function listSessions() {

}

async function selectActions() {
  current = select({
    message: "选择动作",
    choices: [
      {
        name: "添加记忆",
        value: "add_memory",
        description: "为角色添加记忆",
      },
      {
        name: "遍历记忆",
        value: "scroll_memories",
        description: "查看该全部记忆",
      },
      {
        name: "总结角色",
        value: "summary",
        description: "总结角色当前状态",
      },
    ],
  });

  const answer = await current;

  switch (answer) {
    case "add_memory":
      addMemory();
      break;
    case "scroll_memories":
      scrollMemories(0);
      break;
    case "summary":
      summary();
      break;
  }
}

async function addMemory() {
  const answer = await catchEscape(
    input({
      message: "输入需要添加的记忆, 按esc返回：",
    })
  );

  if (answer === null) {
    return;
  }

  const spinner = ora("正在编码...").start();
  //
  // get embeddings
  const embeddings = await embedding([answer]);
  spinner.text = "编码完成，正在保存";

  await addPoints(session, embeddings, [{ content: answer, metadata: {} }]);
  spinner.succeed("添加成功");

  printSeparator();
  await selectActions();
}

async function scrollMemories(offset = 0, limit = 15) {
  const spinner = ora("正在查询...").start();
  const res = await scrollPoints(session, offset, 1);
  spinner.stop();


  const choices = res.points.map((p, _) => ({
    name: p.payload.content,
    value: p.id,
  }));

  if (res.next_page_offset) {
    choices.push({
      name: "下一页",
      value:"next:"+res.next_page_offset
    })
  }

  const answer = await catchEscape(select({
    message: "请选择以下记录，按esc返回:",
    choices,
  }))

  if (answer === null) {
    return
  }

  if(answer.includes("next:")) {
    const next = answer.split(":")[1]
    await scrollMemories(next)
  }
}

async function summary() {}

export function printSeparator() {
  const line = "-".repeat(process.stdout.columns);
  console.log("");
  console.log(chalk.green(line));
  console.log("");
}

async function catchEscape(prompt) {
  current = prompt;
  try {
    return await current;
  } catch (e) {
    console.log(e.toString());
    if (e.toString() !== "Error: Prompt was canceled") {
      throw e;
    } else {
      return null;
    }
  }
}

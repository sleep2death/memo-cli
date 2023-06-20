// load dotenv file
import 'dotenv/config'

import { Command } from "commander";
import figlet from "figlet";
import chalk from "chalk";
import { newSession, loadSession } from './lib/session.js';

// print logo and version
console.log(chalk.bold.green(figlet.textSync("MEMO CLI", "3D-ASCII")));
console.log(chalk.bold.blue(`version: ${process.env.npm_package_version}`));

// new session command
const program = new Command();
program
  .name("memo-cli")
  .description("interative cli for running and testing memo agents")
  .version(process.env.npm_package_version);

program
  .command("new")
  .description("create a new session from the config file")
  .argument("<config>", "the toml configuration file")
  .action(newSession);

program
  .command("load")
  .description("load the existed session from database")
  .argument("[name]", "the session name")
  .action(loadSession);

program.parseAsync(process.argv);

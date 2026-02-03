import { spawn } from "child_process";
import { log, LBError, msgs, isEmpty } from "./utils.mjs";
import process from "process";
import path from "path";

//!! USE IT EXCLUSIVELY where the text is written as a literal - it does not depend on user input
export const fromStr = str => {
  const words = [];
  let i = 0;
  let current = "";
  let inQuotes = false;
  let quoteChar = null;

  while (i < str.length) {
    const char = str[i];

    if (!inQuotes) {
      if (char === " ") {
        if (current !== "") {
          words.push(current);
          current = "";
        }
      } else if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      } else current += char;
    } else {
      if (char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
      } else if (char === "\\" && quoteChar === '"') {
        const next = str[i + 1];
        if (next === '"' || next === "\\" || next === "$") {
          current += next;
          i++;
        } else current += char;
      } else current += char;
    }

    i++;
  }
  if (current !== "") words.push(current);
  return [words[0], words.slice(1)];
};

const rootFolder = process.cwd();

const pwdPaths = {
  tmp: path.join(rootFolder, "tmp"),
  root: rootFolder,
};

const preprocessed = (cmd, args, pwd, silent) => {
  pwd = pwdPaths[pwd ?? "root"];

  if (isEmpty(args)) args = [];
  else if (typeof args === "string") args = [args];
  return [cmd, args, pwd, silent];
};

const _exec = (cmd, args, pwd, silent) => {
  return new Promise((resolve, reject) => {
    if (!silent) log("c", "(", pwd, ")", [cmd, ...args].join(" "));

    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: pwd,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", data => (stdout += data.toString()));

    child.stderr.on("data", data => (stderr += data.toString()));

    child.on("error", reject);

    child.on("close", code =>
      resolve(
        log("d", "cmd-result", {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code,
        })
      )
    );
  });
};

export const exec = async (cmd, args, pwd, silent) => {
  return await _exec(...preprocessed(cmd, args, pwd, silent));
};

//use Cmd.stat(cmd, [input], "tmp");
export const stat = async (cmd, args, pwd, silent) => {
  [cmd, args, pwd, silent] = preprocessed(cmd, args, pwd);
  args.unshift("-f", "'%U %S %M %P'", /* "taskset", "-c", "0", */ cmd);
  cmd = "/usr/bin/time";

  const { stdout, stderr, code } = await _exec(cmd, args, pwd, silent);

  const stderrLines = stderr.split("\n");
  stderrLines.pop();

  if (code)
    throw new LBError(
      msgs.utils.execCommandFail(
        cmd + " " + args.join(" "),
        stdout,
        stderrLines.join("\n"),
        code
      )
    );

  const lastLine = stderr.split("\n").at(-1);
  const splittedRes = lastLine.replace(/^'|'$/, "").split(" ");

  if (splittedRes.length != 4)
    throw new LBError(
      msgs.utils.incorrectOutput(
        cmd + " " + args.join(" "),
        stdout,
        stderrLines.join("\n"),
        code
      )
    );

  const [utime, stime, mem, cpu] = splittedRes;

  return {
    stdout,
    stderr: stderrLines.join("\n"),
    stat: {
      time: Number(utime) + Number(stime),
      mem: Number(mem),
      cpu: parseInt(cpu),
    },
    code,
  };
};

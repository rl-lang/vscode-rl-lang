import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel;

function getRlBinary(context: vscode.ExtensionContext): string {
  const platform = os.platform();
  if (platform === "win32") {
    return context.asAbsolutePath(
      path.join("bin", "windows", "rl-windows-x86_64.exe")
    );
  }
  return context.asAbsolutePath(
    path.join("bin", "linux", "rl-linux-x86_64")
  );
}

function runCommand(
  bin: string,
  args: string[],
  cwd: string,
  label: string
) {
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(`> rl ${args.join(" ")}\n`);

  const { spawn } = require("child_process");
  const proc = spawn(bin, args, { cwd });

  proc.stdout.on("data", (d: Buffer) => outputChannel.append(d.toString()));
  proc.stderr.on("data", (d: Buffer) => outputChannel.append(d.toString()));
  proc.on("close", (code: number) => {
    outputChannel.appendLine(`\n[${label} exited with code ${code}]`);
  });
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("rl-lang");
  const bin = getRlBinary(context);

  // rl run <current file>
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.run", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      runCommand(bin, ["run", file], cwd, "run");
    })
  );

  // rl check <current file>
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.check", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      runCommand(bin, ["check", file], cwd, "check");
    })
  );

  // rl dev — runs from workspace root (requires rl.toml)
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.dev", () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage("rl dev: no workspace folder open");
        return;
      }
      const cwd = folders[0].uri.fsPath;
      runCommand(bin, ["dev"], cwd, "dev");
    })
  );

  // rl new <name> — asks for project name, runs in workspace root
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.new", async () => {
      const name = await vscode.window.showInputBox({
        prompt: "Project name",
        placeHolder: "my-project",
        validateInput: (v) =>
          v.trim().length === 0 ? "name cannot be empty" : undefined,
      });
      if (!name) return;

      const folders = vscode.workspace.workspaceFolders;
      const cwd = folders ? folders[0].uri.fsPath : os.homedir();

      runCommand(bin, ["new", name.trim()], cwd, "new");

      // offer to open the new project folder
      const newDir = vscode.Uri.file(path.join(cwd, name.trim()));
      const open = await vscode.window.showInformationMessage(
        `Created project '${name}'. Open it?`,
        "Open Folder"
      );
      if (open === "Open Folder") {
        vscode.commands.executeCommand("vscode.openFolder", newDir);
      }
    })
  );
}

export function deactivate() {
  outputChannel?.dispose();
}

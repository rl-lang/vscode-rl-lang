import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

const execFileAsync = promisify(execFile);

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel;

// Binaries ship per-platform under server/<os>-<arch>/ (see
// scripts/fetch-server.sh). The seven tools are separate binaries:
// rl (run/test/check/...) rlc (compile) rlt (transpile) rlrepl (REPL)
// rlsp (LSP) rldocs (docs) rlm (toolchain manager).
function serverDir(context: vscode.ExtensionContext): string {
  const platform = os.platform();
  const arch = os.arch();
  let dir: string;
  if (platform === "win32") {
    dir = arch === "arm64" ? "windows-aarch64" : "windows-x86_64";
  } else if (platform === "darwin") {
    dir = arch === "arm64" ? "macos-aarch64" : "macos-x86_64";
  } else {
    dir = arch === "arm64" ? "linux-aarch64" : "linux-x86_64";
  }
  return context.asAbsolutePath(path.join("server", dir));
}

// Bundled binary if present, otherwise a bare name resolved via PATH.
function resolveBin(context: vscode.ExtensionContext, name: string): string {
  const exe = os.platform() === "win32" ? `${name}.exe` : name;
  const bundled = path.join(serverDir(context), exe);
  return existsSync(bundled) ? bundled : exe;
}

function startLanguageClient(bin: string): LanguageClient {
  const serverOptions: ServerOptions = {
    command: bin,
    transport: TransportKind.stdio,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "rl" }],
  };

  const newClient = new LanguageClient(
    "rl-lang-lsp",
    "rl-lang LSP",
    serverOptions,
    clientOptions
  );

  newClient.start();
  return newClient;
}

function runCommand(bin: string, args: string[], cwd: string, label: string) {
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
  const bin = (name: string) => resolveBin(context, name);
  outputChannel = vscode.window.createOutputChannel("rl-lang");

  client = startLanguageClient(bin("rlsp"));

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.run", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      runCommand(bin("rl"), ["run", file], cwd, "run");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.test", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      const match = await vscode.window.showInputBox({
        prompt: "Only run tests matching (leave empty for all)",
        placeHolder: "e.g. money",
      });
      if (match === undefined) return;
      const args = ["test", file];
      if (match.trim().length > 0) args.push("--match", match.trim());
      runCommand(bin("rl"), args, cwd, "test");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.transpile", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      const out = file.replace(/\.rl$/, ".c");
      runCommand(bin("rlt"), [file], cwd, "transpile");
      vscode.window.showInformationMessage(`rl: transpiled to ${out}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.check", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      runCommand(bin("rl"), ["check", file], cwd, "check");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.dev", () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage("rl dev: no workspace folder open");
        return;
      }
      const cwd = folders[0].uri.fsPath;
      runCommand(bin("rl"), ["dev"], cwd, "dev");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.new", async () => {
      const name = await vscode.window.showInputBox({
        prompt: "Project name",
        placeHolder: "my-project",
        validateInput: (v) =>
          v.trim().length === 0 ? "name cannot be empty" : undefined,
      });
      if (!name) return;

      const gitChoice = await vscode.window.showQuickPick(
        ["Yes", "No"],
        { placeHolder: "Run `git init` in the new project?" }
      );
      if (gitChoice === undefined) return;

      const folders = vscode.workspace.workspaceFolders;
      const cwd = folders ? folders[0].uri.fsPath : os.homedir();

      const args = ["new", name.trim()];
      if (gitChoice === "No") args.push("--no-git");
      runCommand(bin("rl"), args, cwd, "new");

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

  // `rlc compile` - lex/parse/resolve/compile a .rl file to .rlc bytecode.
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.compile", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);
      runCommand(bin("rlc"), ["compile", file], cwd, "compile");
    })
  );

  // `rl package` - bundle a .rl file into a self-contained binary.
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.package", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      const file = editor.document.uri.fsPath;
      const cwd = path.dirname(file);

      const output = await vscode.window.showInputBox({
        prompt: "Output binary name",
        value: "program",
        validateInput: (v) =>
          v.trim().length === 0 ? "output name cannot be empty" : undefined,
      });
      if (!output) return;

      const vmChoice = await vscode.window.showQuickPick(
        ["No", "Yes"],
        {
          placeHolder:
            "Embed compiled bytecode (--vm) instead of raw source? (skips lex/parse at startup)",
        }
      );
      if (vmChoice === undefined) return;

      const args = ["package", file, "--output", output.trim()];
      if (vmChoice === "Yes") args.push("--vm");
      runCommand(bin("rl"), args, cwd, "package");
    })
  );

  // `rlrepl` - interactive TUI, needs a real terminal (not the output channel).
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.repl", () => {
      const terminal = vscode.window.createTerminal("rl repl");
      terminal.sendText(`"${bin("rlrepl")}"`);
      terminal.show();
    })
  );

  // `rldocs [topic]` - prints Markdown to stdout, so the output channel fits.
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.docs", async () => {
      const editor = vscode.window.activeTextEditor;
      const cwd = editor
        ? path.dirname(editor.document.uri.fsPath)
        : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? os.homedir();
      const topic = await vscode.window.showInputBox({
        prompt: "Docs topic (leave empty to browse everything)",
        placeHolder: "e.g. io, loops, match",
      });
      if (topic === undefined) return;
      const args = topic.trim().length > 0 ? [topic.trim()] : [];
      runCommand(bin("rldocs"), args, cwd, "docs");
    })
  );

  // `rl workflows` - scaffold GitHub Actions YAML for this project.
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.workflows", async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage("rl workflows: no workspace folder open");
        return;
      }
      const cwd = folders[0].uri.fsPath;

      const picks = await vscode.window.showQuickPick(
        [
          { label: "check", picked: true, description: "rl check on push/PR" },
          { label: "test", picked: true, description: "rl test on push/PR" },
          { label: "transpile", picked: false, description: "transpile to C on push/PR" },
          { label: "format", picked: false, description: "rl format check on push/PR" },
          { label: "package", picked: false, description: "package + release a binary" },
        ],
        {
          canPickMany: true,
          placeHolder: "Which workflow(s) to generate? (at least one required)",
        }
      );
      if (!picks || picks.length === 0) return;

      const args = ["workflows"];
      for (const flag of ["check", "test", "transpile", "format", "package"]) {
        if (picks.some((p) => p.label === flag)) args.push(`--${flag}`);
      }
      runCommand(bin("rl"), args, cwd, "workflows");
    })
  );

  // `rl format` - rewrites the file in place, so we go through a temp copy to
  // give VS Code real TextEdits (works with "Format Document" and format-on-save).
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("rl", {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): Promise<vscode.TextEdit[]> {
        const tmpFile = path.join(
          os.tmpdir(),
          `rl-fmt-${Date.now()}-${Math.random().toString(36).slice(2)}.rl`
        );
        await fs.writeFile(tmpFile, document.getText(), "utf8");
        try {
          await execFileAsync(bin("rl"), ["format", tmpFile]);
          const formatted = await fs.readFile(tmpFile, "utf8");
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (err) {
          vscode.window.showErrorMessage(`rl format failed: ${err}`);
          return [];
        } finally {
          fs.unlink(tmpFile).catch(() => {});
        }
      },
    })
  );

  // Command-palette / editor-title wrapper around the formatter above, so
  // "rl: Format File" behaves the same as "Format Document".
  context.subscriptions.push(
    vscode.commands.registerCommand("rl.format", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("rl: no active file");
        return;
      }
      await vscode.commands.executeCommand("editor.action.formatDocument");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("rl.restartServer", async () => {
      if (client) {
        await client.stop();
      }
      client = startLanguageClient(bin("rlsp"));
      vscode.window.showInformationMessage("rl-lang: language server restarted");
    })
  );
}

export function deactivate(): Thenable<void> | undefined {
  outputChannel?.dispose();
  if (!client) return undefined;
  return client.stop();
}

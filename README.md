
# rl-lang - VS Code

Full language support for [rl-lang](https://github.com/rl-lang/rl-lang), a statically typed interpreted language built in Rust: syntax highlighting, diagnostics/hover via the language server, and commands to run, check, and scaffold projects - all in one extension.

## Features

- **Syntax highlighting** - keywords, operators, literals, strings, and comments, via a TextMate grammar that works with any theme
- **Language server** - real-time diagnostics for type errors, undefined variables, and syntax errors, plus hover information for identifiers
- **Format on save** - `rl format` wired as a document formatter
- **Commands**:
  - `rl: Run File` - run the current `.rl` file with `rl run`
  - `rl: Test File` - run `!#[test]` functions with `rl test` (optional `--match`)
  - `rl: Check File` - type-check the current file with `rl check`
  - `rl: Transpile to C` - transpile with `rlt` (writes `.c` next to the file)
  - `rl: Dev (run project)` - run the current project with `rl dev` (requires an `rl.toml` in the workspace root)
  - `rl: New Project` - scaffold a new project with `rl new`
  - `rl: Compile to Bytecode (.rlc)` - compile with `rlc compile`
  - `rl: Package as Binary` - bundle with `rl package`
  - `rl: Open REPL` - open `rlrepl` in a terminal
  - `rl: Open Docs` - look up stdlib/concept/tutorial docs with `rldocs`
  - `rl: Generate GitHub Actions Workflows` - scaffold CI with `rl workflows`
  - `rl: Restart Language Server` - restart the LSP client without reloading the window

## Usage

Install the extension and open any `.rl` file. Highlighting and the language server activate automatically. Run, check, and dev buttons appear in the editor title bar, and are also available by right-clicking a `.rl` file in the Explorer sidebar.

To create a new project, open the command palette (`Ctrl+Shift+P`) and run `rl: New Project`, then enter a name. The extension will offer to open the new folder automatically.

All command output goes to the **rl-lang** Output Channel at the bottom of the editor.

If VS Code doesn't detect the language, select `RL` from the language picker in the bottom status bar.

## Example

```
dec int x = 10
dec string name = "rl-lang"

fn greet(string name) {
    println("Hello, ", name)
}

greet(name)
```

## Requirements

The extension looks for binaries in two places, in order:

1. Bundled under `server/<os>-<arch>/` (shipped with GitHub releases).
2. Your `PATH` (`rl`, `rlc`, `rlt`, `rlrepl`, `rlsp`, `rldocs`, `rlm`).

To fetch the bundled set yourself (all six platform builds):

```bash
./scripts/fetch-server.sh            # version from rl-version.txt
./scripts/fetch-server.sh 2.2.1      # pinned version
./scripts/fetch-server.sh "" linux-x86_64  # one platform only
```

`rl-version.txt` pins the RL toolchain shipped with the extension.
Bump it when a new RL release is out; tags on this repo are extension
versions and no longer need to match RL versions.

## Manual install (VS Code and VSCodium)

Grab the `.vsix` for your platform from the
[releases page](https://github.com/rl-lang/vscode-rl-lang/releases),
then install it from a terminal:

```bash
code --install-extension vscode-rl-lang-<version>-<platform>.vsix
```

For VSCodium replace `code` with `codium`:

```bash
codium --install-extension vscode-rl-lang-<version>-<platform>.vsix
```

Or without a terminal: open the Extensions view (`Ctrl+Shift+X`),
click the `...` menu at the top, pick **Install from VSIX...**, and
select the file. Same steps in Codium.

There is no official Marketplace listing: GitHub releases are the only
official distribution, and manual install needs no account.

## Links

- Language: [rl-lang/rl-lang](https://github.com/rl-lang/rl-lang)
- Extension: [rl-lang/vscode-rl-lang](https://github.com/rl-lang/vscode-rl-lang)

## License

MIT

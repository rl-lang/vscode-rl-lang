
# rl-lang - VS Code

Full language support for [rl-lang](https://github.com/rl-lang/rl-lang), a statically typed interpreted language built in Rust: syntax highlighting, diagnostics/hover via the language server, and commands to run, check, and scaffold projects - all in one extension.

## Features

- **Syntax highlighting** - keywords, operators, literals, strings, and comments, via a TextMate grammar that works with any theme
- **Language server** - real-time diagnostics for type errors, undefined variables, and syntax errors, plus hover information for identifiers
- **Commands**:
  - `rl: Run File` - run the current `.rl` file with `rl run`
  - `rl: Check File` - type-check the current file with `rl check`
  - `rl: Dev (run project)` - run the current project with `rl dev` (requires an `rl.toml` in the workspace root)
  - `rl: New Project` - scaffold a new project with `rl new`
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

No separate installation needed. The `rl` binary is bundled with the extension for Linux and Windows (x86_64).

## Links

- Language: [rl-lang/rl-lang](https://github.com/rl-lang/rl-lang)
- Extension: [rl-lang/vscode-rl-lang](https://github.com/rl-lang/vscode-rl-lang)

## License

MIT

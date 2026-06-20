# rl-lang - VS Code

Run, check, and scaffold [rl-lang](https://github.com/rl-lang/rl-lang) projects directly from VS Code.

## Features

- Run the current .rl file with rl run
- Type-check the current file with rl check
- Run the current project with rl dev (requires an rl.toml in the workspace root)
- Scaffold a new project with rl new

## Usage

Open a .rl file and three buttons appear in the editor title bar for run, check, and dev. All output goes to the rl-lang Output Channel at the bottom of the editor.

To create a new project, open the command palette with Ctrl+Shift+P and run rl: New Project, then enter a name. The extension will offer to open the new folder automatically.

Commands are also available by right-clicking any .rl file in the Explorer sidebar.

## Requirements

No separate installation needed. The rl binary is bundled for Linux and Windows (x86_64).

## Related

- [vscode-rl](https://github.com/rl-lang/vscode-rl) - syntax highlighting
- [vscode-rl-lsp](https://github.com/rl-lang/vscode-rl-lsp) - diagnostics and hover via the language server

## Links

- Language: [rl-lang/rl-lang](https://github.com/rl-lang/rl-lang)
- Extension: [rl-lang/vscode-rl-lang](https://github.com/rl-lang/vscode-rl-lang)

## License

MIT

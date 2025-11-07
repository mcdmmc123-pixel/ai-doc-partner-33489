# VS Code Extension Integration Guide

This document provides guidance on converting NarratO into a VS Code extension with real-time code analysis capabilities.

## Overview

To transform this web application into a VS Code extension, you'll need to:
1. Use VS Code Extension API
2. Implement file system watchers
3. Add real-time syntax checking
4. Integrate with the extension host

## Prerequisites

- Node.js and npm installed
- VS Code Extension development knowledge
- TypeScript familiarity

## Key Changes Required

### 1. Project Structure

Create a VS Code extension structure:
```
vscode-narrato/
├── extension/
│   ├── src/
│   │   ├── extension.ts (main entry point)
│   │   ├── fileWatcher.ts
│   │   ├── syntaxChecker.ts
│   │   └── webviewProvider.ts
│   ├── package.json (extension manifest)
│   └── tsconfig.json
└── webview/ (your current React app)
```

### 2. Extension Manifest (package.json)

```json
{
  "name": "narrato",
  "displayName": "NarratO - AI Documentation Assistant",
  "description": "Generate professional documentation with AI",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "activationEvents": [
    "onCommand:narrato.openPanel",
    "onStartupFinished"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "narrato.openPanel",
        "title": "Open NarratO",
        "icon": "$(book)"
      },
      {
        "command": "narrato.generateDocs",
        "title": "Generate Documentation"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "narrato",
          "title": "NarratO",
          "icon": "resources/icon.svg"
        }
      ]
    }
  }
}
```

### 3. Real-Time File Watching

Create `fileWatcher.ts`:

```typescript
import * as vscode from 'vscode';

export class FileWatcher {
  private watcher: vscode.FileSystemWatcher;
  private onFileChangeCallback: (uri: vscode.Uri) => void;

  constructor(callback: (uri: vscode.Uri) => void) {
    this.onFileChangeCallback = callback;
    
    // Watch all code files in workspace
    this.watcher = vscode.workspace.createFileSystemWatcher(
      '**/*.{ts,js,tsx,jsx,py,java,cpp,c,go,rs}'
    );

    this.setupListeners();
  }

  private setupListeners() {
    this.watcher.onDidChange((uri) => {
      this.onFileChangeCallback(uri);
    });

    this.watcher.onDidCreate((uri) => {
      this.onFileChangeCallback(uri);
    });

    this.watcher.onDidDelete((uri) => {
      this.onFileChangeCallback(uri);
    });
  }

  dispose() {
    this.watcher.dispose();
  }
}
```

### 4. Real-Time Syntax Checking

Create `syntaxChecker.ts`:

```typescript
import * as vscode from 'vscode';

export class SyntaxChecker {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('narrato');
  }

  async checkFile(document: vscode.TextDocument): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    
    // Simple bracket matching
    const brackets = this.findUnmatchedBrackets(text);
    
    brackets.forEach(bracket => {
      const diagnostic = new vscode.Diagnostic(
        bracket.range,
        `Unmatched ${bracket.type}`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostics.push(diagnostic);
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private findUnmatchedBrackets(text: string): Array<{ range: vscode.Range; type: string }> {
    const unmatched: Array<{ range: vscode.Range; type: string }> = [];
    const stack: Array<{ char: string; line: number; col: number }> = [];
    const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
    
    const lines = text.split('\n');
    
    lines.forEach((line, lineNum) => {
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        
        if (char in pairs) {
          stack.push({ char, line: lineNum, col });
        } else if (Object.values(pairs).includes(char)) {
          if (stack.length === 0) {
            unmatched.push({
              range: new vscode.Range(lineNum, col, lineNum, col + 1),
              type: char
            });
          } else {
            const last = stack[stack.length - 1];
            if (pairs[last.char] === char) {
              stack.pop();
            } else {
              unmatched.push({
                range: new vscode.Range(lineNum, col, lineNum, col + 1),
                type: char
              });
            }
          }
        }
      }
    });

    // Add remaining unmatched opening brackets
    stack.forEach(item => {
      unmatched.push({
        range: new vscode.Range(item.line, item.col, item.line, item.col + 1),
        type: item.char
      });
    });

    return unmatched;
  }

  dispose() {
    this.diagnosticCollection.dispose();
  }
}
```

### 5. Webview Provider

Create `webviewProvider.ts`:

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export class NarratoWebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'getWorkspaceFiles':
          const files = await this.getWorkspaceFiles();
          webviewView.webview.postMessage({ type: 'workspaceFiles', files });
          break;
        case 'readFile':
          const content = await this.readFile(message.path);
          webviewView.webview.postMessage({ type: 'fileContent', content, path: message.path });
          break;
      }
    });
  }

  private async getWorkspaceFiles(): Promise<string[]> {
    const files = await vscode.workspace.findFiles(
      '**/*.{ts,js,tsx,jsx,py,java,cpp,c,go,rs}',
      '**/node_modules/**'
    );
    return files.map(f => f.fsPath);
  }

  private async readFile(filePath: string): Promise<string> {
    const uri = vscode.Uri.file(filePath);
    const content = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(content).toString('utf-8');
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Load your React app here
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'assets', 'index.css')
    );

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
          <div id="root"></div>
          <script src="${scriptUri}"></script>
        </body>
      </html>`;
  }
}
```

### 6. Main Extension Entry Point

Create `extension.ts`:

```typescript
import * as vscode from 'vscode';
import { FileWatcher } from './fileWatcher';
import { SyntaxChecker } from './syntaxChecker';
import { NarratoWebviewProvider } from './webviewProvider';

export function activate(context: vscode.ExtensionContext) {
  const syntaxChecker = new SyntaxChecker();
  
  // Initialize file watcher
  const fileWatcher = new FileWatcher(async (uri) => {
    const document = await vscode.workspace.openTextDocument(uri);
    syntaxChecker.checkFile(document);
  });

  // Check all open documents on activation
  vscode.workspace.textDocuments.forEach(doc => {
    syntaxChecker.checkFile(doc);
  });

  // Check document on change
  const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
    syntaxChecker.checkFile(event.document);
  });

  // Register webview provider
  const provider = new NarratoWebviewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('narrato.mainView', provider)
  );

  // Register commands
  const openCommand = vscode.commands.registerCommand('narrato.openPanel', () => {
    vscode.commands.executeCommand('workbench.view.extension.narrato');
  });

  const generateDocsCommand = vscode.commands.registerCommand('narrato.generateDocs', async () => {
    // Trigger documentation generation
    vscode.window.showInformationMessage('Generating documentation...');
  });

  context.subscriptions.push(
    fileWatcher,
    syntaxChecker,
    changeSubscription,
    openCommand,
    generateDocsCommand
  );
}

export function deactivate() {}
```

## Building the Extension

1. **Build the React app for production:**
   ```bash
   npm run build
   ```

2. **Bundle the extension:**
   ```bash
   cd extension
   npm run compile
   ```

3. **Package the extension:**
   ```bash
   vsce package
   ```

## Testing

1. Press `F5` in VS Code to launch Extension Development Host
2. Open a workspace with code files
3. Open NarratO panel from activity bar
4. Test real-time syntax checking by introducing errors

## Features to Implement

- [ ] Real-time file watching and analysis
- [ ] Syntax error detection (brackets, quotes, semicolons)
- [ ] Documentation preview in editor
- [ ] Compile-time documentation generation
- [ ] Integration with VS Code's diagnostics
- [ ] Custom code actions and quick fixes
- [ ] Settings and configuration options
- [ ] Keyboard shortcuts

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [File System Watcher](https://code.visualstudio.com/api/references/vscode-api#FileSystemWatcher)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)

## Notes

- The web app **is now iframe-ready** with VS Code webview API integration built-in
- Use VS Code API to access file system instead of file uploads
- The app automatically detects when running in VS Code and enables special features
- State persists across webview reloads using VS Code state API
- Implement proper error handling and logging
- Consider performance with large workspaces
- Add extension configuration in VS Code settings

## 🔒 Content Security Policy (CSP)

When bundling the app in your extension's webview, configure CSP in your webview provider:

```typescript
const csp = `
  default-src 'none';
  style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com;
  font-src ${webview.cspSource} https://fonts.gstatic.com;
  script-src ${webview.cspSource} 'unsafe-inline';
  img-src ${webview.cspSource} data: https:;
  connect-src ${webview.cspSource} https://*.supabase.co;
`;
```

**Key CSP settings:**
- Allow Google Fonts (already HTTPS)
- Allow Supabase connections for AI features
- `'unsafe-inline'` for Vite-generated inline scripts (unavoidable)
- `data:` for base64 images

## 📦 Building for Extension

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Copy `dist/` to extension:**
   ```bash
   cp -r dist/ extension/webview-dist/
   ```

3. **Reference in webview provider:**
   ```typescript
   const distPath = vscode.Uri.joinPath(context.extensionUri, 'webview-dist');
   const htmlPath = vscode.Uri.joinPath(distPath, 'index.html');
   ```

## 🔌 VS Code API Integration (Already Built-in!)

The app automatically:
- ✅ Detects VS Code context via `isVSCode()`
- ✅ Communicates with extension via `sendMessageToVSCode()`
- ✅ Listens for messages via `onVSCodeMessage()`
- ✅ Persists state via `saveState()` / `getState()`

**Example extension-to-webview message:**
```typescript
// In extension
panel.webview.postMessage({
  type: 'filesFromWorkspace',
  files: workspaceFiles
});
```

**Example webview-to-extension message:**
```typescript
// In webview (automatic via built-in integration)
sendMessageToVSCode({
  type: 'analyzeFiles',
  files: uploadedFiles
});
```

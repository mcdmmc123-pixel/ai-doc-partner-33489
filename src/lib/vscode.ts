/**
 * VS Code webview API integration
 * Provides communication between the webview and VS Code extension
 */

// VS Code API types
interface VSCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

// Check if running in VS Code webview
export const isVSCode = (): boolean => {
  return typeof window !== 'undefined' && window.parent !== window;
};

// Get VS Code API (only available in webview context)
export const getVSCodeAPI = (): VSCodeApi | null => {
  if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
    return (window as any).acquireVsCodeApi();
  }
  return null;
};

// Message types for VS Code communication
export type VSCodeMessage = 
  | { type: 'analyzeFiles'; files: File[] }
  | { type: 'getWorkspaceFiles' }
  | { type: 'readFile'; path: string }
  | { type: 'saveDocument'; name: string; content: string }
  | { type: 'error'; message: string };

// Send message to VS Code extension
export const sendMessageToVSCode = (message: VSCodeMessage): void => {
  const vscode = getVSCodeAPI();
  if (vscode) {
    vscode.postMessage(message);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[VSCode Message]', message);
  }
};

// Listen for messages from VS Code extension
export const onVSCodeMessage = (handler: (message: any) => void): (() => void) => {
  const listener = (event: MessageEvent) => {
    const message = event.data;
    handler(message);
  };
  
  window.addEventListener('message', listener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('message', listener);
  };
};

// Save state to VS Code (persists across webview reloads)
export const saveState = (state: any): void => {
  const vscode = getVSCodeAPI();
  if (vscode) {
    vscode.setState(state);
  }
};

// Get state from VS Code
export const getState = (): any => {
  const vscode = getVSCodeAPI();
  if (vscode) {
    return vscode.getState();
  }
  return null;
};

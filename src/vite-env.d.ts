/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import("electron").IpcRenderer;
  app: {
    version: () => Promise<string>;
    refreshMenu: () => Promise<
      import("custom-electron-titlebar").CustomTitlebar
    >;
  };
}

import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { update } from "./update";

import { ChildProcess, spawn, execFile } from "child_process";
import psTree from "ps-tree";

import {
  setupTitlebar,
  attachTitlebarToWindow,
} from "custom-electron-titlebar/main";
import { getMenuTemplate } from "./menu";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// setup the titlebar main process
setupTitlebar();

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
// Define Variables
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = app.isPackaged
  ? RENDERER_DIST
  : path.join(process.env.APP_ROOT, "public");

const LOADING_FILE = app.isPackaged
  ? path.join(RENDERER_DIST, "loading.html")
  : path.join(process.env.APP_ROOT, "loading.html");

console.log("process.env.APP_ROOT: ", process.env.APP_ROOT);
console.log("RENDERER_DIST: ", RENDERER_DIST);
console.log("LOADING FILE: ", LOADING_FILE);

const API_PROCESS = app.isPackaged
  ? path.join(process.cwd(), "dist-python/API_NAME/API_EXE_NAME.exe") // Change to your API path
  : path.join(process.env.APP_ROOT, "/api/manage.py");

const CELERY_PROCESS = app.isPackaged
  ? path.join(process.cwd(), "dist-python/API_NAME/celery_worker.exe") // Change to your celery worker path
  : path.join(process.env.APP_ROOT, "/api/runtime_hook.py");

console.log("API_PRCESS: ", API_PROCESS);
console.log("CELERY_PROCESS: ", CELERY_PROCESS);

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// Lock to only one instance
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let subpy: ChildProcess[] = [];

// #######################
// Python Flask Integration
const startPythonSubprocess = () => {
  if (app.isPackaged) {
    subpy = [execFile(API_PROCESS, [])];
  } else {
    subpy = [spawn("python", [API_PROCESS], { windowsHide: true })];
    subpy = [
      ...subpy,
      spawn("python", [CELERY_PROCESS], { windowsHide: true }),
    ];
  }

  subpy[0].stdout!.on("data", (data) => {
    console.log(`stdout-api: ${data}`);
  });

  subpy[0].stderr!.on("data", (data) => {
    console.log(`stderr-api: ${data}`);
  });

  if (subpy.length == 2) {
    subpy[1].stdout!.on("data", (data) => {
      console.log(`stdout-celery: ${data}`);
    });

    subpy[1].stderr!.on("data", (data) => {
      console.log(`stderr-celery: ${data}`);
    });
  }
};

const killPythonSubprocesses = (main_pid: number) => {
  const python_script_name = [
    path.basename(API_PROCESS),
    path.basename(CELERY_PROCESS),
  ];
  if (!app.isPackaged) {
    // python_script_name.push(path.basename(CELERY_PROCESS));
    python_script_name.push("python.exe");
    // python_script_name.push("Electron.exe");

    try {
      spawn("taskkill", ["/f", "/t", "/im", "redis-server.exe"]);
    } catch {
      console.log("Error kill redis");
    }
  }
  // console.log(python_script_name);
  let cleanup_completed = false;
  // const psTree = require("ps-tree");
  psTree(main_pid, function (_, children) {
    let python_pids = children
      .filter(function (el) {
        return python_script_name.includes(el.COMMAND);
      })
      .map(function (p) {
        return p.PID;
      });
    // kill all the spawned python processes
    python_pids.forEach(function (pid) {
      try {
        process.kill(Number(pid));
      } catch (error) {
        console.log(`Error killing process ${pid}`);
        console.log(error);
      }
    });
    // subpy = null;
    cleanup_completed = true;
  });
  return new Promise<void>(function (resolve) {
    (function waitForSubProcessCleanup() {
      if (cleanup_completed) {
        console.log("Python subprocess terminated!");
        return resolve();
      }
      setTimeout(waitForSubProcessCleanup, 30);
    })();
  });
};
// #######################

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let currentDisplay: Electron.Display;

const preload = path.join(__dirname, "../preload/index.mjs");
const splash_preload = path.join(__dirname, "../preload/splash.js");
const indexHtml = path.join(RENDERER_DIST, "index.html");

const refreshCurrentDisplay = (screen: Electron.Screen) => {
  if (!mainWindow) return;
  const { x, y } = mainWindow.getBounds();
  currentDisplay = screen.getDisplayNearestPoint({
    x: x + 10,
    y: y + 10,
  });
};

const refreshMenuTemplate = () => {
  const menuTemplate = getMenuTemplate();
  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);
  mainWindow?.webContents.send("titlebar:refresh");
};

async function createWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: splash_preload,
    },
    // resizable: true,
  });
  splashWindow.loadFile(LOADING_FILE);

  mainWindow = new BrowserWindow({
    show: false,
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    titleBarStyle: "hidden",
    frame: false,
    titleBarOverlay: true,
    webPreferences: {
      preload,
      sandbox: false,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  ipcMain.handle("app:version", () => app.getVersion());

  setTimeout(() => {
    if (mainWindow != null) {
      if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
      } else {
        mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
      }
    }
  }, 0);

  const menuTemplate = getMenuTemplate();
  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);

  attachTitlebarToWindow(mainWindow);

  mainWindow.once("ready-to-show", () => {
    // Remove Timeout on production - Only for dev purposes
    setTimeout(() => {
      splashWindow!.destroy();
      splashWindow = null;
      mainWindow!.maximize();
      mainWindow!.show();
    }, 1000);
  });

  const { screen } = require("electron");
  mainWindow.on("move", () => {
    refreshCurrentDisplay(screen);
  });

  refreshCurrentDisplay(screen);
  // Auto update
  update(mainWindow, currentDisplay);
}

app.whenReady().then(() => {
  createWindow();
  startPythonSubprocess();
  const { screen } = require("electron");
  refreshCurrentDisplay(screen);
  // autoUpdater.checkForUpdates();
});

app.on("window-all-closed", () => {
  killPythonSubprocesses(process.pid).then(() => {
    mainWindow = null;
    if (process.platform !== "darwin") app.quit();
  });
});

app.on("second-instance", () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

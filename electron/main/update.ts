import { app, ipcMain, BrowserWindow, IpcRenderer } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

const { autoUpdater } = createRequire(import.meta.url)("electron-updater");
import log from "electron-log";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "../..");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

const humanFileSize = (size: number) => {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
};

let updateWindow: BrowserWindow | null = null;

function sendAppUpdateStatusToWindow(msg: {
  text: string;
  status?: string;
  version?: string;
  progress?: {
    speed: number;
    percent: number;
    transferred: number;
    total: number;
  };
}) {
  log.info(msg.text);
  if (!updateWindow) return;
  updateWindow.webContents.send("app:update:status", msg);
}

export const createUpdateWindow = (
  mainWindow: BrowserWindow | null,
  currentDisplay: Electron.Display,
  onReady: () => void
) => {
  if (updateWindow) return;

  const { x, y, width, height } = currentDisplay.bounds;

  const window_w = 500;
  const window_h = 150;

  updateWindow = new BrowserWindow({
    show: false,
    width: window_w,
    height: window_h,
    x: x + width / 2 - window_w / 2,
    y: y + height / 2 - window_h / 2,
    resizable: false,
    title: "Update",
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    // fullscreen: true,
    titleBarStyle: "hidden",
    // frame: false,
    // titleBarOverlay: true,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "../preload/closeWinPreload.mjs"),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    updateWindow.loadURL(VITE_DEV_SERVER_URL + "/#/appupdate");
    updateWindow.webContents.openDevTools();
  } else {
    updateWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
      hash: "/appupdate",
    });
  }

  // updateWindow.webContents.openDevTools();

  updateWindow.once("ready-to-show", () => {
    updateWindow?.show();
    onReady && onReady();
  });

  ipcMain.once("app:update:download", () => {
    console.log("app:update:download");
    autoUpdater.downloadUpdate();
  });

  ipcMain.once("app:update:install", () => {
    console.log("app:update:update");
    autoUpdater.quitAndInstall();
  });

  ipcMain.once("app:update:later", (_) => {
    console.log("app:update:later");
    updateWindow?.destroy();
    updateWindow = null;
    ipcMain.removeAllListeners("app:update:install");
    ipcMain.removeAllListeners("app:update:later");
    ipcMain.removeAllListeners("app:update:download");
  });
};

export function update(
  win: Electron.BrowserWindow,
  currentDisplay: Electron.Display
) {
  // When set to false, the update download will be triggered through the API
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;

  // start check
  autoUpdater.on("checking-for-update", () => {
    sendAppUpdateStatusToWindow({
      text: "Checking for update...",
      status: "checking",
    });
  });
  // autoUpdater.on("checking-for-update", function () {});
  // update available

  autoUpdater.on("update-available", (arg: UpdateInfo) => {
    // console.log(info);
    createUpdateWindow(win, currentDisplay, () => {
      sendAppUpdateStatusToWindow({
        text: "Update available.",
        version: arg.version,
        status: "available",
      });
    });
  });
  // autoUpdater.on("update-available", (arg: UpdateInfo) => {
  //   win.webContents.send("update-can-available", {
  //     update: true,
  //     version: app.getVersion(),
  //     newVersion: arg?.version,
  //   });
  // });
  // update not available
  autoUpdater.on("update-not-available", () => {
    sendAppUpdateStatusToWindow({
      text: "Update not available.",
      status: "not-available",
    });
  });
  // autoUpdater.on("update-not-available", (arg: UpdateInfo) => {
  //   win.webContents.send("update-can-available", {
  //     update: false,
  //     version: app.getVersion(),
  //     newVersion: arg?.version,
  //   });
  // });

  // Checking for updates
  ipcMain.handle("app:update:check-update", async () => {
    createUpdateWindow(win, currentDisplay, () => {
      sendAppUpdateStatusToWindow({
        text: "The update feature is only available after the package.",
        status: "not-available",
      });
    });
    if (!app.isPackaged) {
      const error = new Error(
        "The update feature is only available after the package."
      );

      return { message: error.message, error };
    }

    try {
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      return { message: "Network error", error };
    }
  });
  // ipcMain.handle("check-update", async () => {
  //   if (!app.isPackaged) {
  //     const error = new Error(
  //       "The update feature is only available after the package."
  //     );
  //     return { message: error.message, error };
  //   }

  //   try {
  //     return await autoUpdater.checkForUpdatesAndNotify();
  //   } catch (error) {
  //     return { message: "Network error", error };
  //   }
  // });

  // Start downloading and feedback on progress
  ipcMain.once("app:update:download", () => {
    console.log("app:update:download");
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          sendAppUpdateStatusToWindow({
            text: "Error in auto-updater. " + error.message,
            status: "error",
          });
        } else {
          // feedback update progress message
          const {
            bytesPerSecond: speed,
            percent,
            transferred,
            total,
          } = progressInfo as ProgressInfo;

          let log_message = "Download speed: " + humanFileSize(speed) + "/s";
          log_message =
            log_message + " - Downloaded " + percent.toFixed(0) + "%";
          log_message =
            log_message +
            " (" +
            humanFileSize(transferred) +
            "/" +
            humanFileSize(total) +
            ")";
          sendAppUpdateStatusToWindow({
            text: log_message,
            status: "downloading",
            progress: {
              speed,
              percent: percent,
              transferred: transferred,
              total: total,
            },
          });
        }
      },
      () => {
        // feedback update downloaded message
        sendAppUpdateStatusToWindow({
          text: "Update downloaded",
          status: "downloaded",
        });
      }
    );
  });
  // ipcMain.handle("start-download", (event: Electron.IpcMainInvokeEvent) => {
  //   startDownload(
  //     (error, progressInfo) => {
  //       if (error) {
  //         // feedback download error message
  //         event.sender.send("update-error", { message: error.message, error });
  //       } else {
  //         // feedback update progress message
  //         event.sender.send("download-progress", progressInfo);
  //       }
  //     },
  //     () => {
  //       // feedback update downloaded message
  //       event.sender.send("update-downloaded");
  //     }
  //   );
  // });

  // Install now
  // ipcMain.handle("quit-and-install", () => {
  //   autoUpdater.quitAndInstall(false, true);
  // });
  ipcMain.once("app:update:install", () => {
    console.log("app:update:install");
    autoUpdater.quitAndInstall();
  });
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void
) {
  autoUpdater.on("download-progress", (info: ProgressInfo) =>
    callback(null, info)
  );
  autoUpdater.on("error", (error: Error) => callback(error, null));
  autoUpdater.on("update-downloaded", complete);
  autoUpdater.downloadUpdate();
}

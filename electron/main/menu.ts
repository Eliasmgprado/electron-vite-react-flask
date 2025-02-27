import { app, MenuItem, MenuItemConstructorOptions } from "electron";

export const getMenuTemplate = (): (
  | MenuItem
  | MenuItemConstructorOptions
)[] => {
  return [
    {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: process.platform === "darwin" ? "Command+N" : "Ctrl+N",
          click() {
            console.log("New");
          },
        },
        {
          label: "Open...",
          accelerator: process.platform === "darwin" ? "Command+O" : "Ctrl+O",
          click() {
            console.log("Open...");
          },
        },
        {
          label: "Save",
          accelerator: process.platform === "darwin" ? "Command+S" : "Ctrl+S",
          click() {
            console.log("save");
          },
          enabled: true,
        },
        {
          label: "Save As...",
          accelerator:
            process.platform === "darwin" ? "Command+Alt+S" : "Ctrl+Alt+S",
          click() {
            console.log("save as...");
          },
          enabled: true,
        },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Command+Q" : "Ctrl+Q",
          click() {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Tutorials",
          click() {
            console.log("Tutorials");
            //   shell.openExternal("https://google.com");
          },
        },
        {
          label: "Release Notes",
          click() {
            console.log("Release Notes");
          },
        },
        {
          label: "About",
          click() {
            console.log("About");
            // createAboutWindow();
          },
        },
      ],
    },
    { label: "" },
    ...(app.isPackaged ? [] : [{ role: "viewMenu" } as MenuItem]),
  ];
};

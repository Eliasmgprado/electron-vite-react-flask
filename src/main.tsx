import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { routes } from "./routes.tsx";

import "./index.css";

import "./demos/ipc";
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const router = createHashRouter(routes);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");

window.ipcRenderer.on("titlebar:refresh", (_) => {
  // console.log("REFRESH TILTE BAR");
  window.app.refreshMenu();
});

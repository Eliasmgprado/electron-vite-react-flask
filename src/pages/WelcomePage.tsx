import { useCallback, useEffect, useState } from "react";
import logoVite from "../assets/logo-vite.svg";
import logoElectron from "../assets/logo-electron.svg";
import { useNavigate } from "react-router-dom";

function WelcomePage() {
  const [appVersion, setAppVersion] = useState<string>("");
  const navigate = useNavigate();

  const getAppVersion = useCallback(async () => {
    return await window.app.version();
  }, []);

  useEffect(() => {
    getAppVersion().then((version) => setAppVersion(version));
  }, [getAppVersion]);

  return (
    <div className="App">
      <div className="logo-box">
        <a
          href="https://github.com/electron-vite/electron-vite-react"
          target="_blank"
        >
          <img
            src={logoVite}
            className="logo vite"
            alt="Electron + Vite logo"
          />
          <img
            src={logoElectron}
            className="logo electron"
            alt="Electron + Vite logo"
          />
        </a>
      </div>
      <h1>Electron + Vite + React + Flask</h1>
      <div className="card">
        <button onClick={() => navigate("/app")}>Go to App</button>
        <p>
          App version: <code>{`v${appVersion}`}</code>
        </p>
      </div>
      <div className="flex-center">
        Place static files into the<code>/public</code> folder{" "}
        <img style={{ width: "5em" }} src="./node.svg" alt="Node logo" />
      </div>

      {/* <UpdateElectron /> */}
    </div>
  );
}

export default WelcomePage;

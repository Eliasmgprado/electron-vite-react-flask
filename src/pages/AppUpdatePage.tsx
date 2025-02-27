import { humanFileSize } from "@/utils/formating_utils";
import { useCallback, useEffect, useMemo, useState } from "react";
// import { FaExclamationCircle } from "react-icons/fa";
// import useGetProjectData from "../components/RockPlot/hooks/use-get-project-data";

interface UpdateMessage {
  text: string;
  status?: string;
  version?: string;
  progress?: {
    speed: number;
    percent: number;
    transferred: number;
    total: number;
  };
}

const AppUpdatePage = () => {
  const [updateMessage, setUpdateMessage] = useState<UpdateMessage>();
  const [versionVal, setVersion] = useState<string>();

  const { status, progress, version, text } = updateMessage ?? {
    text: null,
    status: null,
    progress: null,
    version: null,
  };

  useEffect(() => {
    if (!version) return;
    setVersion(version);
  }, [version]);

  const onSaveHandler = useCallback(
    () => window.ipcRenderer.send("app:update:install"),
    []
  );
  const onDontSaveHandler = useCallback(
    () => window.ipcRenderer.send("app:update:later"),
    []
  );

  const onDownloadHandler = useCallback(
    () => window.ipcRenderer.send("app:update:download"),
    []
  );

  const downloadingMeta = useMemo(() => {
    if (!progress) return {};
    const speed = humanFileSize(progress.speed) + "/s";
    const perc = progress.percent.toFixed(0) + "%";
    const bytes = `(${humanFileSize(progress.transferred)}/${humanFileSize(
      progress.total
    )})`;
    return { speed, perc, bytes };
  }, [progress]);

  useEffect(() => {
    window.ipcRenderer.on("app:update:status", (_, message) => {
      console.log(message);
      setUpdateMessage(message);
    });

    return () => {
      window.ipcRenderer.removeAllListeners("app:update:status");
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--text-black)",
        width: "100vw",
        height: "100vh",
        padding: "1rem",
        margin: "-2rem",
        boxSizing: "border-box",
      }}
    >
      <div>
        {status !== "not-available" && (
          <h4>{`New version available - v${versionVal}`}</h4>
        )}
        {status === "not-available" && (
          <>
            <span>{`No new version available`}</span>
            <p>{text}</p>
          </>
        )}
        {status === "downloaded" && <p>{`Download completed`}</p>}
        {status === "downloading" && (
          <div>
            <p>{`Downloading version ${versionVal}`}</p>
            <p>{`${progress?.percent}`}</p>

            <p>
              {`${downloadingMeta?.perc} - ${downloadingMeta?.speed} ${downloadingMeta?.bytes}`}
            </p>
          </div>
        )}

        {status !== "downloading" && (
          <div>
            <button onClick={onDontSaveHandler}>Later</button>
            {status === "downloaded" && (
              <button onClick={onSaveHandler}>Install</button>
            )}
            {status === "available" && (
              <button onClick={onDownloadHandler}>Download</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default AppUpdatePage;

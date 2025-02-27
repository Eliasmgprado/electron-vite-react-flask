import { useCallback, useRef, useState, useEffect } from "react";
import pkg from "../../../package.json";

export const BASE_API_URL = pkg.flask.env.FLASK_PROXY_URL;

export type SendRequest = (
  requestConfig: {
    url: string;
    method?: string;
    body?: any;
    contentType?: string | null;
    fileName?: string;
  },
  applyData?: (data: any) => void,
  force?: boolean,
  errorHandler?: (error: any) => void,
  outType?: string,
  getTaskProgress?: (data: any) => void
) => void;

export interface UseHttpProps {
  isLoading?: boolean;
  setIsLoadingOpt?: React.Dispatch<React.SetStateAction<boolean>>;
}

export type UseHttp = (props?: UseHttpProps) => {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadData: React.Dispatch<React.SetStateAction<boolean>>;
  loadData: boolean;
  errorMsg: string | null;
  sendRequest: SendRequest;
  clearRequest: () => void;
};

export class StatusError extends Error {
  status: number | string | undefined;
}

export const fnGetFileNameFromContentDispostionHeader: (
  header: string
) => string = function (header) {
  let contentDispostion = header.split(";");
  const fileNameToken = `filename=`;

  let fileName = "downloaded.pdf";
  for (let thisValue of contentDispostion) {
    if (thisValue.trim().indexOf(fileNameToken) === 0) {
      fileName = decodeURIComponent(
        thisValue.trim().replace(fileNameToken, "")
      );
      break;
    }
  }

  return fileName;
};

const useHttp: UseHttp = (props) => {
  const [isLoading, setIsLoading] = useState(
    props && typeof props.isLoading === "boolean" ? props.isLoading : true
  );
  const [loadData, setLoadData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortConRef = useRef<AbortController>();

  useEffect(() => {
    if (props && props.setIsLoadingOpt) {
      props.setIsLoadingOpt(isLoading);
    }
  }, [isLoading]);

  const clearRequest = useCallback(() => {
    if (abortConRef.current) abortConRef.current.abort();
  }, [abortConRef.current]);

  const trackTaskStatus = useCallback(
    async (
      status_url: string,
      getProgress: (data: any) => void,
      applyData: (data: any) => void,
      errorHandler: (error: any) => void
    ) => {
      const wait = (milliseconds: number) => {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
      };

      const task_id = status_url.split("/")[status_url.split("/").length - 1];

      try {
        const response = await fetch(`${BASE_API_URL}/${status_url}`, {
          method: "GET",
          headers: {
            "Content-type": "application/json",
          },
        });

        if (!response.ok) {
          // if (response.status != 200 || response.statusText != "OK") {
          if (response.status === 500) {
            throw new Error("Erro no servidor. Tente novamente.");
          }
          if (response.status === 401) {
            throw new Error("Erro usuário não autorizado.");
          }
        }
        let data = await response.json();
        // const data = response.data;
        // console.log(data)
        data = { ...data, task_id };
        getProgress(data);

        if (data["state"] === "PENDING" || data["state"] === "PROGRESS") {
          await wait(2000);
          return trackTaskStatus(
            status_url,
            getProgress,
            applyData,
            errorHandler
          );
        }

        applyData(data);
        setIsLoading(false);
        setLoadData(false);
        // return data;

        // console.log("DONE")
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name !== "AbortError") {
            // console.log(error);
            setErrorMsg(error.message);
            errorHandler(error.message);
          }
        }

        setLoadData(false);
        console.log(error);
        // return null;
        // abortConRef.current = null;
      }
    },
    []
  );

  const sendRequest: SendRequest = useCallback(
    async (
      requestConfig,
      applyData,
      force,
      errorHandler,
      outType,
      getTaskProgress
    ) => {
      const OUTPUT_TYPES = ["img", "file", "task"];
      applyData = typeof applyData !== "undefined" ? applyData : () => {};
      force = typeof force !== "undefined" ? force : false;
      errorHandler =
        typeof errorHandler !== "undefined" ? errorHandler : () => {};

      outType =
        typeof outType !== "undefined" && OUTPUT_TYPES.includes(outType)
          ? outType
          : "";
      getTaskProgress =
        typeof getTaskProgress !== "undefined" ? getTaskProgress : () => {};

      if (!loadData && !force) return;

      setErrorMsg(null);
      setIsLoading(true);

      if (abortConRef.current) abortConRef.current.abort();
      abortConRef.current = new AbortController();

      try {
        const response = await fetch(
          `${BASE_API_URL}/${requestConfig.url}`,
          {
            method: requestConfig.method ? requestConfig.method : "GET",
            body: requestConfig.body
              ? requestConfig.body instanceof FormData
                ? requestConfig.body
                : JSON.stringify(requestConfig.body)
              : null,
            headers: {
              ...(requestConfig.contentType !== null && {
                "Content-type": requestConfig.contentType
                  ? requestConfig.contentType
                  : "application/json",
              }),
              ...(requestConfig.fileName !== null && {
                "Content-Disposition": `attachment; filename=${requestConfig.fileName}`,
              }),
            },
            signal: abortConRef.current.signal,
          }
        );

        let data;

        if (!response.ok) {
          if (response.status === 500) {
            const error = new StatusError("Server error. Try again.");

            try {
              data = await response.json();

              if (data?.message) {
                error.status = data.status;
                error.message = data.message;
              }
            } catch {}

            throw error;
          }
          if (response.status === 401) {
            const error = new StatusError("Error: User not authorized.");
            try {
              data = await response.json();

              if (data?.message) {
                error.status = data.status;
                error.message = data.message;
              }
            } catch {}

            throw error;
          }
          data = await response.json();

          const error = new StatusError("Error in request.");
          if (Object.keys(data).includes("error")) {
            error.status = data.error.status;
            error.message = data.error.message;
          }

          throw error;
        }

        if (outType === "task") {
          let status_url = response.headers.get("Location");
          if (!status_url) {
            throw new Error("Erro no servidor. Tente novamente.");
          }

          status_url = status_url.split("/api/")[1];
          return await trackTaskStatus(
            status_url,
            getTaskProgress,
            applyData,
            errorHandler
          );
        } else if (outType === "img") {
          data = await response.blob();
          data = URL.createObjectURL(data);
        } else if (outType === "file") {
          data = await response.blob();
          const contentDisp = response.headers.get("content-disposition");
          let filename: string = "download";
          if (contentDisp !== null) {
            filename = fnGetFileNameFromContentDispostionHeader(contentDisp);
          }

          const newBlob = new Blob([data], { type: "octet/stream" });

          let link = document.createElement("a");
          const file_url = window.URL.createObjectURL(newBlob);

          link.href = file_url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => {
            window.URL.revokeObjectURL(file_url);
          }, 250);
        } else {
          data = await response.json();
        }

        applyData(data);
        setIsLoading(false);
        setLoadData(false);
      } catch (error: unknown) {
        console.log(error);
        if (error instanceof Error || error instanceof StatusError) {
          console.log(error?.message);
          if (error.name !== "AbortError") {
            setErrorMsg(error.message);
            errorHandler(error.message);
          }
        }
        setLoadData(false);
      }
    },
    [loadData, trackTaskStatus]
  );

  return {
    isLoading,
    setIsLoading,
    setLoadData,
    loadData,
    errorMsg,
    sendRequest,
    clearRequest,
  };
};

export default useHttp;

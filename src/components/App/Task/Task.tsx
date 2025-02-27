import useHttp from "@/components/hooks/use-http";
import { useCallback, useState } from "react";

interface TaskProps {
  countValue: number;
}

const Task = ({ countValue }: TaskProps) => {
  const [taskResult, setTaskResult] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [taskID, setTaskID] = useState<string | null>(null);
  const { sendRequest, clearRequest, setIsLoading } = useHttp({
    isLoading: false,
  });

  const executeTaskHandler = useCallback(() => {
    clearRequest();
    setIsLoading(true);

    const getData = (data: any) => {
      console.log(data);
      if (data.result && data.state === "SUCCESS") {
        setTaskResult(data.result);
        console.log(data.result);
      } else {
        if (data.state === "ABORTED") {
          console.log("Task Canceled");
        } else {
          console.log("Task Error");
        }
      }
    };

    const getTaskProgress = (data: any) => {
      console.log(data);
      setTaskStatus(data?.status);
      setTaskID(data?.task_id);
    };

    sendRequest(
      {
        url: "v1/celery_task",
        method: "POST",
        body: { time: countValue },
      },
      getData,
      true,
      (error) => {
        setIsLoading(false);
        console.log(error, "ERROR");
      },
      "task",
      getTaskProgress
    );
  }, [countValue]);

  return (
    <div>
      <h2>Flask + Celery Task</h2>
      <button
        onClick={() => executeTaskHandler()}
      >{`Start Task (sleep ${countValue}s)`}</button>
      {taskStatus && <p>Task Status: {taskStatus}</p>}
      {taskResult && <p>Task Result: {taskResult}</p>}
    </div>
  );
};

export default Task;

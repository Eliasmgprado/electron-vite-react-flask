import App from "@/App";
import { useLocation } from "react-router-dom";
import Task from "./Task/Task";
import { useState } from "react";
// import LoadLastSession from "./LoadLastSession";

const AppIndex = () => {
  // get url query load parameter using react-router-dom
  const [count, setCount] = useState(0);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const load = queryParams.get("load");

  return (
    <div>
      <h1>App Index</h1>
      {load && <p>Loading...</p>}
      {/* <LoadLastSession load={load} /> */}
      <App countValue={count} onCountChange={setCount} />
      <Task countValue={count} />
    </div>
  );
};

export default AppIndex;

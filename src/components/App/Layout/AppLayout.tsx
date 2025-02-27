import { Outlet, useNavigate } from "react-router-dom";

import classes from "./AppLayout.module.css";

const AppLayout = () => {
  return (
    <div className={classes.body}>
      <Outlet />
    </div>
  );
};

export default AppLayout;

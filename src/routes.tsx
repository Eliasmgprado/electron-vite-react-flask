import AppIndex from "./components/App/AppIndex";
import AppLayout from "./components/App/Layout/AppLayout";
import AppUpdatePage from "./pages/AppUpdatePage";
import ErrorPage from "./pages/ErrorPage";
import WelcomePage from "./pages/WelcomePage";

const DEFAULT_ERROR_PAGE = <ErrorPage />;

export const routes = [
  {
    path: "/",
    element: <WelcomePage />,
    errorElement: DEFAULT_ERROR_PAGE,
  },
  {
    path: "/app",
    element: <AppLayout />,
    errorElement: DEFAULT_ERROR_PAGE,
    children: [
      {
        index: true,
        element: <AppIndex />,
        errorElement: DEFAULT_ERROR_PAGE,
      },
    ],
  },
  {
    path: "/appupdate",
    element: <AppUpdatePage />,
    errorElement: DEFAULT_ERROR_PAGE,
  },
  // {
  //   path: "/about",
  //   element: <AboutPage />,
  //   errorElement: DEFAULT_ERROR_PAGE,
  // },
];

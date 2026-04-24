import React from "react";
import ReactDOM from "react-dom/client";

import { RootApp } from "./RootApp";
import "./styles.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootApp apiBaseUrl={apiBaseUrl} />
  </React.StrictMode>
);

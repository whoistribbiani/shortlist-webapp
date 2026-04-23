import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./styles.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App apiBaseUrl={apiBaseUrl} />
  </React.StrictMode>
);

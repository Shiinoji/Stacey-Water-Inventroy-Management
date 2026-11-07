import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import "./style.css";

// Mount the application inside the root element provided by index.html.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

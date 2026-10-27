import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SpecPage } from "./spec/SpecPage";
import "./index.css";

// /spec：畫面規格（Visual PRD）；其餘路徑為 prototype 本體
const isSpec = window.location.pathname.replace(/\/+$/, "") === "/spec";

createRoot(document.getElementById("root")!).render(<StrictMode>{isSpec ? <SpecPage /> : <App />}</StrictMode>);

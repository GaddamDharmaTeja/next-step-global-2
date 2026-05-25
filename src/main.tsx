import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";
import { apiBaseUrl } from "./lib/runtime";

setBaseUrl(apiBaseUrl || null);

createRoot(document.getElementById("root")!).render(<App />);

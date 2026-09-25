import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShowcaseApp } from "./App";
import "./styles/app.css";

const el = document.getElementById("root");
if (!el) throw new Error("Falta #root en showcase/index.html");
createRoot(el).render(
  <StrictMode>
    <ShowcaseApp />
  </StrictMode>
);

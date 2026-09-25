import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingApp } from "./LandingApp";
import "../../showcase/src/styles/app.css";

const el = document.getElementById("root");
if (!el) throw new Error("Falta #root en landing/index.html");
createRoot(el).render(
  <StrictMode>
    <LandingApp />
  </StrictMode>
);

import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import { resetLegacyStudentAccountsOnDevice } from "./services/auth.ts";
import "./index.css";

resetLegacyStudentAccountsOnDevice();

registerSW({
  immediate: true,
  onOfflineReady() {
    // App assets cached for offline reading and journaling
  },
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);


import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

registerSW({
  immediate: true,
  onOfflineReady() {
    // App assets cached for offline reading and journaling
  },
});

createRoot(document.getElementById("root")!).render(<App />);


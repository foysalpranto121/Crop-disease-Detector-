import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./styles/index.css";
import "./i18n";
import App from "./App";
import { USE_MOCKS } from "./api/client";
import { AuthProvider } from "./features/AuthContext";
import { ChatProvider } from "./features/ChatContext";
import { SettingsProvider } from "./features/SettingsContext";

async function enableMocks() {
  // Until the FastAPI backend exists, a service worker answers /api/* with realistic mock data.
  if (!USE_MOCKS) return;
  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}

void enableMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, Button } from "./ui";

/** Webcam capture dialog (desktop). Phones use the native camera via <input capture>. */
export function CameraCapture({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (file: File) => void }) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setReady(false);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch((e: DOMException) => setError(e?.name === "NotAllowedError" ? t("camera.denied") : t("camera.unavailable")));

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [open, onClose, t]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(new File([blob], "camera-leaf.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-leaf-900/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={t("camera.title")}
        >
          <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }} className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-semibold">{t("camera.title")}</h2>
              <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-leaf-100" aria-label={t("common.close")}>
                <X className="size-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-leaf-900">
              {error ? (
                <div className="grid h-full place-items-center p-6">
                  <Alert tone="warning">{error}</Alert>
                </div>
              ) : (
                <>
                  <video ref={videoRef} playsInline muted onLoadedData={() => setReady(true)} className="h-full w-full object-cover" />
                  {!ready && <p className="absolute inset-0 grid place-items-center text-leaf-100">{t("camera.starting")}</p>}
                  <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-dashed border-leaf-300/70" />
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4">
              <Button variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button onClick={capture} disabled={!ready || !!error}>
                <Camera className="size-4" /> {t("camera.capture")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

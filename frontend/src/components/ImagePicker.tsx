import { useRef, useState, type DragEvent } from "react";
import { motion } from "motion/react";
import { Camera, ImagePlus, Upload, Webcam } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";
import { isTouchDevice } from "../lib/device";
import { checkImageFile, type ImageCheck } from "../lib/image";
import { CameraCapture } from "./CameraCapture";
import { Button } from "./ui";

type Reason = Extract<ImageCheck, { ok: false }>["reason"];

export function ImagePicker({ onPick, onError }: { onPick: (file: File) => void; onError: (reason: Reason) => void }) {
  const { t } = useTranslation();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const touch = isTouchDevice();
  const canWebcam = !touch && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const handle = (file: File | null | undefined) => {
    if (!file) return;
    const check = checkImageFile(file);
    if (!check.ok) onError(check.reason);
    else onPick(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files?.[0]);
  };

  return (
    <>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        animate={{ scale: dragging ? 1.015 : 1 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14",
          dragging ? "border-leaf-500 bg-leaf-100" : "border-leaf-300 bg-white",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-leaf-100),transparent_60%)]" aria-hidden />
        <div className="relative">
          <div className="animate-float mx-auto mb-5 grid size-20 place-items-center rounded-full bg-gradient-to-br from-leaf-400 to-leaf-700 text-white shadow-xl shadow-leaf-700/30">
            <ImagePlus className="size-9" aria-hidden />
          </div>
          <p className="text-lg font-semibold">{dragging ? t("diagnose.drop_active") : touch ? t("diagnose.take_photo") : t("diagnose.drop_here")}</p>
          <p className="mt-1 text-sm text-leaf-900/60">{t("diagnose.formats")}</p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {touch ? (
              <>
                <Button size="lg" onClick={() => cameraInput.current?.click()}>
                  <Camera className="size-5" /> {t("diagnose.take_photo")}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => galleryInput.current?.click()}>
                  <Upload className="size-5" /> {t("diagnose.choose_gallery")}
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => galleryInput.current?.click()}>
                  <Upload className="size-5" /> {t("diagnose.choose_gallery")}
                </Button>
                {canWebcam && (
                  <Button size="lg" variant="secondary" onClick={() => setWebcamOpen(true)}>
                    <Webcam className="size-5" /> {t("diagnose.use_webcam")}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          data-testid="gallery-input"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </motion.div>

      <CameraCapture
        open={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onCapture={(file) => {
          setWebcamOpen(false);
          handle(file);
        }}
      />
    </>
  );
}

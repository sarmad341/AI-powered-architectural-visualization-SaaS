import {
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS,
} from "lib/constants";
import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";

interface UploadProps {
  onComplete?: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const { isSignedIn } = useOutletContext<AuthContext>();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const processFile = useCallback(
    (selectedFile: File) => {
      if (!isSignedIn) return;

      setFile(selectedFile);
      setProgress(0);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + PROGRESS_STEP, 100);
            if (next >= 100) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              setTimeout(() => {
                onComplete?.(base64);
              }, REDIRECT_DELAY_MS);
            }
            return next;
          });
        }, PROGRESS_INTERVAL_MS);
      };
      reader.readAsDataURL(selectedFile);
    },
    [isSignedIn, onComplete]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSignedIn) return;
      const files = e.target.files;
      if (files?.length) processFile(files[0]);
      e.target.value = "";
    },
    [isSignedIn, processFile]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSignedIn) setIsDragging(true);
    },
    [isSignedIn]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSignedIn) setIsDragging(false);
    },
    [isSignedIn]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!isSignedIn) return;
      const files = e.dataTransfer.files;
      if (files?.length) processFile(files[0]);
    },
    [isSignedIn, processFile]
  );

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "is-dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg,.jpeg,.png"
            disabled={!isSignedIn}
            onChange={handleChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>

            <p>
              {isSignedIn
                ? "Click to upload or just drag and drop"
                : "Please sign in to upload files"}
            </p>
            <p className="help">Maximum file size 50 MB.</p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>

            <h3>{file.name}</h3>

            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />

              <p className="status-text">
                {progress < 100 ? "Analyzing floor plan..." : "Redirecting..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;

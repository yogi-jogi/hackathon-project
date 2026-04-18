import { useRef, useState } from "react";

export default function FileUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleFile(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("Max 50 MB."); return; }
    onChange(file);
  }

  function preview() {
    if (!value) return null;
    const url = URL.createObjectURL(value);
    if (value.type.startsWith("image/")) return <img src={url} alt="" className="max-h-[100px] rounded-md object-cover" />;
    if (value.type.startsWith("audio/")) return <audio controls src={url} className="w-full" />;
    if (value.type.startsWith("video/")) return <video controls src={url} className="max-h-[100px] w-full rounded-md" />;
    return null;
  }

  return (
    <div
      onDragEnter={() => setDrag(true)}
      onDragLeave={() => setDrag(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
      className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center gap-2 ${
        drag ? "border-accent bg-accent-dim" : "border-border-md bg-bg-2 hover:border-border-hover"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,audio/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {value ? (
        <>
          {preview()}
          <p className="text-xs text-text-2 mt-1">
            {value.name} — {(value.size / 1024 / 1024).toFixed(1)} MB
          </p>
          <button
            type="button"
            className="px-3 py-1.5 mt-2 text-xs font-medium text-danger bg-danger-dim hover:bg-danger/20 rounded-md transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
          >
            Remove
          </button>
        </>
      ) : (
        <>
          <span className="text-xl opacity-35">↑</span>
          <p className="text-[0.8rem] text-text-2">
            Drag & drop or click to upload
          </p>
          <p className="text-[0.72rem] text-text-muted">
            Images, audio, video · max 50 MB
          </p>
        </>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import servicesApi from "../../utils/servicesApi";
import { assetUrl } from "../../utils/assetUrl";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/** Upload up to `max` photos (JPG/PNG/WEBP, 8 MB each) through the member upload endpoint. */
export default function ListingImageUploader({ images = [], onChange, max = 6, label = "Photos" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (fileList) => {
    setError("");
    const files = Array.from(fileList || []).slice(0, Math.max(0, max - images.length));
    const bad = files.find((f) => !ACCEPTED.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      setError("Only JPG, PNG or WEBP images up to 8 MB are allowed.");
      return;
    }
    if (!files.length) return;

    setUploading(true);
    const uploaded = [];
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("document", file);
        const res = await servicesApi.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
        if (res.data?.url) uploaded.push(res.data.url);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try another image.");
    } finally {
      if (uploaded.length) onChange([...images, ...uploaded].slice(0, max));
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="block text-xs font-bold text-slate-700">{label}</span>
        <span className="text-[11px] font-semibold text-slate-400">
          {images.length} / {max}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={assetUrl(url)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-rose-600 shadow"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px] font-bold">{uploading ? "Uploading" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{error}</p>}
      <p className="mt-1.5 text-[11px] text-slate-400">Chamber, waiting area or building front. Shown to members after verification.</p>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { uploadLogo } from "@/lib/api";

export function LogoDrop({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);

  const take = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setErr("Drop an image file.");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setErr("Keep it under 3MB.");
        return;
      }
      setErr("");
      setBusy(true);
      try {
        // The server owns storage now, so we just try it and fall back to a
        // local preview if the backend is not configured on this deploy.
        onChange(await uploadLogo(file));
      } catch (e) {
        onChange(URL.createObjectURL(file));
        setErr(
          e instanceof Error && !/failed|not configured/i.test(e.message)
            ? e.message
            : "Preview only — storage is not configured. Paste an image URL to store it onchain.",
        );
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  return (
    <div className="grid gap-2">
      <label
        className={`grid cursor-pointer place-items-center rounded-2xl border border-dashed p-6 text-center transition ${
          over ? "border-lime bg-lime/10" : "border-line bg-panel"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-24 w-24 rounded-2xl object-cover" />
        ) : (
          <div>
            <p className="text-lg font-semibold">Drop a logo</p>
            <p className="mt-1 font-mono text-[11px] text-mute">PNG / JPG / GIF · click or drag</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void take(e.target.files?.[0])}
        />
      </label>
      {busy && <p className="font-mono text-xs text-lime">Uploading…</p>}
      {err && <p className="text-xs text-ember">{err}</p>}
      <input
        className="field"
        value={value.startsWith("blob:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste an image URL"
      />
    </div>
  );
}

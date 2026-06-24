"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "上传失败");
        }
        uploaded.push(json.url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function setFirst(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-amber-400 bg-amber-50"
            : "border-gray-300 hover:border-amber-300"
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        ) : (
          <Upload className="h-6 w-6 text-gray-400" />
        )}
        <p className="text-sm text-gray-500">
          {uploading ? "上传中..." : "点击或拖拽图片上传（JPG/PNG/WEBP，≤5MB）"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-50"
            >
              <Image src={url} alt="产品图片" fill className="object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  首图
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  title="向前移动"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFirst(index)}
                  disabled={index === 0}
                  title="设为首图"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === value.length - 1}
                  title="向后移动"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

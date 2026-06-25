"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

function isImage(url: string) {
  return IMAGE_EXT.test(url.split("?")[0]);
}

function fileName(url: string) {
  try {
    const path = decodeURIComponent(url.split("?")[0]);
    return path.substring(path.lastIndexOf("/") + 1);
  } catch {
    return url;
  }
}

/** 认证报告上传：支持图片与 PDF/Word 文档，图片显示缩略图，文档显示文件卡片。 */
export function FileUpload({ value, onChange }: FileUploadProps) {
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
        if (!res.ok) throw new Error(json.error || "上传失败");
        uploaded.push(json.url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
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
          {uploading
            ? "上传中..."
            : "点击或拖拽上传认证报告（图片或 PDF/Word，≤10MB）"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-lg border bg-gray-50"
            >
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute right-1 top-1 z-10 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              {isImage(url) ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-square"
                >
                  <Image
                    src={url}
                    alt="认证报告"
                    fill
                    className="object-cover"
                  />
                </a>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center"
                >
                  <FileText className="h-8 w-8 text-amber-500" />
                  <span className="line-clamp-2 break-all text-[11px] text-gray-600">
                    {fileName(url)}
                  </span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

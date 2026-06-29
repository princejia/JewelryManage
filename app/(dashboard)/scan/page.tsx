"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ID = "qr-scanner-region";

/** 解析二维码内容，返回应跳转的应用内路径。 */
function resolveTarget(value: string): string | null {
  let t: string | null = null;
  let id: string | null = null;

  try {
    const url = new URL(value);
    // 新版：/v/<p|s>/<id>
    const m = url.pathname.match(/\/v\/([ps])\/([^/]+)$/i);
    if (m) {
      t = m[1].toLowerCase();
      id = decodeURIComponent(m[2]);
    } else {
      // 兼容旧版：/scan?t=p&id=xxx
      t = url.searchParams.get("t");
      id = url.searchParams.get("id");
    }
  } catch {
    // 兼容纯文本格式：p:<id> / s:<id>
    const m = value.match(/^([ps]):(.+)$/i);
    if (m) {
      t = m[1].toLowerCase();
      id = m[2];
    }
  }

  if (!id) return null;
  // 已登录员工：直接进入编辑页
  if (t === "p") return `/products/${id}`;
  if (t === "s") return `/loose-stones?edit=${encodeURIComponent(id)}`;
  return null;
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handledRef = useRef(false);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const navigate = useCallback(
    (path: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      setRedirecting(true);
      router.push(path);
    },
    [router],
  );

  // 选取/拍摄图片后解码（原生相机对焦更好，识别更稳）
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      handledRef.current = false;
      setDecoding(true);
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        const decodedText = await scanner.scanFile(file, false);
        scanner.clear();
        const target = resolveTarget(decodedText);
        if (target) navigate(target);
        else setError(`无法识别的二维码：${decodedText}`);
      } catch {
        setError("未能从图片中识别二维码，请让二维码清晰居中后重试。");
      } finally {
        setDecoding(false);
      }
    },
    [navigate],
  );

  // 手机相机扫码会打开 /scan?t=..&id=..，此时直接解析并跳转。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    const id = params.get("id");
    if (t && id) {
      const target = resolveTarget(`${window.location.origin}/scan?t=${t}&id=${id}`);
      if (target) navigate(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">扫码查询</h1>
        <p className="mt-1 text-sm text-gray-500">
          拍摄或选取标签二维码图片，即可快速打开对应的产品或裸石。
        </p>
      </div>

      {/* 解码用隐藏容器 */}
      <div id={SCANNER_ID} className="hidden" />

      {redirecting ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          正在跳转…
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={decoding}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 py-16 text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {decoding ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <ImageIcon className="h-10 w-10" />
            )}
            <span className="text-base font-medium">
              {decoding ? "识别中…" : "拍照或选择二维码图片"}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-400">
            点击后可用手机相机拍摄二维码，或从相册选取已有图片进行识别。
          </p>
        </>
      )}
    </div>
  );
}

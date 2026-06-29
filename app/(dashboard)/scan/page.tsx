"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanLine, X, Image as ImageIcon } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handledRef = useRef(false);
  const [scanning, setScanning] = useState(false);
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

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // 忽略停止时的异常
      }
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    handledRef.current = false;

    if (!window.isSecureContext) {
      setError(
        "浏览器仅在 HTTPS 或 localhost 下允许使用摄像头。请用 https 地址访问，或使用下方「拍照识别」。",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("当前浏览器不支持摄像头，请使用下方「拍照识别」。");
      return;
    }

    const onDecode = (decodedText: string) => {
      const target = resolveTarget(decodedText);
      if (target) {
        stopScanner().finally(() => navigate(target));
      } else {
        setError(`无法识别的二维码：${decodedText}`);
      }
    };
    const cfg = { fps: 10, qrbox: { width: 250, height: 250 } };

    // 逐级回退：后置普通 → 后置高清连续对焦 → 任意摄像头。
    // 每次用全新实例，避免上一次 start 失败后实例不可复用。
    const tries: Array<MediaTrackConstraints | { facingMode: string }> = [
      { facingMode: "environment" },
      {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { facingMode: "user" },
    ];
    for (const constraint of tries) {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      try {
        await scanner.start(constraint, cfg, onDecode, () => {});
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await scanner.applyVideoConstraints({
            advanced: [{ focusMode: "continuous" }],
          } as any);
        } catch {
          /* 机型不支持对焦约束 */
        }
        setScanning(true);
        return;
      } catch {
        try {
          await scanner.stop();
        } catch {
          /* 启动失败实例无需 stop */
        }
        scannerRef.current = null;
      }
    }
    setScanning(false);
    setError(
      "无法启动摄像头。请检查：是否已授予摄像头权限、是否被其他应用占用；或直接使用「拍照识别」。",
    );
  }, [navigate, stopScanner]);

  // 用手机原生相机拍照/选图后解码（原生相机对焦更好，识别更稳）
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      handledRef.current = false;
      await stopScanner();
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        const decodedText = await scanner.scanFile(file, false);
        scanner.clear();
        const target = resolveTarget(decodedText);
        if (target) navigate(target);
        else setError(`无法识别的二维码：${decodedText}`);
      } catch {
        setError("未能从图片中识别二维码，请让二维码清晰居中后重试。");
        startScanner();
      }
    },
    [navigate, startScanner, stopScanner],
  );

  // 手机相机扫码会打开 /scan?t=..&id=..，此时直接解析并跳转，无需开启摄像头。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    const id = params.get("id");
    if (t && id) {
      const target = resolveTarget(`${window.location.origin}/scan?t=${t}&id=${id}`);
      if (target) {
        navigate(target);
        return;
      }
    }
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">扫码查询</h1>
        <p className="mt-1 text-sm text-gray-500">
          将标签上的二维码对准摄像头，即可快速打开对应的产品或裸石。
        </p>
      </div>

      {redirecting ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          正在跳转…
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-black">
            <div id={SCANNER_ID} className="w-full" />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            {scanning ? (
              <Button variant="outline" onClick={stopScanner}>
                <X className="h-4 w-4" />
                停止扫描
              </Button>
            ) : (
              <Button onClick={startScanner}>
                <ScanLine className="h-4 w-4" />
                开始扫描
              </Button>
            )}
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" />
              拍照识别
            </Button>
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
          </div>

          <p className="text-xs text-gray-400">
            对焦困难时，点击「拍照识别」用手机相机拍下二维码，识别更稳定。
          </p>
        </>
      )}
    </div>
  );
}

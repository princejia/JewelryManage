"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanLine, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

const SCANNER_ID = "qr-scanner-region";

/** 解析二维码内容，返回应跳转的应用内路径。 */
function resolveTarget(value: string): string | null {
  let t: string | null = null;
  let id: string | null = null;

  try {
    const url = new URL(value);
    t = url.searchParams.get("t");
    id = url.searchParams.get("id");
  } catch {
    // 兼容纯文本格式：p:<id> / s:<id>
    const m = value.match(/^([ps]):(.+)$/i);
    if (m) {
      t = m[1].toLowerCase();
      id = m[2];
    }
  }

  if (!id) return null;
  if (t === "p") return `/products/${id}`;
  if (t === "s") return `/loose-stones?edit=${encodeURIComponent(id)}`;
  return null;
}

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
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
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const target = resolveTarget(decodedText);
          if (target) {
            stopScanner().finally(() => navigate(target));
          } else {
            setError(`无法识别的二维码：${decodedText}`);
          }
        },
        () => {
          // 单帧未识别，忽略
        },
      );
      setScanning(true);
    } catch (e) {
      setError(
        "无法启动摄像头，请确认已授予摄像头权限，并使用 HTTPS 或 localhost 访问。",
      );
      setScanning(false);
    }
  }, [navigate, stopScanner]);

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
          </div>
        </>
      )}
    </div>
  );
}

import QRCode from "qrcode";

export interface LabelItem {
  id: string;
  code: string;
  name: string;
  type: "product" | "stone";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 生成二维码内容：指向应用内的扫码解析页，便于手机相机直接扫描跳转，
 * 同时应用内扫描器也可解析。p = 产品，s = 裸石。
 */
function buildQrPayload(item: LabelItem, origin: string): string {
  const t = item.type === "product" ? "p" : "s";
  return `${origin}/scan?t=${t}&id=${encodeURIComponent(item.id)}`;
}

/**
 * 为给定的产品/裸石生成标签列表并打开打印窗口。
 * 每个标签包含：二维码（编码对应 id）、编号、名称。
 */
export async function printLabels(items: LabelItem[]): Promise<void> {
  if (items.length === 0) return;

  const origin = window.location.origin;

  const labelsHtml = (
    await Promise.all(
      items.map(async (item) => {
        const payload = buildQrPayload(item, origin);
        const qr = await QRCode.toDataURL(payload, {
          margin: 0,
          width: 240,
          errorCorrectionLevel: "M",
        });
        return `
          <div class="label">
            <img class="qr" src="${qr}" alt="二维码" />
            <div class="info">
              <div class="code">${escapeHtml(item.code)}</div>
              <div class="name">${escapeHtml(item.name)}</div>
            </div>
          </div>`;
      }),
    )
  ).join("");

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("无法打开打印窗口，请检查浏览器是否拦截了弹出窗口。");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>标签打印</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      background: #fff;
    }
    .sheet {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .label {
      width: 48mm;
      height: 30mm;
      border: 1px dashed #ccc;
      border-radius: 4px;
      padding: 2mm;
      display: flex;
      align-items: center;
      gap: 2mm;
      page-break-inside: avoid;
    }
    .label .qr {
      width: 24mm;
      height: 24mm;
      flex-shrink: 0;
    }
    .label .info {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .label .code {
      font-family: "Courier New", monospace;
      font-size: 9px;
      color: #666;
      word-break: break-all;
    }
    .label .name {
      font-size: 12px;
      font-weight: 600;
      color: #111;
      margin-top: 1mm;
      overflow-wrap: anywhere;
    }
    .toolbar {
      margin-bottom: 12px;
    }
    .toolbar button {
      padding: 6px 16px;
      font-size: 14px;
      border: 1px solid #d97706;
      background: #f59e0b;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      body { padding: 0; }
      .toolbar { display: none; }
      .label { border-color: transparent; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">打印</button>
  </div>
  <div class="sheet">${labelsHtml}</div>
</body>
</html>`);

  win.document.close();
  win.focus();
  // 等待图片渲染后自动唤起打印对话框
  win.onload = () => {
    setTimeout(() => win.print(), 200);
  };
}

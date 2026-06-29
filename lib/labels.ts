import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export interface LabelItem {
  id: string;
  code: string;
  name: string;
  type: "product" | "stone";
}

/**
 * 生成二维码内容：指向公开展示页 /v/<p|s>/<id>。
 * - 未登录（手机相机直扫）：进入清新展示页（不含价格）。
 * - 已登录：自动跳转到对应编辑页。
 */
function buildQrPayload(item: LabelItem, origin: string): string {
  const t = item.type === "product" ? "p" : "s";
  return `${origin}/v/${t}/${encodeURIComponent(item.id)}`;
}

// 单个标签尺寸（mm）
const LABEL_W = 48;
const LABEL_H = 30;
const MARGIN = 8;
const GAP = 4;
const QR_SIZE = 22;

/**
 * 为给定的产品/裸石生成标签 PDF 并下载保存。
 * 每个标签包含：二维码（编码展示页链接）、编号、名称，按 A4 网格排版，
 * 标签带虚线边框作为裁剪参考线。
 */
export async function saveLabelsPdf(items: LabelItem[]): Promise<void> {
  if (items.length === 0) return;

  const origin = window.location.origin;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cols = Math.max(1, Math.floor((pageW - 2 * MARGIN + GAP) / (LABEL_W + GAP)));
  const rows = Math.max(1, Math.floor((pageH - 2 * MARGIN + GAP) / (LABEL_H + GAP)));
  const perPage = cols * rows;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const idx = i % perPage;
    if (i > 0 && idx === 0) doc.addPage();

    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = MARGIN + col * (LABEL_W + GAP);
    const y = MARGIN + row * (LABEL_H + GAP);

    // 虚线裁剪边框
    doc.setDrawColor(160);
    doc.setLineDashPattern([1, 1], 0);
    doc.roundedRect(x, y, LABEL_W, LABEL_H, 1, 1);
    doc.setLineDashPattern([], 0);

    // 二维码
    const qr = await QRCode.toDataURL(buildQrPayload(item, origin), {
      margin: 0,
      width: 240,
      errorCorrectionLevel: "M",
    });
    const qrY = y + (LABEL_H - QR_SIZE) / 2;
    doc.addImage(qr, "PNG", x + 3, qrY, QR_SIZE, QR_SIZE);

    // 文本区
    const textX = x + 3 + QR_SIZE + 3;
    const textW = LABEL_W - (3 + QR_SIZE + 3) - 3;
    doc.setTextColor(90);
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(item.code, textW), textX, y + 11);
    doc.setTextColor(17);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(item.name, textW), textX, y + 18);
  }

  doc.save(`labels-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** 旧入口保留兼容：现统一改为保存 PDF。 */
export async function printLabels(items: LabelItem[]): Promise<void> {
  return saveLabelsPdf(items);
}

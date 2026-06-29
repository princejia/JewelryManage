"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveLabelsPdf, type LabelItem } from "@/lib/labels";

export function LabelPdfButton({ item }: { item: LabelItem }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await saveLabelsPdf([item]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={busy}>
      <QrCode className="h-4 w-4" />
      {busy ? "生成中…" : "标签 PDF"}
    </Button>
  );
}

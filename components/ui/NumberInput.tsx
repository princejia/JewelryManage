"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: number | null;
  onChange: (value: number | null) => void;
};

/**
 * 数字输入框：内部以字符串维护，允许清空（解决值为 0 时无法用 Backspace 删除的问题）。
 * 清空时回调 null，输入合法数字时回调对应数值。
 */
export function NumberInput({ value, onChange, ...props }: NumberInputProps) {
  const [text, setText] = React.useState(value == null ? "" : String(value));

  React.useEffect(() => {
    // 外部值变化时同步显示文本（忽略由本组件输入引起、数值等价的变化）
    const parsed = text === "" ? null : Number(text);
    if (parsed !== value && !(text !== "" && Number.isNaN(parsed as number))) {
      setText(value == null ? "" : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        if (v === "") {
          onChange(null);
        } else {
          const n = Number(v);
          if (!Number.isNaN(n)) onChange(n);
        }
      }}
    />
  );
}

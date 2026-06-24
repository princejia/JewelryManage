"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  maxLength?: number;
}

/**
 * 可输入文本并根据已有数据进行模糊自动补全的组合输入框。
 * 基于原生 <datalist>，用户输入字符时浏览器会按已输入过的值进行匹配。
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  id,
  maxLength,
}: ComboboxProps) {
  const reactId = React.useId();
  const listId = `combobox-${id ?? reactId}`;
  const uniqueOptions = Array.from(new Set(options.filter(Boolean)));

  return (
    <>
      <Input
        id={id}
        list={listId}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <datalist id={listId}>
        {uniqueOptions.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}

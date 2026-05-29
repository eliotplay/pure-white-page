import { forwardRef } from "react";

export function formatThousands(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  const num = typeof n === "number" ? n : Number(String(n).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-US");
}

export function parseThousands(v: string): string {
  return v.replace(/[^\d]/g, "");
}

interface Props {
  value: string | number;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { value, onChange, placeholder, className, autoFocus },
  ref,
) {
  const display = value === "" || value === null || value === undefined
    ? ""
    : formatThousands(value);
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      className={className ?? "input-bz"}
      placeholder={placeholder}
      value={display}
      onChange={(e) => onChange(parseThousands(e.target.value))}
    />
  );
});
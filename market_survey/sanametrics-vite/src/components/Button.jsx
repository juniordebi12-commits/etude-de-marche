// src/components/Button.jsx
import React from "react";

export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition";
  const variants = {
    primary: "bg-sana-600 text-white shadow-sm hover:bg-sana-700",
    ghost: "border text-slate-700 hover:bg-gray-50",
    white: "bg-white border text-slate-900 hover:shadow-soft",
  };
  const v = variants[variant] || variants.primary;
  return (
    <button className={`${base} ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

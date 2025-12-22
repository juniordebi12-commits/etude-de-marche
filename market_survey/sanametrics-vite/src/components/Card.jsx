// src/components/Card.jsx
import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-md-lg p-6 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

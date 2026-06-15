"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function FilterIcon() {
  return (
    <svg
      className="th-filter-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M2 4h12M4.5 8h7M6.5 12h3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {Array<{ value: string, label: string, href: string }>} props.options
 * @param {"start" | "end"} [props.align]
 */
export function TableHeaderFilter({ label, value, options, align = "start" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = Boolean(value);
  const activeLabel = options.find((opt) => opt.value === value)?.label;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <th>
      <div className="th-filter" ref={rootRef}>
        <span className="th-filter-label">{label}</span>
        <button
          type="button"
          className={`th-filter-btn${active ? " is-active" : ""}`}
          onClick={() => setOpen((current) => !current)}
          aria-label={`Filter ${label}${activeLabel ? `: ${activeLabel}` : ""}`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <FilterIcon />
        </button>
        {open && (
          <div
            className={`th-filter-menu${align === "end" ? " th-filter-menu--end" : ""}`}
            role="menu"
          >
            {options.map((option) => (
              <Link
                key={option.value || "all"}
                href={option.href}
                role="menuitem"
                className={`th-filter-option${value === option.value ? " is-selected" : ""}`}
                onClick={() => setOpen(false)}
              >
                {option.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </th>
  );
}

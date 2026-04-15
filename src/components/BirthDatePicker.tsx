"use client";

import { useState, useEffect } from "react";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Days in a given month, accounting for leap years
function daysInMonth(month: number, year: number): number {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}

const selectClass =
  "bg-navy-900/80 border border-gold-700/30 rounded px-3 py-3 " +
  "text-cream-200 text-sm appearance-none cursor-pointer " +
  "focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 " +
  "transition-colors [color-scheme:dark] " +
  // Custom arrow via background SVG — replaces the unstyled native arrow
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")] " +
  "bg-no-repeat bg-[right_0.75rem_center] pr-8";

export default function BirthDatePicker({ value, onChange, required }: Props) {
  // Parse initial value (YYYY-MM-DD) into parts
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // Sync external value into local state on mount / external change
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-");
      setYear(y ?? "");
      setMonth(m ? String(parseInt(m)) : "");
      setDay(d ? String(parseInt(d)) : "");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit YYYY-MM-DD upstream whenever any part changes
  function emit(d: string, m: string, y: string) {
    if (d && m && y) {
      const mm = m.padStart(2, "0");
      const dd = d.padStart(2, "0");
      onChange(`${y}-${mm}-${dd}`);
    } else {
      onChange("");
    }
  }

  function handleDay(v: string) {
    setDay(v);
    emit(v, month, year);
  }
  function handleMonth(v: string) {
    // If selected day exceeds days in new month, reset day
    const maxDays = daysInMonth(parseInt(v), parseInt(year));
    const clampedDay = day && parseInt(day) > maxDays ? "" : day;
    setMonth(v);
    if (clampedDay !== day) setDay(clampedDay);
    emit(clampedDay, v, year);
  }
  function handleYear(v: string) {
    setYear(v);
    emit(day, month, v);
  }

  const currentYear = new Date().getFullYear();
  // Birth years from 1920 to current year, descending so recent years are at top
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

  const maxDay = daysInMonth(parseInt(month), parseInt(year));
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Day */}
      <div className="relative">
        <select
          value={day}
          onChange={(e) => handleDay(e.target.value)}
          required={required}
          className={selectClass + " w-full"}
          aria-label="Día"
        >
          <option value="" disabled>Día</option>
          {days.map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>
      </div>

      {/* Month */}
      <div className="relative">
        <select
          value={month}
          onChange={(e) => handleMonth(e.target.value)}
          required={required}
          className={selectClass + " w-full"}
          aria-label="Mes"
        >
          <option value="" disabled>Mes</option>
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={String(i + 1)}>{name}</option>
          ))}
        </select>
      </div>

      {/* Year — descending so user reaches their birth year quickly */}
      <div className="relative">
        <select
          value={year}
          onChange={(e) => handleYear(e.target.value)}
          required={required}
          className={selectClass + " w-full"}
          aria-label="Año"
        >
          <option value="" disabled>Año</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

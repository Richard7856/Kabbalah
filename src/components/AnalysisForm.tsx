"use client";

import { useState } from "react";
import BirthDatePicker from "./BirthDatePicker";

export interface FormData {
  name: string;
  birthDate: string;
  birthTime?: string;
  birthCity?: string;
  gender?: string;
  fatherName?: string;
  context?: string;
  secondName?: string;
  secondBirthDate?: string;
  secondBirthTime?: string;
  secondBirthCity?: string;
  secondGender?: string;
}

interface Props {
  onSubmit: (data: FormData) => void;
}

// Reusable field wrapper for consistent label + input layout
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-cream-300 text-sm mb-1 tracking-wide">
        {label}
        {hint && <span className="ml-2 text-[#8a9bb8]/70 text-xs font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-navy-900/80 border border-gold-700/30 rounded px-4 py-3 " +
  "text-cream-200 placeholder-[#8a9bb8]/50 text-sm " +
  "focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 " +
  "transition-colors";

// PersonBlock renders the fields for one person (reused for person 1 and 2)
function PersonBlock({
  prefix,
  title,
  values,
  onChange,
}: {
  prefix: string;
  title: string;
  values: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthCity: string;
    gender: string;
    fatherName?: string; // only shown for person 1
  };
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="border border-gold-700/40 rounded-lg p-6 bg-navy-800/60 space-y-5">
      <h2 className="font-serif text-gold-400 text-lg tracking-wide">{title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nombre completo">
          <input
            type="text"
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Ej: José Miguel"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Fecha de nacimiento">
          <BirthDatePicker
            value={values.birthDate}
            onChange={(v) => onChange("birthDate", v)}
            required
          />
        </Field>

        <Field label="Hora de nacimiento" hint="(opcional)">
          <input
            type="time"
            value={values.birthTime}
            onChange={(e) => onChange("birthTime", e.target.value)}
            className={inputClass + " [color-scheme:dark]"}
          />
          <p className="mt-1 text-[#8a9bb8]/60 text-xs">
            El día hebreo empieza al anochecer — la hora afecta qué día hebreo es
          </p>
        </Field>

        <Field label="Ciudad / País de nacimiento" hint="(opcional)">
          <input
            type="text"
            value={values.birthCity}
            onChange={(e) => onChange("birthCity", e.target.value)}
            placeholder="Ej: Ciudad de México, México"
            className={inputClass}
          />
        </Field>

        <Field label="Género" hint="(opcional)">
          <select
            value={values.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className={inputClass + " [color-scheme:dark]"}
          >
            <option value="">Sin especificar</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
          <p className="mt-1 text-[#8a9bb8]/60 text-xs">
            El Ari diferencia el tikún según género (Zeir Anpin vs. Nukva)
          </p>
        </Field>

        {/* Father's name — only for first person, relevant for "Name ben/bat Father" */}
        {prefix === "p1" && (
          <Field label="Nombre del padre" hint="(opcional)">
            <input
              type="text"
              value={values.fatherName ?? ""}
              onChange={(e) => onChange("fatherName", e.target.value)}
              placeholder="Ej: Abraham, Miguel"
              className={inputClass}
            />
            <p className="mt-1 text-[#8a9bb8]/60 text-xs">
              En Kabbalah: Nombre ben/bat Nombre del padre — afecta transmisión del alma
            </p>
          </Field>
        )}
      </div>
    </div>
  );
}

export default function AnalysisForm({ onSubmit }: Props) {
  // Person 1 fields
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [gender, setGender] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [context, setContext] = useState("");

  // Person 2 fields
  const [hasSecondPerson, setHasSecondPerson] = useState(false);
  const [secondName, setSecondName] = useState("");
  const [secondBirthDate, setSecondBirthDate] = useState("");
  const [secondBirthTime, setSecondBirthTime] = useState("");
  const [secondBirthCity, setSecondBirthCity] = useState("");
  const [secondGender, setSecondGender] = useState("");

  // Map field names to state setters for PersonBlock
  const p1Setters: Record<string, (v: string) => void> = {
    name: setName,
    birthDate: setBirthDate,
    birthTime: setBirthTime,
    birthCity: setBirthCity,
    gender: setGender,
    fatherName: setFatherName,
  };

  const p2Setters: Record<string, (v: string) => void> = {
    name: setSecondName,
    birthDate: setSecondBirthDate,
    birthTime: setSecondBirthTime,
    birthCity: setSecondBirthCity,
    gender: setSecondGender,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      birthDate,
      birthTime: birthTime || undefined,
      birthCity: birthCity || undefined,
      gender: gender || undefined,
      fatherName: fatherName || undefined,
      context: context || undefined,
      secondName: hasSecondPerson ? secondName : undefined,
      secondBirthDate: hasSecondPerson ? secondBirthDate : undefined,
      secondBirthTime: hasSecondPerson && secondBirthTime ? secondBirthTime : undefined,
      secondBirthCity: hasSecondPerson && secondBirthCity ? secondBirthCity : undefined,
      secondGender: hasSecondPerson && secondGender ? secondGender : undefined,
    });
  }

  const canSubmit =
    name.trim().length > 0 &&
    birthDate.length > 0 &&
    (!hasSecondPerson ||
      (secondName.trim().length > 0 && secondBirthDate.length > 0));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <p className="text-[#8a9bb8] text-sm leading-relaxed text-center max-w-lg mx-auto">
        Ingresa nombre y fecha de nacimiento. Los campos opcionales añaden precisión al análisis —
        especialmente la hora y ciudad, que afectan el día hebreo real.
      </p>

      {/* Person 1 */}
      <PersonBlock
        prefix="p1"
        title="Primera persona"
        values={{ name, birthDate, birthTime, birthCity, gender, fatherName }}
        onChange={(field, value) => p1Setters[field]?.(value)}
      />

      {/* Context / specific question — applies to the whole analysis */}
      <div className="border border-gold-700/30 rounded-lg p-5 bg-navy-800/40 space-y-3">
        <Field label="Contexto o pregunta específica" hint="(opcional — hace el análisis más accionable)">
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder="Ej: Estoy pensando en cambiar de negocio. ¿Qué dice mi perfil sobre este tipo de decisión? / Tengo un conflicto con un socio y quiero entender la dinámica."
            className={inputClass + " resize-none"}
          />
        </Field>
      </div>

      {/* Toggle second person */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setHasSecondPerson((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-[#8a9bb8] hover:text-gold-400
                     transition-colors border border-[#8a9bb8]/30 hover:border-gold-700/50
                     rounded px-4 py-2"
        >
          <span
            className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm transition-colors flex-shrink-0
              ${hasSecondPerson ? "bg-gold-500 border-gold-500" : "border-[#8a9bb8]/50"}`}
          >
            {hasSecondPerson && (
              <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
                <path
                  d="M3 8l3.5 3.5 6.5-7"
                  stroke="#06091a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          Analizar interacción entre dos personas
        </button>
      </div>

      {/* Person 2 — shown conditionally */}
      {hasSecondPerson && (
        <div className="animate-[fade-in_0.3s_ease-out]">
          <PersonBlock
            prefix="p2"
            title="Segunda persona"
            values={{
              name: secondName,
              birthDate: secondBirthDate,
              birthTime: secondBirthTime,
              birthCity: secondBirthCity,
              gender: secondGender,
            }}
            onChange={(field, value) => p2Setters[field]?.(value)}
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-4 font-serif text-lg tracking-widest
                   bg-gradient-to-r from-gold-700 via-gold-500 to-gold-700
                   text-navy-950 font-semibold rounded
                   hover:from-gold-600 hover:via-gold-400 hover:to-gold-600
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-gold-500/50"
      >
        Iniciar Análisis
      </button>

      <p className="text-[#8a9bb8]/60 text-xs text-center">
        El análisis tarda ~40–60 segundos · Basado en Kabbalah clásica, Sefer Yetzirah y Tanya
      </p>
    </form>
  );
}

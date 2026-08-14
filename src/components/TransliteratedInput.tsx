import React, { useState, useEffect, useRef } from "react";
import { Languages, Loader2 } from "lucide-react";

interface TransliteratedInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  isTextArea?: boolean;
  rows?: number;
}

export default function TransliteratedInput({
  id,
  value,
  onChange,
  label,
  placeholder = "",
  required = false,
  isTextArea = false,
  rows = 2
}: TransliteratedInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [autoHindi, setAutoHindi] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from parent if changed externally (e.g. on reset or custom loading)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const performTransliteration = async (textToConvert: string) => {
    if (!textToConvert.trim() || !autoHindi) return;

    // Check if the input is already entirely Hindi to save API bandwidth
    const isHindiOnly = /^[\u0900-\u097F\s\d+\-.,()@]+$/.test(textToConvert);
    if (isHindiOnly) return;

    setIsTransliterating(true);
    try {
      if (textToConvert.includes(",")) {
        const parts = textToConvert.split(",");
        const convertedParts = await Promise.all(
          parts.map(async (part) => {
            const trimmed = part.trim();
            if (!trimmed) return part;

            // If the part is already Hindi/numerals/symbols, skip transliteration
            const isPartHindi = /^[\u0900-\u097F\s\d+\-.,()@]+$/.test(trimmed);
            if (isPartHindi) return part;

            try {
              const res = await fetch("/api/transliterate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: trimmed })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.result) {
                  const leadSpace = part.match(/^\s*/)?.[0] || "";
                  const trailSpace = part.match(/\s*$/)?.[0] || "";
                  return leadSpace + data.result + trailSpace;
                }
              }
            } catch (err) {
              console.error("Single part transliteration failed:", err);
            }
            return part;
          })
        );
        const finalResult = convertedParts.join(",");
        setLocalValue(finalResult);
        onChange(finalResult);
        return;
      }

      const res = await fetch("/api/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToConvert })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setLocalValue(data.result);
          onChange(data.result);
        }
      }
    } catch (err) {
      console.error("Transliteration request failed:", err);
    } finally {
      setIsTransliterating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (autoHindi && val.trim().length > 0) {
      // Debounce the call to avoid hitting translation API too frequently
      timerRef.current = setTimeout(() => {
        performTransliteration(val);
      }, 900);
    }
  };

  return (
    <div className="w-full mb-4" id={id}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setAutoHindi(!autoHindi)}
          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
            autoHindi
              ? "bg-orange-100 text-orange-700 border border-orange-200"
              : "bg-stone-100 text-stone-500 border border-stone-200"
          }`}
          title="रोमन में टाइप करने पर स्वतः हिंदी में बदलने की व्यवस्था"
        >
          <Languages className="w-3.5 h-3.5" />
          {autoHindi ? "हिंदी एक्टिव" : "नार्मल इंग्लिश"}
          {isTransliterating && <Loader2 className="w-3 h-3 animate-spin text-orange-600" />}
        </button>
      </div>

      {isTextArea ? (
        <textarea
          rows={rows}
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder || `${label} रोमन में टाइप करें, वह हिंदी में बदल जायेगा (उदा. ram sahu -> राम साहू)...`}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-[15px]"
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder || `${label} रोमन में टाइप करें (उदा. Raipur -> रायपुर)...`}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-[15px]"
        />
      )}
    </div>
  );
}

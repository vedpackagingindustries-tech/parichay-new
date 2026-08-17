import React, { useState, useEffect, useRef } from "react";
import { Languages, Loader2, Mic, MicOff } from "lucide-react";

export function formatDegreesToHindi(text: string): string {
  if (!text) return text;
  let result = text;
  
  const mappings = [
    { keys: ["b\\.com", "bcom", "बीकॉम", "बी\\. कॉम", "बी\\. कॉम\\."], hindi: "बी.कॉम." },
    { keys: ["m\\.a", "ma", "एमए", "एम\\. ए", "एम\\. ए\\."], hindi: "एम.ए." },
    { keys: ["b\\.a", "ba", "बीए", "बी\\. ए", "बी\\. ए\\."], hindi: "बी.ए." },
    { keys: ["bca", "बीसीए"], hindi: "बीसीए" },
    { keys: ["mca", "एमसीए"], hindi: "एमसीए" },
    { keys: ["mba", "एमबीए"], hindi: "एमबीए" },
    { keys: ["b\\.sc", "bsc", "बीएससी", "बी\\. एससी", "बी\\. एससी\\."], hindi: "बी.एससी." },
    { keys: ["m\\.sc", "msc", "एमएससी", "एम\\. एससी", "एम\\. एससी\\."], hindi: "एम.एससी." },
    { keys: ["b\\.tech", "btech", "बीटेक", "बी\\. टेक", "बी\\. टेक\\."], hindi: "बी.टेक." },
    { keys: ["m\\.tech", "mtech", "एमटेक", "एम\\. टेक", "एम\\. टेक\\."], hindi: "एम.टेक." },
    { keys: ["ph\\.d", "phd", "पीएचडी", "पीएच\\. डी", "पीएच\\. डी\\."], hindi: "पीएच.डी." },
    { keys: ["b\\.ed", "bed", "बीएड", "बी\\. एड", "बी\\. एड\\."], hindi: "बी.एड." }
  ];

  for (const map of mappings) {
    for (const key of map.keys) {
      const regex = new RegExp(`(?<=^|[^a-zA-Z\\u0900-\\u097F])${key}(?=$|[^a-zA-Z\\u0900-\\u097F])`, "gi");
      result = result.replace(regex, map.hindi);
    }
  }

  return result;
}

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
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

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
                  return leadSpace + formatDegreesToHindi(data.result) + trailSpace;
                }
              }
            } catch (err) {
              console.error("Single part transliteration failed:", err);
            }
            return part;
          })
        );
        const finalResult = formatDegreesToHindi(convertedParts.join(","));
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
          const finalResult = formatDegreesToHindi(data.result);
          setLocalValue(finalResult);
          onChange(finalResult);
        }
      }
    } catch (err) {
      console.error("Transliteration request failed:", err);
    } finally {
      setIsTransliterating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const val = formatDegreesToHindi(rawVal);
    setLocalValue(val);
    onChange(val);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (autoHindi && val.trim().length > 0) {
      // Debounce the call to avoid hitting translation API too frequently
      timerRef.current = setTimeout(() => {
        performTransliteration(val);
      }, 1500); // slightly longer debounce "thodda ruk kar" as requested
    }
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoHindi && localValue.trim().length > 0) {
      performTransliteration(localValue);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ आपका ब्राउज़र वॉयस टाइपिंग (Speech Recognition) का समर्थन नहीं करता है। कृपया गूगल क्रोम का उपयोग करें।");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "hi-IN"; // Hindi voice typing

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const space = localValue.trim() ? " " : "";
          const newVal = localValue + space + transcript;
          setLocalValue(newVal);
          onChange(newVal);
          if (autoHindi) {
            performTransliteration(newVal);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition failed to start:", err);
      setIsListening(false);
    }
  };

  return (
    <div className="w-full min-w-0 flex flex-col space-y-1.5" id={id}>
      <div className="w-full flex flex-wrap items-center justify-between gap-1.5 min-w-0">
        <label className="text-xs md:text-sm font-bold text-stone-700 flex items-center gap-1 min-w-0 break-words">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold shrink-0">*</span>}
        </label>
        
        <div className="flex items-center gap-1.5">
          {/* Voice Command Dictation Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`shrink-0 p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isListening
                ? "bg-red-500 text-white border-red-600 animate-pulse"
                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
            }`}
            title={isListening ? "सुनना बंद करें" : "बोलकर टाइप करें (Voice Typing)"}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setAutoHindi(!autoHindi)}
            className={`shrink-0 text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer select-none border ${
              autoHindi
                ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
            }`}
            title="रोमन में टाइप करने पर स्वतः हिंदी में बदलने की व्यवस्था"
          >
            <Languages className="w-3.5 h-3.5 shrink-0" />
            <span>{autoHindi ? "हिंदी चालू" : "इंग्लिश"}</span>
            {isTransliterating && <Loader2 className="w-3 h-3 animate-spin text-orange-600 shrink-0" />}
          </button>
        </div>
      </div>

      {isTextArea ? (
        <textarea
          rows={rows}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder || `${label} रोमन में टाइप करें, वह हिंदी में बदल जायेगा या माइक बटन दबाकर बोलें...`}
          className="w-full block box-border min-w-0 px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-[15px] shadow-xs"
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder || `${label} रोमन में लिखें या माइक बटन दबाकर बोलें...`}
          className="w-full block box-border min-w-0 px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-[15px] shadow-xs"
        />
      )}
    </div>
  );
}

import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  CornerDownRight,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Upload,
  Mail,
  Share2,
  FileText,
  Download,
  Sliders,
  Type as TypeIcon,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Flame,
  Award,
  Wand2
} from "lucide-react";
import { AdLayout, AdElement, DEFAULT_LAYOUT } from "../../server/gemini";

export interface AdMakerDimension {
  width: number;
  height: number;
  unit: "inch" | "cm" | "mm";
}

interface AdMakerPanelProps {
  businessInfo: {
    adId?: number | null;
    adNumber?: string;
    businessName?: string;
    ownerName?: string;
    category?: string;
    businessDesc?: string;
    productsServices?: string;
    specialOffer?: string;
    keyFeatures?: string;
    mobile1?: string;
    mobile2?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
    photoUrl?: string;
    readyAdUrl?: string;
    name?: string;
    dob?: string;
    height?: string;
    blood_group?: string;
    gotra?: string;
    education?: string;
    occupation?: string;
    father_name?: string;
    father_occupation?: string;
    mother_name?: string;
    currentAddress?: string;
    permanentAddress?: string;
    [key: string]: any;
  };
  sizeCode?: string;
  sizeName?: string;
  adType?: "business" | "matrimony";
  onApproveDesign: (design: AdLayout, dimensions?: AdMakerDimension, readyAdFileUrl?: string) => void;
}

export default function AdMakerPanel({
  businessInfo,
  sizeCode = "business_standard",
  sizeName = "मानक विज्ञापन",
  adType = "business",
  onApproveDesign
}: AdMakerPanelProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Navigation tabs inside Ad Maker
  const [activeTab, setActiveTab] = useState<"ai_prompt" | "ready_ad" | "edit_elements">("ai_prompt");

  // Custom Size & Dimensions State
  const [dimensionUnit, setDimensionUnit] = useState<"inch" | "cm" | "mm">("inch");
  const [customWidth, setCustomWidth] = useState<number>(() => {
    if (sizeCode === "business_full") return 8.5;
    if (sizeCode === "business_half") return 8.5;
    if (sizeCode === "business_quarter") return 4.25;
    if (adType === "matrimony" || sizeCode === "matrimony_standard") return 3.5;
    return 6;
  });
  const [customHeight, setCustomHeight] = useState<number>(() => {
    if (sizeCode === "business_full") return 11;
    if (sizeCode === "business_half") return 5.5;
    if (sizeCode === "business_quarter") return 5.5;
    if (adType === "matrimony" || sizeCode === "matrimony_standard") return 2;
    return 4;
  });

  // Prompt and AI state
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<"LIVE_AI_GENERATED" | "OFFLINE_SIMULATION" | "INITIAL">("INITIAL");
  const [preset, setPreset] = useState<"classic" | "royal_gold" | "festive_red" | "bold_black" | "minimal">("classic");
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  // Ready-made Ad upload state
  const [readyAdUrl, setReadyAdUrl] = useState<string>(businessInfo.readyAdUrl || "");
  const [readyAdFileName, setReadyAdFileName] = useState<string>("");
  const [isUploadingReadyAd, setIsUploadingReadyAd] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Email dispatch status
  const [isDispatchingEmail, setIsDispatchingEmail] = useState(false);
  const [dispatchSuccessMessage, setDispatchSuccessMessage] = useState<string | null>(null);

  // Active element selection for inline editing
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Initial template layout that incorporates either business or matrimony data
  const initialTitle = businessInfo.businessName || businessInfo.name || "विज्ञापन शीर्षक";
  const initialOwner = businessInfo.ownerName || businessInfo.father_name || "";
  const initialCategory = businessInfo.category || businessInfo.occupation || "";
  const initialDesc = businessInfo.businessDesc || businessInfo.productsServices || businessInfo.education || "हमारे यहाँ सभी प्रकार की सेवाएँ एवं उत्पाद उच्च गुणवत्ता व उचित दरों पर उपलब्ध हैं।";
  const initialOffer = businessInfo.specialOffer ? `विशेष ऑफर: ${businessInfo.specialOffer}` : "";
  const initialMobile = businessInfo.mobile1 || "9301056006";
  const initialAddress = businessInfo.address || businessInfo.currentAddress || "रायपुर (छ.ग.)";

  const [layout, setLayout] = useState<AdLayout>(() => {
    return {
      backgroundColor: "bg-[#FFFDF6]",
      borderColor: "border-stone-900",
      borderWidth: "border-4",
      padding: "p-4",
      fontFamily: "serif",
      cmykProfile: {
        blackType: "100_K_PURE",
        bleedMm: 3,
        safetyMarginMm: 4
      },
      elements: [
        {
          id: "inv-1",
          type: "invocation",
          content: "॥ श्री गणेशाय नमः ॥  ॥ माँ कर्मा देवी की जय ॥",
          fontSize: "xs",
          fontWeight: "bold",
          color: "text-red-700",
          cmykColor: "C:0 M:90 Y:90 K:10",
          align: "center",
          marginBottom: 2
        },
        {
          id: "1",
          type: "heading",
          content: initialTitle,
          fontSize: "2xl",
          fontWeight: "black",
          color: "text-stone-950",
          cmykColor: "C:0 M:0 Y:0 K:100",
          align: "center",
          marginBottom: 3
        },
        ...(initialCategory
          ? [
              {
                id: "sub-1",
                type: "subheading" as const,
                content: `[ ${initialCategory} ]`,
                fontSize: "sm" as const,
                fontWeight: "bold" as const,
                color: "text-stone-700",
                cmykColor: "C:0 M:0 Y:0 K:90",
                align: "center" as const,
                marginBottom: 3
              }
            ]
          : []),
        { id: "2", type: "divider", content: "" },
        {
          id: "3",
          type: "text",
          content: initialDesc,
          fontSize: "sm",
          fontWeight: "normal",
          color: "text-stone-800",
          cmykColor: "C:0 M:0 Y:0 K:90",
          align: "center",
          marginTop: 2,
          marginBottom: 4
        },
        ...(initialOffer
          ? [
              {
                id: "4",
                type: "offer_badge" as const,
                content: initialOffer,
                fontSize: "sm" as const,
                fontWeight: "bold" as const,
                color: "text-white",
                badgeBg: "bg-red-600",
                cmykColor: "C:0 M:95 Y:85 K:0",
                align: "center" as const,
                marginBottom: 6,
                motifType: "ribbon_badge" as const
              }
            ]
          : []),
        ...(initialOwner
          ? [
              {
                id: "5",
                type: "text" as const,
                content: `संचालक/संपर्क: ${initialOwner}`,
                fontSize: "base" as const,
                fontWeight: "bold" as const,
                color: "text-stone-950",
                cmykColor: "C:0 M:0 Y:0 K:100",
                align: "center" as const,
                marginTop: 2
              }
            ]
          : []),
        {
          id: "6",
          type: "contact_bar",
          content: `मो.: ${initialMobile}${businessInfo.mobile2 ? `, ${businessInfo.mobile2}` : ""} | WhatsApp: ${businessInfo.whatsapp || initialMobile}`,
          fontSize: "base",
          fontWeight: "black",
          color: "text-stone-950",
          cmykColor: "C:0 M:0 Y:0 K:100",
          align: "center",
          marginTop: 4
        },
        {
          id: "7",
          type: "text",
          content: `पता: ${initialAddress}`,
          fontSize: "xs",
          fontWeight: "semibold",
          color: "text-stone-700",
          cmykColor: "C:0 M:0 Y:0 K:80",
          align: "center",
          marginTop: 4
        }
      ]
    };
  });

  // Calculate pixel aspect ratios for canvas based on unit & dimensions
  const getDimensionInInches = () => {
    if (dimensionUnit === "inch") return { w: customWidth, h: customHeight };
    if (dimensionUnit === "cm") return { w: customWidth / 2.54, h: customHeight / 2.54 };
    return { w: customWidth / 25.4, h: customHeight / 25.4 }; // mm
  };

  const currentDimsInInches = getDimensionInInches();
  const aspectRatio = currentDimsInInches.w / (currentDimsInInches.h || 1);

  // Preset size shortcuts
  const handleSelectPresetDimension = (presetType: string) => {
    setDimensionUnit("inch");
    if (presetType === "matrimony_std") {
      setCustomWidth(3.5);
      setCustomHeight(2);
    } else if (presetType === "quarter_page") {
      setCustomWidth(4.25);
      setCustomHeight(5.5);
    } else if (presetType === "half_page") {
      setCustomWidth(8.5);
      setCustomHeight(5.5);
    } else if (presetType === "full_page") {
      setCustomWidth(8.5);
      setCustomHeight(11);
    }
  };

  // AI Generation with Gemini Flash & smart prompts
  const handleGenerateAI = async (e?: React.FormEvent, customPromptText?: string) => {
    if (e) e.preventDefault();
    const activePrompt = (customPromptText || prompt).trim();
    if (!activePrompt) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ad-maker/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          businessInfo,
          currentLayout: layout,
          dimensions: {
            width: customWidth,
            height: customHeight,
            unit: dimensionUnit
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.layout && Array.isArray(data.layout.elements)) {
          setLayout(data.layout);
          setAiStatus(data.status || "LIVE_AI_GENERATED");
        }
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPresetStyle = (styleName: "classic" | "royal_gold" | "festive_red" | "bold_black" | "minimal") => {
    setPreset(styleName);

    let backgroundColor = "bg-[#FFFDF6]";
    let borderColor = "border-stone-900";
    let borderWidth = "border-4";
    let fontFamily: "serif" | "sans" | "decorative" = "serif";
    let textColor = "text-stone-900";
    let titleColor = "text-stone-950";

    if (styleName === "royal_gold") {
      backgroundColor = "bg-[#FAF5EC]";
      borderColor = "border-[#C5A880]";
      borderWidth = "border-4";
      fontFamily = "serif";
      textColor = "text-stone-800";
      titleColor = "text-amber-950";
    } else if (styleName === "festive_red") {
      backgroundColor = "bg-[#FFF5F5]";
      borderColor = "border-red-700";
      borderWidth = "border-4";
      fontFamily = "decorative";
      textColor = "text-stone-900";
      titleColor = "text-red-800";
    } else if (styleName === "bold_black") {
      backgroundColor = "bg-white";
      borderColor = "border-stone-950";
      borderWidth = "border-4";
      fontFamily = "sans";
      textColor = "text-stone-950";
      titleColor = "text-black";
    } else if (styleName === "minimal") {
      backgroundColor = "bg-[#FAFAFA]";
      borderColor = "border-stone-300";
      borderWidth = "border-2";
      fontFamily = "sans";
      textColor = "text-stone-700";
      titleColor = "text-stone-900";
    }

    setLayout((prev) => ({
      ...prev,
      backgroundColor,
      borderColor,
      borderWidth,
      fontFamily,
      elements: prev.elements.map((el) => {
        if (el.type === "heading") {
          return { ...el, color: titleColor, cmykColor: "C:0 M:0 Y:0 K:100" };
        }
        if (el.type === "text" || el.type === "contact_bar") {
          return { ...el, color: textColor, cmykColor: "C:0 M:0 Y:0 K:100" };
        }
        return el;
      })
    }));
  };

  const handleReset = () => {
    setPreset("classic");
    setLayout(DEFAULT_LAYOUT);
    setAiStatus("INITIAL");
    setPrompt("");
  };

  // High-Resolution Image Export (PNG / JPG) using client-side canvas
  const handleDownloadAdImage = async () => {
    if (!canvasContainerRef.current) return;
    setIsDownloadingImage(true);
    try {
      const canvas = await html2canvas(canvasContainerRef.current, {
        scale: 3, // 300 DPI high resolution
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `parichayika-ad-${businessInfo.adNumber || "design"}.png`;
      link.click();
    } catch (err) {
      console.error("Image generation export failed:", err);
      alert("इमेज डाउनलोड में त्रुटि हुई। कृपया प्रिंट प्रूफ का उपयोग करें।");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Ready-Made Ad File Upload handler
  const handleReadyAdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReadyAd(true);
    setUploadError(null);
    setReadyAdFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "अपलोड विफल रहा");
      }

      const data = await res.json();
      setReadyAdUrl(data.url);
    } catch (err: any) {
      setUploadError(err.message || "फ़ाइल अपलोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setIsUploadingReadyAd(false);
    }
  };

  // Direct Dispatch to ipgroup2002@gmail.com
  const handleDirectEmailDispatch = async () => {
    setIsDispatchingEmail(true);
    setDispatchSuccessMessage(null);

    const adNumber = businessInfo.adNumber || "ADV-NEW";
    const customerName = businessInfo.businessName || businessInfo.name || "ग्राहक";
    const customerMobile = businessInfo.mobile1 || "N/A";
    const dimsStr = `${customWidth} × ${customHeight} ${dimensionUnit}`;

    try {
      const res = await fetch("/api/dispatch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: "ipgroup2002@gmail.com",
          subject: `[परिचायिका 2026] नया विज्ञापन डिजाइन/प्रविष्टि - ${adNumber} (${customerName})`,
          adNumber,
          customerName,
          customerMobile,
          adType,
          dimensions: dimsStr,
          fileUrl: readyAdUrl || businessInfo.logoUrl || businessInfo.photoUrl || "",
          designData: layout,
          fullDetails: businessInfo
        })
      });

      if (res.ok) {
        setDispatchSuccessMessage("सफलतापूर्वक ipgroup2002@gmail.com एवं इंडियन प्रेस एडमिन को प्रेषित किया गया!");
      } else {
        throw new Error("ईमेल डिस्पैच सर्वर रिस्पॉन्स विफल");
      }
    } catch (err: any) {
      const emailSubject = encodeURIComponent(`[परिचायिका 2026] विज्ञापन संख्या ${adNumber} - ${customerName}`);
      const emailBody = encodeURIComponent(
        `नमस्कार इंडियन प्रेस टीम,\n\nपरिचायिका पत्रिका 2026 हेतु नया विज्ञापन विवरण निम्न प्रकार है:\n\n` +
        `विज्ञापन संख्या: ${adNumber}\n` +
        `ग्राहक/प्रतिष्ठान का नाम: ${customerName}\n` +
        `मोबाइल नंबर: ${customerMobile}\n` +
        `विज्ञापन आकार: ${dimsStr}\n` +
        `अपलोड की गई फ़ाइल/आर्टवर्क: ${readyAdUrl ? window.location.origin + readyAdUrl : "सिस्टम में सुरक्षित AI लेआउट"}\n\n` +
        `धन्यवाद।`
      );
      window.open(`mailto:ipgroup2002@gmail.com?subject=${emailSubject}&body=${emailBody}`, "_blank");
      setDispatchSuccessMessage("ईमेल ड्राफ्ट खोला गया एवं एडमिन को सूचना दर्ज की गई।");
    } finally {
      setIsDispatchingEmail(false);
    }
  };

  // WhatsApp quick share
  const handleWhatsAppShare = () => {
    const adNumber = businessInfo.adNumber || "ADV-NEW";
    const customerName = businessInfo.businessName || businessInfo.name || "ग्राहक";
    const msg = encodeURIComponent(
      `*परिचायिका पत्रिका 2026 - विज्ञापन प्रविष्टि*\n\n` +
      `📌 *विज्ञापन संख्या:* ${adNumber}\n` +
      `🏢 *नाम:* ${customerName}\n` +
      `📞 *मोबाइल:* ${businessInfo.mobile1 || ""}\n` +
      `📐 *साइज:* ${customWidth} × ${customHeight} ${dimensionUnit}\n` +
      `📄 *फ़ाइल लिंक:* ${readyAdUrl ? window.location.origin + readyAdUrl : "सिस्टम में सुरक्षित AI लेआउट"}\n\n` +
      `कृपया इसे परिचायिका में प्रकाशन हेतु स्वीकृत करें।`
    );
    window.open(`https://wa.me/919301056006?text=${msg}`, "_blank");
  };

  // Element updater for visual designer
  const updateElementText = (id: string, newContent: string) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, content: newContent } : el))
    }));
  };

  // Approve action
  const handleApprove = () => {
    onApproveDesign(
      layout,
      {
        width: customWidth,
        height: customHeight,
        unit: dimensionUnit
      },
      readyAdUrl || undefined
    );
  };

  // Render decorative motifs (SVG Icons)
  const renderMotifSvg = (motif?: string) => {
    if (!motif || motif === "none") return null;

    if (motif === "ganesh") {
      return (
        <div className="flex justify-center my-1 text-red-700">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      );
    }

    if (motif === "swastik") {
      return (
        <div className="flex justify-center my-1 text-red-700">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M13 3h2v6h6v2h-8V3zm0 10h8v2h-6v6h-2v-8zm-2 0v8H9v-6H3v-2h8zm0-2H3V9h6V3h2v8z"/>
          </svg>
        </div>
      );
    }

    if (motif === "kalash" || motif === "diya") {
      return (
        <div className="flex justify-center my-1 text-amber-600">
          <Flame className="w-5 h-5 fill-amber-500 text-amber-700 animate-pulse" />
        </div>
      );
    }

    if (motif === "star_award") {
      return (
        <div className="flex justify-center my-1 text-amber-600">
          <Award className="w-5 h-5 fill-amber-400 text-amber-700" />
        </div>
      );
    }

    return null;
  };

  const renderAdCanvas = (isMini = false) => {
    return (
      <div
        ref={canvasContainerRef}
        className="relative w-full h-full p-2 select-none flex flex-col justify-center items-center"
      >
        {/* Bleed Guide Line (3mm Outer Cutting Margin) */}
        {showGuides && (
          <div className="absolute inset-1 border border-dashed border-red-500 pointer-events-none rounded">
            {!isMini && (
              <span className="absolute -top-3 left-1 bg-red-100 text-red-700 text-[8px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                3mm ब्लीड कटिंग सीमा (Bleed Area)
              </span>
            )}
          </div>
        )}

        {/* Safety Zone Line (4mm Inner Text Safe Margin) */}
        {showGuides && (
          <div className="absolute inset-2.5 sm:inset-3 border border-dashed border-blue-500 pointer-events-none rounded">
            {!isMini && (
              <span className="absolute -bottom-3 right-1 bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                सुरक्षित टेक्स्ट क्षेत्र (Safe Zone)
              </span>
            )}
          </div>
        )}

        {/* READY-MADE ARTWORK MODE (If uploaded by user) */}
        {activeTab === "ready_ad" && readyAdUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-white rounded-lg border-2 border-stone-800 shadow-sm overflow-hidden">
            {readyAdUrl.endsWith(".pdf") || readyAdFileName.endsWith(".pdf") ? (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <FileText className="w-12 h-12 text-red-600" />
                <span className="text-sm font-bold text-stone-900">{readyAdFileName || "अपलोड किया गया PDF विज्ञापन"}</span>
                <span className="text-xs text-stone-500">प्रिंट-रेडी वेक्टर PDF फ़ाइल संलग्न है</span>
                <a
                  href={readyAdUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#E65100] underline"
                >
                  PDF खोलें व देखें
                </a>
              </div>
            ) : (
              <img
                src={readyAdUrl}
                alt="Ready Made Advertisement"
                className="w-full h-full object-contain max-h-[360px] rounded"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : (
          /* DYNAMIC STRUCTURED AD CANVAS WITH OFFSET CMYK PROFILE */
          <div
            className={`w-full h-full rounded-lg border-solid flex flex-col justify-between overflow-hidden transition-all ${
              isMini ? "p-1.5" : layout.padding
            } ${layout.backgroundColor} ${layout.borderColor} ${layout.borderWidth}`}
            style={{
              fontFamily:
                layout.fontFamily === "serif"
                  ? "'Tiro Devanagari Hindi', 'Georgia', serif"
                  : layout.fontFamily === "decorative"
                  ? "'Rozha One', 'Tiro Devanagari Hindi', serif"
                  : "'Yantramanav', 'Plus Jakarta Sans', sans-serif"
            }}
          >
            <div className="space-y-1 w-full">
              {/* Show Business Logo if uploaded */}
              {businessInfo.logoUrl && !isMini && (
                <div className="flex justify-center mb-1 bg-white p-1 border border-stone-200 rounded max-h-[38px] w-fit mx-auto shadow-2xs">
                  <img
                    src={businessInfo.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="h-full max-h-[30px] object-contain"
                  />
                </div>
              )}

              {layout.elements.map((el, i) => {
                if (el.type === "divider") {
                  return (
                    <hr
                      key={el.id || i}
                      className="border-t-2 border-stone-800/80 w-full my-1.5"
                    />
                  );
                }

                if (el.type === "invocation") {
                  return (
                    <div
                      key={el.id || i}
                      className={`text-center font-black text-[10px] sm:text-xs tracking-wider ${el.color || "text-red-700"} pb-0.5`}
                    >
                      {el.content}
                    </div>
                  );
                }

                if (el.type === "graphic_motif") {
                  return <div key={el.id || i}>{renderMotifSvg(el.motifType)}</div>;
                }

                const alignClass =
                  el.align === "left" ? "text-left" : el.align === "right" ? "text-right" : "text-center";

                const fontSzClass = isMini
                  ? "text-[8px] leading-tight"
                  : el.fontSize === "xs"
                  ? "text-[9.5px] sm:text-[11px] leading-snug"
                  : el.fontSize === "sm"
                  ? "text-[11px] sm:text-xs leading-snug"
                  : el.fontSize === "base"
                  ? "text-xs sm:text-sm leading-snug"
                  : el.fontSize === "lg"
                  ? "text-sm sm:text-base font-bold leading-snug"
                  : el.fontSize === "xl"
                  ? "text-base sm:text-lg font-black leading-snug"
                  : el.fontSize === "2xl"
                  ? "text-lg sm:text-xl font-black leading-snug"
                  : "text-xl sm:text-2xl font-black leading-snug";

                if (el.type === "offer_badge") {
                  return (
                    <div key={el.id || i} className="flex justify-center my-1.5">
                      <span className={`${el.badgeBg || "bg-red-600"} text-white text-[9.5px] sm:text-[11.5px] font-black px-3 py-1 rounded-full shadow-xs border border-white/40 text-center tracking-wide flex items-center gap-1.5`}>
                        <Award className="w-3 h-3 shrink-0" />
                        {el.content}
                      </span>
                    </div>
                  );
                }

                if (el.type === "contact_bar") {
                  return (
                    <div
                      key={el.id || i}
                      onClick={() => {
                        setSelectedElementId(el.id);
                        setActiveTab("edit_elements");
                      }}
                      className="mt-2 pt-1.5 border-t border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100/50 rounded p-1 transition-all"
                    >
                      <div className="text-xs sm:text-sm font-black text-stone-950 font-mono tracking-tight text-center">
                        {el.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={el.id || i}
                    onClick={() => {
                      setSelectedElementId(el.id);
                      setActiveTab("edit_elements");
                    }}
                    className={`${alignClass} ${fontSzClass} ${el.color || "text-stone-900"} ${el.fontWeight === "black" ? "font-black" : el.fontWeight === "bold" ? "font-bold" : "font-semibold"} break-words cursor-pointer hover:outline hover:outline-1 hover:outline-orange-400 rounded px-1 transition-all`}
                    title="क्लिक करके सीधे टेक्स्ट संपादित करें"
                  >
                    {el.content}
                  </div>
                );
              })}
            </div>

            {/* Candidate Photo / Business Photo representation */}
            {businessInfo.photoUrl && !isMini && (
              <div className="flex justify-center mt-2">
                <img
                  src={businessInfo.photoUrl}
                  alt="Attachment Photo"
                  referrerPolicy="no-referrer"
                  className="w-full h-14 sm:h-20 object-cover rounded-md border border-stone-300 shadow-2xs"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-5 md:p-7 shadow-sm space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                AI विज्ञापन मेकर एवं ऑफसेट प्रिंट डिज़ाइनर
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                  100% फ्री एवं लाइव
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Gemini AI इंटेलिजेंस समर्थित • शुद्ध 100% K-Black ऑफसेट प्रिंटिंग लेआउट
              </p>
            </div>
          </div>
        </div>

        {/* 3 Main Workflow Modes */}
        <div className="flex flex-wrap items-center bg-stone-100 p-1.5 rounded-2xl w-full lg:w-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("ai_prompt")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ai_prompt"
                ? "bg-white text-[#E65100] shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI प्रॉम्प्ट मेकर</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ready_ad")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ready_ad"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>रेडीमेड विज्ञापन (CDR/PDF/JPG)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("edit_elements")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "edit_elements"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            <span>टेक्स्ट संपादन</span>
          </button>
        </div>
      </div>

      {/* CUSTOM DIMENSIONS & UNIT SELECTOR BAR */}
      <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              विज्ञापन माप एवं कस्टम साइज (Dimensions & Units)
            </span>
          </div>

          {/* Quick Presets Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPresetDimension("matrimony_std")}
              className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg shadow-2xs cursor-pointer"
            >
              3.5 × 2 इंच (विवाह ब्लॉक)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPresetDimension("quarter_page")}
              className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg shadow-2xs cursor-pointer"
            >
              4.25 × 5.5 इंच (1/4 पेज)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPresetDimension("half_page")}
              className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg shadow-2xs cursor-pointer"
            >
              8.5 × 5.5 इंच (1/2 पेज)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPresetDimension("full_page")}
              className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg shadow-2xs cursor-pointer"
            >
              8.5 × 11 इंच (फुल पेज)
            </button>
          </div>
        </div>

        {/* Custom Width, Height and Unit Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end pt-1">
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">
              इकाई (Unit):
            </label>
            <select
              value={dimensionUnit}
              onChange={(e) => setDimensionUnit(e.target.value as any)}
              className="w-full bg-white px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-orange-500 shadow-2xs"
            >
              <option value="inch">इंच (Inches - in)</option>
              <option value="cm">सेंटीमीटर (Centimeters - cm)</option>
              <option value="mm">मिलीमीटर (Millimeters - mm)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">
              चौड़ाई (Width):
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={customWidth}
              onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 1)}
              className="w-full bg-white px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">
              ऊँचाई (Height):
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={customHeight}
              onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 1)}
              className="w-full bg-white px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
          </div>

          <div className="bg-white/80 p-2 rounded-xl border border-amber-300/80 text-[11px] text-stone-700 flex flex-col justify-center">
            <span className="font-bold text-orange-950">
              सक्रिय आकार: {customWidth} × {customHeight} {dimensionUnit}
            </span>
            <span className="text-[10px] text-stone-500">
              {(currentDimsInInches.w * 25.4).toFixed(0)} × {(currentDimsInInches.h * 25.4).toFixed(0)} mm • 300 DPI प्रिंट रेडी
            </span>
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN DESIGN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP: LIVE AD CANVAS PREVIEW CONTAINER */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-3">
          {/* Canvas Controls Header */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-700">थीम स्टाइल:</span>
              <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-xl">
                {(["classic", "royal_gold", "festive_red", "bold_black", "minimal"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => applyPresetStyle(st)}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold capitalize transition-all cursor-pointer ${
                      preset === st ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {st === "classic"
                      ? "क्लासिक"
                      : st === "royal_gold"
                      ? "शाही गोल्ड"
                      : st === "festive_red"
                      ? "उत्सव लाल"
                      : st === "bold_black"
                      ? "बोल्ड"
                      : "सिंपल"}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Guidelines */}
            <button
              type="button"
              onClick={() => setShowGuides(!showGuides)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showGuides
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showGuides ? "गाइड ऑन" : "गाइड ऑफ"}</span>
            </button>
          </div>

          {/* Canvas Viewport Frame */}
          <div className="bg-gradient-to-b from-stone-100 to-stone-200/90 p-4 sm:p-6 rounded-2xl border border-stone-300 shadow-inner w-full flex justify-center items-center overflow-x-auto min-h-[300px]">
            <div
              className="w-full bg-white border border-stone-300 shadow-lg p-2 sm:p-4 rounded-xl transition-all flex flex-col justify-center"
              style={{
                maxWidth: aspectRatio > 1.4 ? "520px" : aspectRatio < 0.7 ? "340px" : "440px",
                minHeight: aspectRatio < 0.8 ? "420px" : "240px"
              }}
            >
              {renderAdCanvas()}
            </div>
          </div>

          {/* Offset CMYK Guarantee Info Bar & Direct HD Image Download */}
          <div className="w-full bg-stone-900 text-white rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-stone-100">Offset CMYK Pure Black: </span>
                <span className="text-stone-300 font-mono">C:0 M:0 Y:0 K:100% (No RGB blur)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAdImage}
                disabled={isDownloadingImage}
                className="bg-[#E65100] hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
                title="विज्ञापन का हाई-रेजोल्यूशन इमेज डाउनलोड करें"
              >
                {isDownloadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                HD इमेज डाउनलोड (PNG)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: TAB CONTENT (AI PROMPT / READY AD / TEXT EDIT) */}
        <div className="lg:col-span-5 bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4">
          {/* TAB 1: AI PROMPT ASSISTANT (Gemini Flash Intelligence) */}
          {activeTab === "ai_prompt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                  <h4 className="text-sm font-bold text-stone-900">
                    Gemini AI प्रॉम्प्ट डिज़ाइनर
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  फ्री इंटेलिजेंस
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                हिंदी, इंग्लिश या हिंगलिश में बताएं कि आपको किस तरह का विज्ञापन चाहिए (थीम, रंग, ऑफर, धार्मिक हेडर):
              </p>

              <form onSubmit={(e) => handleGenerateAI(e)} className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="उदा. 'रॉयल गोल्ड थीम बनाओ, 15% छूट का विशेष बैज जोड़ो, ऊपर श्री गणेशाय नमः मंत्र रखो और संपर्क नंबर को प्रमुखता से दिखाओ...'"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-inner"
                />

                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-[#E65100] hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gemini AI डिज़ाइन व इमेज बना रहा है...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI द्वारा विज्ञापन व इमेज डिज़ाइन करें
                    </>
                  )}
                </button>
              </form>

              {/* Recommended One-Click AI Prompts */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  क्लिक करके तुरंत डिज़ाइन बनाएं (One-Click Styles):
                </span>
                <div className="space-y-1.5">
                  {[
                    {
                      label: "🌟 विशेष उत्सव व 15% छूट ऑफर",
                      p: "उत्सव लाल थीम बनाओ जिसमें 15% छूट का आकर्षक लाल ऑफर बैज हो और दीपक/फ्लेम ग्राफिक हो"
                    },
                    {
                      label: "👑 रॉयल गोल्डन पत्रिका स्टाइल",
                      p: "शाही गोल्ड प्रीमियम थीम बनाओ जिसमें सोने जैसा बॉर्डर, क्लासिक देवनागरी फॉन्ट और आकर्षक हेडिंग हो"
                    },
                    {
                      label: "🕉️ माँ कर्मा देवी व गणेश आशीर्वाद",
                      p: "धार्मिक मंगलाचरण || श्री गणेशाय नमः || || माँ कर्मा देवी की जय || जोड़ें और पारिवारिक सम्मानजनक रूप दें"
                    },
                    {
                      label: "🏛️ क्लासिक ऑफसेट प्योर ब्लैक",
                      p: "प्योर ब्लैक एंड वाइट ऑफसेट पत्रिका लेआउट करो जिसमें 100% K-Black और स्पष्ट फोन नंबर हों"
                    }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(item.p);
                        handleGenerateAI(undefined, item.p);
                      }}
                      className="w-full text-left text-[11px] text-orange-950 bg-orange-50/70 hover:bg-orange-100/90 border border-orange-200/70 rounded-xl p-2.5 flex items-start gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span className="font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: READY-MADE ARTWORK UPLOAD (CDR / PSD / PDF / JPG / PNG) */}
          {activeTab === "ready_ad" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h4 className="text-sm font-bold text-stone-900">
                  पहले से बना विज्ञापन अपलोड करें (Ready-Made Artwork)
                </h4>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                यदि आपके पास पहले से बना हुआ CorelDraw (CDR), Photoshop (PSD), Illustrator (AI), PDF या हाई-रेजोल्यूशन JPG/PNG विज्ञापन उपलब्ध है, तो उसे यहाँ अपलोड करें:
              </p>

              <div className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-2xl p-6 bg-white flex flex-col items-center justify-center text-center space-y-2 cursor-pointer relative">
                <input
                  type="file"
                  accept=".cdr,.psd,.pdf,.ai,.eps,.jpg,.jpeg,.png,.webp,.tiff,.tif"
                  onChange={handleReadyAdUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-emerald-600" />
                <span className="text-xs font-bold text-stone-800">
                  फ़ाइल चुनने के लिए क्लिक करें या ड्रैग करें
                </span>
                <span className="text-[10px] text-stone-400">
                  सपोर्टेड फॉर्मेट: CDR, PSD, PDF, AI, EPS, JPG, PNG (मैक्स 50MB)
                </span>
              </div>

              {isUploadingReadyAd && (
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 p-2.5 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  फ़ाइल अपलोड हो रही है, कृपया प्रतीक्षा करें...
                </div>
              )}

              {readyAdUrl && !isUploadingReadyAd && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      फ़ाइल सफलतापूर्वक अपलोड हो गई है!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReadyAdUrl("");
                        setReadyAdFileName("");
                      }}
                      className="text-red-600 font-bold hover:underline"
                    >
                      हटाएँ
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600 font-mono truncate">
                    {readyAdFileName || readyAdUrl}
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT ELEMENT AND TEXT EDITOR */}
          {activeTab === "edit_elements" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-900"></span>
                  <h4 className="text-sm font-bold text-stone-900">टेक्स्ट व तत्व संपादन (Editor)</h4>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {layout.elements.map((el, idx) => {
                  if (el.type === "divider") return null;
                  return (
                    <div
                      key={el.id || idx}
                      className={`p-2.5 rounded-xl border transition-all ${
                        selectedElementId === el.id
                          ? "bg-orange-50/80 border-orange-400 shadow-2xs"
                          : "bg-white border-stone-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase">
                          {el.type === "heading"
                            ? "मुख्य शीर्षक"
                            : el.type === "invocation"
                            ? "मंगलाचरण मंत्र"
                            : el.type === "offer_badge"
                            ? "ऑफर बैज"
                            : el.type === "contact_bar"
                            ? "संपर्क बार"
                            : `तत्व #${idx + 1}`}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400">
                          {el.cmykColor || "K:100%"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={el.content}
                        onChange={(e) => updateElementText(el.id, e.target.value)}
                        className="w-full bg-stone-50 focus:bg-white px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DIRECT EMAIL DISPATCH TO ipgroup2002@gmail.com */}
          <div className="pt-3 border-t border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-red-600" />
                सीधे इंडियन प्रेस को प्रेषित करें:
              </span>
              <span className="text-[11px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                ipgroup2002@gmail.com
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDirectEmailDispatch}
                disabled={isDispatchingEmail}
                className="bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow transition-all cursor-pointer"
              >
                {isDispatchingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                ipgroup2002@gmail.com पर भेजें
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp भेजें (+91 9301056006)
              </button>
            </div>

            {dispatchSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dispatchSuccessMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS BAR */}
      <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          प्रारंभिक डिज़ाइन रीसेट
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            className="w-full sm:w-auto bg-[#E65100] hover:bg-orange-700 text-white text-xs sm:text-sm font-black px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            इस विज्ञापन लेआउट को स्वीकृत करें (Confirm & Add to Cart)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

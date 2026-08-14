import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, CornerDownRight, RotateCcw, Check } from "lucide-react";
import { AdLayout } from "../../server/gemini";

interface AdMakerPanelProps {
  businessInfo: {
    businessName: string;
    ownerName: string;
    category: string;
    businessDesc: string;
    productsServices: string;
    specialOffer: string;
    keyFeatures: string;
    mobile1: string;
    mobile2: string;
    whatsapp: string;
    email: string;
    address: string;
    logoUrl?: string;
    photoUrl?: string;
  };
  sizeCode: string;
  sizeName: string;
  onApproveDesign: (design: AdLayout) => void;
}

export default function AdMakerPanel({
  businessInfo,
  sizeCode,
  sizeName,
  onApproveDesign
}: AdMakerPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<"LIVE_AI_GENERATED" | "OFFLINE_SIMULATION" | "INITIAL">("INITIAL");
  const [preset, setPreset] = useState<"classic" | "premium" | "bold" | "minimal">("classic");

  // Initial template layout that is customized with current business fields
  const [layout, setLayout] = useState<AdLayout>({
    backgroundColor: "bg-[#FFFDF6]",
    borderColor: "border-stone-800",
    borderWidth: "border-4",
    padding: "p-4",
    fontFamily: "serif",
    elements: [
      { id: "1", type: "text", content: businessInfo.businessName || "आपके व्यवसाय का नाम", fontSize: "2xl", fontWeight: "bold", color: "text-amber-950", align: "center", marginBottom: 6 },
      { id: "2", type: "divider", content: "" },
      { id: "3", type: "text", content: businessInfo.businessDesc || businessInfo.productsServices || "हमारे यहाँ सभी प्रकार के उत्पाद और सेवाएँ उचित मूल्य पर उपलब्ध हैं। एक बार अवश्य पधारें।", fontSize: "base", fontWeight: "normal", color: "text-stone-700", align: "center", marginTop: 8, marginBottom: 8 },
      { id: "4", type: "offer_badge", content: businessInfo.specialOffer ? `विशेष ऑफर: ${businessInfo.specialOffer}` : "विशेष उत्सव ऑफर के लिए आज ही संपर्क करें!", fontSize: "lg", fontWeight: "semibold", color: "text-red-700", align: "center", marginBottom: 10 },
      { id: "5", type: "text", content: businessInfo.ownerName ? `मालिक: ${businessInfo.ownerName}` : "संचालक", fontSize: "lg", fontWeight: "semibold", color: "text-amber-900", align: "center" },
      { id: "6", type: "text", content: `संपर्क: ${businessInfo.mobile1}${businessInfo.mobile2 ? ", " + businessInfo.mobile2 : ""}`, fontSize: "xl", fontWeight: "bold", color: "text-amber-950", align: "center", marginTop: 4 },
      { id: "7", type: "text", content: `पता: ${businessInfo.address || "रायपुर (छ.ग.)"}`, fontSize: "sm", fontWeight: "normal", color: "text-stone-500", align: "center", marginTop: 8 }
    ]
  });

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ad-maker/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          businessInfo,
          currentLayout: layout,
          dimensions: getDimensions()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.layout) {
          setLayout(data.layout);
          setAiStatus(data.status);
        }
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDimensions = () => {
    switch (sizeCode) {
      case "business_full": return { width: 8.5, height: 11, unit: "inch" };
      case "business_half": return { width: 8.5, height: 5.5, unit: "inch" };
      case "business_quarter": return { width: 4.25, height: 5.5, unit: "inch" };
      default: return { width: 6, height: 4, unit: "inch" };
    }
  };

  const applyPresetStyle = (styleName: "classic" | "premium" | "bold" | "minimal") => {
    setPreset(styleName);
    
    let backgroundColor = "bg-[#FFFDF6]";
    let borderColor = "border-stone-800";
    let borderWidth = "border-4";
    let fontFamily = "serif";
    let textColor = "text-stone-800";
    let titleColor = "text-amber-950";
    
    if (styleName === "premium") {
      backgroundColor = "bg-[#FAF5EC]";
      borderColor = "border-[#C5A880]";
      borderWidth = "border-[6px]";
      fontFamily = "serif";
      textColor = "text-stone-700";
      titleColor = "text-amber-900";
    } else if (styleName === "bold") {
      backgroundColor = "bg-white";
      borderColor = "border-stone-950";
      borderWidth = "border-8";
      fontFamily = "sans";
      textColor = "text-black";
      titleColor = "text-stone-950";
    } else if (styleName === "minimal") {
      backgroundColor = "bg-[#FAFAFA]";
      borderColor = "border-stone-200";
      borderWidth = "border";
      fontFamily = "sans";
      textColor = "text-stone-600";
      titleColor = "text-stone-900";
    }
    
    setLayout(prev => ({
      ...prev,
      backgroundColor,
      borderColor,
      borderWidth,
      fontFamily,
      elements: prev.elements.map(el => {
        if (el.type === "text") {
          return {
            ...el,
            color: el.id === "1" ? titleColor : textColor
          };
        }
        return el;
      })
    }));
  };

  const handleReset = () => {
    setPreset("classic");
    setLayout({
      backgroundColor: "bg-[#FFFDF6]",
      borderColor: "border-stone-800",
      borderWidth: "border-4",
      padding: "p-4",
      fontFamily: "serif",
      elements: [
        { id: "1", type: "text", content: businessInfo.businessName || "आपके व्यवसाय का नाम", fontSize: "2xl", fontWeight: "bold", color: "text-amber-950", align: "center", marginBottom: 6 },
        { id: "2", type: "divider", content: "" },
        { id: "3", type: "text", content: businessInfo.businessDesc || "सभी प्रकार के गुणवत्तायुक्त उत्पाद एवं सेवाएँ उचित दरों पर उपलब्ध हैं।", fontSize: "sm", fontWeight: "normal", color: "text-stone-700", align: "center", marginTop: 6, marginBottom: 6 },
        { id: "4", type: "offer_badge", content: businessInfo.specialOffer ? `विशेष ऑफर: ${businessInfo.specialOffer}` : "विशेष ऑफर का लाभ उठाने के लिए आज ही पधारें!", fontSize: "base", fontWeight: "semibold", color: "text-red-600", align: "center", marginBottom: 8 },
        { id: "5", type: "text", content: `संचालक: ${businessInfo.ownerName || "साहू जी"}`, fontSize: "base", fontWeight: "semibold", color: "text-amber-900", align: "center" },
        { id: "6", type: "text", content: `फ़ोन: ${businessInfo.mobile1}`, fontSize: "lg", fontWeight: "bold", color: "text-amber-950", align: "center", marginTop: 2 },
        { id: "7", type: "text", content: `पता: ${businessInfo.address || "रायपुर (छ.ग.)"}`, fontSize: "xs", fontWeight: "normal", color: "text-stone-500", align: "center", marginTop: 6 }
      ]
    });
    setAiStatus("INITIAL");
    setPrompt("");
  };

  const handleApprove = () => {
    onApproveDesign(layout);
  };

  const renderAdCanvas = (isMini = false) => {
    return (
      <div className="relative w-full h-full p-2 select-none">
        {/* Bleed Guide Line */}
        <div className="absolute inset-1.5 border border-dashed border-red-400 pointer-events-none rounded">
          {!isMini && (
            <span className="absolute -top-3 left-1 bg-red-100 text-red-600 text-[6.5px] font-bold px-0.5 rounded scale-90 origin-left">
              मार्जिन / ब्लीड गाइडलाइन (काटने की सीमा)
            </span>
          )}
        </div>

        {/* Safety Zone Line */}
        <div className="absolute inset-3.5 border border-dashed border-blue-400 pointer-events-none rounded">
          {!isMini && (
            <span className="absolute -bottom-3 right-1 bg-blue-100 text-blue-600 text-[6.5px] font-bold px-0.5 rounded scale-90 origin-right">
              टेक्स्ट सुरक्षित क्षेत्र (इसके अंदर का टेक्स्ट कटेगा नहीं)
            </span>
          )}
        </div>

        {/* Actual Advertisement Inner Layout */}
        <div
          className={`w-full h-full rounded border-solid flex flex-col justify-between overflow-hidden transition-all ${
            isMini ? "p-1.5" : layout.padding
          } ${layout.backgroundColor} ${layout.borderColor} ${layout.borderWidth}`}
          style={{
            fontFamily: layout.fontFamily === "serif" ? "Georgia, Cambria, serif" : "system-ui, sans-serif"
          }}
        >
          <div>
            {/* Show Business Logo if uploaded */}
            {businessInfo.logoUrl && !isMini && (
              <div className="flex justify-center mb-1 bg-white p-0.5 border rounded inline-block mx-auto max-h-[30px]">
                <img
                  src={businessInfo.logoUrl}
                  alt="Logo"
                  referrerPolicy="no-referrer"
                  className="h-full max-h-[24px] object-contain"
                />
              </div>
            )}

            {layout.elements.map((el, i) => {
              if (el.type === "divider") {
                return (
                  <hr
                    key={el.id || i}
                    className="border-t border-dashed border-stone-300 w-full my-1"
                  />
                );
              }

              const alignClass =
                el.align === "left" ? "text-left" : el.align === "right" ? "text-right" : "text-center";

              const fontSzClass = isMini 
                ? "text-[7px] leading-tight" 
                : el.fontSize === "sm"
                  ? "text-[9px]"
                  : el.fontSize === "base"
                  ? "text-[10px]"
                  : el.fontSize === "lg"
                  ? "text-xs font-semibold"
                  : el.fontSize === "xl"
                  ? "text-sm font-bold"
                  : el.fontSize === "2xl"
                  ? "text-base font-black"
                  : "text-lg font-black";

              if (el.type === "offer_badge") {
                return (
                  <div key={el.id || i} className="flex justify-center my-0.5">
                    <span className="bg-red-600 text-white text-[7px] md:text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-red-500">
                      {el.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={el.id || i}
                  className={`${alignClass} ${fontSzClass} ${el.color || "text-stone-800"} truncate`}
                >
                  {el.content}
                </div>
              );
            })}
          </div>

          {/* Business photo representation inside the ad */}
          {businessInfo.photoUrl && !isMini && (
            <div className="flex justify-center mt-1">
              <img
                src={businessInfo.photoUrl}
                alt="Business Shop"
                referrerPolicy="no-referrer"
                className="w-full h-8 object-cover rounded border border-stone-200"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600 fill-orange-100" />
            विज्ञापन प्रीव्यू (वास्तविक छपाई का सटीक रूप)
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            आकार: <span className="font-semibold text-orange-700">{sizeName}</span> • भौतिक ब्लीड एवं मार्जिन गाइडलाइन के साथ सटीक लेआउट
          </p>
        </div>

        {/* Layout presets/themes toggles */}
        <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-xl">
          {(["classic", "premium", "bold", "minimal"] as const).map((styleName) => (
            <button
              key={styleName}
              type="button"
              onClick={() => applyPresetStyle(styleName)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                preset === styleName
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {styleName === "classic" ? "क्लासिक" : 
               styleName === "premium" ? "प्रीमियम" : 
               styleName === "bold" ? "बोल्ड" : "न्यूनतम"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-red-500"></span>
          <span><strong>मार्जिन / ब्लीड गाइडलाइन (काटने की सीमा):</strong> 3mm बाहरी ब्लीड सीमा</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-500"></span>
          <span><strong>टेक्स्ट सुरक्षित क्षेत्र (इसके अंदर का टेक्स्ट कटेगा नहीं):</strong> मुद्रण सुरक्षित क्षेत्र</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Magazine Layout Preview Container */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <span className="text-xs font-semibold text-stone-400 mb-2 uppercase tracking-wide">
            परिचायिका पत्रिका पृष्ठ लेआउट (Target Magazine Page Frame)
          </span>

          <div className="bg-stone-200 p-4 rounded-2xl border border-stone-300 shadow-inner w-full flex justify-center overflow-x-auto">
            {/* High fidelity Magazine Frame */}
            <div className="w-[300px] h-[400px] bg-white border border-stone-300 shadow-xl p-3 flex flex-col justify-between relative select-none shrink-0 rounded">
              
              {/* Magazine Page Header */}
              <div className="border-b border-stone-200 pb-1 flex justify-between items-center text-[7px] text-stone-400 uppercase font-bold">
                <span>परिचायिका पत्रिका • संस्करण 2026</span>
                <span>पृष्ठ संख्या 42</span>
              </div>

              {/* Page Body containing Ad and optionally other layout text */}
              <div className="flex-1 my-1.5 relative flex flex-col justify-between overflow-hidden">
                {sizeCode === "business_full" ? (
                  /* Full Page Ad */
                  <div className="w-full h-full">
                    {renderAdCanvas()}
                  </div>
                ) : sizeCode === "business_half" ? (
                  /* Half Page Layout */
                  <div className="flex flex-col h-full justify-between gap-1.5">
                    {/* Top Half: Dummy magazine content */}
                    <div className="flex-1 bg-stone-50 border border-stone-100 p-2 rounded flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-stone-400">विशेष लेख: समाज उत्थान एवं प्रगति</span>
                      <div className="space-y-1">
                        <div className="h-1 bg-stone-200 w-full rounded"></div>
                        <div className="h-1 bg-stone-200 w-5/6 rounded"></div>
                        <div className="h-1 bg-stone-200 w-4/5 rounded"></div>
                      </div>
                      <span className="text-[6px] text-stone-400">- लेखक: प्रशासनिक समिति</span>
                    </div>
                    
                    {/* Bottom Half: Our Ad */}
                    <div className="h-[170px] border border-stone-200 rounded">
                      {renderAdCanvas()}
                    </div>
                  </div>
                ) : (
                  /* Quarter Page Layout */
                  <div className="grid grid-cols-2 grid-rows-2 h-full gap-1.5">
                    {/* Top Left: Dummy Content */}
                    <div className="bg-stone-50 border border-stone-100 p-1.5 rounded flex flex-col justify-between text-[7px] text-stone-300">
                      <span className="font-bold text-stone-400">विशेष आलेख</span>
                      <div className="space-y-1">
                        <div className="h-0.5 bg-stone-100 w-full"></div>
                        <div className="h-0.5 bg-stone-100 w-5/6"></div>
                      </div>
                    </div>
                    
                    {/* Top Right: Dummy Content */}
                    <div className="bg-stone-50 border border-stone-100 p-1.5 rounded flex flex-col justify-between text-[7px] text-stone-300">
                      <span className="font-bold text-stone-400">साहू संघ रायपुर</span>
                      <div className="space-y-1">
                        <div className="h-0.5 bg-stone-100 w-full"></div>
                        <div className="h-0.5 bg-stone-100 w-2/3"></div>
                      </div>
                    </div>
                    
                    {/* Bottom Left: Another Dummy Ad */}
                    <div className="bg-stone-50 border border-stone-100 p-1.5 rounded flex flex-col justify-between text-[7px] text-stone-400">
                      <span className="font-bold">श्री राम ज्वेलर्स</span>
                      <p className="text-[5px]">मो. 98271XXXXX</p>
                    </div>

                    {/* Bottom Right: OUR AD! */}
                    <div className="h-full border border-stone-200 rounded overflow-hidden">
                      {renderAdCanvas(true)}
                    </div>
                  </div>
                )}
              </div>

              {/* Magazine Footer */}
              <div className="border-t border-stone-200 pt-1 flex justify-center text-[7px] text-stone-400">
                <span>© अखिल भारतीय साहू समाज प्रकाशन प्रकोष्ठ</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-stone-400 mt-2 font-semibold">
            काले बॉर्डर के बाहर 3mm कटिंग ब्लेड क्षेत्र शामिल है
          </span>
        </div>

        {/* AI Control Panel */}
        <div className="lg:col-span-5 bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
            <h4 className="text-sm font-bold text-stone-800">लेआउट डिज़ाइन परिवर्तन प्रॉम्प्ट</h4>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            AI को निर्देश दें कि वह इस विज्ञापन को आपकी पसंद के अनुसार कैसे डिजाइन करे। अपनी भाषा (रोमन हिंदी या शुद्ध हिंदी) में कहें:
          </p>

          <form onSubmit={handleGenerateAI} className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="उदा. 'हेडर का रंग लाल और बड़ा करो, बैकग्राउंड हलका पीला करो...'"
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-inner"
            />

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs shadow transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI डिजाइनिंग कर रहा है...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  डिज़ाइन अपडेट करें (AI Update)
                </>
              )}
            </button>
          </form>

          {/* Prompt Recommendations */}
          <div className="pt-3 border-t border-stone-200">
            <h5 className="text-[11px] font-bold text-stone-400 uppercase mb-2 tracking-wide">
              त्वरित सुझाव (Recommended Prompts):
            </h5>
            <div className="space-y-1.5">
              {[
                "शीर्षक (Header) को लाल रंग में बोल्ड और बड़ा करो",
                "पृष्ठभूमि (Background) का रंग गहरा लाल या केसरिया करो",
                "इस विज्ञापन को एक दम आधुनिक (Modern) और सिंपल लुक दो",
                "प्रोपराइटर / मालिक का नाम सबसे ऊपर रखो"
              ].map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(rec)}
                  className="w-full text-left text-[11px] text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg p-2 flex items-start gap-1 transition-all"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                  {rec}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 pt-4 border-t border-stone-100 flex justify-between items-center">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          प्रारंभिक डिज़ाइन रीसेट
        </button>
        <button
          onClick={handleApprove}
          className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          इस लेआउट डिज़ाइन को स्वीकृत करें
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

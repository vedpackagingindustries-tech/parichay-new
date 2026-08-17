import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined in environment. Running with Intelligent Built-in Prompt Parser.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface AdElement {
  id: string;
  type: "heading" | "subheading" | "invocation" | "text" | "bullet_point" | "offer_badge" | "graphic_motif" | "divider" | "contact_bar" | "photo" | "logo";
  content: string;
  subContent?: string;
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
  color?: string; // Tailwind class or Hex
  cmykColor?: string; // e.g. "C:0 M:0 Y:0 K:100" for offset black
  align?: "left" | "center" | "right";
  marginTop?: number; // In px
  marginBottom?: number; // In px
  borderStyle?: string;
  badgeBg?: string;
  motifType?: "ganesh" | "karma_mata" | "swastik" | "kalash" | "diya" | "ribbon_badge" | "star_award" | "floral_corner" | "none";
}

export interface AdLayout {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string; // Tailwind border-2, border-4 etc
  padding: string; // Tailwind padding
  elements: AdElement[];
  fontFamily: "serif" | "sans" | "decorative";
  cmykProfile?: {
    blackType: "100_K_PURE" | "RICH_BLACK";
    bleedMm: number;
    safetyMarginMm: number;
  };
}

export const DEFAULT_LAYOUT: AdLayout = {
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
      content: "कृपा किराना एवं जनरल स्टोर",
      fontSize: "2xl",
      fontWeight: "black",
      color: "text-stone-950",
      cmykColor: "C:0 M:0 Y:0 K:100",
      align: "center",
      marginBottom: 4
    },
    { id: "2", type: "divider", content: "" },
    {
      id: "3",
      type: "text",
      content: "शुद्धता एवं विश्वास का 25 वर्षों का अनुभव • सभी प्रकार के किराना, ताजे मसाले व पूजन सामग्री थोक एवं चिल्हर भाव में उपलब्ध।",
      fontSize: "sm",
      fontWeight: "normal",
      color: "text-stone-800",
      cmykColor: "C:0 M:0 Y:0 K:90",
      align: "center",
      marginTop: 2,
      marginBottom: 4
    },
    {
      id: "4",
      type: "offer_badge",
      content: "विशेष उत्सव ऑफर: ₹1000 से अधिक की खरीदी पर 5% की सीधी छूट!",
      fontSize: "sm",
      fontWeight: "bold",
      color: "text-white",
      badgeBg: "bg-red-600",
      cmykColor: "C:0 M:95 Y:85 K:0",
      align: "center",
      marginBottom: 6
    },
    {
      id: "5",
      type: "text",
      content: "संचालक: श्री राम साहू (प्रदेश उपाध्यक्ष - साहू समाज)",
      fontSize: "base",
      fontWeight: "bold",
      color: "text-stone-950",
      cmykColor: "C:0 M:0 Y:0 K:100",
      align: "center",
      marginTop: 2
    },
    {
      id: "6",
      type: "contact_bar",
      content: "मो.: 9301056006, 9300717080 | WhatsApp: 9301056006",
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
      content: "पता: मुख्य मार्ग, पहाड़ी चौक, गुढ़ियारी, रायपुर (छ.ग.)",
      fontSize: "xs",
      fontWeight: "semibold",
      color: "text-stone-700",
      cmykColor: "C:0 M:0 Y:0 K:80",
      align: "center",
      marginTop: 4
    }
  ]
};

/**
 * Intelligent prompt-based layout synthesizer for offline & fallback modes
 */
function synthesizeSmartLayout(
  prompt: string,
  businessInfo: any,
  currentLayout?: AdLayout
): AdLayout {
  const p = (prompt || "").toLowerCase();

  // Determine theme colors based on prompt keywords
  let backgroundColor = "bg-[#FFFDF6]";
  let borderColor = "border-stone-900";
  let borderWidth = "border-4";
  let fontFamily: "serif" | "sans" | "decorative" = "serif";
  let headingColor = "text-stone-950";
  let badgeBg = "bg-red-600";
  let motifType: AdElement["motifType"] = "none";

  if (p.includes("gold") || p.includes("गोल्ड") || p.includes("शाही") || p.includes("royal") || p.includes("पीला")) {
    backgroundColor = "bg-[#FAF5EC]";
    borderColor = "border-[#C5A880]";
    borderWidth = "border-4";
    fontFamily = "serif";
    headingColor = "text-amber-950";
    badgeBg = "bg-amber-700";
  } else if (p.includes("red") || p.includes("लाल") || p.includes("उत्सव") || p.includes("festive") || p.includes("धार्मिक") || p.includes("पूजा")) {
    backgroundColor = "bg-[#FFF5F5]";
    borderColor = "border-red-700";
    borderWidth = "border-4";
    fontFamily = "decorative";
    headingColor = "text-red-900";
    badgeBg = "bg-red-600";
    motifType = "kalash";
  } else if (p.includes("green") || p.includes("हरा") || p.includes("नेचुरल") || p.includes("आयुर्वेद") || p.includes("emerald")) {
    backgroundColor = "bg-[#F0FDF4]";
    borderColor = "border-emerald-800";
    borderWidth = "border-4";
    fontFamily = "sans";
    headingColor = "text-emerald-950";
    badgeBg = "bg-emerald-700";
  } else if (p.includes("black") || p.includes("काला") || p.includes("बोल्ड") || p.includes("offset") || p.includes("प्रिंट")) {
    backgroundColor = "bg-white";
    borderColor = "border-stone-950";
    borderWidth = "border-4";
    fontFamily = "sans";
    headingColor = "text-black";
    badgeBg = "bg-stone-900";
  } else if (p.includes("सादा") || p.includes("minimal") || p.includes("सिंपल")) {
    backgroundColor = "bg-[#FAFAFA]";
    borderColor = "border-stone-400";
    borderWidth = "border-2";
    fontFamily = "sans";
    headingColor = "text-stone-900";
    badgeBg = "bg-stone-800";
  }

  // Motifs based on prompt
  if (p.includes("गणेश") || p.includes("ganesh")) motifType = "ganesh";
  else if (p.includes("कर्मा") || p.includes("karma")) motifType = "karma_mata";
  else if (p.includes("स्वास्तिक") || p.includes("swastik")) motifType = "swastik";
  else if (p.includes("दीपक") || p.includes("दिया") || p.includes("diya")) motifType = "diya";
  else if (p.includes("रिबन") || p.includes("ऑफर") || p.includes("डिस्काउंट") || p.includes("ribbon")) motifType = "ribbon_badge";

  const bName = businessInfo.businessName || businessInfo.name || "विज्ञापन शीर्षक";
  const bOwner = businessInfo.ownerName || businessInfo.father_name || "";
  const bCategory = businessInfo.category || businessInfo.occupation || "";
  const bDesc = businessInfo.description || businessInfo.productsServices || businessInfo.education || "हमारे यहाँ सभी प्रकार के कार्य व सेवाएँ उच्च गुणवत्ता एवं उचित दरों पर उपलब्ध हैं।";
  
  // Custom offer derived from prompt or info
  let bOffer = businessInfo.specialOffer || "";
  if (!bOffer && (p.includes("ऑफर") || p.includes("छूट") || p.includes("discount") || p.includes("%"))) {
    const match = prompt.match(/\d+%/);
    bOffer = match ? `विशेष उत्सव ऑफर: ${match[0]} की भारी छूट!` : "विशेष सीमित समय ऑफर: सर्वोत्तम गुणवत्ता व विशेष छूट उपलब्ध!";
  }

  const bMobile = businessInfo.mobile1 || "9301056006";
  const bMobile2 = businessInfo.mobile2 ? `, ${businessInfo.mobile2}` : "";
  const bWhatsapp = businessInfo.whatsapp || businessInfo.mobile1 || "9301056006";
  const bAddress = businessInfo.address || businessInfo.currentAddress || "रायपुर (छ.ग.)";

  // Build structured elements
  const elements: AdElement[] = [];

  // 1. Invocation Header
  let invocationText = "॥ श्री गणेशाय नमः ॥";
  if (p.includes("कर्मा") || p.includes("साहू")) {
    invocationText = "॥ श्री गणेशाय नमः ॥  ॥ माँ कर्मा देवी की जय ॥";
  } else if (p.includes("शिव") || p.includes("महादेव")) {
    invocationText = "॥ ॐ नमः शिवाय ॥";
  } else if (p.includes("जोहार")) {
    invocationText = "॥ जय जोहार ॥  ॥ जय छत्तीसगढ़ ॥";
  }

  elements.push({
    id: "inv-1",
    type: "invocation",
    content: invocationText,
    fontSize: "xs",
    fontWeight: "bold",
    color: headingColor.includes("red") ? "text-red-700" : headingColor.includes("amber") ? "text-amber-800" : "text-stone-700",
    cmykColor: "C:0 M:90 Y:90 K:10",
    align: "center",
    marginBottom: 2
  });

  // 2. Main Heading
  elements.push({
    id: "1",
    type: "heading",
    content: bName,
    fontSize: "2xl",
    fontWeight: "black",
    color: headingColor,
    cmykColor: "C:0 M:0 Y:0 K:100",
    align: "center",
    marginBottom: 3
  });

  // 3. Subtitle / Category
  if (bCategory) {
    elements.push({
      id: "sub-1",
      type: "subheading",
      content: `[ ${bCategory} ]`,
      fontSize: "sm",
      fontWeight: "bold",
      color: "text-stone-700",
      cmykColor: "C:0 M:0 Y:0 K:90",
      align: "center",
      marginBottom: 3
    });
  }

  // 4. Divider
  elements.push({ id: "2", type: "divider", content: "" });

  // 5. Description / Features
  elements.push({
    id: "3",
    type: "text",
    content: bDesc,
    fontSize: "sm",
    fontWeight: "normal",
    color: "text-stone-800",
    cmykColor: "C:0 M:0 Y:0 K:90",
    align: "center",
    marginTop: 2,
    marginBottom: 4
  });

  // 6. Offer Badge if any
  if (bOffer) {
    elements.push({
      id: "4",
      type: "offer_badge",
      content: bOffer,
      fontSize: "sm",
      fontWeight: "bold",
      color: "text-white",
      badgeBg: badgeBg,
      cmykColor: "C:0 M:95 Y:85 K:0",
      align: "center",
      marginBottom: 6,
      motifType: motifType !== "none" ? motifType : "ribbon_badge"
    });
  }

  // 7. Proprietor / Contact Person
  if (bOwner) {
    elements.push({
      id: "5",
      type: "text",
      content: `संचालक/संपर्क: ${bOwner}`,
      fontSize: "base",
      fontWeight: "bold",
      color: "text-stone-950",
      cmykColor: "C:0 M:0 Y:0 K:100",
      align: "center",
      marginTop: 2
    });
  }

  // 8. Contact Bar with Pure K-Black
  elements.push({
    id: "6",
    type: "contact_bar",
    content: `मो.: ${bMobile}${bMobile2} | WhatsApp: ${bWhatsapp}`,
    fontSize: "base",
    fontWeight: "black",
    color: "text-stone-950",
    cmykColor: "C:0 M:0 Y:0 K:100",
    align: "center",
    marginTop: 4
  });

  // 9. Address Footer
  elements.push({
    id: "7",
    type: "text",
    content: `पता: ${bAddress}`,
    fontSize: "xs",
    fontWeight: "semibold",
    color: "text-stone-700",
    cmykColor: "C:0 M:0 Y:0 K:80",
    align: "center",
    marginTop: 4
  });

  return {
    backgroundColor,
    borderColor,
    borderWidth,
    padding: "p-4",
    fontFamily,
    cmykProfile: {
      blackType: "100_K_PURE",
      bleedMm: 3,
      safetyMarginMm: 4
    },
    elements
  };
}

export async function generateAdLayout(
  prompt: string,
  businessInfo: {
    businessName?: string;
    ownerName?: string;
    category?: string;
    description?: string;
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
    [key: string]: any;
  },
  currentLayout?: AdLayout,
  dimensions?: { width: number; height: number; unit: string }
): Promise<{ layout: AdLayout; status: "LIVE_AI_GENERATED" | "OFFLINE_SIMULATION" }> {
  const client = getAiClient();

  if (!client) {
    const layout = synthesizeSmartLayout(prompt, businessInfo, currentLayout);
    return { layout, status: "OFFLINE_SIMULATION" };
  }

  const systemInstruction = `
    You are an elite, award-winning Graphic and Publication Designer with deep specialization in Indian Offset Magazine and Souvenir Ads ("परिचायिका" Sahu Samaj annual directory and business publications).
    Your goal is to parse natural language instructions (in Hindi, English, or Hinglish) and generate a stunning, mathematically balanced, print-ready advertisement layout JSON.

    Offset CMYK Rules to strictly follow:
    1. Pure Black Rule for typography: Body text and critical phone numbers MUST use Offset Pure Black (K:100%, C:0 M:0 Y:0). Never output washed-out RGB grays for small body copy.
    2. Backgrounds & Accents: Utilize rich publication color harmonies (Royal Gold 'bg-[#FAF5EC]', Festive Crimson 'bg-[#FFF5F5]', Imperial Saffron 'bg-amber-50', Warm Ivory 'bg-[#FFFDF6]', Deep Emerald 'bg-[#F0FDF4]', Pure White 'bg-white').
    3. Typography & Hierarchy: Clear visual structure:
       - Invocation Header at top (e.g. || श्री गणेशाय नमः ||, || ॐ श्री कर्मा देव्यै नमः ||, || जय जोहार ||)
       - Top / Eye-catching Main Heading (Business Name or Candidate Title in bold Hindi text)
       - Subtitle / Category
       - Key Offer / Highlighting Badge (with badgeBg like bg-red-600, bg-amber-700, bg-emerald-700)
       - Graphic Motifs (motifType: ganesh, karma_mata, swastik, kalash, diya, ribbon_badge, star_award, floral_corner, none)
       - Descriptive Bullet points or Services
       - Prominent Operator / Owner Name
       - High-visibility Contact Footer (Phone numbers & WhatsApp)
       - Clear Postal Address & Landmarks
    4. Language: Natural, polished, culturally respectful Hindi with English numerals for phone numbers and dates.

    Output format MUST be a strict single JSON object following this schema:
    {
      "backgroundColor": "bg-[#FFFDF6] | bg-[#FAF5EC] | bg-[#FFF5F5] | bg-[#F0FDF4] | bg-white | bg-stone-50",
      "borderColor": "border-stone-900 | border-red-700 | border-amber-600 | border-emerald-800",
      "borderWidth": "border-2 | border-4 | border-8",
      "padding": "p-3 | p-4 | p-6",
      "fontFamily": "serif" | "sans" | "decorative",
      "cmykProfile": {
        "blackType": "100_K_PURE",
        "bleedMm": 3,
        "safetyMarginMm": 4
      },
      "elements": [
        {
          "id": "unique-id",
          "type": "heading" | "subheading" | "invocation" | "text" | "bullet_point" | "offer_badge" | "graphic_motif" | "divider" | "contact_bar",
          "content": "Hindi text content (numbers in 0-9)",
          "fontSize": "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
          "fontWeight": "normal" | "medium" | "semibold" | "bold" | "black",
          "color": "Tailwind text color class",
          "cmykColor": "e.g. C:0 M:0 Y:0 K:100",
          "align": "left" | "center" | "right",
          "marginTop": 0,
          "marginBottom": 4,
          "badgeBg": "bg-red-600 (optional for offer_badge)",
          "motifType": "ganesh | karma_mata | swastik | kalash | diya | ribbon_badge | star_award | floral_corner | none"
        }
      ]
    }
  `;

  const inputPrompt = `
    User Prompt/Design Request: ${prompt}
    Target Size Dimensions: ${dimensions?.width || 8.5} x ${dimensions?.height || 11} ${dimensions?.unit || "inch"}
    
    Provided Customer & Business/Candidate details:
    - Business / Candidate Name: ${businessInfo.businessName || businessInfo.name || "N/A"}
    - Owner / Guardian Name: ${businessInfo.ownerName || businessInfo.father_name || "N/A"}
    - Category / Profile: ${businessInfo.category || businessInfo.occupation || "N/A"}
    - Description / Services: ${businessInfo.description || businessInfo.productsServices || businessInfo.education || "N/A"}
    - Special Offer / Highlights: ${businessInfo.specialOffer || "N/A"}
    - Key Features: ${businessInfo.keyFeatures || "N/A"}
    - Mobile 1: ${businessInfo.mobile1 || "9301056006"}
    - Mobile 2: ${businessInfo.mobile2 || ""}
    - Whatsapp: ${businessInfo.whatsapp || businessInfo.mobile1 || "9301056006"}
    - Address: ${businessInfo.address || businessInfo.currentAddress || "रायपुर (छ.ग.)"}

    Create an exceptionally clean, well-aligned, high-contrast Hindi advertisement JSON. Output ONLY valid JSON.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: inputPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text;
    if (rawText) {
      // Clean potential markdown blocks
      const cleanJson = rawText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
        return { layout: parsed as AdLayout, status: "LIVE_AI_GENERATED" };
      }
    }
  } catch (error) {
    console.error("Gemini Flash API call failed, using intelligent synthesis:", error);
    // Fallback attempt with gemini-2.5-flash
    try {
      const retryResponse = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: inputPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
      const retryRaw = retryResponse.text;
      if (retryRaw) {
        const cleanJson = retryRaw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && Array.isArray(parsed.elements)) {
          return { layout: parsed as AdLayout, status: "LIVE_AI_GENERATED" };
        }
      }
    } catch (retryError) {
      console.error("Gemini 2.5 retry failed:", retryError);
    }
  }

  // Intelligent fallback synthesizing layout directly from prompt
  const fallbackLayout = synthesizeSmartLayout(prompt, businessInfo, currentLayout);
  return { layout: fallbackLayout, status: "OFFLINE_SIMULATION" };
}

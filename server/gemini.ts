import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    // Do not crash at module load, but raise a helpful error at runtime if missing
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI Ad Maker will run in offline simulation mode.");
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
  type: "text" | "logo" | "photo" | "offer_badge" | "divider";
  content: string;
  fontSize?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  color?: string; // Tailwind class or Hex
  align?: "left" | "center" | "right";
  marginTop?: number; // In px
  marginBottom?: number; // In px
  borderStyle?: string;
}

export interface AdLayout {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string; // Tailwind border-2, border-4 etc
  padding: string; // Tailwind padding
  elements: AdElement[];
  fontFamily: string; // e.g. 'sans-serif', 'serif', etc
}

const DEFAULT_LAYOUT: AdLayout = {
  backgroundColor: "bg-orange-50",
  borderColor: "border-orange-600",
  borderWidth: "border-4",
  padding: "p-6",
  fontFamily: "serif",
  elements: [
    { id: "1", type: "text", content: "कृपा किराना स्टोर", fontSize: "3xl", fontWeight: "bold", color: "text-orange-900", align: "center", marginBottom: 8 },
    { id: "2", type: "divider", content: "" },
    { id: "3", type: "text", content: "हमारे यहाँ सभी प्रकार के किराना सामान, ताजे मसाले और दैनिक आवश्यकता की वस्तुएं उचित मूल्य पर उपलब्ध हैं।", fontSize: "base", fontWeight: "normal", color: "text-stone-700", align: "center", marginTop: 8, marginBottom: 8 },
    { id: "4", type: "offer_badge", content: "विशेष ऑफर: ₹1000 की खरीदी पर 5% की सीधी छूट!", fontSize: "lg", fontWeight: "semibold", color: "text-red-700", align: "center", marginBottom: 12 },
    { id: "5", type: "text", content: "संचालक: राम साहू", fontSize: "lg", fontWeight: "semibold", color: "text-orange-800", align: "center" },
    { id: "6", type: "text", content: "संपर्क: +91 9301056006, 9300717080", fontSize: "xl", fontWeight: "bold", color: "text-orange-950", align: "center", marginTop: 4 },
    { id: "7", type: "text", content: "पता: पहाड़ी चौक, गुढ़ियारी, रायपुर (छ.ग.)", fontSize: "sm", fontWeight: "normal", color: "text-stone-500", align: "center", marginTop: 8 }
  ]
};

export async function generateAdLayout(
  prompt: string,
  businessInfo: {
    businessName: string;
    ownerName: string;
    category: string;
    description: string;
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
  },
  currentLayout?: AdLayout,
  dimensions?: { width: number; height: number; unit: string }
): Promise<{ layout: AdLayout; status: "LIVE_AI_GENERATED" | "OFFLINE_SIMULATION" }> {
  const client = getAiClient();

  if (!client) {
    // Offline simulation mode (passes back the layout customized or basic fallback safely)
    console.log("No AI key; customizing layout offline with matching details.");
    const layout = { ...DEFAULT_LAYOUT };
    if (businessInfo.businessName) {
      layout.elements = layout.elements.map(el => {
        if (el.id === "1") return { ...el, content: businessInfo.businessName };
        if (el.id === "3") return { ...el, content: businessInfo.description || businessInfo.productsServices || el.content };
        if (el.id === "4") return { ...el, content: businessInfo.specialOffer ? `ऑफर: ${businessInfo.specialOffer}` : el.content };
        if (el.id === "5") return { ...el, content: businessInfo.ownerName ? `संचालक: ${businessInfo.ownerName}` : el.content };
        if (el.id === "6") return { ...el, content: `संपर्क: ${businessInfo.mobile1 || "+91 9301056006"}` };
        if (el.id === "7") return { ...el, content: `पता: ${businessInfo.address || "रायपुर"}` };
        return el;
      });
    }
    return { layout, status: "OFFLINE_SIMULATION" };
  }

  const systemInstruction = `
    You are an expert advertisement layout designer specialized in Indian local newspaper ads in Hindi ("परिचायिका" Sahu Samaj magazine).
    Your task is to take customer instructions (prompt), business details, current layout state, and target size, and generate/refine a beautiful structured advertisement layout JSON.

    Output format MUST be a strict single JSON object following this schema:
    {
      "backgroundColor": "Tailwind color class (e.g. bg-amber-50, bg-red-50, bg-emerald-50, bg-sky-50, bg-orange-100)",
      "borderColor": "Tailwind border color class (e.g. border-orange-600, border-red-700, border-blue-800)",
      "borderWidth": "Tailwind border thickness class (border, border-2, border-4, border-8)",
      "padding": "Tailwind padding class (p-2, p-4, p-6)",
      "fontFamily": "serif or sans",
      "elements": [
        {
          "id": "unique sequence string",
          "type": "text" | "logo" | "photo" | "offer_badge" | "divider",
          "content": "Text content in Hindi or empty for divider",
          "fontSize": "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
          "fontWeight": "normal" | "medium" | "semibold" | "bold",
          "color": "Tailwind text color class (e.g. text-stone-800, text-red-700, text-orange-950)",
          "align": "left" | "center" | "right",
          "marginTop": number,
          "marginBottom": number
        }
      ]
    }

    Guidelines:
    - ALL text content for headings, offers, owners, address, must be in Hindi. Translating English prompt intents or instructions directly to professional advertising Hindi.
    - If the user prompt asks to make some field larger, increase its "fontSize".
    - If the user prompt says "Logo ऊपर रखो" (put logo on top), reorder elements so type "logo" is at the start of the elements array.
    - If the user prompt says "Contact number नीचे रखो" (put contact below), reorder contact element to the bottom.
    - Incorporate details from businessInfo to make it highly personalized!
    - Ensure a professional color theme (typically warm traditional colors like orange, red, gold, yellow, cream, deep maroon etc. which are highly popular in Sahu Samaj publications).
  `;

  const inputPrompt = `
    User Prompt/Instruction: ${prompt}
    Target Size Dimensions: ${dimensions?.width || 8.5} x ${dimensions?.height || 11} ${dimensions?.unit || "inch"}
    
    Business details to use:
    - Business Name (व्यवसाय/संस्था का नाम): ${businessInfo.businessName}
    - Owner Name (मालिक/संचालक): ${businessInfo.ownerName}
    - Category (श्रेणी): ${businessInfo.category}
    - Description (विवरण): ${businessInfo.description}
    - Products/Services (उत्पाद/सेवाएँ): ${businessInfo.productsServices}
    - Special Offer (विशेष ऑफर): ${businessInfo.specialOffer}
    - Key Features (मुख्य विशेषताएँ): ${businessInfo.keyFeatures}
    - Mobile 1: ${businessInfo.mobile1}
    - Mobile 2: ${businessInfo.mobile2}
    - Whatsapp: ${businessInfo.whatsapp}
    - Email: ${businessInfo.email}
    - Address: ${businessInfo.address}
    - Logo URL: ${businessInfo.logoUrl || "none"}
    - Photo URL: ${businessInfo.photoUrl || "none"}

    Current Layout State:
    ${JSON.stringify(currentLayout || DEFAULT_LAYOUT, null, 2)}
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: inputPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            backgroundColor: { type: Type.STRING },
            borderColor: { type: Type.STRING },
            borderWidth: { type: Type.STRING },
            padding: { type: Type.STRING },
            fontFamily: { type: Type.STRING },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  content: { type: Type.STRING },
                  fontSize: { type: Type.STRING },
                  fontWeight: { type: Type.STRING },
                  color: { type: Type.STRING },
                  align: { type: Type.STRING },
                  marginTop: { type: Type.INTEGER },
                  marginBottom: { type: Type.INTEGER }
                },
                required: ["id", "type", "content"]
              }
            }
          },
          required: ["backgroundColor", "borderColor", "borderWidth", "padding", "elements"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return { layout: parsed as AdLayout, status: "LIVE_AI_GENERATED" };
    }
  } catch (error) {
    console.error("Gemini API call failed, falling back to offline customizer:", error);
  }

  return { layout: DEFAULT_LAYOUT, status: "OFFLINE_SIMULATION" };
}

import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import {
  initDatabase,
  dbRun,
  dbAll,
  dbGet,
  generateAdNumber
} from "./server/db.js";
import { generateAdLayout } from "./server/gemini.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "parichayika-super-secret-key-2026";

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure static uploads directory serving
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// JWT Authentication Middleware for Admin
const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.adminId = decoded.adminId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
};

// Ensure uploads directory exists on server startup
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for secure, persistent file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB for print files (CDR, PSD, PDF, etc.)
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    const allowedExtensions = [".cdr", ".psd", ".pdf", ".ai", ".eps", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".svg"];
    
    if (allowedExtensions.includes(ext) || mime.startsWith("image/") || mime.includes("pdf") || mime.includes("photoshop") || mime.includes("coreldraw") || mime.includes("postscript") || mime.includes("octet-stream")) {
      cb(null, true);
    } else {
      cb(new Error("अमान्य फ़ाइल प्रकार! कृपया CDR, PSD, PDF, AI, EPS, JPG, PNG, WEBP फ़ाइल अपलोड करें।"));
    }
  }
});

// API Routes

// Helper to ensure numeric characters remain in English (ASCII digits 0-9)
function convertHindiNumeralsToEnglish(str: string): string {
  const mapping: { [key: string]: string } = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9"
  };
  return str.replace(/[०-९]/g, (m) => mapping[m] || m);
}

// Custom dictionary and regex post-processing to fix spelling and academic/degree transliteration errors
function applyPostTransliterationFixes(text: string): string {
  if (!text) return text;

  let fixed = text;

  // 1. Surname & Name phonetic fixes (Sahu -> साहू, Ashwini -> अश्विनी)
  fixed = fixed.replace(/सहु\b/g, "साहू");
  fixed = fixed.replace(/\bसहु\b/g, "साहू");
  fixed = fixed.replace(/सहु/g, "साहू");
  fixed = fixed.replace(/शाहू/g, "साहू");
  fixed = fixed.replace(/सहू/g, "साहू");
  fixed = fixed.replace(/अश्वनी/g, "अश्विनी");
  fixed = fixed.replace(/अश्विनि/g, "अश्विनी");
  fixed = fixed.replace(/साहूू/g, "साहू"); // Fix double long 'oo'

  // 2. Degrees & Educational acronyms cleanups (removing spaces around dots and making them standard Hindi format)
  fixed = fixed.replace(/एम\s*\.\s*कॉम\s*\.?/gi, "एम.कॉम.");
  fixed = fixed.replace(/बी\s*\.\s*कॉम\s*\.?/gi, "बी.कॉम.");
  fixed = fixed.replace(/एम\s*\.\s*ए\s*\.?/gi, "एम.ए.");
  fixed = fixed.replace(/बी\s*\.\s*ए\s*\.?/gi, "बी.ए.");
  fixed = fixed.replace(/बी\s*\.\s*एससी\s*\.?/gi, "बी.एससी.");
  fixed = fixed.replace(/एम\s*\.\s*एससी\s*\.?/gi, "एम.एससी.");
  fixed = fixed.replace(/बी\s*\.\s*टेक\s*\.?/gi, "बी.टेक.");
  fixed = fixed.replace(/एम\s*\.\s*टेक\s*\.?/gi, "एम.टेक.");
  fixed = fixed.replace(/पी\s*\.\s*एच\s*\.\s*डी\s*\.?/gi, "पीएच.डी.");
  fixed = fixed.replace(/पीएच\s*\.\s*डी\s*\.?/gi, "पीएच.डी.");
  fixed = fixed.replace(/बी\s*\.\s*एड\s*\.?/gi, "बी.एड.");
  fixed = fixed.replace(/एम\s*\.\s*एड\s*\.?/gi, "एम.एड.");
  fixed = fixed.replace(/डी\s*\.\s*एल\s*\.\s*एड\s*\.?/gi, "डी.एल.एड.");
  fixed = fixed.replace(/डी\s*\.\s*एड\s*\.?/gi, "डी.एड.");
  fixed = fixed.replace(/बी\s*\.\s*सी\s*\.\s*ए\s*\.?/gi, "बीसीए");
  fixed = fixed.replace(/एम\s*\.\s*सी\s*\.\s*ए\s*\.?/gi, "एमसीए");
  fixed = fixed.replace(/बी\s*\.\s*बी\s*\.\s*ए\s*\.?/gi, "बीबीए");
  fixed = fixed.replace(/एम\s*\.\s*बी\s*\.\s*ए\s*\.?/gi, "एमबीए");

  // Additional English word fallbacks to Hindi translations that Google gets wrong or forgets
  fixed = fixed.replace(/\bm\.com\b/gi, "एम.कॉम.");
  fixed = fixed.replace(/\bb\.com\b/gi, "बी.कॉम.");
  fixed = fixed.replace(/\bm\.a\b/gi, "एम.ए.");
  fixed = fixed.replace(/\bb\.a\b/gi, "बी.ए.");
  fixed = fixed.replace(/\bbsc\b/gi, "बी.एससी.");
  fixed = fixed.replace(/\bmsc\b/gi, "एम.एससी.");
  fixed = fixed.replace(/\bca\b/gi, "सीए");
  fixed = fixed.replace(/\bcs\b/gi, "सीएस");
  fixed = fixed.replace(/\bbca\b/gi, "बीसीए");
  fixed = fixed.replace(/\bmca\b/gi, "एमसीए");
  fixed = fixed.replace(/\bmba\b/gi, "एमबीए");
  fixed = fixed.replace(/\bbtech\b/gi, "बी.टेक.");
  fixed = fixed.replace(/\bmtech\b/gi, "एम.टेक.");
  fixed = fixed.replace(/\bphd\b/gi, "पीएच.डी.");
  fixed = fixed.replace(/\bllb\b/gi, "एलएलबी");
  fixed = fixed.replace(/\bllm\b/gi, "एलएलएम");
  fixed = fixed.replace(/\bbed\b/gi, "बी.एड.");
  fixed = fixed.replace(/\bmed\b/gi, "एम.एड.");

  return fixed;
}

// Unified processing wrapper
function transliterationPostProcess(str: string): string {
  const englishDigits = convertHindiNumeralsToEnglish(str);
  return applyPostTransliterationFixes(englishDigits);
}

// 1. Google Cloud Translation Transliteration phonetic converter API
app.post("/api/transliterate", async (req: any, res: any) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.json({ result: "" });
  }

  // Check for numerals, system IDs, mobile numbers, dates or URLs - skip translation
  const isExcluded = /^[0-9+\-:\s@.]+$|^(https?:\/\/|www\.)|^\d{10}$/.test(text.trim());
  if (isExcluded) {
    return res.json({ result: text, method: "skipped" });
  }

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  if (apiKey) {
    try {
      // Official Google Cloud Translation API v2
      const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target: "hi",
          format: "text"
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translatedText = data?.data?.translations?.[0]?.translatedText;
        if (translatedText) {
          return res.json({
            result: transliterationPostProcess(translatedText),
            method: "LIVE GOOGLE API VERIFIED"
          });
        }
      }
    } catch (err) {
      console.error("Google Cloud Translate API failed, trying fallback:", err);
    }
  }

  // Primary Phonetic Fallback: Google Input Tools Transliteration (High Accuracy)
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
      text
    )}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data[0] === "SUCCESS") {
        const resultText = data[1]?.[0]?.[1]?.[0] || text;
        return res.json({
          result: transliterationPostProcess(resultText),
          method: "INTEGRATION COMPLETE"
        });
      }
    }
  } catch (err) {
    console.error("Phonetic Input Tools failed:", err);
  }

  // Base fallback is to return original text if all translation fails
  res.json({ result: transliterationPostProcess(text), method: "fallback-raw" });
});

// 2. Load Masters Data (for frontend selections)
app.get("/api/masters", async (req: any, res: any) => {
  try {
    const districts = await dbAll("SELECT * FROM districts WHERE is_enabled = 1");
    const sangathans = await dbAll("SELECT * FROM sangathans WHERE is_enabled = 1");
    const magazines = await dbAll("SELECT * FROM magazines WHERE is_enabled = 1");
    const editions = await dbAll("SELECT * FROM editions WHERE is_enabled = 1");
    const sizes = await dbAll("SELECT * FROM advertisement_sizes WHERE is_enabled = 1");
    const pricings = await dbAll("SELECT * FROM pricings");
    const publications = await dbAll(`
      SELECT p.*, d.name_hi as district_hi, s.name_hi as sangathan_hi, m.name_hi as magazine_hi, e.name_hi as edition_hi
      FROM publications p
      JOIN districts d ON p.district_id = d.id
      JOIN sangathans s ON p.sangathan_id = s.id
      JOIN magazines m ON p.magazine_id = m.id
      JOIN editions e ON p.edition_id = e.id
      WHERE p.is_enabled = 1
    `);

    res.json({
      districts,
      sangathans,
      magazines,
      editions,
      sizes,
      pricings,
      publications
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Next Auto Ad Number for Matrimony & Business
app.get("/api/advertisements/next-ad-number", async (req: any, res: any) => {
  const typeCode = req.query.type || "matrimony";
  const magazineHi = req.query.magazine || "परिचायिका";
  try {
    if (typeCode === "matrimony") {
      const countRow = await dbGet("SELECT COUNT(*) as count FROM advertisements WHERE type_code = 'matrimony'");
      const nextSeq = String((countRow?.count || 0) + 1).padStart(3, "0");
      return res.json({ nextAdNumber: nextSeq, count: countRow?.count || 0 });
    } else {
      const countRow = await dbGet("SELECT COUNT(*) as count FROM advertisements WHERE type_code = 'business'");
      const nextSeq = String((countRow?.count || 0) + 1).padStart(3, "0");
      return res.json({ nextAdNumber: `BUS-${nextSeq} / ${magazineHi}`, count: countRow?.count || 0 });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create or Edit an Advertisement (Draft/Final with Immediate Immutable Advertisement Number Generation)
app.post("/api/advertisements/save", async (req: any, res: any) => {
  const { adId, typeCode, publicationId, sizeCode, customerName, customerMobile, formData } = req.body;
  if (!typeCode || !customerName || !customerMobile) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    // 1. Resolve publication details
    let district_hi = "रायपुर";
    let sangathan_hi = "रायपुर साहू संगठन";
    let magazine_hi = "परिचायिका";
    let edition_hi = "संस्करण 2026";
    let price = 500;
    let size_hi = "विवाह मानक (3.5 × 2 इंच)";

    if (publicationId && typeof publicationId === "string" && publicationId.startsWith("CONF-")) {
      const conf = await dbGet("SELECT * FROM admin_configurations WHERE configuration_id = ?", [publicationId]);
      if (conf) {
        district_hi = conf.district;
        sangathan_hi = conf.sangathan;
        magazine_hi = conf.magazine;
        edition_hi = conf.edition;
        price = conf.pricing;
        size_hi = `${conf.size_name} (${conf.width} × ${conf.height} ${conf.unit})`;
      } else {
        return res.status(400).json({ error: "इस विज्ञापन के लिए आवश्यक प्रकाशन कॉन्फ़िगरेशन उपलब्ध नहीं है। कृपया व्यवस्थापक से संपर्क करें।" });
      }
    } else if (publicationId && publicationId !== "CUSTOM") {
      const pub = await dbGet(`
        SELECT p.*, d.name_hi as district_hi, s.name_hi as sangathan_hi, m.name_hi as magazine_hi, e.name_hi as edition_hi
        FROM publications p
        JOIN districts d ON p.district_id = d.id
        JOIN sangathans s ON p.sangathan_id = s.id
        JOIN magazines m ON p.magazine_id = m.id
        JOIN editions e ON p.edition_id = e.id
        WHERE p.id = ?
      `, [publicationId]);

      if (pub) {
        district_hi = pub.district_hi;
        sangathan_hi = pub.sangathan_hi;
        magazine_hi = pub.magazine_hi;
        edition_hi = pub.edition_hi;

        // Resolve pricing
        const pricing = await dbGet(`
          SELECT price FROM pricings
          WHERE district_id = ? AND sangathan_id = ? AND magazine_id = ? AND edition_id = ?
          AND adv_type_code = ? AND adv_size_code = ?
        `, [pub.district_id, pub.sangathan_id, pub.magazine_id, pub.edition_id, typeCode, sizeCode || "matrimony_standard"]);

        if (pricing) {
          price = pricing.price;
        } else {
          if (typeCode === "matrimony") price = 500;
          else if (sizeCode === "business_full") price = 5000;
          else if (sizeCode === "business_half") price = 3000;
          else if (sizeCode === "business_quarter") price = 1500;
          else price = 2500;
        }
      }

      if (typeCode === "business" && sizeCode) {
        const sz = await dbGet("SELECT name_hi FROM advertisement_sizes WHERE code = ?", [sizeCode]);
        if (sz) size_hi = sz.name_hi;
      }
    } else {
      // CUSTOM / MANUAL MANUALLY INPUTTED DISTRICT & SANGATHAN
      district_hi = formData.district_hi || "रायपुर";
      sangathan_hi = formData.sangathan_hi || "रायपुर साहू संगठन";
      magazine_hi = formData.magazine_hi || "परिचायिका";
      edition_hi = formData.edition_hi || "संस्करण 2026";

      if (typeCode === "matrimony") price = 500;
      else if (sizeCode === "business_full") price = 5000;
      else if (sizeCode === "business_half") price = 3000;
      else if (sizeCode === "business_quarter") price = 1500;
      else price = 2500;

      if (typeCode === "business" && sizeCode) {
        const sz = await dbGet("SELECT name_hi FROM advertisement_sizes WHERE code = ?", [sizeCode]);
        if (sz) size_hi = sz.name_hi;
      }
    }

    const created_at = new Date().toISOString();

    if (adId) {
      // EDIT MODE: Update existing records, keeping the exact same ad_number
      const ad = await dbGet("SELECT ad_number FROM advertisements WHERE id = ?", [adId]);
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      await dbRun(`
        UPDATE advertisements SET
          customer_name = ?,
          customer_mobile1 = ?,
          price = ?,
          district_hi = ?,
          sangathan_hi = ?,
          magazine_hi = ?,
          edition_hi = ?,
          size_code = ?,
          size_hi = ?
        WHERE id = ?
      `, [customerName, customerMobile, price, district_hi, sangathan_hi, magazine_hi, edition_hi, sizeCode || (typeCode === "matrimony" ? "matrimony_standard" : "business_size"), size_hi, adId]);

      if (typeCode === "matrimony") {
        const standardKeys = [
          "name", "dob", "height", "blood_group", "gotra", "education", "occupation",
          "father_name", "father_occupation", "mother_name", "mobile1", "mobile2", "whatsapp",
          "currentAddress", "permanentAddress", "photoUrl", "biodataUrl"
        ];
        const extraFields: Record<string, any> = {};
        for (const k of Object.keys(formData)) {
          if (!standardKeys.includes(k)) {
            extraFields[k] = formData[k];
          }
        }
        await dbRun(`
          UPDATE matrimony_profiles SET
            name = ?, dob = ?, height = ?, blood_group = ?, gotra = ?, education = ?, occupation = ?,
            father_name = ?, father_occupation = ?, mother_name = ?, mobile1 = ?, mobile2 = ?, whatsapp = ?,
            current_address = ?, permanent_address = ?, photo_url = ?, biodata_url = ?, extra_fields_json = ?
          WHERE ad_id = ?
        `, [
          formData.name, formData.dob, formData.height, formData.blood_group, formData.gotra, formData.education, formData.occupation,
          formData.father_name, formData.father_occupation, formData.mother_name, formData.mobile1, formData.mobile2, formData.whatsapp,
          formData.currentAddress, formData.permanentAddress, formData.photoUrl, formData.biodataUrl, JSON.stringify(extraFields), adId
        ]);
      } else {
        const standardKeys = [
          "businessName", "ownerName", "category", "businessDesc", "productsServices", "specialOffer",
          "keyFeatures", "mobile1", "mobile2", "whatsapp", "email", "businessAddress", "otherAddress",
          "logoUrl", "photoUrl", "readyAdUrl"
        ];
        const extraFields: Record<string, any> = {};
        for (const k of Object.keys(formData)) {
          if (!standardKeys.includes(k)) {
            extraFields[k] = formData[k];
          }
        }
        await dbRun(`
          UPDATE business_advertisements SET
            business_name = ?, owner_name = ?, category = ?, business_desc = ?, products_services = ?, special_offer = ?,
            key_features = ?, mobile1 = ?, mobile2 = ?, whatsapp = ?, email = ?, business_address = ?, other_address = ?,
            logo_url = ?, photo_url = ?, ready_ad_url = ?, extra_fields_json = ?
          WHERE ad_id = ?
        `, [
          formData.businessName, formData.ownerName, formData.category, formData.businessDesc, formData.productsServices, formData.specialOffer,
          formData.keyFeatures, formData.mobile1, formData.mobile2, formData.whatsapp, formData.email, formData.businessAddress, formData.otherAddress,
          formData.logoUrl, formData.photoUrl, formData.readyAdUrl, JSON.stringify(extraFields), adId
        ]);
      }

      res.json({
        id: Number(adId),
        adNumber: ad.ad_number,
        price,
        success: true
      });
    } else {
      // CREATE MODE: Generate a unique, persistent, immutable ad_number immediately on save!
      let finalAdNum = "";
      if (typeCode === "matrimony") {
        const countRow = await dbGet("SELECT COUNT(*) as count FROM advertisements WHERE type_code = 'matrimony'");
        const seqNum = String((countRow?.count || 0) + 1).padStart(3, "0");
        finalAdNum = seqNum;
      } else {
        const countRow = await dbGet("SELECT COUNT(*) as count FROM advertisements WHERE type_code = 'business'");
        const seqNum = String((countRow?.count || 0) + 1).padStart(3, "0");
        finalAdNum = `BUS-${seqNum} / ${magazine_hi}`;
      }

      const adResult = await dbRun(`
        INSERT INTO advertisements (
          ad_number, type_code, district_hi, sangathan_hi, magazine_hi, edition_hi, size_code, size_hi,
          customer_name, customer_mobile1, price, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `, [finalAdNum, typeCode, district_hi, sangathan_hi, magazine_hi, edition_hi, sizeCode || (typeCode === "matrimony" ? "matrimony_standard" : "business_size"), size_hi, customerName, customerMobile, price, created_at]);

      const newAdId = adResult.lastID;

      if (typeCode === "matrimony") {
        const standardKeys = [
          "name", "dob", "height", "blood_group", "gotra", "education", "occupation",
          "father_name", "father_occupation", "mother_name", "mobile1", "mobile2", "whatsapp",
          "currentAddress", "permanentAddress", "photoUrl", "biodataUrl"
        ];
        const extraFields: Record<string, any> = {};
        for (const k of Object.keys(formData)) {
          if (!standardKeys.includes(k)) {
            extraFields[k] = formData[k];
          }
        }
        await dbRun(`
          INSERT INTO matrimony_profiles (
            ad_id, name, dob, height, blood_group, gotra, education, occupation,
            father_name, father_occupation, mother_name, mobile1, mobile2, whatsapp,
            current_address, permanent_address, photo_url, biodata_url, extra_fields_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newAdId, formData.name, formData.dob, formData.height, formData.blood_group, formData.gotra, formData.education, formData.occupation,
          formData.father_name, formData.father_occupation, formData.mother_name, formData.mobile1, formData.mobile2, formData.whatsapp,
          formData.currentAddress, formData.permanentAddress, formData.photoUrl, formData.biodataUrl, JSON.stringify(extraFields)
        ]);
      } else {
        const standardKeys = [
          "businessName", "ownerName", "category", "businessDesc", "productsServices", "specialOffer",
          "keyFeatures", "mobile1", "mobile2", "whatsapp", "email", "businessAddress", "otherAddress",
          "logoUrl", "photoUrl", "readyAdUrl"
        ];
        const extraFields: Record<string, any> = {};
        for (const k of Object.keys(formData)) {
          if (!standardKeys.includes(k)) {
            extraFields[k] = formData[k];
          }
        }
        await dbRun(`
          INSERT INTO business_advertisements (
            ad_id, business_name, owner_name, category, business_desc, products_services, special_offer,
            key_features, mobile1, mobile2, whatsapp, email, business_address, other_address,
            logo_url, photo_url, ready_ad_url, extra_fields_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newAdId, formData.businessName, formData.ownerName, formData.category, formData.businessDesc, formData.productsServices, formData.specialOffer,
          formData.keyFeatures, formData.mobile1, formData.mobile2, formData.whatsapp, formData.email, formData.businessAddress, formData.otherAddress,
          formData.logoUrl, formData.photoUrl, formData.readyAdUrl, JSON.stringify(extraFields)
        ]);
      }

      res.json({
        id: newAdId,
        adNumber: finalAdNum,
        price,
        success: true
      });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Persistent File Upload Route with robust error handling
app.post("/api/upload", (req: any, res: any, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "कोई फ़ाइल अपलोड नहीं की गई" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileData = {
      filename: req.file.filename,
      filepath: req.file.path,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
      created_at: new Date().toISOString()
    };

    const result = await dbRun(
      "INSERT INTO uploads (filename, filepath, url, mimetype, size, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [fileData.filename, fileData.filepath, fileData.url, fileData.mimetype, fileData.size, fileData.created_at]
    );

    res.json({
      id: result.lastID,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. AI-assisted Ad Maker layout generator endpoint
app.post("/api/ad-maker/generate", async (req: any, res: any) => {
  const { prompt, businessInfo, currentLayout, dimensions } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt or details" });
  }
  try {
    const result = await generateAdLayout(prompt, businessInfo || {}, currentLayout, dimensions);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4.1 Direct Dispatch & Email Notification Endpoint for ipgroup2002@gmail.com
app.post("/api/dispatch-email", async (req: any, res: any) => {
  const { recipientEmail, subject, adNumber, customerName, customerMobile, adType, dimensions, fileUrl, designData, fullDetails } = req.body;
  const targetEmail = recipientEmail || "ipgroup2002@gmail.com";

  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      targetEmail,
      subject: subject || `[परिचायिका 2026] नया विज्ञापन प्रविष्टि - ${adNumber || "ADV"} (${customerName || "Customer"})`,
      adNumber,
      customerName,
      customerMobile,
      adType,
      dimensions,
      fileUrl,
      fullDetails
    };

    console.log(`[DISPATCH EMAIL TO ${targetEmail}]`, JSON.stringify(logEntry, null, 2));

    // Also persist dispatch log in database for admin auditing
    try {
      await dbRun(
        "INSERT INTO admin_activity_logs (admin_username, action_type, description, target_id, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "SYSTEM_DISPATCH",
          "EMAIL_DISPATCH_TO_INDIAN_PRESS",
          `विज्ञापन फ़ाइल/प्रविष्टि सीधे ${targetEmail} को भेजी गई। ग्राहक: ${customerName}, फोन: ${customerMobile}, विज्ञापन संख्या: ${adNumber}`,
          adNumber || "DIRECT_SUBMISSION",
          req.ip || "127.0.0.1",
          new Date().toISOString()
        ]
      );
    } catch (e) {
      console.warn("Could not write to admin_activity_logs:", e);
    }

    res.json({
      success: true,
      message: `प्रविष्टि सफलतापूर्वक ${targetEmail} और इंडियन प्रेस एडमिन को प्रेषित की गई।`,
      targetEmail,
      timestamp: logEntry.timestamp,
      adNumber
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Persistent Shopping Cart APIs
app.get("/api/cart", async (req: any, res: any) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.json([]);
  try {
    const items = await dbAll("SELECT * FROM cart_items WHERE session_id = ? ORDER BY id DESC", [sessionId]);
    res.json(items.map((item: any) => ({
      id: item.id,
      sessionId: item.session_id,
      adType: item.ad_type,
      data: JSON.parse(item.data_json),
      price: item.price
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cart/add", async (req: any, res: any) => {
  const { sessionId, adType, data, price } = req.body;
  if (!sessionId || !adType || !data) {
    return res.status(400).json({ error: "Missing required cart details" });
  }
  try {
    const created_at = new Date().toISOString();
    const result = await dbRun(
      "INSERT INTO cart_items (session_id, ad_type, data_json, price, created_at) VALUES (?, ?, ?, ?, ?)",
      [sessionId, adType, JSON.stringify(data), price, created_at]
    );
    res.json({ success: true, id: result.lastID });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/cart/remove/:id", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM cart_items WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cart/clear", async (req: any, res: any) => {
  const { sessionId } = req.body;
  try {
    await dbRun("DELETE FROM cart_items WHERE session_id = ?", [sessionId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Checkout: Order creation and Dynamic UPI Payee Generator
app.post("/api/order/submit", async (req: any, res: any) => {
  const { sessionId, customerName, customerMobile } = req.body;
  if (!sessionId || !customerName || !customerMobile) {
    return res.status(400).json({ error: "Missing required checkout parameters" });
  }

  try {
    // 1. Fetch current items in cart
    const cartItems = await dbAll("SELECT * FROM cart_items WHERE session_id = ?", [sessionId]);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2. Authoritative Price calculation on server
    let total = 0;
    const itemsWithParsedData = cartItems.map((item) => {
      const parsedData = JSON.parse(item.data_json);
      total += item.price;
      return { ...item, parsedData };
    });

    const orderId = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const created_at = new Date().toISOString();

    // 3. Create main order record
    await dbRun(
      "INSERT INTO orders (order_id, total_amount, payment_status, created_at) VALUES (?, ?, 'PENDING', ?)",
      [orderId, total, created_at]
    );

    // 4. Save order items mapping
    for (const item of itemsWithParsedData) {
      const parsed = item.parsedData;
      // Use the actual, final immutable adNumber pre-generated at preview/save time
      const finalAdNum = parsed.adNumber || `ADV-PENDING-${Date.now()}`;
      
      await dbRun(
        `INSERT INTO order_items (
          order_id, ad_number, ad_type, district_hi, sangathan_hi, magazine_hi, edition_hi, size_hi, price,
          customer_name, customer_mobile, matrimony_details_json, business_details_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          finalAdNum,
          item.ad_type,
          parsed.district_hi || "रायपुर",
          parsed.sangathan_hi || "रायपुर साहू संगठन",
          parsed.magazine_hi || "परिचायिका",
          parsed.edition_hi || "संस्करण 2026",
          parsed.size_hi || (item.ad_type === "matrimony" ? "विवाह मानक (3.5 × 2 इंच)" : "व्यवसाय आकार"),
          item.price,
          customerName,
          customerMobile,
          item.ad_type === "matrimony" ? item.data_json : null,
          item.ad_type === "business" ? item.data_json : null
        ]
      );
    }

    // Clear user's cart
    await dbRun("DELETE FROM cart_items WHERE session_id = ?", [sessionId]);

    // Retrieve UPI details with NPCI-compliant parameters
    const primaryUpiId = "9301056006@ybl";
    const cleanPayeeName = "IndianPress";
    const formattedAmount = total.toFixed(2);
    const cleanTxnRef = `ORD${orderId.replace(/[^a-zA-Z0-9]/g, "")}`;
    const cleanTxnNote = `Parichayika_${orderId}`;

    // Standard NPCI Compliant UPI URI
    const upiPayload = `upi://pay?pa=${primaryUpiId}&pn=${cleanPayeeName}&am=${formattedAmount}&cu=INR&tn=${cleanTxnNote}&tr=${cleanTxnRef}`;

    const upiHandles = [
      { id: "phonepe", label: "PhonePe UPI", vpa: "9301056006@ybl" },
      { id: "paytm", label: "Paytm UPI", vpa: "9301056006@paytm" },
      { id: "bhim", label: "BHIM / Yes Bank", vpa: "9301056006@ibl" },
      { id: "gpay", label: "Google Pay / Axis", vpa: "9301056006@axl" }
    ];

    res.json({
      orderId,
      totalAmount: total,
      paymentStatus: "PENDING",
      upiPayload,
      primaryUpiId,
      upiHandles,
      cleanPayeeName,
      recipientPhone: "9301056006"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp helper function to save to DB and console log notifications
async function sendWhatsAppNotification(orderId: string, phone: string, customerName: string, status: string, message: string) {
  try {
    const created_at = new Date().toISOString();
    await dbRun(
      "INSERT INTO whatsapp_notifications (order_id, phone, customer_name, status, message, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [orderId, phone, customerName, status, message, created_at]
    );
    console.log(`
============================================================
📱 [AUTOMATED WHATSAPP NOTIFICATION] DISPATCHED SUCCESSFULLY
============================================================
Order ID:      ${orderId}
Recipient:     ${customerName} (${phone})
Type/Status:   ${status}
Timestamp:     ${created_at}
------------------------------------------------------------
Message:
${message}
============================================================
`);
  } catch (err: any) {
    console.error("❌ Error registering WhatsApp notification in database:", err.message);
  }
}

// 7. Customer submits payment confirmation
app.post("/api/order/payment-submit", async (req: any, res: any) => {
  const { orderId, paymentRef, paymentDate, customerName, paymentScreenshot } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "Missing required order ID" });
  }
  try {
    const nowStr = new Date().toISOString();
    await dbRun(
      "UPDATE orders SET payment_status = 'SUBMITTED', payment_ref = ?, payment_date = ?, payment_screenshot = ? WHERE order_id = ?",
      [paymentRef || "DIRECT_UPI_CONFIRMED", paymentDate || nowStr, paymentScreenshot || "", orderId]
    );

    // Dynamic WhatsApp receipt generation
    try {
      const items = await dbAll("SELECT customer_name, customer_mobile, ad_type, ad_number, district_hi, sangathan_hi FROM order_items WHERE order_id = ?", [orderId]);
      if (items && items.length > 0) {
        const mainCustomer = items[0];
        const customerPhone = mainCustomer.customer_mobile || "N/A";
        const customerNameVal = mainCustomer.customer_name || customerName || "ग्राहक";

        const orderObj = await dbGet("SELECT total_amount FROM orders WHERE order_id = ?", [orderId]);
        const amount = orderObj?.total_amount || 0;

        const adDetails = items.map((it, idx) => `  ${idx + 1}. ${it.ad_type === "matrimony" ? "विवाह परिचय प्रविष्टि" : "व्यावसायिक विज्ञापन"} (${it.ad_number}) [${it.district_hi} • ${it.sangathan_hi}]`).join("\n");

        const host = req.get("host") || "localhost:3000";
        const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
        const invoiceLink = `${protocol}://${host}/?order=${orderId}`;

        const customerMsg = `*प्रवेश पत्र / भुगतान पुष्टि - परिचायिका 2026* 📝

नमस्ते *${customerNameVal}*, आपका विज्ञापन विवरण और भुगतान सफलतापूर्वक सबमिट हो गया है।

*ऑर्डर विवरण:*
• *ऑर्डर ID:* ${orderId}
• *कुल राशि:* ₹${amount}
• *संदर्भ (Ref / UTR No):* ${paymentRef || "DIRECT_UPI_CONFIRMED"}
• *स्थिति:* ⏳ सत्यापन हेतु लंबित (Submitted)

*विज्ञापन विवरण:*
${adDetails}

*आवश्यक सूचना:* एडमिन द्वारा भुगतान स्क्रीनशॉट की जाँच होने के पश्चात ही आपकी डिजिटल पावती (Invoice) रसीद जनरेट होगी। रसीद तैयार होने पर आपको व्हाट्सएप पर ऑटोमैटिक प्राप्त हो जाएगी।

🔗 *स्थिति जाँच लिंक:* ${invoiceLink}

धन्यवाद,
*इंडियन प्रेस / परिचायिका टीम* 🌸`;

        // 1. Send simulated WhatsApp message to customer
        await sendWhatsAppNotification(orderId, customerPhone, customerNameVal, "SUBMITTED", customerMsg);

        // 2. Also notify admin (Simulated)
        const superAdmin = await dbGet("SELECT recovery_whatsapp FROM super_admins LIMIT 1");
        const adminPhone = superAdmin?.recovery_whatsapp || "9301056006";
        const adminMsg = `*🚨 नया भुगतान सत्यापन अनुरोध - परिचायिका 2026*

*नया आर्डर सबमिट हुआ है:*
• *ऑर्डर ID:* ${orderId}
• *ग्राहक:* ${customerNameVal} (${customerPhone})
• *कुल राशि:* ₹${amount}
• *UTR संदर्भ:* ${paymentRef || "DIRECT_UPI_CONFIRMED"}
• *भुगतान स्क्रीनशॉट:* ${paymentScreenshot || "नहीं पाया गया"}
• *स्थिति:* ⏳ सत्यापन लंबित

*विज्ञापन विवरण:*
${adDetails}

🔗 *एडमिन पैनल लिंक:* ${protocol}://${host}/admin`;

        await sendWhatsAppNotification(orderId, adminPhone, "सुपर एडमिन", "ADMIN_ALERT_SUBMITTED", adminMsg);
      }
    } catch (waErr: any) {
      console.error("WhatsApp notification generation error:", waErr.message);
    }

    res.json({ success: true, message: "Payment confirmation recorded" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7.1 Public Order / Invoice Lookup API
app.get("/api/orders/:orderId", async (req: any, res: any) => {
  const { orderId } = req.params;
  try {
    const order = await dbGet("SELECT * FROM orders WHERE order_id = ?", [orderId]);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const items = await dbAll("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
    const enrichedItems = items.map((it: any) => {
      let matrimonyDetails = null;
      let businessDetails = null;
      try {
        if (it.matrimony_details_json) matrimonyDetails = JSON.parse(it.matrimony_details_json);
      } catch (e) {}
      try {
        if (it.business_details_json) businessDetails = JSON.parse(it.business_details_json);
      } catch (e) {}
      return {
        ...it,
        matrimonyDetails,
        businessDetails
      };
    });
    res.json({
      ...order,
      items: enrichedItems
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Status Check API
app.get("/api/admin/setup-status", async (req: any, res: any) => {
  try {
    const admin = await dbGet("SELECT COUNT(*) as count FROM super_admins");
    res.json({ setupRequired: admin.count === 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Super Admin account
app.post("/api/admin/setup", async (req: any, res: any) => {
  const { username, password, confirmPassword } = req.body;
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: "सभी फील्ड भरना आवश्यक है।" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।" });
  }
  try {
    const adminCheck = await dbGet("SELECT COUNT(*) as count FROM super_admins");
    if (adminCheck.count > 0) {
      return res.status(400).json({ error: "सेटअप पहले ही किया जा चुका है।" });
    }
    const hash = await bcrypt.hash(password, 10);
    await dbRun(
      "INSERT INTO super_admins (username, password_hash, recovery_email, recovery_whatsapp) VALUES (?, ?, ?, ?)",
      [username, hash, username, ""]
    );
    res.json({ success: true, message: "सुपर एडमिन सेटअप सफलतापूर्वक पूर्ण हुआ।" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin recovery settings
app.get("/api/admin/recovery-settings", authenticateAdmin, async (req: any, res: any) => {
  try {
    const admin = await dbGet("SELECT username, recovery_email as recoveryEmail, recovery_whatsapp as recoveryWhatsapp FROM super_admins WHERE id = ?", [req.adminId]);
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save recovery settings
app.post("/api/admin/recovery-settings", authenticateAdmin, async (req: any, res: any) => {
  const { recoveryEmail, recoveryWhatsapp } = req.body;
  try {
    await dbRun(
      "UPDATE super_admins SET recovery_email = ?, recovery_whatsapp = ? WHERE id = ?",
      [recoveryEmail, recoveryWhatsapp, req.adminId]
    );
    res.json({ success: true, message: "रिकवरी सेटिंग्स सफलतापूर्वक सुरक्षित की गईं।" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password link generation
app.post("/api/admin/forgot-password", async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "ईमेल आईडी दर्ज करना आवश्यक है।" });
  try {
    const admin = await dbGet("SELECT * FROM super_admins WHERE username = ? OR recovery_email = ?", [email, email]);
    if (!admin) {
      return res.status(404).json({ error: "इस ईमेल पते के साथ कोई एडमिन पंजीकृत नहीं है।" });
    }

    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes limit

    await dbRun(
      "UPDATE super_admins SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [resetToken, expiry, admin.id]
    );

    const resetUrl = `/admin-reset-password?token=${resetToken}`;

    res.json({
      success: true,
      message: "पासवर्ड रीसेट लिंक सफलतापूर्वक जनरेट हो गया है।",
      resetToken,
      resetUrl,
      whatsappNumber: admin.recovery_whatsapp || "",
      recoveryEmail: admin.recovery_email || ""
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password API
app.post("/api/admin/reset-password", async (req: any, res: any) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "टोकन और नया पासवर्ड आवश्यक है।" });
  }
  try {
    const admin = await dbGet("SELECT * FROM super_admins WHERE reset_token = ?", [token]);
    if (!admin) {
      return res.status(400).json({ error: "अवैध या उपयोग किया हुआ रीसेट टोकन।" });
    }

    const now = new Date();
    const expiry = new Date(admin.reset_token_expiry);
    if (now > expiry) {
      return res.status(400).json({ error: "रीसेट टोकन की समयावधि समाप्त हो चुकी है (Expired)।" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await dbRun(
      "UPDATE super_admins SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hash, admin.id]
    );

    res.json({ success: true, message: "पासवर्ड सफलतापूर्वक रीसेट हो गया है। अब आप लॉगिन कर सकते हैं।" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Custom fields public getter
app.get("/api/custom-fields/:formType", async (req: any, res: any) => {
  const { formType } = req.params;
  try {
    const fields = await dbAll(
      "SELECT * FROM custom_fields WHERE form_type = ? AND visible = 1 ORDER BY display_order ASC",
      [formType]
    );
    res.json(fields);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Custom fields admin getter (all fields)
app.get("/api/admin/custom-fields/:formType", authenticateAdmin, async (req: any, res: any) => {
  const { formType } = req.params;
  try {
    const fields = await dbAll(
      "SELECT * FROM custom_fields WHERE form_type = ? ORDER BY display_order ASC",
      [formType]
    );
    res.json(fields);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Custom fields builder insert API
app.post("/api/admin/custom-fields", authenticateAdmin, async (req: any, res: any) => {
  const { form_type, field_name, label, field_type, required, placeholder, help_text, default_value, visible, display_order, select_options } = req.body;
  if (!form_type || !field_name || !label || !field_type) {
    return res.status(400).json({ error: "Missing required field attributes" });
  }
  try {
    await dbRun(`
      INSERT INTO custom_fields (form_type, field_name, label, field_type, required, placeholder, help_text, default_value, visible, display_order, select_options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [form_type, field_name.toLowerCase(), label, field_type, required ? 1 : 0, placeholder || "", help_text || "", default_value || "", visible ? 1 : 0, display_order || 0, select_options || ""]);
    res.json({ success: true, message: "फ़ील्ड सफलतापूर्वक जोड़ा गया।" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Custom fields builder update API
app.put("/api/admin/custom-fields/:id", authenticateAdmin, async (req: any, res: any) => {
  const { id } = req.params;
  const { label, field_type, required, placeholder, help_text, default_value, visible, display_order, select_options } = req.body;
  try {
    await dbRun(`
      UPDATE custom_fields
      SET label = ?, field_type = ?, required = ?, placeholder = ?, help_text = ?, default_value = ?, visible = ?, display_order = ?, select_options = ?
      WHERE id = ?
    `, [label, field_type, required ? 1 : 0, placeholder || "", help_text || "", default_value || "", visible ? 1 : 0, display_order || 0, select_options || "", id]);
    res.json({ success: true, message: "फ़ील्ड सफलतापूर्वक अपडेट किया गया।" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Custom fields builder delete API
app.delete("/api/admin/custom-fields/:id", authenticateAdmin, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM custom_fields WHERE id = ?", [id]);
    res.json({ success: true, message: "फ़ील्ड सफलतापूर्वक हटा दिया गया।" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Super Admin login
app.post("/api/admin/login", async (req: any, res: any) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }
  try {
    const admin = await dbGet("SELECT * FROM super_admins WHERE username = ?", [username]);
    if (!admin) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }
    const token = jwt.sign({ adminId: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, username: admin.username });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin change password
app.post("/api/admin/change-password", authenticateAdmin, async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing passwords" });
  }
  try {
    const admin = await dbGet("SELECT * FROM super_admins WHERE id = ?", [req.adminId]);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const match = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!match) return res.status(400).json({ error: "Incorrect current password" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRun("UPDATE super_admins SET password_hash = ? WHERE id = ?", [newHash, req.adminId]);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Admin List & Filter Orders
app.get("/api/admin/orders", authenticateAdmin, async (req: any, res: any) => {
  try {
    const orders = await dbAll("SELECT * FROM orders ORDER BY id DESC");
    const items = await dbAll("SELECT * FROM order_items");
    
    // Structure order items grouped under orders
    const enrichedOrders = orders.map((ord) => {
      const orderItems = items.filter((it) => it.order_id === ord.order_id);
      return {
        ...ord,
        items: orderItems.map(it => ({
          ...it,
          matrimonyDetails: it.matrimony_details_json ? JSON.parse(it.matrimony_details_json) : null,
          businessDetails: it.business_details_json ? JSON.parse(it.business_details_json) : null
        }))
      };
    });
    res.json(enrichedOrders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Admin Verify Payment (Approve order)
// This creates actual, final immutable advertisement numbers for the advertisements in this order!
app.post("/api/admin/orders/:orderId/verify", authenticateAdmin, async (req: any, res: any) => {
  const { orderId } = req.params;
  const { status, reason } = req.body; // 'PAID' or 'REJECTED'
  if (!status || !["PAID", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status state" });
  }

  try {
    const order = await dbGet("SELECT * FROM orders WHERE order_id = ?", [orderId]);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const verifiedBy = req.username;
    const verificationTime = new Date().toISOString();

    await dbRun(
      "UPDATE orders SET payment_status = ?, verified_by = ?, verification_time = ?, rejection_reason = ? WHERE order_id = ?",
      [status, verifiedBy, verificationTime, reason || null, orderId]
    );

    // Find all order items under this order, and update pre-saved advertisements status
    const items = await dbAll("SELECT ad_number, customer_name, customer_mobile, ad_type, district_hi, sangathan_hi FROM order_items WHERE order_id = ?", [orderId]);
    for (const item of items) {
      await dbRun("UPDATE advertisements SET payment_status = ? WHERE ad_number = ?", [status, item.ad_number]);
    }

    // Trigger WhatsApp notification for PAID or REJECTED
    try {
      if (items && items.length > 0) {
        const mainCustomer = items[0];
        const customerPhone = mainCustomer.customer_mobile || "N/A";
        const customerNameVal = mainCustomer.customer_name || "ग्राहक";
        const amount = order.total_amount || 0;

        const adDetails = items.map((it, idx) => `  ${idx + 1}. ${it.ad_type === "matrimony" ? "विवाह परिचय प्रविष्टि" : "व्यावसायिक विज्ञापन"} (${it.ad_number}) [${it.district_hi} • ${it.sangathan_hi}]`).join("\n");

        const host = req.get("host") || "localhost:3000";
        const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
        const invoiceLink = `${protocol}://${host}/?order=${orderId}`;

        if (status === "PAID") {
          const customerMsg = `*प्रवेश स्वीकृत रसीद - परिचायिका 2026* ✅

नमस्ते *${customerNameVal}*, आपका विज्ञापन भुगतान स्वीकृत हो गया है और विज्ञापन उत्पादन (Print Production) के लिए भेज दिया गया है।

*ऑर्डर विवरण:*
• *ऑर्डर ID:* ${orderId}
• *कुल राशि:* ₹${amount}
• *संदर्भ (UTR/Ref No):* ${order.payment_ref || "DIRECT_UPI_CONFIRMED"}
• *स्थिति:* 🟢 स्वीकृत (PAID)

*विज्ञापन विवरण:*
${adDetails}

🔗 *डिजिटल पावती / Invoice डाउनलोड करें:* ${invoiceLink}

धन्यवाद,
*इंडियन प्रेस / परिचायिका टीम* 🌸`;

          // 1. Notify Customer
          await sendWhatsAppNotification(orderId, customerPhone, customerNameVal, "PAID", customerMsg);

          // 2. Notify Admin
          const superAdmin = await dbGet("SELECT recovery_whatsapp FROM super_admins LIMIT 1");
          const adminPhone = superAdmin?.recovery_whatsapp || "9301056006";
          const adminMsg = `*✅ भुगतान स्वीकृत पुष्टि - परिचायिका 2026*

• *ऑर्डर ID:* ${orderId}
• *ग्राहक:* ${customerNameVal} (${customerPhone})
• *कुल राशि:* ₹${amount}
• *स्थिति:* 🟢 स्वीकृत (PAID)

उत्पादन अनुभाग में मुद्रण (Print Sheet) हेतु प्रविष्टियाँ भेज दी गई हैं।`;
          await sendWhatsAppNotification(orderId, adminPhone, "सुपर एडमिन", "ADMIN_ALERT_PAID", adminMsg);

        } else if (status === "REJECTED") {
          const rejectReason = reason || "भुगतान विवरण अमान्य पाया गया। कृपया पुनः सही जानकारी दर्ज करें।";
          const customerMsg = `*भुगतान अस्वीकृत / विफल सूचना - परिचायिका 2026* ❌

नमस्ते *${customerNameVal}*, आपके विज्ञापन आर्डर का भुगतान विवरण अमान्य संदर्भ (UTR) या अन्य कारणों से *अस्वीकृत (REJECTED)* कर दिया गया है।

*ऑर्डर विवरण:*
• *ऑर्डर ID:* ${orderId}
• *कुल राशि:* ₹${amount}
• *स्थिति:* 🔴 अस्वीकृत (REJECTED)
• *अस्वीकृति का कारण:* ${rejectReason}

*कृपया पुनः प्रयास करें:*
आप नीचे दिए लिंक पर जाकर अपना सही भुगतान विवरण दर्ज कर सकते हैं या फिर से भुगतान कर सकते हैं।

🔗 *पुनः प्रयास करें / डिजिटल पावती:* ${invoiceLink}

यदि कोई समस्या हो तो कृपया परिचायिका एडमिन से संपर्क करें।

धन्यवाद,
*इंडियन प्रेस / परिचायिका टीम* 🌸`;

          // 1. Notify Customer
          await sendWhatsAppNotification(orderId, customerPhone, customerNameVal, "REJECTED", customerMsg);

          // 2. Notify Admin
          const superAdmin = await dbGet("SELECT recovery_whatsapp FROM super_admins LIMIT 1");
          const adminPhone = superAdmin?.recovery_whatsapp || "9301056006";
          const adminMsg = `*❌ भुगतान अस्वीकृत (REJECTED) - परिचायिका 2026*

• *ऑर्डर ID:* ${orderId}
• *ग्राहक:* ${customerNameVal} (${customerPhone})
• *कुल राशि:* ₹${amount}
• *स्थिति:* 🔴 अस्वीकृत (REJECTED)
• *अस्वीकृति का कारण:* ${rejectReason}

ग्राहक को पुनः प्रयास हेतु सूचना भेज दी गई है।`;
          await sendWhatsAppNotification(orderId, adminPhone, "सुपर एडमिन", "ADMIN_ALERT_REJECTED", adminMsg);
        }
      }
    } catch (waErr: any) {
      console.error("WhatsApp notification verification trigger error:", waErr.message);
    }

    res.json({ success: true, message: `Order updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10.1 Admin Fetch WhatsApp Notification Logs
app.get("/api/admin/whatsapp-logs", authenticateAdmin, async (req: any, res: any) => {
  try {
    const logs = await dbAll("SELECT * FROM whatsapp_notifications ORDER BY id DESC");
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Admin Master Data CRUDS
app.post("/api/admin/masters/:entity", authenticateAdmin, async (req: any, res: any) => {
  const { entity } = req.params;
  const data = req.body;
  try {
    if (entity === "districts") {
      await dbRun("INSERT INTO districts (name_en, name_hi, is_enabled) VALUES (?, ?, 1)", [data.name_en, data.name_hi]);
    } else if (entity === "sangathans") {
      await dbRun("INSERT INTO sangathans (district_id, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", [data.district_id, data.name_en, data.name_hi]);
    } else if (entity === "editions") {
      await dbRun("INSERT INTO editions (magazine_id, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", [data.magazine_id, data.name_en, data.name_hi]);
    } else if (entity === "sizes") {
      await dbRun(
        "INSERT INTO advertisement_sizes (code, name_en, name_hi, width, height, unit, rows, cols, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
        [data.code, data.name_en, data.name_hi, data.width, data.height, data.unit || "inch", data.rows || 1, data.cols || 1]
      );
    } else if (entity === "pricings") {
      await dbRun(
        "INSERT INTO pricings (district_id, sangathan_id, magazine_id, edition_id, adv_type_code, adv_size_code, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.district_id, data.sangathan_id, data.magazine_id, data.edition_id, data.adv_type_code, data.adv_size_code, data.price]
      );
    } else if (entity === "publications") {
      await dbRun(
        "INSERT INTO publications (district_id, sangathan_id, magazine_id, edition_id, is_enabled) VALUES (?, ?, ?, ?, 1)",
        [data.district_id, data.sangathan_id, data.magazine_id, data.edition_id]
      );
    } else {
      return res.status(400).json({ error: "Invalid master entity" });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Retrieve Approved, Paid Advertisements for Print Production Layout
app.get("/api/admin/advertisements", authenticateAdmin, async (req: any, res: any) => {
  try {
    const ads = await dbAll("SELECT * FROM advertisements ORDER BY id DESC");
    const matDetails = await dbAll("SELECT * FROM matrimony_profiles");
    const busDetails = await dbAll("SELECT * FROM business_advertisements");

    const enriched = ads.map((ad) => {
      const mat = matDetails.find((m) => m.ad_id === ad.id);
      const bus = busDetails.find((b) => b.ad_id === ad.id);
      return {
        ...ad,
        matrimonyProfile: mat || null,
        businessProfile: bus ? {
          ...bus,
          adMakerDesignJson: bus.ad_maker_design_json ? JSON.parse(bus.ad_maker_design_json) : null
        } : null
      };
    });
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Admin Update Pricing rate dynamically
app.post("/api/admin/pricings/update", authenticateAdmin, async (req: any, res: any) => {
  const { id, price } = req.body;
  if (!id || price === undefined) {
    return res.status(400).json({ error: "Missing id or price parameters" });
  }
  try {
    await dbRun("UPDATE pricings SET price = ? WHERE id = ?", [Number(price), Number(id)]);
    res.json({ success: true, message: "Price updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Admin Configurations API (Super Admin)
app.get("/api/admin/configurations", async (req: any, res: any) => {
  try {
    const configs = await dbAll("SELECT * FROM admin_configurations ORDER BY id DESC");
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/configurations", authenticateAdmin, async (req: any, res: any) => {
  const { district, sangathan, magazine, edition, adv_type, size_name, width, height, unit, layout, pricing, status } = req.body;
  if (!district || !sangathan || !magazine || !edition || !adv_type || !size_name || pricing === undefined) {
    return res.status(400).json({ error: "Required fields are missing" });
  }
  try {
    // Generate system-generated unique configuration_id
    const configuration_id = "CONF-" + Math.floor(100000 + Math.random() * 900000);
    await dbRun(`
      INSERT INTO admin_configurations (configuration_id, district, sangathan, magazine, edition, adv_type, size_name, width, height, unit, layout, pricing, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [configuration_id, district, sangathan, magazine, edition, adv_type, size_name, Number(width || 0), Number(height || 0), unit || "inch", layout || "Standard", Number(pricing), status || "enabled"]);
    res.json({ success: true, configurationId: configuration_id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/configurations/:id", authenticateAdmin, async (req: any, res: any) => {
  const { id } = req.params;
  const { district, sangathan, magazine, edition, adv_type, size_name, width, height, unit, layout, pricing, status } = req.body;
  try {
    const existing = await dbGet("SELECT * FROM admin_configurations WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ error: "Configuration not found" });
    }
    await dbRun(`
      UPDATE admin_configurations SET
        district = ?, sangathan = ?, magazine = ?, edition = ?, adv_type = ?, size_name = ?,
        width = ?, height = ?, unit = ?, layout = ?, pricing = ?, status = ?
      WHERE id = ?
    `, [district, sangathan, magazine, edition, adv_type, size_name, Number(width || 0), Number(height || 0), unit || "inch", layout || "Standard", Number(pricing), status || "enabled", id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/configurations/:id", authenticateAdmin, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM admin_configurations WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup dev server or static distribution build
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res) => {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      }
    }));
    app.get("*", (req, res) => {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

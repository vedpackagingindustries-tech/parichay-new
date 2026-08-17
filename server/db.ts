import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "parichayika.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Helper function to run SQL queries as Promises
export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper to query multiple rows
export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Helper to query a single row
export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

// DB schema tables initialization
export async function initDatabase() {
  db.serialize(async () => {
    // 1. Super Admins
    db.run(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);

    // 2. Districts (जिला)
    db.run(`
      CREATE TABLE IF NOT EXISTS districts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1
      )
    `);

    // 3. Sangathans (संगठन)
    db.run(`
      CREATE TABLE IF NOT EXISTS sangathans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_id INTEGER NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        FOREIGN KEY(district_id) REFERENCES districts(id)
      )
    `);

    // 4. Magazines (पत्रिका)
    db.run(`
      CREATE TABLE IF NOT EXISTS magazines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1
      )
    `);

    // 5. Editions (संस्करण)
    db.run(`
      CREATE TABLE IF NOT EXISTS editions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        magazine_id INTEGER NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        FOREIGN KEY(magazine_id) REFERENCES magazines(id)
      )
    `);

    // 6. Advertisement Types
    db.run(`
      CREATE TABLE IF NOT EXISTS advertisement_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        is_enabled INTEGER DEFAULT 1
      )
    `);

    // 7. Advertisement Sizes
    db.run(`
      CREATE TABLE IF NOT EXISTS advertisement_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        unit TEXT DEFAULT 'inch',
        rows INTEGER DEFAULT 1,
        cols INTEGER DEFAULT 1,
        is_enabled INTEGER DEFAULT 1
      )
    `);

    // 8. Pricings
    db.run(`
      CREATE TABLE IF NOT EXISTS pricings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_id INTEGER NOT NULL,
        sangathan_id INTEGER NOT NULL,
        magazine_id INTEGER NOT NULL,
        edition_id INTEGER NOT NULL,
        adv_type_code TEXT NOT NULL,
        adv_size_code TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(district_id) REFERENCES districts(id),
        FOREIGN KEY(sangathan_id) REFERENCES sangathans(id),
        FOREIGN KEY(magazine_id) REFERENCES magazines(id),
        FOREIGN KEY(edition_id) REFERENCES editions(id)
      )
    `);

    // 9. Advertisements (Matrimony + Business ads reference)
    db.run(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad_number TEXT UNIQUE NOT NULL,
        type_code TEXT NOT NULL,
        district_hi TEXT NOT NULL,
        sangathan_hi TEXT NOT NULL,
        magazine_hi TEXT NOT NULL,
        edition_hi TEXT NOT NULL,
        size_code TEXT NOT NULL,
        size_hi TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_mobile1 TEXT NOT NULL,
        price REAL NOT NULL,
        payment_status TEXT DEFAULT 'PENDING',
        created_at TEXT NOT NULL
      )
    `);

    // 10. Matrimony Profiles (विवाह विवरण)
    db.run(`
      CREATE TABLE IF NOT EXISTS matrimony_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        dob TEXT,
        height TEXT,
        blood_group TEXT,
        gotra TEXT,
        education TEXT,
        occupation TEXT,
        father_name TEXT,
        father_occupation TEXT,
        mother_name TEXT,
        mobile1 TEXT,
        mobile2 TEXT,
        whatsapp TEXT,
        current_address TEXT,
        permanent_address TEXT,
        photo_url TEXT,
        biodata_url TEXT,
        FOREIGN KEY(ad_id) REFERENCES advertisements(id) ON DELETE CASCADE
      )
    `);

    // 11. Business Advertisements (व्यवसाय विवरण)
    db.run(`
      CREATE TABLE IF NOT EXISTS business_advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad_id INTEGER UNIQUE NOT NULL,
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        category TEXT,
        business_desc TEXT,
        products_services TEXT,
        special_offer TEXT,
        key_features TEXT,
        mobile1 TEXT,
        mobile2 TEXT,
        whatsapp TEXT,
        email TEXT,
        business_address TEXT,
        other_address TEXT,
        logo_url TEXT,
        photo_url TEXT,
        ready_ad_url TEXT,
        ad_maker_design_json TEXT,
        FOREIGN KEY(ad_id) REFERENCES advertisements(id) ON DELETE CASCADE
      )
    `);

    // 12. Uploads
    db.run(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        url TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // 13. Cart Items
    db.run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        ad_type TEXT NOT NULL,
        data_json TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // 14. Orders
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'PENDING',
        payment_ref TEXT,
        payment_date TEXT,
        verified_by TEXT,
        verification_time TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 15. Order Items
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        ad_number TEXT NOT NULL,
        ad_type TEXT NOT NULL,
        district_hi TEXT NOT NULL,
        sangathan_hi TEXT NOT NULL,
        magazine_hi TEXT NOT NULL,
        edition_hi TEXT NOT NULL,
        size_hi TEXT NOT NULL,
        price REAL NOT NULL,
        customer_name TEXT NOT NULL,
        customer_mobile TEXT NOT NULL,
        matrimony_details_json TEXT,
        business_details_json TEXT,
        FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
      )
    `);

    // 16. Publications
    db.run(`
      CREATE TABLE IF NOT EXISTS publications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_id INTEGER NOT NULL,
        sangathan_id INTEGER NOT NULL,
        magazine_id INTEGER NOT NULL,
        edition_id INTEGER NOT NULL,
        is_enabled INTEGER DEFAULT 1,
        FOREIGN KEY(district_id) REFERENCES districts(id),
        FOREIGN KEY(sangathan_id) REFERENCES sangathans(id),
        FOREIGN KEY(magazine_id) REFERENCES magazines(id),
        FOREIGN KEY(edition_id) REFERENCES editions(id)
      )
    `);

    // 17. Print Jobs
    db.run(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        district_hi TEXT,
        sangathan_hi TEXT,
        magazine_hi TEXT,
        edition_hi TEXT,
        layout_config_json TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 18. Settings
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT UNIQUE PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // 18.1 WhatsApp Notifications Log Table
    db.run(`
      CREATE TABLE IF NOT EXISTS whatsapp_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        error_reason TEXT
      )
    `);

    // 19. Advertisement Counters (Race-condition safe auto numbering)
    db.run(`
      CREATE TABLE IF NOT EXISTS advertisement_counters (
        counter_date TEXT UNIQUE PRIMARY KEY,
        last_seq INTEGER NOT NULL
      )
    `);

    // 20. Admin Configurations (Super Admin manual entries with system-generated configurationId)
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        configuration_id TEXT UNIQUE NOT NULL,
        district TEXT NOT NULL,
        sangathan TEXT NOT NULL,
        magazine TEXT NOT NULL,
        edition TEXT NOT NULL,
        adv_type TEXT NOT NULL,
        size_name TEXT NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        unit TEXT NOT NULL,
        layout TEXT NOT NULL,
        pricing REAL NOT NULL,
        status TEXT DEFAULT 'enabled'
      )
    `);

    // 21. Custom Fields (Super Admin field builder definitions)
    db.run(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_type TEXT NOT NULL,
        field_name TEXT NOT NULL,
        label TEXT NOT NULL,
        field_type TEXT NOT NULL,
        required INTEGER DEFAULT 0,
        placeholder TEXT,
        help_text TEXT,
        default_value TEXT,
        visible INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        select_options TEXT,
        UNIQUE(form_type, field_name)
      )
    `);

    // Safe DB Migrations for backward compatibility / existing tables
    db.run(`ALTER TABLE super_admins ADD COLUMN recovery_email TEXT`, () => {});
    db.run(`ALTER TABLE super_admins ADD COLUMN recovery_whatsapp TEXT`, () => {});
    db.run(`ALTER TABLE super_admins ADD COLUMN reset_token TEXT`, () => {});
    db.run(`ALTER TABLE super_admins ADD COLUMN reset_token_expiry TEXT`, () => {});
    db.run(`ALTER TABLE matrimony_profiles ADD COLUMN extra_fields_json TEXT`, () => {});
    db.run(`ALTER TABLE business_advertisements ADD COLUMN extra_fields_json TEXT`, () => {});
    db.run(`ALTER TABLE orders ADD COLUMN rejection_reason TEXT`, () => {});
    db.run(`ALTER TABLE orders ADD COLUMN payment_screenshot TEXT`, () => {});

    // Create Indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_ad_number ON advertisements(ad_number)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ad_customer_name ON advertisements(customer_name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ad_payment_status ON advertisements(payment_status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_id ON orders(order_id)`);

    // Seed Initial Data
    await seedData();
  });
}

async function seedData() {
  try {
    // 1. Seed Super Admin (Left completely empty to enforce SUPER ADMIN INITIAL SETUP)
    // No default admin/admin123 seed anymore!

    // 2. Seed Districts
    const districtsCheck = await dbGet("SELECT COUNT(*) as count FROM districts");
    if (districtsCheck.count === 0) {
      const dists = [
        ["Raipur", "रायपुर"],
        ["Durg", "दुर्ग"],
        ["Bilaspur", "बिलासपुर"],
        ["Rajnandgaon", "राजनांदगांव"],
        ["Dhamtari", "धमतरी"],
        ["Mahasamund", "महासमुंद"]
      ];
      for (const [en, hi] of dists) {
        await dbRun("INSERT INTO districts (name_en, name_hi, is_enabled) VALUES (?, ?, 1)", [en, hi]);
      }
      console.log("Seeded Districts");
    }

    // 3. Seed Sangathans (for Raipur, Durg, Bilaspur)
    const sangathansCheck = await dbGet("SELECT COUNT(*) as count FROM sangathans");
    if (sangathansCheck.count === 0) {
      const sangs = [
        [1, "Raipur Sahu Sangathan", "रायपुर साहू संगठन"],
        [2, "Durg Sahu Sangathan", "दुर्ग साहू संगठन"],
        [3, "Bilaspur Sahu Sangathan", "बिलासपुर साहू संगठन"]
      ];
      for (const [dId, en, hi] of sangs) {
        await dbRun("INSERT INTO sangathans (district_id, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", [dId, en, hi]);
      }
      console.log("Seeded Sangathans");
    }

    // 4. Seed Magazines
    const magazinesCheck = await dbGet("SELECT COUNT(*) as count FROM magazines");
    if (magazinesCheck.count === 0) {
      await dbRun("INSERT INTO magazines (name_en, name_hi, is_enabled) VALUES (?, ?, 1)", ["Parichayika", "परिचायिका"]);
      console.log("Seeded Magazines");
    }

    // 5. Seed Editions
    const editionsCheck = await dbGet("SELECT COUNT(*) as count FROM editions");
    if (editionsCheck.count === 0) {
      await dbRun("INSERT INTO editions (magazine_id, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", [1, "Edition 2026", "संस्करण 2026"]);
      await dbRun("INSERT INTO editions (magazine_id, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", [1, "Edition 2027", "संस्करण 2027"]);
      console.log("Seeded Editions");
    }

    // 6. Seed Advertisement Types
    const typesCheck = await dbGet("SELECT COUNT(*) as count FROM advertisement_types");
    if (typesCheck.count === 0) {
      await dbRun("INSERT INTO advertisement_types (code, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", ["matrimony", "Matrimony", "विवाह विज्ञापन"]);
      await dbRun("INSERT INTO advertisement_types (code, name_en, name_hi, is_enabled) VALUES (?, ?, ?, 1)", ["business", "Business", "व्यवसाय विज्ञापन"]);
      console.log("Seeded Advertisement Types");
    }

    // 7. Seed Advertisement Sizes
    const sizesCheck = await dbGet("SELECT COUNT(*) as count FROM advertisement_sizes");
    if (sizesCheck.count === 0) {
      const sizes = [
        ["matrimony_standard", "Matrimony Standard", "विवाह मानक (3.5 × 2 इंच)", 3.5, 2, "inch", 1, 1],
        ["business_full", "Full Page", "पूरा पृष्ठ (8.5 × 11 इंच)", 8.5, 11, "inch", 1, 1],
        ["business_half", "Half Page", "आधा पृष्ठ (8.5 × 5.5", 8.5, 5.5, "inch", 1, 1],
        ["business_quarter", "Quarter Page", "चौथाई पृष्ठ (4.25 × 5.5 इंच)", 4.25, 5.5, "inch", 1, 1],
        ["business_custom", "Custom Size", "कस्टम आकार", 0, 0, "inch", 1, 1]
      ];
      for (const [code, en, hi, w, h, u, r, c] of sizes) {
        await dbRun("INSERT INTO advertisement_sizes (code, name_en, name_hi, width, height, unit, rows, cols, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)", [code, en, hi, w, h, u, r, c]);
      }
      console.log("Seeded Advertisement Sizes");
    }

    // 8. Seed Default Pricings for combinations (Raipur -> Raipur Sahu Sangathan -> Parichayika -> Edition 2026)
    const pricingsCheck = await dbGet("SELECT COUNT(*) as count FROM pricings");
    if (pricingsCheck.count === 0) {
      // Standard prices for district 1, sangathan 1, magazine 1, edition 1
      const priceList = [
        [1, 1, 1, 1, "matrimony", "matrimony_standard", 500],
        [1, 1, 1, 1, "business", "business_full", 5000],
        [1, 1, 1, 1, "business", "business_half", 3000],
        [1, 1, 1, 1, "business", "business_quarter", 1500],
        [1, 1, 1, 1, "business", "business_custom", 2500],
        // district 2, sangathan 2 (Durg)
        [2, 2, 1, 1, "matrimony", "matrimony_standard", 450],
        [2, 2, 1, 1, "business", "business_full", 4500],
        [2, 2, 1, 1, "business", "business_half", 2500],
        [2, 2, 1, 1, "business", "business_quarter", 1200],
        [2, 2, 1, 1, "business", "business_custom", 2000],
        // district 3, sangathan 3 (Bilaspur)
        [3, 3, 1, 1, "matrimony", "matrimony_standard", 400],
        [3, 3, 1, 1, "business", "business_full", 4000],
        [3, 3, 1, 1, "business", "business_half", 2200],
        [3, 3, 1, 1, "business", "business_quarter", 1000],
        [3, 3, 1, 1, "business", "business_custom", 1800]
      ];
      for (const [dId, sId, mId, eId, tCode, sCode, pr] of priceList) {
        await dbRun("INSERT INTO pricings (district_id, sangathan_id, magazine_id, edition_id, adv_type_code, adv_size_code, price) VALUES (?, ?, ?, ?, ?, ?, ?)", [dId, sId, mId, eId, tCode, sCode, pr]);
      }
      console.log("Seeded Pricings");
    }

    // 9. Seed Publications combinations
    const publicationsCheck = await dbGet("SELECT COUNT(*) as count FROM publications");
    if (publicationsCheck.count === 0) {
      await dbRun("INSERT INTO publications (district_id, sangathan_id, magazine_id, edition_id, is_enabled) VALUES (?, ?, ?, ?, 1)", [1, 1, 1, 1]);
      await dbRun("INSERT INTO publications (district_id, sangathan_id, magazine_id, edition_id, is_enabled) VALUES (?, ?, ?, ?, 1)", [2, 2, 1, 1]);
      await dbRun("INSERT INTO publications (district_id, sangathan_id, magazine_id, edition_id, is_enabled) VALUES (?, ?, ?, ?, 1)", [3, 3, 1, 1]);
      console.log("Seeded Publications");
    }

    // 10. Default settings
    const settingsCheck = await dbGet("SELECT COUNT(*) as count FROM settings");
    if (settingsCheck.count === 0) {
      await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", ["upi_id", "9301056006@paytm"]);
      await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", ["upi_name", "Parichayika Powered by Indian Press"]);
      await dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", ["whatsapp_api_enabled", "0"]);
      console.log("Seeded Settings");
    }

    // 11. Seed Admin Configurations
    const configsCheck = await dbGet("SELECT COUNT(*) as count FROM admin_configurations");
    if (configsCheck.count === 0) {
      await dbRun(`
        INSERT INTO admin_configurations (configuration_id, district, sangathan, magazine, edition, adv_type, size_name, width, height, unit, layout, pricing, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, ["CONF-000001", "रायपुर", "रायपुर साहू समाज", "परिचायिका", "2026", "विवाह", "3.5 × 2 inch", 3.5, 2, "inch", "Standard", 500, "enabled"]);

      await dbRun(`
        INSERT INTO admin_configurations (configuration_id, district, sangathan, magazine, edition, adv_type, size_name, width, height, unit, layout, pricing, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, ["CONF-000002", "दुर्ग", "दुर्ग साहू समाज", "परिचायिका", "2026", "विवाह", "3.5 × 2 inch", 3.5, 2, "inch", "Standard", 450, "enabled"]);

      await dbRun(`
        INSERT INTO admin_configurations (configuration_id, district, sangathan, magazine, edition, adv_type, size_name, width, height, unit, layout, pricing, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, ["CONF-000003", "रायपुर", "रायपुर साहू समाज", "परिचायिका", "2026", "व्यवसाय", "4 × 2 inch", 4, 2, "inch", "Standard-Business", 700, "enabled"]);

      console.log("Seeded default Admin Configurations");
    }

    // 12. Seed Custom Fields
    const customFieldsCheck = await dbGet("SELECT COUNT(*) as count FROM custom_fields");
    if (customFieldsCheck.count === 0) {
      const defaultFields = [
        // Matrimony
        ["matrimony", "name", "युवक-युवती का नाम (Name)", "text", 1, "जैसे: राम कुमार साहू", "पूरा नाम लिखें", "", 1, 1, ""],
        ["matrimony", "dob", "जन्म तिथि (Date of Birth)", "date", 0, "", "जन्म दिनांक", "", 1, 2, ""],
        ["matrimony", "height", "ऊँचाई (Height)", "text", 0, "जैसे: 5.4 ft", "ऊँचाई दर्ज करें", "", 1, 3, ""],
        ["matrimony", "blood_group", "रक्त समूह (Blood Group)", "text", 0, "जैसे: AB+", "रक्त समूह चुनें", "", 1, 4, ""],
        ["matrimony", "gotra", "गोत्र (Gotra)", "text", 0, "जैसे: साहू", "गोत्र लिखें", "", 1, 5, ""],
        ["matrimony", "education", "विस्तृत शैक्षणिक योग्यता (Education Detail)", "textarea", 0, "जैसे: MBA", "अल्पविराम से अलग करें", "", 1, 6, ""],
        ["matrimony", "occupation", "व्यवसाय/नौकरी (Occupation)", "text", 0, "जैसे: सॉफ्टवेयर इंजीनियर", "नौकरी या व्यवसाय का नाम", "", 1, 7, ""],
        ["matrimony", "father_name", "पिता का नाम", "text", 0, "जैसे: श्री रमेश कुमार साहू", "पिता का पूरा नाम", "", 1, 8, ""],
        ["matrimony", "father_occupation", "पिता का व्यवसाय", "text", 0, "जैसे: कृषक", "पिता का व्यवसाय दर्ज करें", "", 1, 9, ""],
        ["matrimony", "mother_name", "माता का नाम", "text", 0, "जैसे: श्रीमती सुशीला साहू", "माता का नाम", "", 1, 10, ""],
        ["matrimony", "mobile1", "मोबाइल नंबर 1", "phone", 1, "जैसे: 9301056006", "10 अंकों का नंबर", "", 1, 11, ""],
        ["matrimony", "mobile2", "मोबाइल नंबर 2", "phone", 0, "", "वैकल्पिक नंबर", "", 1, 12, ""],
        ["matrimony", "whatsapp", "WhatsApp नंबर", "phone", 0, "", "वैकल्पिक व्हाट्सएप नंबर", "", 1, 13, ""],
        ["matrimony", "current_address", "वर्तमान पता (Current Address)", "textarea", 0, "", "पूरा वर्तमान पता लिखें", "", 1, 14, ""],
        ["matrimony", "permanent_address", "स्थायी पता (Permanent Address)", "textarea", 0, "", "पूरा स्थायी पता लिखें", "", 1, 15, ""],

        // Business
        ["business", "business_name", "व्यापार/दुकान का नाम (Business Name)", "text", 1, "जैसे: साहू इलेक्ट्रॉनिक्स", "व्यापार का नाम", "", 1, 1, ""],
        ["business", "owner_name", "स्वामी का नाम (Owner Name)", "text", 1, "जैसे: राम साहू", "मालिक का नाम", "", 1, 2, ""],
        ["business", "category", "श्रेणी (Category)", "text", 0, "जैसे: इलेक्ट्रॉनिक्स", "व्यापार श्रेणी", "", 1, 3, ""],
        ["business", "business_desc", "व्यापार विवरण (Description)", "textarea", 0, "", "व्यापार के बारे में संक्षेप में", "", 1, 4, ""],
        ["business", "products_services", "उत्पाद एवं सेवाएं (Products/Services)", "textarea", 0, "जैसे: टीवी, फ्रिज, वाशिंग मशीन", "आपके उत्पाद या सेवाएं", "", 1, 5, ""],
        ["business", "special_offer", "विशेष ऑफर (Special Offer)", "text", 0, "जैसे: 10% दिवाली डिस्काउंट", "कोई विशेष ऑफर", "", 1, 6, ""],
        ["business", "key_features", "मुख्य विशेषताएं (Highlights)", "textarea", 0, "", "दुकान/व्यापार की मुख्य बातें", "", 1, 7, ""],
        ["business", "mobile1", "मोबाइल नंबर 1", "phone", 1, "जैसे: 9301056006", "संपर्क मोबाइल नंबर", "", 1, 8, ""],
        ["business", "mobile2", "मोबाइल नंबर 2", "phone", 0, "", "वैकल्पिक संपर्क नंबर", "", 1, 9, ""],
        ["business", "whatsapp", "WhatsApp नंबर", "phone", 0, "", "व्हाट्सएप संपर्क नंबर", "", 1, 10, ""],
        ["business", "email", "ईमेल (Email)", "email", 0, "जैसे: owner@example.com", "वैकल्पिक ईमेल", "", 1, 11, ""],
        ["business", "business_address", "व्यापार का पता (Business Address)", "textarea", 0, "", "व्यापार/दुकान का पूरा पता", "", 1, 12, ""],
        ["business", "other_address", "अन्य पता (Other Address)", "textarea", 0, "", "वैकल्पिक पता", "", 1, 13, ""]
      ];

      for (const [fType, fName, lbl, fldType, req, ph, help, defVal, vis, ord, opts] of defaultFields) {
        await dbRun(`
          INSERT INTO custom_fields (form_type, field_name, label, field_type, required, placeholder, help_text, default_value, visible, display_order, select_options)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [fType, fName, lbl, fldType, req, ph, help, defVal, vis, ord, opts]);
      }
      console.log("Seeded Custom Fields");
    }

  } catch (err) {
    console.error("Error during database seeding:", err);
  }
}

// Function to generate the immutable, unique race-condition safe Ad Number
export async function generateAdNumber(sangathanHi: string, magazineHi: string): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = `${dd}-${mm}-${yy}`;

  // Use transactions or atomic increments on advertisement_counters
  return new Promise<string>((resolve, reject) => {
    db.serialize(() => {
      db.run("INSERT OR IGNORE INTO advertisement_counters (counter_date, last_seq) VALUES (?, 0)", [dateStr]);
      db.run("UPDATE advertisement_counters SET last_seq = last_seq + 1 WHERE counter_date = ?", [dateStr]);
      db.get("SELECT last_seq FROM advertisement_counters WHERE counter_date = ?", [dateStr], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          const seq = String(row.last_seq).padStart(3, "0");
          // Format: DD-MM-YY / SANGATHAN / MAGAZINE / NNN
          const adNumPrefix = `${dateStr} / ${sangathanHi} / ${magazineHi} / ${seq}`;
          resolve(adNumPrefix);
        }
      });
    });
  });
}

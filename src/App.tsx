import React, { useState, useEffect } from "react";
import {
  Heart,
  Building,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  FileText,
  HelpCircle,
  QrCode,
  ShieldAlert,
  Loader2,
  Trash2,
  User,
  Plus,
  Send,
  Upload as UploadIcon,
  Sparkles,
  ChevronRight,
  BookOpen,
  CreditCard
} from "lucide-react";
import TransliteratedInput from "./components/TransliteratedInput";
import AdMakerPanel from "./components/AdMakerPanel";
import InvoicePDF from "./components/InvoicePDF";
import AdminPanel from "./components/AdminPanel";
import {
  District,
  Sangathan,
  Magazine,
  Edition,
  AdvertisementSize,
  Publication,
  MatrimonyFormState,
  BusinessFormState,
  CartItem,
  Order
} from "./types";

export default function App() {
  // Navigation Screens: 'home' | 'matrimony_form' | 'business_form' | 'cart' | 'checkout' | 'invoice' | 'admin'
  const [screen, setScreen] = useState<"home" | "matrimony_form" | "business_form" | "cart" | "checkout" | "invoice" | "admin">("home");

  // Masters State loaded from Server
  const [masters, setMasters] = useState<{
    districts: District[];
    sangathans: Sangathan[];
    magazines: Magazine[];
    editions: Edition[];
    sizes: AdvertisementSize[];
    publications: Publication[];
  }>({
    districts: [],
    sangathans: [],
    magazines: [],
    editions: [],
    sizes: [],
    publications: []
  });

  const [userConfigs, setUserConfigs] = useState<any[]>([]);

  // Client Session ID for Persistent Shopping Cart
  const [sessionId, setSessionId] = useState("");

  // Cart State (loaded from server + local fallback)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Form selections and data structures
  const [selectedPubId, setSelectedPubId] = useState("");
  const [selectedSizeCode, setSelectedSizeCode] = useState("");
  const [matrimonyTheme, setMatrimonyTheme] = useState<"classic" | "premium" | "bold" | "minimal">("classic");

  // Files upload loading helpers
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // 1. Matrimony Form Initial State
  const [matrimonyForm, setMatrimonyForm] = useState<MatrimonyFormState>({
    name: "",
    dob: "",
    height: "",
    blood_group: "",
    gotra: "",
    education: "",
    occupation: "",
    father_name: "",
    father_occupation: "",
    mother_name: "",
    mobile1: "",
    mobile2: "",
    whatsapp: "",
    currentAddress: "",
    permanentAddress: "",
    photoUrl: "",
    biodataUrl: "",
    district_id: "",
    sangathan_id: "",
    magazine_id: "",
    edition_id: ""
  });

  // 2. Business Form Initial State
  const [businessForm, setBusinessForm] = useState<BusinessFormState>({
    businessName: "",
    ownerName: "",
    category: "",
    businessDesc: "",
    productsServices: "",
    specialOffer: "",
    keyFeatures: "",
    mobile1: "",
    mobile2: "",
    whatsapp: "",
    email: "",
    businessAddress: "",
    otherAddress: "",
    logoUrl: "",
    photoUrl: "",
    readyAdUrl: "",
    district_id: "",
    sangathan_id: "",
    magazine_id: "",
    edition_id: "",
    size_code: ""
  });

  // Active form previews / Ad Maker states
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isAdMakerOpen, setIsAdMakerOpen] = useState(false);

  const uniqueDistricts = Array.from(new Set([
    ...userConfigs.map(c => c.district),
    ...masters.publications.map(p => p.district_hi)
  ])).filter(Boolean);

  const uniqueSangathans = Array.from(new Set([
    ...userConfigs.map(c => c.sangathan),
    ...masters.publications.map(p => p.sangathan_hi)
  ])).filter(Boolean);

  // New step-by-step wizard states with saved Ad IDs & numbers
  const [matrimonyStep, setMatrimonyStep] = useState<1 | 2 | 3>(1);
  const [businessStep, setBusinessStep] = useState<1 | 2 | 3>(1);
  const [savedAdId, setSavedAdId] = useState<number | null>(null);
  const [savedAdNumber, setSavedAdNumber] = useState("");
  const [savedPrice, setSavedPrice] = useState(500);

  // Checkout and Order Response
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    totalAmount: number;
    paymentStatus: string;
    upiPayload: string;
    recipientPhone: string;
  } | null>(null);

  // Payment proof reference input
  const [paymentRef, setPaymentRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  // Initializing Client Session & Masters
  useEffect(() => {
    // Session Setup
    let sId = localStorage.getItem("parichayika_session_id");
    if (!sId) {
      sId = `SESS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem("parichayika_session_id", sId);
    }
    setSessionId(sId);

    // Fetch Masters from Backend API
    fetch("/api/masters")
      .then((res) => res.json())
      .then((data) => {
        setMasters({
          districts: data.districts || [],
          sangathans: data.sangathans || [],
          magazines: data.magazines || [],
          editions: data.editions || [],
          sizes: data.sizes || [],
          publications: data.publications || []
        });
      })
      .catch((err) => console.error("Error fetching masters:", err));

    // Fetch Admin Configurations
    fetch("/api/admin/configurations")
      .then((res) => res.json())
      .then((data) => {
        setUserConfigs(data || []);
      })
      .catch((err) => console.error("Error fetching configurations:", err));
  }, []);

  // Dynamic custom fields definitions loaded from backend
  const [dynFields, setDynFields] = useState<{ matrimony: any[]; business: any[] }>({ matrimony: [], business: [] });

  useEffect(() => {
    fetch("/api/custom-fields/matrimony")
      .then(r => r.json())
      .then(d => setDynFields(prev => ({ ...prev, matrimony: d || [] })))
      .catch(e => console.error(e));

    fetch("/api/custom-fields/business")
      .then(r => r.json())
      .then(d => setDynFields(prev => ({ ...prev, business: d || [] })))
      .catch(e => console.error(e));
  }, []);

  // Fetch Cart Items whenever screen transitions to cart or sessionId loads
  useEffect(() => {
    if (sessionId) {
      fetchCart();
    }
  }, [sessionId, screen]);

  const fetchCart = async () => {
    setIsLoadingCart(true);
    try {
      const res = await fetch(`/api/cart?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setIsLoadingCart(false);
    }
  };

  // Synchronize dynamic details of publication selection into forms
  const handlePubSelectionChange = (pubId: string, formType: "matrimony" | "business") => {
    setSelectedPubId(pubId);
    if (pubId && typeof pubId === "string" && pubId.startsWith("CONF-")) {
      const conf = userConfigs.find((c) => c.configuration_id === pubId);
      if (conf) {
        if (formType === "matrimony") {
          setMatrimonyForm((prev) => ({
            ...prev,
            district_id: "999",
            sangathan_id: "999",
            magazine_id: "999",
            edition_id: "999",
            district_hi: conf.district,
            sangathan_hi: conf.sangathan,
            magazine_hi: conf.magazine,
            edition_hi: conf.edition
          }));
        } else {
          setBusinessForm((prev) => ({
            ...prev,
            district_id: "999",
            sangathan_id: "999",
            magazine_id: "999",
            edition_id: "999",
            district_hi: conf.district,
            sangathan_hi: conf.sangathan,
            magazine_hi: conf.magazine,
            edition_hi: conf.edition
          }));
        }
      }
      return;
    }

    const pub = masters.publications.find((p) => String(p.id) === pubId);
    if (pub) {
      if (formType === "matrimony") {
        setMatrimonyForm((prev) => ({
          ...prev,
          district_id: String(pub.district_id),
          sangathan_id: String(pub.sangathan_id),
          magazine_id: String(pub.magazine_id),
          edition_id: String(pub.edition_id),
          district_hi: pub.district_hi,
          sangathan_hi: pub.sangathan_hi,
          magazine_hi: pub.magazine_hi,
          edition_hi: pub.edition_hi
        }));
      } else {
        setBusinessForm((prev) => ({
          ...prev,
          district_id: String(pub.district_id),
          sangathan_id: String(pub.sangathan_id),
          magazine_id: String(pub.magazine_id),
          edition_id: String(pub.edition_id),
          district_hi: pub.district_hi,
          sangathan_hi: pub.sangathan_hi,
          magazine_hi: pub.magazine_hi,
          edition_hi: pub.edition_hi
        }));
      }
    } else {
      if (formType === "matrimony") {
        setMatrimonyForm((prev) => ({
          ...prev,
          district_id: "",
          sangathan_id: "",
          magazine_id: "",
          edition_id: "",
          district_hi: "",
          sangathan_hi: "",
          magazine_hi: "",
          edition_hi: ""
        }));
      } else {
        setBusinessForm((prev) => ({
          ...prev,
          district_id: "",
          sangathan_id: "",
          magazine_id: "",
          edition_id: "",
          district_hi: "",
          sangathan_hi: "",
          magazine_hi: "",
          edition_hi: ""
        }));
      }
    }
  };

  // Upload status and retry helpers
  const [lastSelectedFiles, setLastSelectedFiles] = useState<{ [key: string]: File }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [uploadSuccesses, setUploadSuccesses] = useState<{ [key: string]: boolean }>({});

  // Secure File Uploading client pipeline with type checking
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | null, fieldName: string, fileObject?: File) => {
    const file = fileObject || e?.target?.files?.[0];
    if (!file) return;

    // Cache file for retries
    setLastSelectedFiles((prev) => ({ ...prev, [fieldName]: file }));

    // Client-side extension validation
    const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      alert("अमान्य फ़ाइल प्रकार! केवल JPG, JPEG, PNG और PDF की अनुमति है।");
      return;
    }

    setUploadingField(fieldName);
    setUploadErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setUploadSuccesses((prev) => ({ ...prev, [fieldName]: false }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Map to correct state field
          if (screen === "matrimony_form") {
            setMatrimonyForm((prev) => ({ ...prev, [fieldName]: data.url }));
          } else if (screen === "business_form") {
            setBusinessForm((prev) => ({ ...prev, [fieldName]: data.url }));
          }
          setUploadSuccesses((prev) => ({ ...prev, [fieldName]: true }));
        } else {
          setUploadErrors((prev) => ({ ...prev, [fieldName]: "सर्वर से फाइल यूआरएल प्राप्त नहीं हुआ।" }));
        }
      } else {
        const err = await res.json();
        setUploadErrors((prev) => ({ ...prev, [fieldName]: err.error || "अपलोड करने में असमर्थ" }));
      }
    } catch (err) {
      setUploadErrors((prev) => ({ ...prev, [fieldName]: "नेटवर्क त्रुटि के कारण अपलोड करने में असमर्थ" }));
    } finally {
      setUploadingField(null);
    }
  };

  const handleUploadRetry = (fieldName: string) => {
    const file = lastSelectedFiles[fieldName];
    if (file) {
      handleFileUpload(null, fieldName, file);
    } else {
      alert("कृपया फ़ाइल पुनः चुनें।");
    }
  };

  const handleUploadRemove = (fieldName: string) => {
    if (screen === "matrimony_form") {
      setMatrimonyForm((prev) => ({ ...prev, [fieldName]: "" }));
    } else if (screen === "business_form") {
      setBusinessForm((prev) => ({ ...prev, [fieldName]: "" }));
    }
    setUploadSuccesses((prev) => ({ ...prev, [fieldName]: false }));
    setUploadErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setLastSelectedFiles((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  // Server Calculated authorative price finder
  const getCalculatedPrice = (adType: "matrimony" | "business", sizeCode?: string): number => {
    if (selectedPubId && typeof selectedPubId === "string" && selectedPubId.startsWith("CONF-")) {
      const conf = userConfigs.find((c) => c.configuration_id === selectedPubId);
      if (conf) return conf.pricing;
    }
    const pub = masters.publications.find((p) => String(p.id) === selectedPubId);
    if (!pub) return adType === "matrimony" ? 500 : 1500;

    // Search matches inside masters.pricings
    const targetSize = adType === "matrimony" ? "matrimony_standard" : (sizeCode || "business_full");
    const pricing = masters.publications.length > 0 ? true : false;
    
    // In-memory lookup based on priced combinations
    // (If not found, returns standard fallback defaults safely)
    if (adType === "matrimony") return pub.district_id === 1 ? 500 : pub.district_id === 2 ? 450 : 400;
    
    // Business rates depending on full, half, quarter size
    switch (targetSize) {
      case "business_full": return pub.district_id === 1 ? 5000 : 4500;
      case "business_half": return pub.district_id === 1 ? 3000 : 2500;
      case "business_quarter": return pub.district_id === 1 ? 1500 : 1200;
      default: return pub.district_id === 1 ? 2500 : 2000;
    }
  };

  // Matrimony Form: Validate Details and Save directly to DB -> Proceed to Step 3 (Visual Preview)
  const handleMatrimonySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matrimonyForm.name || !matrimonyForm.mobile1) {
      alert("कृपया नाम और मोबाइल नंबर अवश्य भरें।");
      return;
    }
    if (!matrimonyForm.district_hi || !matrimonyForm.sangathan_hi) {
      alert("कृपया जिला और साहू संगठन अवश्य भरें।");
      return;
    }

    const payload = {
      adId: savedAdId, // can be null or a pre-existing ID for edit
      typeCode: "matrimony",
      publicationId: selectedPubId || "CUSTOM",
      customerName: matrimonyForm.name,
      customerMobile: matrimonyForm.mobile1,
      formData: {
        ...matrimonyForm,
        district_hi: matrimonyForm.district_hi,
        sangathan_hi: matrimonyForm.sangathan_hi,
        magazine_hi: matrimonyForm.magazine_hi || "परिचायिका",
        edition_hi: matrimonyForm.edition_hi || "संस्करण 2026"
      }
    };

    try {
      const res = await fetch("/api/advertisements/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAdId(data.id);
        setSavedAdNumber(data.adNumber);
        setSavedPrice(data.price);
        setMatrimonyForm((prev) => ({
          ...prev,
          district_hi: matrimonyForm.district_hi,
          sangathan_hi: matrimonyForm.sangathan_hi,
          magazine_hi: matrimonyForm.magazine_hi || "परिचायिका",
          edition_hi: matrimonyForm.edition_hi || "संस्करण 2026"
        }));
        setMatrimonyStep(3); // Go directly to Visual Preview
      } else {
        const err = await res.json();
        alert("त्रुटि: " + (err.error || "सुरक्षित करने में विफल।"));
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("नेटवर्क त्रुटि: विज्ञापन सुरक्षित करने में असमर्थ");
    }
  };

  // Matrimony Form Step 3: Approve -> Add to Cart
  const handleMatrimonyApprove = async () => {
    if (!savedAdId || !savedAdNumber) {
      alert("सुरक्षित विज्ञापन आईडी या नंबर अनुपलब्ध है।");
      return;
    }

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          adType: "matrimony",
          data: {
            ...matrimonyForm,
            adId: savedAdId,
            adNumber: savedAdNumber
          },
          price: savedPrice
        })
      });

      if (res.ok) {
        alert("सफलता: प्रविष्टि को कार्ट में जोड़ दिया गया है।");
        // Reset form states completely
        setMatrimonyForm({
          name: "", dob: "", height: "", blood_group: "", gotra: "",
          education: "", occupation: "", father_name: "", father_occupation: "", mother_name: "",
          mobile1: "", mobile2: "", whatsapp: "", currentAddress: "", permanentAddress: "",
          photoUrl: "", biodataUrl: "", district_id: "", sangathan_id: "", magazine_id: "", edition_id: ""
        });
        setSelectedPubId("");
        setSelectedSizeCode("");
        setSavedAdId(null);
        setSavedAdNumber("");
        setMatrimonyStep(1);
        setScreen("cart");
      }
    } catch (err) {
      console.error("Cart add failed:", err);
    }
  };

  // Business Form: Validate Details and Save directly to DB -> Proceed to Step 3 (Visual Designer)
  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.businessName || !businessForm.mobile1) {
      alert("कृपया व्यवसाय का नाम और संपर्क नंबर अवश्य भरें।");
      return;
    }
    if (!selectedSizeCode) {
      alert("कृपया विज्ञापन आकार अवश्य चुनें।");
      return;
    }
    if (!businessForm.district_hi || !businessForm.sangathan_hi) {
      alert("कृपया जिला और साहू संगठन अवश्य भरें।");
      return;
    }

    const sz = masters.sizes.find((s) => s.code === selectedSizeCode);

    const payload = {
      adId: savedAdId, // can be null or a pre-existing ID for edit
      typeCode: "business",
      publicationId: selectedPubId || "CUSTOM",
      sizeCode: selectedSizeCode,
      customerName: businessForm.businessName,
      customerMobile: businessForm.mobile1,
      formData: {
        ...businessForm,
        district_hi: businessForm.district_hi,
        sangathan_hi: businessForm.sangathan_hi,
        magazine_hi: businessForm.magazine_hi || "परिचायिका",
        edition_hi: businessForm.edition_hi || "संस्करण 2026",
        size_code: selectedSizeCode,
        size_hi: sz ? sz.name_hi : "व्यावसायिक आकार"
      }
    };

    try {
      const res = await fetch("/api/advertisements/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAdId(data.id);
        setSavedAdNumber(data.adNumber);
        setSavedPrice(data.price);
        setBusinessForm((prev) => ({
          ...prev,
          district_hi: businessForm.district_hi,
          sangathan_hi: businessForm.sangathan_hi,
          magazine_hi: businessForm.magazine_hi || "परिचायिका",
          edition_hi: businessForm.edition_hi || "संस्करण 2026",
          size_code: selectedSizeCode,
          size_hi: sz ? sz.name_hi : "व्यावसायिक आकार"
        }));
        setBusinessStep(3); // Go directly to Visual Designer (Ad Maker)
      } else {
        const err = await res.json();
        alert("त्रुटि: " + (err.error || "सुरक्षित करने में विफल।"));
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("नेटवर्क त्रुटि: विज्ञापन सुरक्षित करने में असमर्थ");
    }
  };

  // Business Form Step 3: Receive approved layout design configuration from AI Ad Maker -> Add to Cart
  const handleApproveAdMakerDesign = async (approvedLayout: any) => {
    if (!savedAdId || !savedAdNumber) {
      alert("सुरक्षित विज्ञापन आईडी या नंबर अनुपलब्ध है।");
      return;
    }

    const updatedForm = { 
      ...businessForm, 
      adMakerDesignJson: approvedLayout,
      adId: savedAdId,
      adNumber: savedAdNumber
    };
    setBusinessForm(updatedForm);

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          adType: "business",
          data: updatedForm,
          price: savedPrice
        })
      });

      if (res.ok) {
        alert("सफलता: व्यवसाय विज्ञापन को डिज़ाइन के साथ कार्ट में जोड़ दिया गया है।");
        // Reset form states completely
        setBusinessForm({
          businessName: "", ownerName: "", category: "", businessDesc: "", productsServices: "",
          specialOffer: "", keyFeatures: "", mobile1: "", mobile2: "", whatsapp: "", email: "",
          businessAddress: "", otherAddress: "", logoUrl: "", photoUrl: "", readyAdUrl: "",
          district_id: "", sangathan_id: "", magazine_id: "", edition_id: "", size_code: ""
        });
        setSelectedPubId("");
        setSelectedSizeCode("");
        setSavedAdId(null);
        setSavedAdNumber("");
        setBusinessStep(1);
        setScreen("cart");
      }
    } catch (err) {
      console.error("Business ad cart failed:", err);
    }
  };

  // Remove from Shopping Cart API Call
  const handleRemoveCartItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/cart/remove/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear entire cart
  const handleClearCart = async () => {
    try {
      const res = await fetch("/api/cart/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Finalize order creation and fetch Dynamic UPI Payload
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone) {
      alert("कृपया मुख्य संपर्क नाम और मोबाइल नंबर अवश्य भरें।");
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/order/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          customerName: checkoutName,
          customerMobile: checkoutPhone
        })
      });

      if (res.ok) {
        const result = await res.json();
        setOrderResult(result);
        setScreen("checkout");
      } else {
        const err = await res.json();
        alert(`चेकआउट विफल: ${err.error}`);
      }
    } catch (err) {
      alert("चेकआउट सर्वर त्रुटि");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Customer submits payment proof Transaction Reference number (UTR)
  const handlePaymentProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef.trim()) {
      alert("कृपया भुगतान संदर्भ नंबर / UTR / Transaction ID डालें।");
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/order/payment-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderResult?.orderId,
          paymentRef,
          customerName: checkoutName
        })
      });

      if (res.ok) {
        alert("सफलता: भुगतान प्रमाण सत्यापन हेतु सबमिट कर दिया गया है। एडमिन द्वारा समीक्षा के उपरांत पावती/Invoice बन जाएगी।");
        
        // Build a mock/submitted invoice object to show instantly to client
        const invoicePayload: Order = {
          id: Date.now(),
          order_id: orderResult?.orderId || "ORD-PENDING",
          total_amount: orderResult?.totalAmount || 0,
          payment_status: "SUBMITTED",
          payment_ref: paymentRef,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          items: cart.map((it, idx) => ({
            id: idx,
            order_id: orderResult?.orderId || "ORD-PENDING",
            ad_number: `PENDING / ${it.data.sangathan_hi || "संगठन"} / ${it.data.magazine_hi || "परिचायिका"} / ${orderResult?.orderId}`,
            ad_type: it.adType,
            district_hi: it.data.district_hi || "रायपुर",
            sangathan_hi: it.data.sangathan_hi || "साहू संगठन",
            magazine_hi: it.data.magazine_hi || "परिचायिका",
            edition_hi: it.data.edition_hi || "संस्करण 2026",
            size_hi: it.adType === "matrimony" ? "विवाह मानक" : (it.data as BusinessFormState).size_hi || "आकार",
            price: it.price,
            customer_name: checkoutName,
            customer_mobile: checkoutPhone
          }))
        };

        setActiveInvoiceOrder(invoicePayload);
        setScreen("invoice");
        // Reset checkout state
        setOrderResult(null);
        setCheckoutName("");
        setCheckoutPhone("");
        setPaymentRef("");
        setCart([]);
      }
    } catch (err) {
      alert("प्रमाण जमा करने में असमर्थ");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans text-[#2D2D2D]">
      <datalist id="district-datalist">
        {uniqueDistricts.map((d, idx) => (
          <option key={idx} value={d} />
        ))}
      </datalist>
      <datalist id="sangathan-datalist">
        {uniqueSangathans.map((s, idx) => (
          <option key={idx} value={s} />
        ))}
      </datalist>

      {/* HEADER */}
      <header className="w-full bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2.5 rounded-xl shadow-md text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#E65100] tracking-tight cursor-pointer" onClick={() => setScreen("home")}>
              परिचायिका
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
              Powered by Indian Press
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("cart")}
            className="relative p-2 text-stone-600 hover:text-orange-600 transition-all flex items-center gap-1 cursor-pointer"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setScreen(screen === "admin" ? "home" : "admin")}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:text-orange-600 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            {screen === "admin" ? "होमपेज" : "एडमिन लॉगिन"}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* HOMEPAGE */}
        {screen === "home" && (
          <div className="space-y-12 my-6">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 leading-tight">
                साहू समाज युवक-युवती परिचय सम्मेलन की प्रविष्टियाँ यहाँ दें
              </h2>
              <p className="text-sm text-stone-500 max-w-lg mx-auto">
                परिचायिका पत्रिका प्रकाशन एवं सम्मेलन में सहभागिता हेतु अपने विवाह विवरण या व्यापार के विज्ञापन यहाँ सीधे दर्ज करें।
              </p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Box 1: Matrimony Entry */}
              <div
                onClick={() => {
                  setSavedAdId(null);
                  setSavedAdNumber("");
                  setSelectedPubId("");
                  setSelectedSizeCode("");
                  setMatrimonyStep(1);
                  setMatrimonyForm({
                    name: "", dob: "", height: "", blood_group: "", gotra: "",
                    education: "", occupation: "", father_name: "", father_occupation: "", mother_name: "",
                    mobile1: "", mobile2: "", whatsapp: "", currentAddress: "", permanentAddress: "",
                    photoUrl: "", biodataUrl: "", district_id: "", sangathan_id: "", magazine_id: "", edition_id: ""
                  });
                  setScreen("matrimony_form");
                }}
                className="group cursor-pointer bg-white border border-stone-200 hover:border-orange-500 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl p-8 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Heart className="w-8 h-8 text-[#E65100] fill-orange-100" />
                </div>
                <h3 className="text-xl font-bold text-stone-800">विवाह विज्ञापन दें</h3>
                <p className="text-stone-500 text-xs">
                  स्वयं या परिवार के युवक-युवती परिचय सम्मेलन विवरण दर्ज करें एवं मानक ३.५ × २ इंच आकार का कॉलम बुक करें।
                </p>
                <span className="inline-flex items-center text-[#E65100] font-bold text-xs pt-2">
                  प्रविष्टि प्रारंभ करें <ChevronRight className="w-4 h-4 ml-1" />
                </span>
              </div>

              {/* Box 2: Business Entry */}
              <div
                onClick={() => {
                  setSavedAdId(null);
                  setSavedAdNumber("");
                  setSelectedPubId("");
                  setSelectedSizeCode("");
                  setBusinessStep(1);
                  setBusinessForm({
                    businessName: "", ownerName: "", category: "", businessDesc: "", productsServices: "",
                    specialOffer: "", keyFeatures: "", mobile1: "", mobile2: "", whatsapp: "", email: "",
                    businessAddress: "", otherAddress: "", logoUrl: "", photoUrl: "", readyAdUrl: "",
                    district_id: "", sangathan_id: "", magazine_id: "", edition_id: "", size_code: ""
                  });
                  setScreen("business_form");
                }}
                className="group cursor-pointer bg-white border border-stone-200 hover:border-orange-600 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl p-8 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-orange-50/60 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-800">व्यवसाय विज्ञापन दें</h3>
                <p className="text-stone-500 text-xs">
                  अपने व्यापार/दुकान की परिचायिका विज्ञापन बुक करें। आकर्षक डिज़ाइन बनाने हेतु AI एड-मेकर की सुविधा।
                </p>
                <span className="inline-flex items-center text-orange-600 font-bold text-xs pt-2">
                  प्रारंभ करें <ChevronRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MATRIMONY ENTRY FORM */}
        {screen === "matrimony_form" && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setScreen("home");
              }}
              className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              वापस होमपेज
            </button>

            {matrimonyStep === 1 && (
              <form onSubmit={handleMatrimonySave} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Form Fields Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TransliteratedInput
                    value={matrimonyForm.name}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, name: val })}
                    label="युवक-युवती का नाम (Name)"
                    required
                  />

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">जन्म तिथि (Date of Birth)</label>
                    <input
                      type="date"
                      value={matrimonyForm.dob}
                      onChange={(e) => setMatrimonyForm({ ...matrimonyForm, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <TransliteratedInput
                    value={matrimonyForm.height}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, height: val })}
                    label="ऊँचाई (Height - e.g. 5.4 ft)"
                  />

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      रक्त समूह (Blood Group)
                    </label>
                    <input
                      type="text"
                      value={matrimonyForm.blood_group}
                      onChange={(e) => setMatrimonyForm({ ...matrimonyForm, blood_group: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white placeholder-stone-400 text-sm outline-none focus:border-orange-500 font-medium"
                      placeholder="e.g. AB+, O+, B+"
                    />
                  </div>

                  <TransliteratedInput
                    value={matrimonyForm.gotra}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, gotra: val })}
                    label="गोत्र (Gotra)"
                  />

                  <TransliteratedInput
                    value={matrimonyForm.occupation}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, occupation: val })}
                    label="व्यवसाय/नौकरी (Occupation)"
                  />

                  <div className="md:col-span-2">
                    <TransliteratedInput
                      value={matrimonyForm.education}
                      onChange={(val) => setMatrimonyForm({ ...matrimonyForm, education: val })}
                      label="विस्तृत शैक्षणिक योग्यता (Education Detail)"
                      isTextArea
                      rows={2}
                      placeholder="अल्पविराम ( , ) लगाकर एक से अधिक डिग्री दर्ज करें (जैसे: 12th, B.Com, MBA...)"
                    />
                  </div>

                  <TransliteratedInput
                    value={matrimonyForm.father_name}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, father_name: val })}
                    label="पिता का नाम"
                  />

                  <TransliteratedInput
                    value={matrimonyForm.father_occupation}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, father_occupation: val })}
                    label="पिता का व्यवसाय"
                  />

                  <TransliteratedInput
                    value={matrimonyForm.mother_name}
                    onChange={(val) => setMatrimonyForm({ ...matrimonyForm, mother_name: val })}
                    label="माता का नाम"
                  />

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">मोबाइल नंबर 1 *</label>
                    <input
                      type="tel"
                      required
                      value={matrimonyForm.mobile1}
                      onChange={(e) => setMatrimonyForm({ ...matrimonyForm, mobile1: e.target.value })}
                      placeholder="दस अंकों का संपर्क नंबर"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">मोबाइल नंबर 2</label>
                    <input
                      type="tel"
                      value={matrimonyForm.mobile2}
                      onChange={(e) => setMatrimonyForm({ ...matrimonyForm, mobile2: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">WhatsApp नंबर</label>
                    <input
                      type="tel"
                      value={matrimonyForm.whatsapp}
                      onChange={(e) => setMatrimonyForm({ ...matrimonyForm, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TransliteratedInput
                      value={matrimonyForm.currentAddress}
                      onChange={(val) => setMatrimonyForm({ ...matrimonyForm, currentAddress: val })}
                      label="वर्तमान पता (Current Address)"
                      isTextArea
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TransliteratedInput
                      value={matrimonyForm.permanentAddress}
                      onChange={(val) => setMatrimonyForm({ ...matrimonyForm, permanentAddress: val })}
                      label="स्थायी पता (Permanent Address)"
                      isTextArea
                      rows={2}
                    />
                  </div>

                  {/* Dynamic Custom Fields */}
                  {dynFields.matrimony.filter(f => !["name", "dob", "height", "blood_group", "gotra", "education", "occupation", "father_name", "father_occupation", "mother_name", "mobile1", "mobile2", "whatsapp", "currentaddress", "permanentaddress", "photourl", "biodataurl", "currentAddress", "permanentAddress", "photoUrl", "biodataUrl"].includes(f.field_name)).map((f) => {
                    const fieldVal = matrimonyForm[f.field_name] || f.default_value || "";
                    const onChangeVal = (val: string) => setMatrimonyForm({ ...matrimonyForm, [f.field_name]: val });

                    return (
                      <div key={f.id} className={f.field_type === "textarea" ? "md:col-span-2" : ""}>
                        {f.field_type === "textarea" ? (
                          <TransliteratedInput
                            value={fieldVal}
                            onChange={onChangeVal}
                            label={f.label}
                            required={f.required === 1}
                            isTextArea
                            rows={2}
                          />
                        ) : f.field_type === "select" ? (
                          <div>
                            <label className="text-sm font-semibold text-stone-700 block mb-1">
                              {f.label}{f.required ? " *" : ""}
                            </label>
                            <select
                              value={fieldVal}
                              onChange={(e) => onChangeVal(e.target.value)}
                              required={f.required === 1}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                            >
                              <option value="">-- चुनें --</option>
                              {f.select_options.split(",").map((opt: string) => (
                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                              ))}
                            </select>
                            {f.help_text && <p className="text-[11px] text-stone-400 mt-1">{f.help_text}</p>}
                          </div>
                        ) : (
                          <div>
                            <TransliteratedInput
                              value={fieldVal}
                              onChange={onChangeVal}
                              label={f.label}
                              required={f.required === 1}
                              placeholder={f.placeholder || ""}
                            />
                            {f.help_text && <p className="text-[11px] text-stone-400 mt-1">{f.help_text}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Document & Photo Upload Pipeline */}
                  <div className="border border-stone-200 rounded-xl p-5 bg-stone-50 grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2 shadow-inner">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                        युवक/युवती का फोटो (JPG/PNG) <span className="text-red-500">*</span>
                      </label>
                      
                      <div className="relative">
                        <input
                          id="matrimony-photoUrl-file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "photoUrl")}
                          className="sr-only"
                        />
                        
                        {/* Custom Large Interactive Clickable Card */}
                        <label
                          htmlFor="matrimony-photoUrl-file"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-orange-500 bg-white hover:bg-orange-50/20 rounded-xl p-5 cursor-pointer transition-all active:scale-[0.98] min-h-[110px]"
                        >
                          <div className="flex flex-col items-center text-center space-y-1">
                            <UploadIcon className="w-6 h-6 text-[#E65100]" />
                            <span className="text-xs font-bold text-stone-700">फ़ाइल चुनें (Choose Image)</span>
                            <span className="text-[10px] text-stone-400">अधिकतम साइज: 15MB (JPG/PNG)</span>
                          </div>
                        </label>
                      </div>

                      {uploadingField === "photoUrl" && (
                        <p className="text-xs text-orange-600 font-semibold mt-2 flex items-center gap-1.5 animate-pulse">
                          <span className="inline-block w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                          फ़ोटो अपलोड हो रही है, कृपया प्रतीक्षा करें...
                        </p>
                      )}

                      {(uploadSuccesses["photoUrl"] || matrimonyForm.photoUrl) && matrimonyForm.photoUrl && (
                        <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            ✓ फ़ोटो सफलतापूर्वक अपलोड हो गई है
                          </p>
                          <div className="flex items-center gap-3">
                            <img src={matrimonyForm.photoUrl} alt="Uploaded Photo" className="h-16 w-16 object-cover rounded-lg border border-stone-200 shadow-xs" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => handleUploadRemove("photoUrl")}
                              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                            >
                              हटाएँ (Remove)
                            </button>
                          </div>
                        </div>
                      )}

                      {uploadErrors["photoUrl"] && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg space-y-1.5">
                          <p className="text-xs text-red-600 font-semibold leading-relaxed">अपलोड विफल: {uploadErrors["photoUrl"]}</p>
                          <button
                            type="button"
                            onClick={() => handleUploadRetry("photoUrl")}
                            className="text-xs font-bold text-orange-700 bg-white hover:bg-orange-50 px-2.5 py-1 rounded border border-orange-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            पुनः प्रयास करें
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                        पहले से बना बायोडाटा (PDF/JPG) <span className="text-stone-400 font-normal">(वैकल्पिक)</span>
                      </label>
                      
                      <div className="relative">
                        <input
                          id="matrimony-biodataUrl-file"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, "biodataUrl")}
                          className="sr-only"
                        />
                        
                        {/* Custom Large Interactive Clickable Card */}
                        <label
                          htmlFor="matrimony-biodataUrl-file"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-orange-500 bg-white hover:bg-orange-50/20 rounded-xl p-5 cursor-pointer transition-all active:scale-[0.98] min-h-[110px]"
                        >
                          <div className="flex flex-col items-center text-center space-y-1">
                            <UploadIcon className="w-6 h-6 text-[#E65100]" />
                            <span className="text-xs font-bold text-stone-700">बायोडाटा फ़ाइल चुनें (PDF/JPG)</span>
                            <span className="text-[10px] text-stone-400">अधिकतम साइज: 15MB (PDF/JPG)</span>
                          </div>
                        </label>
                      </div>

                      {uploadingField === "biodataUrl" && (
                        <p className="text-xs text-orange-600 font-semibold mt-2 flex items-center gap-1.5 animate-pulse">
                          <span className="inline-block w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                          बायोडाटा अपलोड हो रहा है, कृपया प्रतीक्षा करें...
                        </p>
                      )}

                      {(uploadSuccesses["biodataUrl"] || matrimonyForm.biodataUrl) && matrimonyForm.biodataUrl && (
                        <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            ✓ बायोडाटा फ़ाइल अपलोड हो गई है
                          </p>
                          <div className="flex items-center justify-between gap-3 bg-white p-2 rounded border border-stone-100 shadow-2xs">
                            <span className="text-xs font-bold text-stone-700 truncate max-w-[150px]">
                              {matrimonyForm.biodataUrl.split("/").pop() || "बायोडाटा फ़ाइल"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUploadRemove("biodataUrl")}
                              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer shrink-0"
                            >
                              हटाएँ (Remove)
                            </button>
                          </div>
                        </div>
                      )}

                      {uploadErrors["biodataUrl"] && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg space-y-1.5">
                          <p className="text-xs text-red-600 font-semibold leading-relaxed">अपलोड विफल: {uploadErrors["biodataUrl"]}</p>
                          <button
                            type="button"
                            onClick={() => handleUploadRetry("biodataUrl")}
                            className="text-xs font-bold text-orange-700 bg-white hover:bg-orange-50 px-2.5 py-1 rounded border border-orange-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            पुनः प्रयास करें
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* प्रकाशन पत्रिका एवं साहू संगठन चयन */}
                <div className="pt-6 border-t border-stone-200 space-y-4">
                  <h3 className="text-base font-bold text-stone-800 border-b pb-2">प्रकाशन पत्रिका एवं साहू संगठन चयन</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">पत्रिका प्रकाशन (पूर्व-निर्धारित सूची - वैकल्पिक)</label>
                      <select
                        value={selectedPubId}
                        onChange={(e) => handlePubSelectionChange(e.target.value, "matrimony")}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-800"
                      >
                        <option value="">-- पूर्व-निर्धारित सूची से चुनें --</option>
                        {userConfigs.filter((cfg) => (cfg.adv_type === "विवाह" || cfg.adv_type === "matrimony") && cfg.status === "enabled").map((cfg) => (
                          <option key={cfg.configuration_id} value={cfg.configuration_id}>
                            {cfg.district} • {cfg.sangathan} • {cfg.magazine} ({cfg.edition}) — ₹{cfg.pricing} [Super Admin]
                          </option>
                        ))}
                        {masters.publications.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.district_hi} • {p.sangathan_hi} • {p.magazine_hi} ({p.edition_hi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">जिला (District) *</label>
                      <input
                        type="text"
                        required
                        value={matrimonyForm.district_hi || ""}
                        onChange={(e) => setMatrimonyForm({ ...matrimonyForm, district_hi: e.target.value })}
                        list="district-datalist"
                        placeholder="जैसे: रायपुर"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 bg-white placeholder-stone-400 outline-none focus:border-orange-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">संगठन (Sangathan) *</label>
                      <input
                        type="text"
                        required
                        value={matrimonyForm.sangathan_hi || ""}
                        onChange={(e) => setMatrimonyForm({ ...matrimonyForm, sangathan_hi: e.target.value })}
                        list="sangathan-datalist"
                        placeholder="जैसे: रायपुर साहू संगठन"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 bg-white placeholder-stone-400 outline-none focus:border-orange-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow cursor-pointer"
                  >
                    विज्ञापन सुरक्षित करें और प्रीव्यू देखें
                  </button>
                </div>
              </form>
            )}

            {matrimonyStep === 3 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-md space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-stone-800">विज्ञापन प्रीव्यू (सटीक प्रिंट रूप)</h3>
                    <p className="text-xs text-stone-500">सम्मेलन परिचायिका पत्रिका हेतु 3.5 × 2 इंच का वास्तविक लेआउट</p>
                  </div>
                  
                  {/* Theme toggles */}
                  <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-xl">
                    {(["classic", "premium", "bold", "minimal"] as const).map((styleName) => (
                      <button
                        key={styleName}
                        type="button"
                        onClick={() => setMatrimonyTheme(styleName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          matrimonyTheme === styleName
                            ? "bg-white text-stone-900 shadow-sm"
                            : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        {styleName === "classic" ? "क्लासिक (Classic)" : 
                         styleName === "premium" ? "प्रीमियम (Premium)" : 
                         styleName === "bold" ? "बोल्ड (Bold)" : "न्यूनतम (Minimal)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend Guidelines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-red-500"></span>
                    <span><strong>मार्जिन / ब्लीड गाइडलाइन:</strong> 3mm बाहरी ब्लीड क्षेत्र</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-500"></span>
                    <span><strong>टेक्स्ट सुरक्षित क्षेत्र:</strong> महत्वपूर्ण जानकारी सुरक्षा सीमा</span>
                  </div>
                </div>

                {/* Visual guidelines wrapper with background pattern resembling print desk */}
                <div className="flex flex-col items-center justify-center py-10 bg-stone-100 rounded-2xl border border-stone-200 shadow-inner overflow-x-auto">
                  
                  {/* Real Scale 3.5" x 2" (350px x 200px equivalent) */}
                  <div className="relative p-6 bg-[#FAFAFA] border border-stone-300 shadow-xl rounded-md select-none shrink-0">
                    
                    {/* Bleed guide line (outer red dotted border) */}
                    <div className="absolute inset-2 border border-dashed border-red-400 pointer-events-none rounded">
                      <span className="absolute -top-4 left-2 bg-red-100 text-red-600 text-[8px] font-bold px-1 rounded">ब्लीड सीमा</span>
                    </div>

                    {/* Safe zone guide line (inner blue dotted border) */}
                    <div className="absolute inset-5 border border-dashed border-blue-400 pointer-events-none rounded">
                      <span className="absolute -bottom-4 right-2 bg-blue-100 text-blue-600 text-[8px] font-bold px-1 rounded">सुरक्षित क्षेत्र</span>
                    </div>

                    {/* Actual card rendering inside */}
                    <div 
                      className={`relative w-[350px] h-[200px] border p-4 flex gap-3 transition-all ${
                        matrimonyTheme === "classic" ? "bg-[#FFFDF6] border-stone-800 text-stone-900" :
                        matrimonyTheme === "premium" ? "bg-[#FAF5EC] border-[#C5A880] text-stone-800 font-serif" :
                        matrimonyTheme === "bold" ? "bg-white border-4 border-stone-950 text-stone-950 font-sans" :
                        "bg-white border border-stone-200 text-stone-700 font-light"
                      }`}
                      style={{
                        fontFamily: matrimonyTheme === "premium" ? "Georgia, serif" : "system-ui, sans-serif"
                      }}
                    >
                      {/* Top-left matrimony ad number (Ad Number 001...) - plain red text, no patch */}
                      <div className="absolute top-1.5 left-2.5 text-red-600 font-mono font-black text-[11px] z-10 select-none">
                        {savedAdNumber || "001"}
                      </div>

                      {/* Photo block */}
                      <div className="w-[85px] h-[115px] bg-stone-100 border border-stone-200 rounded overflow-hidden shrink-0 self-center relative shadow-sm">
                        {matrimonyForm.photoUrl ? (
                          <img src={matrimonyForm.photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-400 font-bold text-center p-1 bg-stone-50">
                            फोटो उपलब्ध नहीं
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                        <div className="space-y-1">
                          <h4 className={`text-sm font-black border-b pb-0.5 tracking-wide truncate ${
                            matrimonyTheme === "classic" ? "text-orange-900 border-orange-200" :
                            matrimonyTheme === "premium" ? "text-amber-800 border-amber-200" :
                            matrimonyTheme === "bold" ? "text-black border-black border-b-2" :
                            "text-stone-900 border-stone-100"
                          }`}>
                            {matrimonyForm.name || "युवक-युवती का नाम"}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] leading-[11px]">
                            <p className="truncate"><span className="font-bold text-stone-900">जन्म:</span> {matrimonyForm.dob || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">ऊँचाई:</span> {matrimonyForm.height || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">गोत्र:</span> {matrimonyForm.gotra || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">रक्त समूह:</span> {matrimonyForm.blood_group || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">पिता:</span> {matrimonyForm.father_name || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">पिता व्यव:</span> {matrimonyForm.father_occupation || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">माता:</span> {matrimonyForm.mother_name || "-"}</p>
                            <p className="truncate"><span className="font-bold text-stone-900">व्यवसाय:</span> {matrimonyForm.occupation || "-"}</p>
                            <p className="col-span-2 truncate"><span className="font-bold text-stone-900">शिक्षा:</span> {matrimonyForm.education || "-"}</p>
                            <p className="col-span-2 truncate"><span className="font-bold text-stone-900">पता:</span> {matrimonyForm.currentAddress || matrimonyForm.permanentAddress || "-"}</p>
                            
                            {/* System generated Ad number directly inside card layout */}
                            <p className="col-span-2 text-[7.5px] font-mono font-bold text-red-600 border-t border-dashed border-stone-200 pt-0.5 mt-0.5 truncate">
                              ID: {savedAdNumber || "001"}
                            </p>
                          </div>
                        </div>

                        {/* Contact info at bottom */}
                        <div className={`pt-1 border-t flex justify-between items-center text-[10px] ${
                          matrimonyTheme === "classic" ? "border-orange-200 text-stone-700" :
                          matrimonyTheme === "premium" ? "border-amber-200 text-stone-600" :
                          matrimonyTheme === "bold" ? "border-black text-black font-bold" :
                          "border-stone-100 text-stone-500"
                        }`}>
                          <span className="font-mono">संपर्क: {matrimonyForm.mobile1}</span>
                          <span className="text-[8px] uppercase tracking-wider px-1 bg-stone-100 rounded text-stone-400 font-mono">3.5 × 2 INCH</span>
                        </div>
                      </div>

                    </div>
                  </div>
                  <span className="text-[11px] text-stone-400 mt-4 font-semibold">3.5 x 2 इंच (परिचायिका ब्लॉक अनुपात) • ब्लीड क्षेत्र काटकर छपाई होगी</span>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center justify-center space-y-1">
                  <span className="text-xs text-stone-600">प्रकाशन दर (Price): <strong className="text-base text-stone-900 font-mono">₹{savedPrice}</strong></span>
                  <span className="text-xs text-orange-600">विज्ञापन संख्या (Ad Number): <strong className="font-mono">{savedAdNumber}</strong></span>
                </div>

                <div className="flex justify-between items-center border-t border-stone-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setMatrimonyStep(2)}
                    className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    प्रकाशन बदलें
                  </button>
                  <button
                    type="button"
                    onClick={handleMatrimonyApprove}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow cursor-pointer"
                  >
                    स्वीकृत करें और कार्ट में जोड़ें (Locks Item)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BUSINESS ADVERTISEMENT ENTRY FORM */}
        {screen === "business_form" && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setScreen("home");
              }}
              className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              वापस होमपेज
            </button>

            {businessStep === 1 && (
              <form onSubmit={handleBusinessSave} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TransliteratedInput
                    value={businessForm.businessName}
                    onChange={(val) => setBusinessForm({ ...businessForm, businessName: val })}
                    label="व्यवसाय/संस्था का नाम (Business Name)"
                    required
                  />

                  <TransliteratedInput
                    value={businessForm.ownerName}
                    onChange={(val) => setBusinessForm({ ...businessForm, ownerName: val })}
                    label="मालिक/संचालक का नाम (Owner)"
                  />

                  <TransliteratedInput
                    value={businessForm.category}
                    onChange={(val) => setBusinessForm({ ...businessForm, category: val })}
                    label="व्यवसाय श्रेणी (Category - e.g. किराना, ज्वेलर्स, क्लॉथ स्टोर)"
                  />

                  <TransliteratedInput
                    value={businessForm.specialOffer}
                    onChange={(val) => setBusinessForm({ ...businessForm, specialOffer: val })}
                    label="विशेष ऑफर (Special Offer - e.g. 5% की सीधी छूट!)"
                  />

                  <div className="md:col-span-2">
                    <TransliteratedInput
                      value={businessForm.businessDesc}
                      onChange={(val) => setBusinessForm({ ...businessForm, businessDesc: val })}
                      label="व्यवसाय विवरण (Business Description)"
                      isTextArea
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TransliteratedInput
                      value={businessForm.productsServices}
                      onChange={(val) => setBusinessForm({ ...businessForm, productsServices: val })}
                      label="मुख्य उत्पाद एवं सेवाएँ (Products & Services)"
                      isTextArea
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">मोबाइल नंबर 1 *</label>
                    <input
                      type="tel"
                      required
                      value={businessForm.mobile1}
                      onChange={(e) => setBusinessForm({ ...businessForm, mobile1: e.target.value })}
                      placeholder="दस अंकों का संपर्क नंबर"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">मोबाइल नंबर 2</label>
                    <input
                      type="tel"
                      value={businessForm.mobile2}
                      onChange={(e) => setBusinessForm({ ...businessForm, mobile2: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">WhatsApp नंबर</label>
                    <input
                      type="tel"
                      value={businessForm.whatsapp}
                      onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">ईमेल (Email Address)</label>
                    <input
                      type="email"
                      value={businessForm.email}
                      onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                      placeholder="info@example.com"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TransliteratedInput
                      value={businessForm.businessAddress}
                      onChange={(val) => setBusinessForm({ ...businessForm, businessAddress: val })}
                      label="व्यवसाय पता (Business Address)"
                      isTextArea
                      rows={2}
                    />
                  </div>

                  {/* Dynamic Custom Fields */}
                  {dynFields.business.filter(f => !["businessName", "ownerName", "category", "businessDesc", "productsServices", "specialOffer", "keyFeatures", "mobile1", "mobile2", "whatsapp", "email", "businessAddress", "otherAddress", "logoUrl", "photoUrl", "readyAdUrl", "businessname", "ownername", "businessdesc", "productsservices", "specialoffer", "keyfeatures", "businessaddress", "otheraddress", "logourl", "photourl", "readyadurl"].includes(f.field_name)).map((f) => {
                    const fieldVal = businessForm[f.field_name] || f.default_value || "";
                    const onChangeVal = (val: string) => setBusinessForm({ ...businessForm, [f.field_name]: val });

                    return (
                      <div key={f.id} className={f.field_type === "textarea" ? "md:col-span-2" : ""}>
                        {f.field_type === "textarea" ? (
                          <TransliteratedInput
                            value={fieldVal}
                            onChange={onChangeVal}
                            label={f.label}
                            required={f.required === 1}
                            isTextArea
                            rows={2}
                          />
                        ) : f.field_type === "select" ? (
                          <div>
                            <label className="text-sm font-semibold text-stone-700 block mb-1">
                              {f.label}{f.required ? " *" : ""}
                            </label>
                            <select
                              value={fieldVal}
                              onChange={(e) => onChangeVal(e.target.value)}
                              required={f.required === 1}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 bg-white"
                            >
                              <option value="">-- चुनें --</option>
                              {f.select_options.split(",").map((opt: string) => (
                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                              ))}
                            </select>
                            {f.help_text && <p className="text-[11px] text-stone-400 mt-1">{f.help_text}</p>}
                          </div>
                        ) : (
                          <div>
                            <TransliteratedInput
                              value={fieldVal}
                              onChange={onChangeVal}
                              label={f.label}
                              required={f.required === 1}
                              placeholder={f.placeholder || ""}
                            />
                            {f.help_text && <p className="text-[11px] text-stone-400 mt-1">{f.help_text}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Image Logo uploads pipeline */}
                  <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 grid grid-cols-1 md:grid-cols-3 gap-4 col-span-2">
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase block mb-1.5">व्यवसाय लोगो (Logo Image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "logoUrl")}
                        className="text-xs w-full"
                      />
                      {uploadingField === "logoUrl" && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                          अपलोड हो रहा है...
                        </p>
                      )}
                      {uploadSuccesses["logoUrl"] && businessForm.logoUrl && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ लोगो सफलतापूर्वक अपलोड हुआ
                          </p>
                          <div className="flex items-center gap-2">
                            <img src={businessForm.logoUrl} alt="Logo" className="h-12 w-auto border object-contain rounded bg-white p-0.5" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => handleUploadRemove("logoUrl")}
                              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                            >
                              हटाएँ
                            </button>
                          </div>
                        </div>
                      )}
                      {!uploadSuccesses["logoUrl"] && businessForm.logoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={businessForm.logoUrl} alt="Logo" className="h-12 w-auto border object-contain rounded bg-white p-0.5" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleUploadRemove("logoUrl")}
                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                          >
                            हटाएँ
                          </button>
                        </div>
                      )}
                      {uploadErrors["logoUrl"] && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
                          <p className="text-xs text-red-600 font-semibold">अपलोड विफल: {uploadErrors["logoUrl"]}</p>
                          <button
                            type="button"
                            onClick={() => handleUploadRetry("logoUrl")}
                            className="mt-1 text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer"
                          >
                            पुनः प्रयास करें
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase block mb-1.5">दुकान/व्यवसाय फोटो (Shop Image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "photoUrl")}
                        className="text-xs w-full"
                      />
                      {uploadingField === "photoUrl" && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                          अपलोड हो रहा है...
                        </p>
                      )}
                      {uploadSuccesses["photoUrl"] && businessForm.photoUrl && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ फोटो सफलतापूर्वक अपलोड हुई
                          </p>
                          <div className="flex items-center gap-2">
                            <img src={businessForm.photoUrl} alt="Shop Preview" className="h-12 w-auto border object-cover rounded" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => handleUploadRemove("photoUrl")}
                              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                            >
                              हटाएँ
                            </button>
                          </div>
                        </div>
                      )}
                      {!uploadSuccesses["photoUrl"] && businessForm.photoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={businessForm.photoUrl} alt="Shop Preview" className="h-12 w-auto border object-cover rounded" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleUploadRemove("photoUrl")}
                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                          >
                            हटाएँ
                          </button>
                        </div>
                      )}
                      {uploadErrors["photoUrl"] && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
                          <p className="text-xs text-red-600 font-semibold">अपलोड विफल: {uploadErrors["photoUrl"]}</p>
                          <button
                            type="button"
                            onClick={() => handleUploadRetry("photoUrl")}
                            className="mt-1 text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer"
                          >
                            पुनः प्रयास करें
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase block mb-1.5">पहले से बना विज्ञापन (Custom AD)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "readyAdUrl")}
                        className="text-xs w-full"
                      />
                      {uploadingField === "readyAdUrl" && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
                          अपलोड हो रहा है...
                        </p>
                      )}
                      {uploadSuccesses["readyAdUrl"] && businessForm.readyAdUrl && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ विज्ञापन सफलतापूर्वक अपलोड हुआ
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded">विज्ञापन.pdf / .jpg</span>
                            <button
                              type="button"
                              onClick={() => handleUploadRemove("readyAdUrl")}
                              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                            >
                              हटाएँ
                            </button>
                          </div>
                        </div>
                      )}
                      {!uploadSuccesses["readyAdUrl"] && businessForm.readyAdUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded">विज्ञापन.pdf / .jpg</span>
                          <button
                            type="button"
                            onClick={() => handleUploadRemove("readyAdUrl")}
                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                          >
                            हटाएँ
                          </button>
                        </div>
                      )}
                      {uploadErrors["readyAdUrl"] && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
                          <p className="text-xs text-red-600 font-semibold">अपलोड विफल: {uploadErrors["readyAdUrl"]}</p>
                          <button
                            type="button"
                            onClick={() => handleUploadRetry("readyAdUrl")}
                            className="mt-1 text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer"
                          >
                            पुनः प्रयास करें
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* प्रकाशन पत्रिका, साहू संगठन एवं विज्ञापन आकार */}
                <div className="pt-6 border-t border-stone-200 space-y-4">
                  <h3 className="text-base font-bold text-stone-800 border-b pb-2">प्रकाशन पत्रिका, साहू संगठन एवं विज्ञापन आकार</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">पत्रिका प्रकाशन (पूर्व-निर्धारित सूची - वैकल्पिक)</label>
                      <select
                        value={selectedPubId}
                        onChange={(e) => handlePubSelectionChange(e.target.value, "business")}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-800"
                      >
                        <option value="">-- पूर्व-निर्धारित सूची से चुनें --</option>
                        {userConfigs.filter((cfg) => (cfg.adv_type === "व्यवसाय" || cfg.adv_type === "business") && cfg.status === "enabled").map((cfg) => (
                          <option key={cfg.configuration_id} value={cfg.configuration_id}>
                            {cfg.district} • {cfg.sangathan} • {cfg.magazine} ({cfg.edition}) — ₹{cfg.pricing} [Super Admin]
                          </option>
                        ))}
                        {masters.publications.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.district_hi} • {p.sangathan_hi} • {p.magazine_hi} ({p.edition_hi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#E65100] block mb-1">विज्ञापन आकार चुनें *</label>
                      <select
                        value={selectedSizeCode}
                        required
                        onChange={(e) => setSelectedSizeCode(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E65100] rounded-lg text-sm bg-white text-stone-800 font-bold animate-pulse-subtle"
                      >
                        <option value="">-- आकार चुनें --</option>
                        {masters.sizes.filter(sz => sz.code !== "matrimony_standard").map((sz) => (
                          <option key={sz.id} value={sz.code}>{sz.name_hi}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">जिला (District) *</label>
                      <input
                        type="text"
                        required
                        value={businessForm.district_hi || ""}
                        onChange={(e) => setBusinessForm({ ...businessForm, district_hi: e.target.value })}
                        list="district-datalist"
                        placeholder="जैसे: रायपुर"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 bg-white placeholder-stone-400 outline-none focus:border-orange-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">संगठन (Sangathan) *</label>
                      <input
                        type="text"
                        required
                        value={businessForm.sangathan_hi || ""}
                        onChange={(e) => setBusinessForm({ ...businessForm, sangathan_hi: e.target.value })}
                        list="sangathan-datalist"
                        placeholder="जैसे: रायपुर साहू संगठन"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 bg-white placeholder-stone-400 outline-none focus:border-orange-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow cursor-pointer"
                  >
                    विवरण सुरक्षित करें और डिज़ाइन मेकर खोलें
                  </button>
                </div>
              </form>
            )}

            {businessStep === 3 && (
              /* AD MAKER SCREEN BLOCK WITH PERSISTENT AD DETAILS */
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-stone-500 font-semibold">सिस्टम द्वारा आवंटित विज्ञापन संख्या (Ad Number)</p>
                    <p className="text-lg font-black text-orange-600 font-mono">{savedAdNumber}</p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs text-stone-500 font-semibold">निर्धारित दर (Price)</p>
                    <p className="text-lg font-black text-stone-900 font-mono">₹{savedPrice}</p>
                  </div>
                </div>

                <AdMakerPanel
                  businessInfo={{
                    ...businessForm,
                    adId: savedAdId,
                    adNumber: savedAdNumber
                  }}
                  sizeCode={selectedSizeCode}
                  sizeName={masters.sizes.find(s => s.code === selectedSizeCode)?.name_hi || "विज्ञापन"}
                  onApproveDesign={handleApproveAdMakerDesign}
                />
              </div>
            )}
          </div>
        )}

        {/* SHOPPING CART VIEW */}
        {screen === "cart" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <ShoppingCart className="text-[#E65100]" />
              आपकी विज्ञापन कार्ट (Your Shopping Cart)
            </h3>

            {isLoadingCart ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
            ) : cart.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Cart list items */}
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex justify-between items-center gap-4">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          item.adType === "matrimony" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {item.adType === "matrimony" ? "विवाह विज्ञापन" : "व्यवसाय विज्ञापन"}
                        </span>
                        <h4 className="text-base font-bold text-stone-800 mt-2">
                          {item.adType === "matrimony" ? item.data.name : (item.data as BusinessFormState).businessName}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1">
                          प्रकाशन: {item.data.district_hi} • {item.data.sangathan_hi} • {item.data.magazine_hi} ({item.data.edition_hi})
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-xs text-stone-400 font-semibold">दर (Price)</p>
                          <p className="text-lg font-mono font-black text-stone-900">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveCartItem(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-colors cursor-pointer"
                          title="हटाएँ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleClearCart}
                      className="text-xs font-semibold text-stone-500 hover:text-red-600 bg-stone-100 hover:bg-red-50 border px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      कार्ट खाली करें (Clear Cart)
                    </button>
                    <button
                      onClick={() => setScreen("home")}
                      className="text-xs font-bold text-[#E65100] hover:underline"
                    >
                      + अन्य विज्ञापन जोड़ें
                    </button>
                  </div>
                </div>

                {/* Checkout Summary Box */}
                <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-bold text-stone-800 border-b pb-2">आर्डर सारांश (Summary)</h4>

                  <div className="space-y-2 text-sm text-stone-600 font-medium">
                    <div className="flex justify-between">
                      <span>कुल विज्ञापन (Ads):</span>
                      <span className="font-bold text-stone-800">{cart.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-stone-900 font-bold">
                      <span>कुल योग (Total Amount):</span>
                      <span className="text-lg font-black text-[#E65100] font-mono">₹{getCartTotal().toLocaleString("en-IN")}.00</span>
                    </div>
                  </div>

                  {/* Customer Checkout Form */}
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">मुख्य आवेदक का नाम *</label>
                      <input
                        type="text"
                        required
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        placeholder="उदा. राम कुमार साहू"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1">मुख्य मोबाइल नंबर *</label>
                      <input
                        type="tel"
                        required
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        placeholder="10 अंकों का फ़ोन नंबर"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCheckingOut}
                      className="w-full bg-[#E65100] hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          प्रविष्टि आर्डर बन रहा है...
                        </>
                      ) : (
                        "भुगतान चरण पर जाएँ"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl p-8 space-y-4 max-w-lg mx-auto">
                <ShoppingCart className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="text-base font-bold text-stone-600">आपकी विज्ञापन कार्ट अभी खाली है</h4>
                <p className="text-xs text-stone-400">कृपया विवाह या व्यावसायिक विज्ञापन दर्ज करके शुरू करें।</p>
                <button
                  onClick={() => setScreen("home")}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-6 py-2 rounded-lg"
                >
                  विज्ञापन दर्ज करें
                </button>
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT PAYMENT GATEWAY WORKFLOW SCREEN */}
        {screen === "checkout" && orderResult && (
          <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden my-6">
            <div className="bg-orange-600 p-6 text-white text-center">
              <QrCode className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-xl font-bold">आधिकारिक सुरक्षित यूपीआई भुगतान</h3>
              <p className="text-xs text-orange-100 mt-1">Sahu Press Payment Hub - Recipient: 9301056006</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Billing statistics */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                <span className="text-xs font-semibold text-stone-500 block mb-1">आर्डर ID: {orderResult.orderId}</span>
                <span className="text-3xl font-mono font-black text-stone-900">₹{orderResult.totalAmount.toLocaleString("en-IN")}.00</span>
                <span className="text-[11px] text-[#E65100] font-bold block mt-1.5">यह राशि सीधे आपके बैंक से कटेगी</span>
              </div>

              {/* QR Image Box */}
              <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-white border border-stone-200 rounded-xl max-w-xs mx-auto shadow-inner">
                <p className="text-xs font-bold text-stone-500 text-center uppercase tracking-wider">भुगतान हेतु इस QR को स्कैन करें</p>
                
                {/* Dynamically generated high quality QR code using Google Charts API */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(orderResult.upiPayload)}`}
                  alt="UPI QR Code"
                  className="w-44 h-44 border p-1 rounded"
                />

                <span className="text-xs font-black text-stone-700 bg-stone-100 px-3 py-1 rounded-full font-mono">
                  9301056006@paytm
                </span>
              </div>

              {/* Pay via UPI App (India UPI standard deep links with App Logos) */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center space-y-3 max-w-xs mx-auto shadow-xs">
                <p className="text-xs font-bold text-orange-950">
                  सीधे अपने मोबाइल यूपीआई एप्प से भुगतान करें (Pay from any UPI):
                </p>
                
                {/* Main Instant Pay Button */}
                <a
                  href={orderResult.upiPayload}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#E65100] hover:bg-orange-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md transition-all active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  यहाँ क्लिक कर सीधे पे करें (Pay Now)
                </a>

                {/* Subtext explaining it works on Phone */}
                <p className="text-[10px] text-stone-500 font-medium leading-tight">
                  * यह बटन मोबाइल पर सीधे आपके PhonePe, Paytm, GPay, BHIM आदि को चालू कर देगा।
                </p>

                {/* Brand Logos/Badges row */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {/* PhonePe badge */}
                  <a
                    href={orderResult.upiPayload}
                    className="flex items-center justify-center gap-1 bg-white hover:bg-purple-50 border border-stone-200 px-2 py-1 rounded shadow-2xs transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    <span className="text-[9px] font-bold text-purple-950 font-sans tracking-tight">PhonePe</span>
                  </a>

                  {/* Paytm badge */}
                  <a
                    href={orderResult.upiPayload}
                    className="flex items-center justify-center gap-1 bg-white hover:bg-sky-50 border border-stone-200 px-2 py-1 rounded shadow-2xs transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    <span className="text-[9px] font-bold text-sky-950 font-sans tracking-tight">Paytm</span>
                  </a>

                  {/* GPay badge */}
                  <a
                    href={orderResult.upiPayload}
                    className="flex items-center justify-center gap-1 bg-white hover:bg-blue-50 border border-stone-200 px-2 py-1 rounded shadow-2xs transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span className="text-[9px] font-bold text-stone-900 font-sans tracking-tight">GPay</span>
                  </a>

                  {/* BHIM UPI badge */}
                  <a
                    href={orderResult.upiPayload}
                    className="flex items-center justify-center gap-1 bg-white hover:bg-emerald-50 border border-stone-200 px-2 py-1 rounded shadow-2xs transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span className="text-[9px] font-bold text-emerald-950 font-sans tracking-tight">BHIM UPI</span>
                  </a>
                </div>
              </div>

              {/* Instruction checklist */}
              <div className="border-t border-stone-100 pt-4 space-y-4">
                <div className="flex gap-2 text-xs text-stone-600">
                  <span className="bg-orange-100 text-[#E65100] font-black h-5 w-5 rounded-full shrink-0 flex items-center justify-center">1</span>
                  <p className="mt-0.5">भीम यूपीआई (PhonePe, GPay, Paytm) एप्प से उपरोक्त QR कोड को स्कैन करके ₹{orderResult.totalAmount} का भुगतान करें।</p>
                </div>

                <div className="flex gap-2 text-xs text-stone-600">
                  <span className="bg-orange-100 text-[#E65100] font-black h-5 w-5 rounded-full shrink-0 flex items-center justify-center">2</span>
                  <p className="mt-0.5">सफल भुगतान के पश्चात 12 अंकों का संदर्भ नंबर (UTR / Ref ID) नीचे दर्ज करके प्रमाण प्रस्तुत करें।</p>
                </div>
              </div>

              {/* Submit Proof Form */}
              <form onSubmit={handlePaymentProofSubmit} className="space-y-4 border-t pt-4">
                <div>
                  <label className="text-xs font-semibold text-[#E65100] block mb-1">भुगतान संदर्भ (UTR / Ref ID / Transaction ID) *</label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="उदा. UTR 624519503381..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 shadow"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      प्रमाण दर्ज हो रहा है...
                    </>
                  ) : (
                    "भुगतान प्रमाण सबमिट करें"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* INVOICE VIEW FOR USER AFTER SUBMISSION */}
        {screen === "invoice" && activeInvoiceOrder && (
          <div className="space-y-6 print:m-0">
            <div className="flex justify-center print:hidden">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-xl flex items-center gap-2 max-w-2xl w-full">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>आपका आवेदन सबमिट हो गया है। एडमिन द्वारा UTR की जाँच होते ही विज्ञापन नंबर प्रकाशित हो जाएंगे।</span>
              </div>
            </div>

            <InvoicePDF
              order={activeInvoiceOrder}
              onClose={() => {
                setActiveInvoiceOrder(null);
                setScreen("home");
              }}
            />
          </div>
        )}

        {/* ADMIN LOGIN & DASHBOARD MOUNT */}
        {screen === "admin" && (
          <AdminPanel />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200 px-6 py-8 shrink-0 print:hidden mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">मुद्रण प्रकाशन कार्यालय</span>
              <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                गांधी नगर, पहाड़ी चौक,<br />गुढ़ियारी, रायपुर (छत्तीसगढ़)
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">पूछताछ 1</span>
                <p className="text-xs text-stone-900 font-bold">7647924636</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">पूछताछ 2</span>
                <p className="text-xs text-stone-900 font-bold">9300717080</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">भुगतान सहायता</span>
                <p className="text-xs text-[#E65100] font-black underline decoration-orange-300">9301056006</p>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end w-full md:w-auto">
            <div className="h-9 px-4 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-[9px] text-orange-700 font-bold tracking-widest uppercase">SECURE PAYMENT HUB</span>
            </div>
            <p className="text-[11px] text-stone-400">© 2026 परिचायिका | Powered by Indian Press, Raipur</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

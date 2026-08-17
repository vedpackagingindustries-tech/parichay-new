import React, { useState, useEffect } from "react";
import {
  Lock,
  User,
  LogOut,
  Layers,
  Database,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings,
  Grid,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  LockKeyhole,
  Loader2,
  TrendingUp,
  CreditCard,
  ListPlus,
  ArrowLeft,
  Check,
  X,
  Printer,
  MessageSquare
} from "lucide-react";
import { Order, Advertisement } from "../types";
import PrintProduction from "./PrintProduction";
import InvoicePDF from "./InvoicePDF";

interface AdminPanelProps {
  onLogout?: () => void;
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Tabs: 'orders' | 'print' | 'configs' | 'masters' | 'settings' | 'fields' | 'whatsapp_logs'
  const [activeTab, setActiveTab] = useState<"orders" | "print" | "configs" | "masters" | "settings" | "fields" | "whatsapp_logs">("orders");

  // Admin Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "SUBMITTED" | "REJECTED" | "PENDING">("ALL");
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Search/Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [waSearch, setWaSearch] = useState("");

  // Masters configuration local lists
  const [districts, setDistricts] = useState<any[]>([]);
  const [sangathans, setSangathans] = useState<any[]>([]);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [editions, setEditions] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [pricings, setPricings] = useState<any[]>([]);

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAdminInvoice, setShowAdminInvoice] = useState<boolean>(false);

  // Reject Payment Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<"Invalid UTR" | "Low Amount" | "Incorrect/Blank Screenshot" | "Custom">("Invalid UTR");
  const [customRejectReason, setCustomRejectReason] = useState<string>("");

  // Masters insertion forms
  const [newDistrict, setNewDistrict] = useState({ name_en: "", name_hi: "" });
  const [newSangathan, setNewSangathan] = useState({ district_id: "", name_en: "", name_hi: "" });
  const [newPricing, setNewPricing] = useState({
    district_id: "",
    sangathan_id: "",
    magazine_id: "1",
    edition_id: "",
    adv_type_code: "matrimony",
    adv_size_code: "matrimony_standard",
    price: ""
  });

  // State to track admin pricing modifications in real-time
  const [editingPrices, setEditingPrices] = useState<Record<number, number>>({});

  // Settings forms
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Admin Configurations States
  const [adminConfigs, setAdminConfigs] = useState<any[]>([]);
  const [isEditingConfig, setIsEditingConfig] = useState<number | null>(null);
  const [configForm, setConfigForm] = useState({
    district: "",
    sangathan: "",
    magazine: "",
    edition: "",
    adv_type: "",
    size_name: "",
    width: "",
    height: "",
    unit: "inch",
    layout: "",
    pricing: "",
    status: "enabled"
  });

  // Setup forms and check states
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");

  // Recovery States
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [whatsappRecoveryUrl, setWhatsappRecoveryUrl] = useState("");

  // URL Reset Token State
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Recovery Configuration Settings
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState("");
  const [adminRecoveryWhatsapp, setAdminRecoveryWhatsapp] = useState("");
  const [recoverySaveSuccess, setRecoverySaveSuccess] = useState("");
  const [recoverySaveError, setRecoverySaveError] = useState("");

  // Custom Fields States
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [selectedFormType, setSelectedFormType] = useState<"matrimony" | "business">("matrimony");
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    field_name: "",
    label: "",
    field_type: "text",
    required: false,
    placeholder: "",
    help_text: "",
    default_value: "",
    visible: true,
    display_order: 10,
    select_options: ""
  });
  const [fieldActionError, setFieldActionError] = useState("");
  const [fieldActionSuccess, setFieldActionSuccess] = useState("");

  // Load token from storage on mount
  useEffect(() => {
    // Check initial setup requirement
    fetch("/api/admin/setup-status")
      .then(r => r.json())
      .then(d => {
        setSetupRequired(d.setupRequired);
        setCheckingSetup(false);
      })
      .catch(() => setCheckingSetup(false));

    // Parse recovery token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setResetToken(tokenParam);
    }

    const savedToken = localStorage.getItem("parichayika_admin_token");
    const savedUser = localStorage.getItem("parichayika_admin_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsername(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch admin dashboard data
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchDashboardData();
    }
  }, [isLoggedIn, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("parichayika_admin_token", data.token);
        localStorage.setItem("parichayika_admin_user", data.username);
        setToken(data.token);
        setUsername(data.username);
        setIsLoggedIn(true);
        setPassword("");
      } else {
        const err = await res.json();
        setLoginError(err.error || "त्रुटि: पासवर्ड या यूजरनेम सही नहीं है");
      }
    } catch (err) {
      setLoginError("सर्वर से संपर्क करने में असमर्थ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("parichayika_admin_token");
    localStorage.removeItem("parichayika_admin_user");
    setToken("");
    setIsLoggedIn(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySuccess("");
    setRecoveryError("");
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await res.json();
      if (res.ok) {
        const absResetUrl = window.location.origin + data.resetUrl;
        setRecoverySuccess(`सुरक्षित रीसेट लिंक सफलतापूर्वक जनरेट हो गया है। आप इस पर क्लिक करके या कॉपी करके पासवर्ड बदल सकते हैं:\n${absResetUrl}`);
        if (data.whatsappNumber) {
          const waMsg = `नमस्ते, परिचायिका सुपर एडमिन पासवर्ड रीसेट लिंक यहाँ उपलब्ध है: ${absResetUrl}`;
          const waUrl = `https://wa.me/${data.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`;
          setWhatsappRecoveryUrl(waUrl);
        } else {
          setWhatsappRecoveryUrl("");
        }
      } else {
        setRecoveryError(data.error || "त्रुटि: पासवर्ड रीसेट लिंक जनरेट करने में विफलता");
      }
    } catch (err) {
      setRecoveryError("सर्वर से संपर्क करने में असमर्थ");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess("");
    setResetError("");
    if (resetPasswordVal !== resetConfirmPassword) {
      setResetError("पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।");
      return;
    }
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword: resetPasswordVal })
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message || "पासवर्ड सफलतापूर्वक रीसेट हो गया है। अब आप लॉगिन कर सकते हैं।");
        setTimeout(() => {
          setResetToken("");
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 3000);
      } else {
        setResetError(data.error || "रीसेट टोकन अमान्य या समाप्त हो चुका है।");
      }
    } catch (err) {
      setResetError("सर्वर से संपर्क करने में असमर्थ");
    }
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupSuccess("");
    setSetupError("");
    if (setupPassword !== setupConfirmPassword) {
      setSetupError("पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।");
      return;
    }
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: setupUsername,
          password: setupPassword,
          confirmPassword: setupConfirmPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSetupSuccess(data.message || "सुपर एडमिन सेटअप सफलतापूर्वक पूर्ण हुआ।");
        setSetupRequired(false);
      } else {
        setSetupError(data.error || "सेटअप विफल रहा।");
      }
    } catch (err) {
      setSetupError("सर्वर से संपर्क करने में असमर्थ");
    }
  };

  const handleSaveRecoverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySaveSuccess("");
    setRecoverySaveError("");
    try {
      const res = await fetch("/api/admin/recovery-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recoveryEmail: adminRecoveryEmail,
          recoveryWhatsapp: adminRecoveryWhatsapp
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRecoverySaveSuccess(data.message || "रिकवरी सेटिंग्स सुरक्षित की गईं।");
      } else {
        setRecoverySaveError(data.error || "सुरक्षित करने में विफलता।");
      }
    } catch (err) {
      setRecoverySaveError("सर्वर से संपर्क करने में असमर्थ");
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldActionSuccess("");
    setFieldActionError("");
    
    const url = editingFieldId ? `/api/admin/custom-fields/${editingFieldId}` : "/api/admin/custom-fields";
    const method = editingFieldId ? "PUT" : "POST";
    
    const payload = {
      ...fieldForm,
      form_type: selectedFormType,
      field_name: fieldForm.field_name || fieldForm.label.toLowerCase().replace(/[^a-z0-9_]/g, "_")
    };
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setFieldActionSuccess(editingFieldId ? "फ़ील्ड सफलतापूर्वक संशोधित हुआ।" : "फ़ील्ड सफलतापूर्वक जोड़ा गया।");
        setIsAddingField(false);
        setEditingFieldId(null);
        setFieldForm({
          field_name: "",
          label: "",
          field_type: "text",
          required: false,
          placeholder: "",
          help_text: "",
          default_value: "",
          visible: true,
          display_order: 10,
          select_options: ""
        });
        fetchCustomFields();
      } else {
        setFieldActionError(data.error || "कार्रवाई विफल रही।");
      }
    } catch (err) {
      setFieldActionError("सर्वर से संपर्क करने में असमर्थ");
    }
  };

  const handleEditFieldClick = (field: any) => {
    setEditingFieldId(field.id);
    setIsAddingField(true);
    setFieldForm({
      field_name: field.field_name,
      label: field.label,
      field_type: field.field_type,
      required: field.required === 1,
      placeholder: field.placeholder || "",
      help_text: field.help_text || "",
      default_value: field.default_value || "",
      visible: field.visible === 1,
      display_order: field.display_order || 10,
      select_options: field.select_options || ""
    });
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!window.confirm("क्या आप वाकई इस फ़ील्ड को हटाना चाहते हैं?")) return;
    setFieldActionSuccess("");
    setFieldActionError("");
    try {
      const res = await fetch(`/api/admin/custom-fields/${fieldId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFieldActionSuccess("फ़ील्ड सफलतापूर्वक हटा दिया गया।");
        fetchCustomFields();
      } else {
        setFieldActionError(data.error || "हटाने में विफल।");
      }
    } catch (err) {
      setFieldActionError("सर्वर से संपर्क करने में असमर्थ");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };
      const bodyData = {
        ...configForm,
        width: Number(configForm.width || 0),
        height: Number(configForm.height || 0),
        pricing: Number(configForm.pricing || 0)
      };

      let url = "/api/admin/configurations";
      let method = "POST";

      if (isEditingConfig !== null) {
        url = `/api/admin/configurations/${isEditingConfig}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        alert(isEditingConfig ? "सफलता: कॉन्फ़िगरेशन अपडेट किया गया।" : "सफलता: नया कॉन्फ़िगरेशन जोड़ा गया।");
        setIsEditingConfig(null);
        setConfigForm({
          district: "",
          sangathan: "",
          magazine: "",
          edition: "",
          adv_type: "",
          size_name: "",
          width: "",
          height: "",
          unit: "inch",
          layout: "",
          pricing: "",
          status: "enabled"
        });
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`त्रुटि: ${err.error}`);
      }
    } catch (err) {
      alert("सुरक्षित करने में विफलता");
    }
  };

  const handleEditConfigClick = (cfg: any) => {
    setIsEditingConfig(cfg.id);
    setConfigForm({
      district: cfg.district || "",
      sangathan: cfg.sangathan || "",
      magazine: cfg.magazine || "",
      edition: cfg.edition || "",
      adv_type: cfg.adv_type || "",
      size_name: cfg.size_name || "",
      width: String(cfg.width || ""),
      height: String(cfg.height || ""),
      unit: cfg.unit || "inch",
      layout: cfg.layout || "",
      pricing: String(cfg.pricing || ""),
      status: cfg.status || "enabled"
    });
  };

  const handleDeleteConfig = async (id: number) => {
    if (!window.confirm("क्या आप इस कॉन्फ़िगरेशन को हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`/api/admin/configurations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("सफलता: कॉन्फ़िगरेशन हटाया गया।");
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`त्रुटि: ${err.error}`);
      }
    } catch (err) {
      alert("हटाने में विफलता");
    }
  };

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Orders
      const resOrders = await fetch("/api/admin/orders", { headers });
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data);
      }

      // 2. Fetch Advertisements
      const resAds = await fetch("/api/admin/advertisements", { headers });
      if (resAds.ok) {
        const data = await resAds.json();
        setAdvertisements(data);
      }

      // 2.5 Fetch WhatsApp Logs
      const resLogs = await fetch("/api/admin/whatsapp-logs", { headers });
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setWhatsappLogs(logsData);
      }

      // 3. Fetch Master Lists
      const resMasters = await fetch("/api/masters");
      if (resMasters.ok) {
        const data = await resMasters.json();
        setDistricts(data.districts);
        setSangathans(data.sangathans);
        setMagazines(data.magazines);
        setEditions(data.editions);
        setSizes(data.sizes);
        setPricings(data.pricings);
      }

      // 4. Fetch Admin Configurations
      const resConfigs = await fetch("/api/admin/configurations");
      if (resConfigs.ok) {
        const data = await resConfigs.json();
        setAdminConfigs(data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchCustomFields = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/custom-fields/${selectedFormType}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomFields(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecoverySettings = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/recovery-settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdminRecoveryEmail(data.recoveryEmail || "");
        setAdminRecoveryWhatsapp(data.recoveryWhatsapp || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchCustomFields();
    }
  }, [isLoggedIn, token, selectedFormType]);

  useEffect(() => {
    if (isLoggedIn && token && activeTab === "settings") {
      fetchRecoverySettings();
    }
  }, [isLoggedIn, token, activeTab]);

  // Trigger custom Reject Payment Modal
  const triggerRejectOrder = (orderId: string) => {
    setRejectingOrderId(orderId);
    setSelectedRejectReason("Invalid UTR");
    setCustomRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    let finalReason = "";
    if (selectedRejectReason === "Invalid UTR") {
      finalReason = "अमान्य संदर्भ संख्या (UTR) / बैंक रिकॉर्ड में भुगतान नहीं मिला।";
    } else if (selectedRejectReason === "Low Amount") {
      finalReason = "भुगतान राशि अधूरी है। कृपया पूरे विज्ञापन शुल्क का सही भुगतान करें।";
    } else if (selectedRejectReason === "Incorrect/Blank Screenshot") {
      finalReason = "स्क्रीनशॉट अस्पष्ट या खाली है। कृपया सही भुगतान रसीद अपलोड करें।";
    } else {
      finalReason = customRejectReason.trim() || "अमान्य संदर्भ संख्या (UTR) / भुगतान अमान्य है।";
    }

    setRejectModalOpen(false);
    await executeVerifyOrder(rejectingOrderId, "REJECTED", finalReason);
  };

  // Payment Verification API Trigger (PAID / REJECTED)
  const handleVerifyOrder = async (orderId: string, status: "PAID" | "REJECTED") => {
    if (status === "REJECTED") {
      triggerRejectOrder(orderId);
    } else {
      if (!window.confirm(`क्या आप ऑर्डर ${orderId} को स्वीकृत करना चाहते हैं?`)) return;
      await executeVerifyOrder(orderId, "PAID", "");
    }
  };

  const executeVerifyOrder = async (orderId: string, status: "PAID" | "REJECTED", reason: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      });

      if (res.ok) {
        alert(`सफलता: ऑर्डर को ${status === "PAID" ? "स्वीकृत" : "अस्वीकृत"} कर दिया गया है।`);
        setSelectedOrder(null);
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`त्रुटि: ${err.error}`);
      }
    } catch (err) {
      alert("सत्यापन अनुरोध विफल रहा");
    }
  };

  // Masters CRUD Trigger
  const handleAddMaster = async (entity: string, data: any) => {
    try {
      const res = await fetch(`/api/admin/masters/${entity}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert("सफलता: मास्टर डेटा जोड़ा गया।");
        fetchDashboardData();
        // Reset local forms
        if (entity === "districts") setNewDistrict({ name_en: "", name_hi: "" });
        if (entity === "sangathans") setNewSangathan({ district_id: "", name_en: "", name_hi: "" });
      } else {
        const err = await res.json();
        alert(`त्रुटि: ${err.error}`);
      }
    } catch (err) {
      alert("मास्टर डेटा जोड़ना विफल रहा");
    }
  };

  const handleUpdatePrice = async (pricingId: number, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) {
      alert("कृपया एक वैध दर (सकारात्मक अंक) दर्ज करें।");
      return;
    }
    try {
      const res = await fetch("/api/admin/pricings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: pricingId, price: newPrice })
      });
      if (res.ok) {
        alert("सफलता: प्रकाशन दर को सफलतापूर्वक अपडेट कर दिया गया है।");
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`त्रुटि: ${err.error}`);
      }
    } catch (err) {
      alert("प्रकाशन दर अपडेट करने में असमर्थ");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword) {
      setPasswordError("सभी पासवर्ड फ़ील्ड भरना आवश्यक है");
      return;
    }

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.ok) {
        setPasswordSuccess("सफलता: एडमिन पासवर्ड बदल दिया गया है!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        setPasswordError(err.error || "पासवर्ड बदलना विफल रहा");
      }
    } catch (err) {
      setPasswordError("सर्वर प्रतिक्रिया विफल रही");
    }
  };

  // Parse and match query criteria (supports multi-value searches like "रायपुर + 001")
  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    if (statusFilter !== "ALL" && order.payment_status !== statusFilter) {
      return false;
    }

    // 2. Search Query
    if (!searchQuery.trim()) return true;

    const parts = searchQuery.split("+").map((p) => p.trim().toLowerCase());
    return parts.every((part) => {
      if (!part) return true;

      // Check main order attributes
      const orderIdMatch = order.order_id.toLowerCase().includes(part);
      const statusMatch = order.payment_status.toLowerCase().includes(part);
      const refMatch = order.payment_ref?.toLowerCase().includes(part) || false;

      // Check items customer attributes
      const customerMatch = order.items?.some((it) => {
        return (
          it.customer_name.toLowerCase().includes(part) ||
          it.customer_mobile.includes(part) ||
          it.ad_number.toLowerCase().includes(part) ||
          it.district_hi.toLowerCase().includes(part) ||
          it.sangathan_hi.toLowerCase().includes(part) ||
          it.magazine_hi.toLowerCase().includes(part)
        );
      }) || false;

      return orderIdMatch || statusMatch || refMatch || customerMatch;
    });
  });

  // Render Login Card if logged out
  if (!isLoggedIn) {
    if (checkingSetup) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-sm text-stone-500 font-bold">सिस्टम सेटअप की जाँच हो रही है...</p>
        </div>
      );
    }

    // 1. Initial Setup Form (Wizard)
    if (setupRequired) {
      return (
        <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#E65100] p-6 text-white text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 bg-[#F57C00] p-2 rounded-full" />
            <h2 className="text-xl font-black">सुपर एडमिन सेटअप (Initial Setup)</h2>
            <p className="text-xs text-orange-100 mt-1">सुरक्षित शुरुआत के लिए सुपर एडमिन खाता बनाएं</p>
          </div>

          <form onSubmit={handleSetupAdmin} className="p-6 space-y-4">
            {setupError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
                {setupError}
              </div>
            )}
            {setupSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-lg text-center">
                {setupSuccess}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">ईमेल आईडी (Username/Email)</label>
              <input
                type="email"
                required
                value={setupUsername}
                onChange={(e) => setSetupUsername(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">पासवर्ड (Password)</label>
              <input
                type="password"
                required
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="न्यूनतम 6 अक्षर"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">पासवर्ड की पुष्टि करें (Confirm Password)</label>
              <input
                type="password"
                required
                value={setupConfirmPassword}
                onChange={(e) => setSetupConfirmPassword(e.target.value)}
                placeholder="पासवर्ड दोबारा प्रविष्ट करें"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
            >
              खाता बनाएं और सेटअप पूर्ण करें
            </button>
          </form>
        </div>
      );
    }

    // 2. Password Reset Form (Token in URL)
    if (resetToken) {
      return (
        <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-orange-600 p-6 text-white text-center">
            <LockKeyhole className="w-10 h-10 mx-auto mb-2 bg-orange-700 p-2 rounded-full" />
            <h2 className="text-xl font-black">नया पासवर्ड बनाएं (Reset Password)</h2>
            <p className="text-xs text-orange-100 mt-1">अपना नया सुरक्षित पासवर्ड प्रविष्ट करें</p>
          </div>

          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-lg text-center">
                {resetSuccess}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">नया पासवर्ड (New Password)</label>
              <input
                type="password"
                required
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                placeholder="नया मजबूत पासवर्ड बनाएँ"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">पासवर्ड की पुष्टि करें (Confirm Password)</label>
              <input
                type="password"
                required
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="पासवर्ड दोबारा प्रविष्ट करें"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all animate-pulse"
            >
              पासवर्ड सुरक्षित करें
            </button>
          </form>
        </div>
      );
    }

    // 3. Password Recovery / Send Reset Link View
    if (recoveryMode) {
      return (
        <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-orange-600 p-6 text-white text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 bg-orange-700 p-2 rounded-full" />
            <h2 className="text-xl font-black">पासवर्ड रिकवरी (Recovery)</h2>
            <p className="text-xs text-orange-100 mt-1">सुरक्षित रीसेट लिंक जनरेट करें</p>
          </div>

          <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
            {recoveryError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
                {recoveryError}
              </div>
            )}
            {recoverySuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-lg space-y-2">
                <p className="font-bold whitespace-pre-line">{recoverySuccess}</p>
                {whatsappRecoveryUrl && (
                  <div className="pt-2 border-t border-emerald-100">
                    <p className="text-[11px] text-emerald-600 mb-2">इस सुरक्षित रीसेट लिंक को WhatsApp पर भेजने के लिए नीचे क्लिक करें:</p>
                    <a
                      href={whatsappRecoveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded text-[11px] shadow transition-colors"
                    >
                      WhatsApp पर भेजें
                    </a>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">पंजीकृत ईमेल आईडी (Registered Email)</label>
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode(false);
                  setRecoveryEmail("");
                  setRecoverySuccess("");
                  setRecoveryError("");
                  setWhatsappRecoveryUrl("");
                }}
                className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold py-2 rounded-lg text-xs"
              >
                लॉगिन पर जाएँ
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-xs"
              >
                लिंक जनरेट करें
              </button>
            </div>
          </form>
        </div>
      );
    }

    // 4. Standard Login Panel
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-orange-600 p-6 text-white text-center">
          <Lock className="w-10 h-10 mx-auto mb-2 bg-orange-700 p-2 rounded-full" />
          <h2 className="text-xl font-black">सुपर एडमिन लॉगिन (परिचायिका)</h2>
          <p className="text-xs text-orange-100 mt-1">प्रविष्टियाँ एवं एडवरटाइजमेंट प्रकाशन प्रबंधन हेतु</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
              {loginError}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">यूज़रनेम / ईमेल (Username/Email)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="उदा. admin@example.com"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">पासवर्ड (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <LockKeyhole className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="उदा. admin123"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                प्रवेश की जाँच हो रही है...
              </>
            ) : (
              "डैशबोर्ड में प्रवेश करें"
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setRecoveryMode(true)}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold transition-all cursor-pointer"
            >
              पासवर्ड भूल गए? (Forgot Password / Recovery)
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Admin Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-900 text-white p-6 rounded-2xl mb-8 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-bold tracking-tight">परिचायिका एडमिन डैशबोर्ड (Super Admin)</h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            नमस्ते, <span className="font-semibold text-white uppercase">{username}</span> • Sahu Press Publication Management
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-1.5 border border-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-800 flex items-center gap-1.5 transition-all"
          >
            रीफ्रेश डेटा
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            लॉगआउट
          </button>
        </div>
      </div>

      {/* Admin Quick Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "कुल प्राप्त प्रविष्टियां", val: orders.length, desc: "कुल सबमिट ऑर्डर शीट्स" },
          { label: "विवाह विज्ञापन (Matrimony)", val: advertisements.filter(a => a.type_code === "matrimony").length, desc: "सक्रिय विवाह बायोडाटा" },
          { label: "व्यवसाय विज्ञापन (Business)", val: advertisements.filter(a => a.type_code === "business").length, desc: "सक्रिय व्यापार विज्ञापन" },
          { label: "लंबित सत्यापन (Submitted)", val: orders.filter(o => o.payment_status === "SUBMITTED").length, desc: "एडमिन अनुमोदन योग्य" },
          { label: "कुल एकत्र राशि", val: `₹${orders.filter(o => o.payment_status === "PAID").reduce((acc, curr) => acc + curr.total_amount, 0).toLocaleString("en-IN")}`, desc: "PAID भुगतान योग" }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">{stat.label}</span>
            <span className="text-xl font-black text-stone-800 block">{stat.val}</span>
            <span className="text-[10px] text-stone-500 mt-1 block leading-tight">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 mb-8 overflow-x-auto gap-1">
        {[
          { id: "orders", label: "प्रविष्टियाँ एवं आर्डर", icon: FileSpreadsheet },
          { id: "print", label: "प्रिंट प्रोडक्शन", icon: Grid },
          { id: "whatsapp_logs", label: "WhatsApp नोटिफिकेशन लॉग्स", icon: MessageSquare },
          { id: "configs", label: "प्रकाशन कॉन्फ़िगरेशन (Super Admin)", icon: Layers },
          { id: "fields", label: "फ़ील्ड बिल्डर (Fields)", icon: ListPlus },
          { id: "masters", label: "मास्टर्स कॉन्फ़िगरेशन", icon: Database },
          { id: "settings", label: "डैशबोर्ड सेटिंग्स", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs md:text-sm whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-orange-600 text-orange-600 bg-orange-50/50"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state indicator */}
      {isLoadingData && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <span className="text-sm font-semibold text-stone-500 ml-2">नवीनतम प्रविष्टियां लोड हो रही हैं...</span>
        </div>
      )}

      {/* TABS VIEWS */}

      {/* Tab 1: Orders and Entries management */}
      {!isLoadingData && activeTab === "orders" && (
        <div className="space-y-6">
          {/* Advanced combined Search Box & Status Filter */}
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="संयुक्त खोज करें... उदा. 'रायपुर + 001' या 'राम कुमार' या 'परिचायिका'..."
                className="w-full focus:outline-none text-stone-800 text-sm placeholder-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-stone-400 hover:text-stone-600 bg-stone-100 px-2 py-1 rounded"
                >
                  क्लियर
                </button>
              )}
            </div>

            {/* Status Filter Tabs/Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-500 mr-2">भुगतान स्थिति से फ़िल्टर करें:</span>
              {[
                { key: "ALL", label: "सभी आर्डर", count: orders.length },
                { key: "SUBMITTED", label: "⏳ सत्यापन लंबित", count: orders.filter(o => o.payment_status === "SUBMITTED").length },
                { key: "PAID", label: "🟢 स्वीकृत (PAID)", count: orders.filter(o => o.payment_status === "PAID").length },
                { key: "REJECTED", label: "🔴 अस्वीकृत (REJECTED)", count: orders.filter(o => o.payment_status === "REJECTED").length },
                { key: "PENDING", label: "⚪ अधूरा / PENDING", count: orders.filter(o => o.payment_status === "PENDING").length },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setStatusFilter(btn.key as any)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === btn.key
                      ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                      : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                  }`}
                >
                  {btn.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === btn.key ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600 font-black"}`}>
                    {btn.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders Listing Grid/Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-6 py-3.5">ऑर्डर ID / तिथि</th>
                  <th className="px-6 py-3.5">मुख्य ग्राहक</th>
                  <th className="px-6 py-3.5">प्रविष्टियां (विवरण)</th>
                  <th className="px-6 py-3.5">कुल राशि</th>
                  <th className="px-6 py-3.5">भुगतान स्थिति</th>
                  <th className="px-6 py-3.5 text-right">कार्य (Action)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-stone-100 text-stone-700 bg-white">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-stone-900">{ord.order_id}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {new Date(ord.created_at).toLocaleString("hi-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {ord.items && ord.items.length > 0 ? (
                        <>
                          <p className="font-bold text-stone-800">{ord.items[0].customer_name}</p>
                          <p className="text-xs text-stone-500">{ord.items[0].customer_mobile}</p>
                        </>
                      ) : (
                        <p className="text-stone-400 text-xs">विवरण अनुपलब्ध</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="flex flex-col">
                            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                              • {it.ad_type === "matrimony" ? "विवाह" : "व्यवसाय"}
                              <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-1 rounded border border-orange-100">
                                {it.ad_number}
                              </span>
                            </span>
                            <span className="text-[10px] text-stone-400 pl-2.5">
                              {it.district_hi} • {it.sangathan_hi} • {it.size_hi}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-stone-950">
                      ₹{ord.total_amount.toLocaleString("en-IN")}.00
                    </td>
                    <td className="px-6 py-4">
                      {ord.payment_status === "PAID" && (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                          स्वीकृत (PAID)
                        </span>
                      )}
                      {ord.payment_status === "SUBMITTED" && (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                          जाँच लंबित (SUBMITTED)
                        </span>
                      )}
                      {ord.payment_status === "REJECTED" && (
                        <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-200">
                          अस्वीकृत (REJECTED)
                        </span>
                      )}
                      {ord.payment_status === "PENDING" && (
                        <span className="bg-stone-100 text-stone-500 text-[11px] font-bold px-2.5 py-1 rounded-full border border-stone-200">
                          पेमेंट शेष (PENDING)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        जाँच करें
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-stone-400">
                      कोई आर्डर शीट नहीं मिली
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Print Production Mount */}
      {!isLoadingData && activeTab === "print" && (
        <PrintProduction advertisements={advertisements} />
      )}

      {/* Tab 2.1: WhatsApp Notification Logs */}
      {!isLoadingData && activeTab === "whatsapp_logs" && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-stone-800 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              WhatsApp स्वचालित सूचना रिकॉर्ड (WhatsApp Logs)
            </h3>
            <p className="text-xs text-stone-500">
              प्रविष्टियाँ सबमिट होने, स्वीकृत होने या अस्वीकृत होने पर कस्टमर्स एवं एडमिन को भेजे गए सभी स्वचालित व्हाट्सएप संदेशों का विवरण यहाँ देख सकते हैं।
            </p>
          </div>

          {/* Search Box within logs */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-stone-400 shrink-0" />
            <input
              type="text"
              value={waSearch}
              onChange={(e) => setWaSearch(e.target.value)}
              placeholder="नाम, नंबर, आर्डर ID या संदेश सामग्री से खोजें..."
              className="w-full focus:outline-none text-stone-800 text-sm placeholder-stone-400"
            />
            {waSearch && (
              <button
                onClick={() => setWaSearch("")}
                className="text-xs text-stone-400 hover:text-stone-600 bg-stone-100 px-2 py-1 rounded"
              >
                क्लियर
              </button>
            )}
          </div>

          {/* Logs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whatsappLogs
              .filter((log) => {
                if (!waSearch.trim()) return true;
                const query = waSearch.toLowerCase();
                return (
                  log.customer_name?.toLowerCase().includes(query) ||
                  log.phone?.toLowerCase().includes(query) ||
                  log.order_id?.toLowerCase().includes(query) ||
                  log.status?.toLowerCase().includes(query) ||
                  log.message?.toLowerCase().includes(query)
                );
              })
              .map((log) => (
                <div key={log.id} className="bg-stone-50 border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-stone-800 text-sm">{log.customer_name}</h4>
                        <p className="text-xs text-emerald-600 font-mono font-bold mt-0.5">{log.phone}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${
                        log.status?.includes("ADMIN")
                          ? "bg-stone-100 text-stone-700 border-stone-200"
                          : log.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : log.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {log.status === "PAID" ? "स्वीकृत (PAID)" : log.status === "REJECTED" ? "अस्वीकृत (REJECTED)" : log.status === "SUBMITTED" ? "सबमिट" : log.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                      <span>ऑर्डर ID: <b>{log.order_id}</b></span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleString("hi-IN")}</span>
                    </div>

                    {/* Chat Bubble style message rendering */}
                    <div className="bg-white border border-stone-150 rounded-lg p-3.5 text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                      {log.message}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-stone-250/50">
                    <button
                      onClick={() => {
                        const matchedOrder = orders.find((o) => o.order_id === log.order_id);
                        if (matchedOrder) {
                          setSelectedOrder(matchedOrder);
                          setActiveTab("orders");
                        } else {
                          alert("ऑर्डर विवरण नहीं मिला।");
                        }
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      संबद्ध ऑर्डर देखें
                    </button>

                    <a
                      href={`https://wa.me/${log.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(log.message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp भेजें
                    </a>
                  </div>
                </div>
              ))}

            {whatsappLogs.length === 0 && (
              <div className="col-span-full text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                कोई व्हाट्सएप नोटिफिकेशन लॉग उपलब्ध नहीं है।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Super Admin Configurations */}
      {!isLoadingData && activeTab === "configs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Form (Column 1) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-600" />
                {isEditingConfig ? "प्रकाशन कॉन्फ़िगरेशन संपादित करें" : "नया प्रकाशन कॉन्फ़िगरेशन जोड़ें"}
              </h3>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">जिला * (e.g. रायपुर)</label>
                  <input
                    type="text"
                    required
                    value={configForm.district}
                    onChange={(e) => setConfigForm({ ...configForm, district: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                    placeholder="जैसे: रायपुर"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">साहू संगठन * (e.g. रायपुर साहू समाज)</label>
                  <input
                    type="text"
                    required
                    value={configForm.sangathan}
                    onChange={(e) => setConfigForm({ ...configForm, sangathan: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                    placeholder="जैसे: रायपुर साहू संगठन"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">पत्रिका नाम * (e.g. परिचायिका)</label>
                  <input
                    type="text"
                    required
                    value={configForm.magazine}
                    onChange={(e) => setConfigForm({ ...configForm, magazine: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                    placeholder="जैसे: परिचायिका"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">संस्करण * (e.g. 2026)</label>
                  <input
                    type="text"
                    required
                    value={configForm.edition}
                    onChange={(e) => setConfigForm({ ...configForm, edition: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                    placeholder="जैसे: 2026"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">विज्ञापन का प्रकार *</label>
                  <select
                    required
                    value={configForm.adv_type}
                    onChange={(e) => setConfigForm({ ...configForm, adv_type: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium bg-white"
                  >
                    <option value="">-- चयन करें --</option>
                    <option value="विवाह">विवाह (Matrimony)</option>
                    <option value="व्यवसाय">व्यवसाय (Business)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">आकार का नाम * (e.g. विवाह मानक)</label>
                  <input
                    type="text"
                    required
                    value={configForm.size_name}
                    onChange={(e) => setConfigForm({ ...configForm, size_name: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                    placeholder="जैसे: विवाह मानक"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">चौड़ाई *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={configForm.width}
                      onChange={(e) => setConfigForm({ ...configForm, width: e.target.value })}
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                      placeholder="3.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">ऊंचाई *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={configForm.height}
                      onChange={(e) => setConfigForm({ ...configForm, height: e.target.value })}
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                      placeholder="2.0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">इकाई *</label>
                    <select
                      value={configForm.unit}
                      onChange={(e) => setConfigForm({ ...configForm, unit: e.target.value })}
                      className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium bg-white"
                    >
                      <option value="inch">inch</option>
                      <option value="cm">cm</option>
                      <option value="px">px</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">लेआउट नाम / टेम्पलेट (e.g. Standard)</label>
                  <input
                    type="text"
                    value={configForm.layout}
                    onChange={(e) => setConfigForm({ ...configForm, layout: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium"
                    placeholder="जैसे: Standard"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">निर्धारित मूल्य * (₹)</label>
                  <input
                    type="number"
                    required
                    value={configForm.pricing}
                    onChange={(e) => setConfigForm({ ...configForm, pricing: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium font-mono"
                    placeholder="₹ 500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">स्थिति *</label>
                  <select
                    value={configForm.status}
                    onChange={(e) => setConfigForm({ ...configForm, status: e.target.value })}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-medium bg-white"
                  >
                    <option value="enabled">सक्रिय (Enabled)</option>
                    <option value="disabled">निष्क्रिय (Disabled)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-lg transition-all cursor-pointer shadow-sm text-center"
                  >
                    {isEditingConfig ? "अपडेट करें" : "सुरक्षित करें"}
                  </button>
                  {(isEditingConfig || configForm.district) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingConfig(null);
                        setConfigForm({
                          district: "",
                          sangathan: "",
                          magazine: "",
                          edition: "",
                          adv_type: "",
                          size_name: "",
                          width: "",
                          height: "",
                          unit: "inch",
                          layout: "",
                          pricing: "",
                          status: "enabled"
                        });
                      }}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-lg transition-all cursor-pointer"
                    >
                      रद्द करें
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List/Table (Columns 2 & 3) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex justify-between items-center">
                <h3 className="text-base font-bold text-stone-800">
                  वर्तमान सक्रिय एवं निष्क्रिय प्रकाशन कॉन्फ़िगरेशन सूची
                </h3>
                <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full font-bold">
                  कुल: {adminConfigs.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                      <th className="px-4 py-3 text-xs">कॉन्फ़िगरेशन ID</th>
                      <th className="px-4 py-3 text-xs">विवरण (प्रकाशन एवं जिला)</th>
                      <th className="px-4 py-3 text-xs">प्रकार / आकार</th>
                      <th className="px-4 py-3 text-xs">मूल्य (₹)</th>
                      <th className="px-4 py-3 text-xs">स्थिति</th>
                      <th className="px-4 py-3 text-xs text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                    {adminConfigs.map((cfg) => (
                      <tr key={cfg.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                            {cfg.configuration_id}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-stone-800">{cfg.magazine} ({cfg.edition})</div>
                          <div className="text-xs text-stone-500">{cfg.district} &bull; {cfg.sangathan}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-stone-800">{cfg.adv_type}</div>
                          <div className="text-xs text-stone-500">{cfg.size_name} ({cfg.width} &times; {cfg.height} {cfg.unit})</div>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-stone-800">
                          ₹{cfg.pricing}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            cfg.status === "enabled"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {cfg.status === "enabled" ? "सक्रिय" : "निष्क्रिय"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditConfigClick(cfg)}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-all cursor-pointer"
                              title="संपादित करें"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteConfig(cfg.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
                              title="हटाएं"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminConfigs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-stone-400">
                          कोई कॉन्फ़िगरेशन नहीं मिला। कृपया जोड़ें।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Masters CRUD Setup Panel */}
      {!isLoadingData && activeTab === "masters" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add District/Sangathan Forms */}
          <div className="space-y-6">
            {/* Form: Add District */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-600" />
                नया जिला जोड़ें (Add District)
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-1">जिला (English)</label>
                  <input
                    type="text"
                    value={newDistrict.name_en}
                    onChange={(e) => setNewDistrict({ ...newDistrict, name_en: e.target.value })}
                    placeholder="e.g. Raipur"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-1">जिला (हिन्दी)</label>
                  <input
                    type="text"
                    value={newDistrict.name_hi}
                    onChange={(e) => setNewDistrict({ ...newDistrict, name_hi: e.target.value })}
                    placeholder="उदा. रायपुर"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => handleAddMaster("districts", newDistrict)}
                disabled={!newDistrict.name_en || !newDistrict.name_hi}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 text-white text-xs font-bold py-2 rounded-lg"
              >
                जिला जोड़ें
              </button>
            </div>

            {/* Form: Add Sangathan */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-600" />
                नया साहू संगठन जोड़ें (Add Sangathan)
              </h4>
              <div className="mb-4">
                <label className="text-xs font-semibold text-stone-500 block mb-1">मुख्य जिला चुनें</label>
                <select
                  value={newSangathan.district_id}
                  onChange={(e) => setNewSangathan({ ...newSangathan, district_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                >
                  <option value="">-- जिला चुनें --</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name_hi}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-1">संगठन (English)</label>
                  <input
                    type="text"
                    value={newSangathan.name_en}
                    onChange={(e) => setNewSangathan({ ...newSangathan, name_en: e.target.value })}
                    placeholder="e.g. Abhanpur Sangathan"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 block mb-1">संगठन (हिन्दी)</label>
                  <input
                    type="text"
                    value={newSangathan.name_hi}
                    onChange={(e) => setNewSangathan({ ...newSangathan, name_hi: e.target.value })}
                    placeholder="उदा. अभनपुर साहू संगठन"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => handleAddMaster("sangathans", newSangathan)}
                disabled={!newSangathan.district_id || !newSangathan.name_en || !newSangathan.name_hi}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 text-white text-xs font-bold py-2 rounded-lg"
              >
                संगठन जोड़ें
              </button>
            </div>
          </div>

          {/* Master Lists display */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-stone-800 border-b pb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-600" />
              सिस्टम सक्रिय मास्टर सूची (Active Master Configurations)
            </h4>

            {/* Districts List */}
            <div>
              <span className="text-xs font-bold text-stone-400 block uppercase mb-1.5">सक्रिय जिला (Districts)</span>
              <div className="flex flex-wrap gap-2">
                {districts.map((d) => (
                  <span key={d.id} className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-full border border-stone-200 font-semibold">
                    {d.name_hi} ({d.name_en})
                  </span>
                ))}
              </div>
            </div>

            {/* Sangathans List */}
            <div className="pt-3 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-400 block uppercase mb-1.5">सक्रिय संगठन (Sangathans)</span>
              <div className="flex flex-wrap gap-2">
                {sangathans.map((s) => (
                  <span key={s.id} className="bg-orange-50 text-orange-800 text-xs px-2.5 py-1 rounded-full border border-orange-100 font-semibold">
                    {s.name_hi}
                  </span>
                ))}
              </div>
            </div>

            {/* Sizes List */}
            <div className="pt-3 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-400 block uppercase mb-1.5">विज्ञापन आकार (Ad Sizes)</span>
              <div className="space-y-1.5">
                {sizes.map((sz) => (
                  <div key={sz.id} className="flex justify-between items-center text-xs text-stone-700 bg-stone-50 p-2 rounded">
                    <span className="font-semibold">{sz.name_hi}</span>
                    <span className="font-mono text-stone-400 font-bold bg-white px-1.5 py-0.5 rounded border">
                      {sz.width} × {sz.height} {sz.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Rates Management Block */}
          <div className="col-span-1 lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6 shadow-sm mt-4">
            <div className="border-b pb-3 mb-4">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-[#E65100]" />
                विज्ञापन प्रकाशन दर निर्धारण (Pricing Rates Manager)
              </h4>
              <p className="text-xs text-stone-400 mt-1">यहाँ से आप विभिन्न संस्करणों की विवाह या व्यवसाय विज्ञापनों की दरें (Price Rates) तय कर सकते हैं।</p>
            </div>

            <div className="overflow-x-auto border border-stone-100 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">जिला (District)</th>
                    <th className="px-4 py-2.5">संगठन (Sangathan)</th>
                    <th className="px-4 py-2.5">विज्ञापन प्रकार (Type)</th>
                    <th className="px-4 py-2.5">आकार (Ad Size)</th>
                    <th className="px-4 py-2.5 w-40">प्रकाशन दर (Price)</th>
                    <th className="px-4 py-2.5 text-right">सुरक्षित करें (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {pricings.map((p) => {
                    const dist = districts.find((d) => d.id === p.district_id);
                    const sang = sangathans.find((s) => s.id === p.sangathan_id);
                    const sz = sizes.find((s) => s.code === p.adv_size_code);
                    const currentVal = editingPrices[p.id] !== undefined ? editingPrices[p.id] : p.price;

                    return (
                      <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-stone-800">
                          {dist ? dist.name_hi : "रायपुर"}
                        </td>
                        <td className="px-4 py-3">
                          {sang ? sang.name_hi : "साहू संगठन"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.adv_type_code === "matrimony"
                              ? "bg-orange-50 text-orange-700 border border-orange-100"
                              : "bg-sky-50 text-sky-700 border border-sky-100"
                          }`}>
                            {p.adv_type_code === "matrimony" ? "विवाह" : "व्यवसाय"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-stone-600">
                          {sz ? sz.name_hi : p.adv_size_code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative rounded-lg shadow-sm max-w-[110px]">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                              <span className="text-stone-500 font-bold text-xs">₹</span>
                            </div>
                            <input
                              type="number"
                              value={currentVal}
                              onChange={(e) => setEditingPrices({ ...editingPrices, [p.id]: Number(e.target.value) })}
                              className="block w-full pl-5 pr-2 py-1 bg-stone-50 border border-stone-200 rounded text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleUpdatePrice(p.id, currentVal)}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] rounded shadow-xs transition-colors cursor-pointer"
                          >
                            दर बचाएं
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Change Password and Admin Settings */}
      {!isLoadingData && activeTab === "settings" && (
        <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-stone-800 mb-6 pb-2 border-b flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-600" />
            सुरक्षा पासवर्ड बदलें (Change Super Admin Password)
          </h4>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-lg text-center">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
                {passwordError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">वर्तमान पासवर्ड (Current Password)</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="वर्तमान पासवर्ड डालें"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">नया पासवर्ड (New Password)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="नया मजबूत पासवर्ड बनाएँ"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2 rounded-lg text-xs"
            >
              पासवर्ड अपडेट करें
            </button>
          </form>

          {/* Recovery Email & Whatsapp Settings */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <h4 className="text-sm font-bold text-stone-800 mb-6 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-600" />
              पासवर्ड रिकवरी सेटिंग्स (Password Recovery Settings)
            </h4>

            <form onSubmit={handleSaveRecoverySettings} className="space-y-4">
              {recoverySaveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-lg text-center">
                  {recoverySaveSuccess}
                </div>
              )}
              {recoverySaveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
                  {recoverySaveError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-500 block mb-1">रिकवरी ईमेल पता (Recovery Email/Username)</label>
                <input
                  type="email"
                  required
                  value={adminRecoveryEmail}
                  onChange={(e) => setAdminRecoveryEmail(e.target.value)}
                  placeholder="admin-recovery@example.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-500 block mb-1">रिकवरी व्हाट्सएप नंबर (Recovery Whatsapp with Country Code)</label>
                <input
                  type="text"
                  required
                  value={adminRecoveryWhatsapp}
                  onChange={(e) => setAdminRecoveryWhatsapp(e.target.value)}
                  placeholder="उदा. 919301056006"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                रिकवरी सेटिंग्स सुरक्षित करें
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Dynamic Custom Fields Builder */}
      {!isLoadingData && activeTab === "fields" && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-orange-600" />
                डायनेमिक फॉर्म फ़ील्ड्स बिल्डर (Custom Dynamic Field Builder)
              </h3>
              <p className="text-xs text-stone-400 mt-1">विवाह परिचय तथा व्यावसायिक विज्ञापन फॉर्म के फ़ील्ड्स को ककस्टमाइज़ करें</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedFormType}
                onChange={(e: any) => {
                  setSelectedFormType(e.target.value);
                  setIsAddingField(false);
                  setEditingFieldId(null);
                }}
                className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="matrimony">विवाह परिचय फॉर्म (Matrimony Form)</option>
                <option value="business">व्यावसायिक विज्ञापन फॉर्म (Business Form)</option>
              </select>

              {!isAddingField && (
                <button
                  onClick={() => {
                    setIsAddingField(true);
                    setEditingFieldId(null);
                    setFieldForm({
                      field_name: "",
                      label: "",
                      field_type: "text",
                      required: false,
                      placeholder: "",
                      help_text: "",
                      default_value: "",
                      visible: true,
                      display_order: (customFields.length + 1) * 10,
                      select_options: ""
                    });
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  नया फ़ील्ड जोड़ें
                </button>
              )}
            </div>
          </div>

          {fieldActionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg text-center">
              {fieldActionError}
            </div>
          )}
          {fieldActionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-lg text-center">
              {fieldActionSuccess}
            </div>
          )}

          {/* New / Edit field editor */}
          {isAddingField && (
            <form onSubmit={handleSaveField} className="bg-stone-50/60 border border-stone-200 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">
                {editingFieldId ? "फ़ील्ड सम्पादित करें (Edit Field)" : "नया फ़ील्ड बनाएं (New Custom Field)"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">सिस्टम फ़ील्ड की (System Field Name / Key)*</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingFieldId}
                    value={fieldForm.field_name}
                    onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    placeholder="उदा. height_inch, sub_gotra, business_pincode"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs disabled:bg-stone-100 disabled:text-stone-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">लेबल (Label Name - हिन्दी / English)*</label>
                  <input
                    type="text"
                    required
                    value={fieldForm.label}
                    onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                    placeholder="उदा. उप-गोत्र (Sub-Gotra)"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">फ़ील्ड प्रकार (Field Input Type)*</label>
                  <select
                    value={fieldForm.field_type}
                    onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="text">टेक्स्ट (Single line text)</option>
                    <option value="textarea">लम्बा विवरण (Paragraph/Textarea)</option>
                    <option value="number">नंबर (Number)</option>
                    <option value="phone">फ़ोन नंबर (10 Digit Phone)</option>
                    <option value="date">तारीख (Date Picker)</option>
                    <option value="email">ईमेल (Email Address)</option>
                    <option value="select">ड्रॉपडाउन विकल्प (Dropdown Select)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">क्रम स्थान (Display Order)*</label>
                  <input
                    type="number"
                    required
                    value={fieldForm.display_order}
                    onChange={(e) => setFieldForm({ ...fieldForm, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="उदा. 10"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                {fieldForm.field_type === "select" && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">ड्रॉपडाउन विकल्प सूची (अल्पविराम द्वारा विभाजित)*</label>
                    <input
                      type="text"
                      required={fieldForm.field_type === "select"}
                      value={fieldForm.select_options}
                      onChange={(e) => setFieldForm({ ...fieldForm, select_options: e.target.value })}
                      placeholder="उदा. हाँ, नहीं, लागू नहीं"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">विकल्पों को पृथक करने के लिए कॉमा (,) का उपयोग करें।</p>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">प्लेसहोल्डर (Placeholder)</label>
                  <input
                    type="text"
                    value={fieldForm.placeholder}
                    onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                    placeholder="उदा. यहाँ अपना उप-गोत्र लिखें"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">मददगार टिप्पणी (Help Text)</label>
                  <input
                    type="text"
                    value={fieldForm.help_text}
                    onChange={(e) => setFieldForm({ ...fieldForm, help_text: e.target.value })}
                    placeholder="उदा. गोत्र का नाम ही दर्ज करें"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  अनिवार्य फ़ील्ड (Required Field)
                </label>

                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.visible}
                    onChange={(e) => setFieldForm({ ...fieldForm, visible: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  पब्लिक के लिए दृश्य (Visible)
                </label>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingField(false);
                    setEditingFieldId(null);
                  }}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold rounded-lg text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs"
                >
                  {editingFieldId ? "सुरक्षित करें (Save Changes)" : "जोड़ें (Add Field)"}
                </button>
              </div>
            </form>
          )}

          {/* List of custom fields */}
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3">क्रम</th>
                  <th className="p-3">लेबल (Label)</th>
                  <th className="p-3">की (Field Key)</th>
                  <th className="p-3">प्रकार (Type)</th>
                  <th className="p-3 text-center">अनिवार्य (Required)</th>
                  <th className="p-3 text-center">दृश्यता (Visible)</th>
                  <th className="p-3 text-center">एक्शन (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {customFields.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400 font-bold">
                      कोई अतिरिक्त कस्टम फ़ील्ड नहीं मिला। ऊपर दिए बटन से फ़ील्ड बनाना प्रारंभ करें।
                    </td>
                  </tr>
                ) : (
                  customFields.map((field) => (
                    <tr key={field.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-bold text-stone-500">{field.display_order}</td>
                      <td className="p-3 font-bold text-stone-900">{field.label}</td>
                      <td className="p-3 font-mono text-stone-500">{field.field_name}</td>
                      <td className="p-3 uppercase font-semibold text-stone-600">{field.field_type}</td>
                      <td className="p-3 text-center">
                        {field.required === 1 ? (
                          <span className="inline-block bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded border border-orange-100">हाँ</span>
                        ) : (
                          <span className="text-stone-400">नहीं</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {field.visible === 1 ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">दृश्यमान</span>
                        ) : (
                          <span className="inline-block bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-100">छिपा हुआ</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditFieldClick(field)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            एडिट
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded border border-red-100 cursor-pointer"
                          >
                            हटाएं
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL VIEW: Order details and Payment Verification Review */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white">
          {showAdminInvoice ? (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full p-6 relative max-h-[95vh] overflow-y-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none">
              <button
                onClick={() => setShowAdminInvoice(false)}
                className="absolute top-4 right-4 text-stone-500 hover:text-stone-700 font-bold text-sm bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-all print:hidden cursor-pointer"
              >
                ✕ वापस आर्डर विवरण पर जाएँ
              </button>
              <div className="mt-8">
                <InvoicePDF order={selectedOrder} onClose={() => setShowAdminInvoice(false)} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setShowAdminInvoice(false);
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 font-bold text-lg"
              >
                ✕
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded">
                    ऑर्डर विवरण समीक्षा
                  </span>
                  <span className="font-mono text-sm font-bold text-stone-500">ID: {selectedOrder.order_id}</span>
                </div>
                <p className="text-xs text-stone-400 mt-1">तिथी: {new Date(selectedOrder.created_at).toLocaleString("hi-IN")}</p>
              </div>

              {/* List of Advertisements inside this order */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">आदेश सूची सामग्री (Advertisements):</h4>
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
                      <span className="text-sm font-black text-stone-800">
                        {it.ad_type === "matrimony" ? "विवाह परिचय प्रविष्टि" : "व्यावसायिक विज्ञापन"}
                      </span>
                      <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 text-xs rounded border border-orange-100">
                        {it.ad_number}
                      </span>
                    </div>

                    {/* Render profile / details */}
                    {it.ad_type === "matrimony" && it.matrimonyDetails && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-stone-600">
                        <p><span className="font-bold text-stone-800">नाम:</span> {it.matrimonyDetails.name}</p>
                        <p><span className="font-bold text-stone-800">जन्म तिथि:</span> {it.matrimonyDetails.dob}</p>
                        <p><span className="font-bold text-stone-800">गोत्र:</span> {it.matrimonyDetails.gotra}</p>
                        <p><span className="font-bold text-stone-800">रक्त समूह:</span> {it.matrimonyDetails.blood_group}</p>
                        <p className="col-span-2"><span className="font-bold text-stone-800">शिक्षा:</span> {it.matrimonyDetails.education}</p>
                        <p className="col-span-2"><span className="font-bold text-stone-800">व्यवसाय:</span> {it.matrimonyDetails.occupation}</p>
                        {it.matrimonyDetails.photoUrl && (
                          <div className="col-span-2 mt-2">
                            <span className="font-bold text-stone-800 block mb-1">अपलोडेड फोटो:</span>
                            <img
                              src={it.matrimonyDetails.photoUrl}
                              alt="Uploaded"
                              className="h-28 w-auto rounded object-contain border border-stone-200 bg-white p-1"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {it.matrimonyDetails.biodataUrl && (
                          <div className="col-span-2 mt-1">
                            <span className="font-bold text-stone-800">बायोडाटा फ़ाइल: </span>
                            <a href={it.matrimonyDetails.biodataUrl} target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline hover:text-orange-700">
                              बायोडाटा देखने के लिए क्लिक करें
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {it.ad_type === "business" && it.businessDetails && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-stone-600">
                        <p><span className="font-bold text-stone-800">व्यवसाय नाम:</span> {it.businessDetails.businessName}</p>
                        <p><span className="font-bold text-stone-800">मालिक:</span> {it.businessDetails.ownerName}</p>
                        <p className="col-span-2"><span className="font-bold text-stone-800">विवरण:</span> {it.businessDetails.businessDesc}</p>
                        <p className="col-span-2"><span className="font-bold text-stone-800">सेवाएं:</span> {it.businessDetails.productsServices}</p>
                        {it.businessDetails.specialOffer && <p className="col-span-2 text-red-600 font-semibold"><span className="font-bold text-stone-800">ऑफर:</span> {it.businessDetails.specialOffer}</p>}
                        {it.businessDetails.logoUrl && (
                          <div className="mt-2">
                            <span className="font-bold text-stone-800 block mb-1">अपलोडेड लोगो:</span>
                            <img src={it.businessDetails.logoUrl} alt="Logo" className="h-16 w-auto rounded object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {it.businessDetails.readyAdUrl && (
                          <div className="col-span-2 mt-1">
                            <span className="font-bold text-stone-800">पहले से बना विज्ञापन: </span>
                            <a href={it.businessDetails.readyAdUrl} target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline hover:text-orange-700">
                              फ़ाइल देखें
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Billing summary and Payment Reference details */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-stone-800">कुल बिल राशि: <span className="text-orange-700 text-base font-black">₹{selectedOrder.total_amount.toLocaleString("en-IN")}.00</span></p>
                  <button
                    onClick={() => setShowAdminInvoice(true)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all print:hidden"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    पावती / Invoice देखें
                  </button>
                </div>
                {selectedOrder.payment_ref && (
                  <p><span className="font-bold text-stone-800">ग्राहक संदर्भ आईडी (Ref ID / UTR):</span> <span className="font-mono font-bold text-stone-900 bg-white border px-1.5 py-0.5 rounded">{selectedOrder.payment_ref}</span></p>
                )}
                {selectedOrder.payment_date && (
                  <p><span className="font-bold text-stone-800">भुगतान तिथि:</span> {new Date(selectedOrder.payment_date).toLocaleString("hi-IN")}</p>
                )}
                {selectedOrder.payment_screenshot && (
                  <div className="pt-2 border-t border-stone-200 mt-2">
                    <span className="font-bold text-stone-800 block mb-1">भुगतान का स्क्रीनशॉट (Payment Screenshot):</span>
                    <a href={selectedOrder.payment_screenshot} target="_blank" rel="noreferrer" className="inline-block relative group max-w-xs">
                      <img
                        src={selectedOrder.payment_screenshot}
                        alt="Payment Screenshot"
                        className="h-44 w-auto rounded object-contain border border-stone-300 hover:border-orange-500 bg-white p-1 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold group-hover:bg-orange-600">
                        बड़ा देखने के लिए क्लिक करें 🔍
                      </span>
                    </a>
                  </div>
                )}
              </div>

              {/* Verify Actions */}
              {selectedOrder.payment_status === "SUBMITTED" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleVerifyOrder(selectedOrder.order_id, "PAID")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    भुगतान स्वीकृत करें (Mark PAID)
                  </button>
                  <button
                    onClick={() => handleVerifyOrder(selectedOrder.order_id, "REJECTED")}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2.5 px-6 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    अस्वीकृत करें (Reject)
                  </button>
                </div>
              )}

              {selectedOrder.payment_status === "PAID" && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-lg text-center flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  यह आर्डर स्वीकृत एवं PAID है। सत्यापन कर्ता: {selectedOrder.verified_by || "एडमिन"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reject Payment Custom Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-full hover:bg-stone-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900">भुगतान अस्वीकार करें (Reject Payment)</h3>
              <p className="text-xs text-stone-500">अस्वीकृति का मुख्य कारण चुनें, जो स्वचालित रूप से ग्राहक के व्हाट्सएप पर भेजा जाएगा।</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">अस्वीकृति का मुख्य कारण</label>
              
              <div className="space-y-2.5">
                {[
                  { value: "Invalid UTR", label: "अमान्य UTR (Invalid UTR)", desc: "संदर्भ संख्या (UTR/Ref No) बैंक रिकॉर्ड में नहीं मिली।" },
                  { value: "Low Amount", label: "अधूरी भुगतान राशि (Low Amount)", desc: "भुगतान की गई राशि विज्ञापन के वास्तविक मूल्य से कम है।" },
                  { value: "Incorrect/Blank Screenshot", label: "गलत/अस्पष्ट स्क्रीनशॉट", desc: "अपलोड किया गया स्क्रीनशॉट गलत, अस्पष्ट या खाली है।" },
                  { value: "Custom", label: "अन्य कोई कारण (Custom Reason)", desc: "स्वयं कोई अन्य कारण लिखना चाहते हैं।" }
                ].map((reason) => (
                  <label
                    key={reason.value}
                    onClick={() => setSelectedRejectReason(reason.value as any)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRejectReason === reason.value
                        ? "border-red-500 bg-red-50/40 shadow-xs"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reject_reason"
                      value={reason.value}
                      checked={selectedRejectReason === reason.value}
                      onChange={() => setSelectedRejectReason(reason.value as any)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{reason.label}</span>
                      <span className="text-[10px] text-stone-500">{reason.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {selectedRejectReason === "Custom" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-xs font-bold text-stone-600 block">अपना कारण विस्तार से लिखें *</label>
                  <textarea
                    required
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="जैसे: आपके द्वारा अपलोड किया गया स्क्रीनशॉट पुराना है..."
                    className="w-full min-h-[80px] p-2.5 border border-stone-300 rounded-lg text-xs text-stone-800 bg-white placeholder-stone-400 outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl text-xs hover:bg-stone-50 transition-all cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={selectedRejectReason === "Custom" && !customRejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                अस्वीकृति की पुष्टि करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

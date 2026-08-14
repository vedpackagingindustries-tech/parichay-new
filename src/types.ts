export interface District {
  id: number;
  name_en: string;
  name_hi: string;
  is_enabled: number;
}

export interface Sangathan {
  id: number;
  district_id: number;
  name_en: string;
  name_hi: string;
  is_enabled: number;
}

export interface Magazine {
  id: number;
  name_en: string;
  name_hi: string;
  is_enabled: number;
}

export interface Edition {
  id: number;
  magazine_id: number;
  name_en: string;
  name_hi: string;
  is_enabled: number;
}

export interface AdvertisementType {
  id: number;
  code: string; // 'matrimony' or 'business'
  name_en: string;
  name_hi: string;
  is_enabled: number;
}

export interface AdvertisementSize {
  id: number;
  code: string;
  name_en: string;
  name_hi: string;
  width: number;
  height: number;
  unit: string;
  rows: number;
  cols: number;
  is_enabled: number;
}

export interface Pricing {
  id: number;
  district_id: number;
  sangathan_id: number;
  magazine_id: number;
  edition_id: number;
  adv_type_code: string;
  adv_size_code: string;
  price: number;
}

export interface Publication {
  id: number;
  district_id: number;
  sangathan_id: number;
  magazine_id: number;
  edition_id: number;
  district_hi: string;
  sangathan_hi: string;
  magazine_hi: string;
  edition_hi: string;
  is_enabled: number;
}

export interface MatrimonyFormState {
  [key: string]: any;
  name: string;
  dob: string;
  height: string;
  blood_group: string;
  gotra: string;
  education: string;
  occupation: string;
  father_name: string;
  father_occupation: string;
  mother_name: string;
  mobile1: string;
  mobile2: string;
  whatsapp: string;
  currentAddress: string;
  permanentAddress: string;
  photoUrl: string;
  biodataUrl: string;
  // Selected Master Details
  district_id: string;
  sangathan_id: string;
  magazine_id: string;
  edition_id: string;
  district_hi?: string;
  sangathan_hi?: string;
  magazine_hi?: string;
  edition_hi?: string;
}

export interface BusinessFormState {
  [key: string]: any;
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
  businessAddress: string;
  otherAddress: string;
  logoUrl: string;
  photoUrl: string;
  readyAdUrl: string;
  adMakerDesignJson?: any;
  // Selected Master Details
  district_id: string;
  sangathan_id: string;
  magazine_id: string;
  edition_id: string;
  size_code: string;
  district_hi?: string;
  sangathan_hi?: string;
  magazine_hi?: string;
  edition_hi?: string;
  size_hi?: string;
}

export interface CartItem {
  id: number;
  sessionId: string;
  adType: "matrimony" | "business";
  data: MatrimonyFormState | BusinessFormState;
  price: number;
}

export interface Order {
  id: number;
  order_id: string;
  total_amount: number;
  payment_status: "PENDING" | "SUBMITTED" | "PAID" | "REJECTED";
  payment_ref?: string;
  payment_date?: string;
  verified_by?: string;
  verification_time?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: string;
  ad_number: string;
  ad_type: "matrimony" | "business";
  district_hi: string;
  sangathan_hi: string;
  magazine_hi: string;
  edition_hi: string;
  size_hi: string;
  price: number;
  customer_name: string;
  customer_mobile: string;
  matrimonyDetails?: MatrimonyFormState;
  businessDetails?: BusinessFormState;
}

export interface Advertisement {
  id: number;
  ad_number: string;
  type_code: string;
  district_hi: string;
  sangathan_hi: string;
  magazine_hi: string;
  edition_hi: string;
  size_code: string;
  size_hi: string;
  customer_name: string;
  customer_mobile1: string;
  price: number;
  payment_status: string;
  created_at: string;
  matrimonyProfile?: any;
  businessProfile?: any;
}

export interface Address {
  placeId: string;
  description: string;
  latitude: number;
  longitude: number;
  additionalInfo: string;
}

export interface User {
  uid: string;
  identificationType: "Cedula" | "Pasaporte" | "RNC";
  identification: string;
  identificationImage?: string;
  email: string;
  names: string;
  lastNames: string;
  phone: string;
  userType: "client" | "driver" | "admin" | "seller";
  personType?: "fisica" | "juridica";
  companyRnc?: string;
  companyName?: string;
  addresses?: Address[] | null;
  vehicle?: {
    brand: string;
    model: string;
    year: string;
    tons: string;
    plateNumber: string;
  };
  createdAt: string;
  status: "pending" | "active" | "inactive" | "banned" | "rejected";
  notifications?: {
    sms?: boolean;
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
    whatsapp?: boolean;
  };
  whatsappOptInAt?: string;
  expoPushToken?: string;
  driverCode?: string;
  sellerCode?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  aiRiskFlag?: boolean;
  aiRiskScore?: number;
  aiRiskReason?: string;
}

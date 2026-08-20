export interface Address {
  placeId: string;
  description: string;
  latitude: number;
  longitude: number;
  additionalInfo: string;
}

export interface User {
  uid: string;
  identificationType: "Cedula" | "Pasaporte"; // Puedes ajustar los tipos válidos
  identification: string;
  email: string;
  password: string;
  names: string;
  lastNames: string;
  phone: string;
  userType: "client" | "driver" | "admin"; // Puedes extender con más tipos si es necesario
  addresses?: Address[] | null; // Solo aplica si userType === 'client'
  vehicle: {
    brand: string;
    model: string;
    year: string;
    tons: string;
    plateNumber: string;
  }; // Solo aplica si userType === 'conductor'
  createdAt: string;
  status: string;
}

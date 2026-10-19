export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: 'savings' | 'checking' | 'current';
  currency: string;
  routingNumber?: string;
  swiftCode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields (backward compatibility)
  rnc?: string;
  holder?: string;
}

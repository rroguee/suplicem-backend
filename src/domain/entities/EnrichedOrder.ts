import { Order } from "./Order";

export interface EnrichedOrder extends Order {
  userNames?: string;
  userLastNames?: string;
  isAssisted?: boolean;
  createdByName?: string;
  createdByRole?: "seller" | "admin";
  createdByPhone?: string;
}

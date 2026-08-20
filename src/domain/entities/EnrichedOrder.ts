import { Order } from "./Order";

export interface EnrichedOrder extends Order {
  userNames?: string;
  userLastNames?: string;
}

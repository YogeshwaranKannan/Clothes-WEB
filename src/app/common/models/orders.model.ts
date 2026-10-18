export interface OrderItem {
  item_name: string;
  qty: number;
  price: number;
  offerPrice?: number;
  sellerPrice?: number;
  image_url: string;
  batch_id: string;
  inv_id: string;
  isService: boolean;
  productId?: string;
}

export interface OrderList {
  order_id: string;
  order_value: number;
  order_status: string;
  payment_status: string;
}

/* New: Customer Info */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

/* New: Delivery Info */
export interface DeliveryInfo {
  address: string;
  city: string;
  expected_date: string; // keep as string if API returns string
}

export interface OrderStage {
  name: string;
  date: string | null;
}
export interface RewardsDTO {
  RewardPoints: number;
  RedeemPoints: number;
}

export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Failed"
  | "Cash on Delivery"
  | "Unpaid"; // backend value; displayed as "Pay on Delivery"

export interface OrderDetail {
  order_id: string;
  items: OrderItem[];
  tot_order_value: string; // intentionally string as requested
  order_status: OrderStatus;

  /* Newly added fields */
  customer?: CustomerInfo;
  delivery?: DeliveryInfo;
  rewardsDTO?: RewardsDTO;
  payment: {
    status?: PaymentStatus | null;
    date?: string | null; // ISO string
    paymentID?: string | null;
  };
  stages: OrderStage[];
}

export interface OrdersList {
  items: OrderList[];
}

export type OrderStatus =
  | "Order Placed"
  | "Review" // backend alias of "Processing"
  | "Processing"
  | "Shipment Ready"
  | "Out for Delivery"
  | "Delivered"
  | "Completed"; // backend alias of "Delivered"

// export interface OrderItem {
//   item_name: string;
//   qty: number;
//   price: number;
// }

// Add this new interface
export interface SitesAccountSummaryTrailer {
  totalRecords: number;
  totalAmountReceived: number;
  totalSiteExpenses: number;
  totalBalance: number;
}

export interface Order {
  order_id: string;
  refno?: string;
  order_date: string;
  payment_status: string;
  order_Status: string;
  customerSiteName: string;
  siteLocation: string;
  work: string;
  flooring: string;
  totalLength: string;
  contactName: string;
  type: string;
  deliveryDate: string;
  jobValue: string;
  amountReceived: string;
  siteExpenses: string;
  balanceAmount: string;
  duration: string;
  items: OrderItem[];
  tot_order_value: string; // intentionally string as requested
  order_status: OrderStatus;
}

export interface Payment {
  paymentId?: number;
  jobCard?: string | number; // Fallback for jobCard field
  order_id?: string;
  cashInDate: string;
  amountReceived: number;
  balanceDue: number;
  paymentMode: string;
  description: string;
  paymentRefNumber?: string;
  customerSiteName?: string;
  jobValue?: number;
  entryBy: string;
}

export interface Expense {
  id?: number;
  order_id?: string;
  jobCard?: string | number; // Fallback for jobCard field
  transactionDate: string;
  expenseDescription: string;
  vendorName: string;
  receiptNumber: string;
  transactionAmount: number;
  typeOfExpense: string;
  paidAmount: number;
  taxAmount: number;
  dueAmount: number;
}

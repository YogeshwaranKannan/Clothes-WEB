export interface Address {
  PickupPointName?: string;
  Address1?: string;
  Address2?: string;
  areaName?: string;
  pincode?: string;
  city?: string;
  state?: string;
}

export interface ChottaOrder {
  sellerId: string;
  default?: boolean | string;
  addressType: "DELIVERY" | "PICKUP" | string;
  address: Address;
}

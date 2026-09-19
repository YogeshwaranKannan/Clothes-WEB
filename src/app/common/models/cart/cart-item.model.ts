// export interface CartItem {
//   productId: string;
//   title: string;
//   dealPrice: number;
//   mrp: number;
//   quantity: number;
//   imageUrl: string;
//   item: any;
//   selectedAddons?: SelectedAddon[];
// }

export interface CartItem {
  productId: string;
  title: string;
  dealPrice: number;
  isService: boolean;
  mrp: number;
  quantity: number;
  imageUrl: string;
  item: any;
  selectedAddons?: SelectedAddon[];
  propertyAttributes?: any;
  selectedVariant?: any;
  totalVariants?: any;
  available_properties?: any;
}
export interface SelectedAddon {
  id: string; // productId of the addon product
  name: string;
  price: number; // parsed OfferPrice
  quantity: number; // always 1 for now
}

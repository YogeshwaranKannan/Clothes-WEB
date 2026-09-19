export interface SellerDetailsResponse {
  sellerid: string;
  companyname: string;
  companyMobile: string;
  serviceImageFolder: string;
  profileImgPath: string;
  paymentModes: string[];
  deliveryFee?: number;
  orderThreshold?: number;
  rewardsDTO?: {
    RedeeemAmount: number;
    RedeemPoints: number;
    RewardAmount: number;
    RewardPoints: number;
  };
  sellerPaymentDetails: {
    key?: string;
    pay_Online_Link?: string;
    secret_Key?: string;
    upi_Id?: string;
  };
}

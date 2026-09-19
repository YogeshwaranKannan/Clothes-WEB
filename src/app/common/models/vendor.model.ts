// =============================================================================
// vendor.model.ts
// =============================================================================

export interface VendorBreakdown {
  customer:    string;
  job_card_no: number | null;
  amount:      number;
}

export interface Vendor {
  vendor:        string;
  category:      string;
  invoice:       number;
  total_pending: number;
  old_pending:   number | null;
  totalPending:  number;
  paid:          number;
  breakdown:     VendorBreakdown[];
}

/** Full shape of getVendors.json */
export interface VendorResponse {
  all_rows:   Vendor[];
  headerarea: VendorSummary;
}

/** Header-area totals used in the summary banner */
export interface VendorSummary {
  OverAllCurrentPending: number;
  OverAllOldPending:     number;
  OverallPending:        number;
  OverAllPaid:           number;
  OverAllDue:            number;
}

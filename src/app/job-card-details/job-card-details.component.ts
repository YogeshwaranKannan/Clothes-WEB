import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../common/services/orders.service';
import { Payment, Expense } from '../common/models/orders.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-job-card-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-card-details.component.html',
  styleUrls: ['./job-card-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCardDetailsComponent implements OnInit, OnChanges, OnDestroy {

  // ── Inputs ────────────────────────────────
  @Input() orderId:          string | null = null;
  @Input() customerSiteName: string = '';
  @Input() contactName:      string = '';
  @Input() siteLocation:     string = '';
  @Input() work:             string = '';
  @Input() flooring:         string = '';
  @Input() totalLength:      string = '';
  @Input() type:             string = '';
  @Input() deliveryDate:     string = '';

  // Header summary inputs (passed from parent / order model)
  @Input() duration:      string = '';
  @Input() jobValue:      string = '';
  @Input() totalCashIn:   string = '';
  @Input() totalCashOut:  string = '';
  @Input() finalBalance:  string = '';

  // ── Services ──────────────────────────────
  private orderService = inject(OrderService);
  private destroy$     = new Subject<void>();

  // ── UI state ──────────────────────────────
  activeTab      = signal<'payment' | 'expense' | 'cr_dt'>('payment');
  headerExpanded = signal(true);

  // ── Data signals ──────────────────────────
  payments   = signal<Payment[]>([]);
  expenses   = signal<Expense[]>([]);

  // Separate loading/error per tab to avoid race conditions
  isLoadingPayments = signal(false);
  isLoadingExpenses = signal(false);
  errorPayments     = signal<string | null>(null);
  errorExpenses     = signal<string | null>(null);

  // Convenience helpers used in template
  isLoading = () => this.isLoadingPayments() || this.isLoadingExpenses();
  error     = () => this.errorPayments() ?? this.errorExpenses();

  // ── Lifecycle ─────────────────────────────

  ngOnInit() {
    if (this.orderId) {
      this.loadAll(this.orderId);
    }
  }

  /** Re-load whenever orderId @Input changes (e.g. user opens a different card) */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      const id = changes['orderId'].currentValue;
      if (id) {
        this.activeTab.set('payment'); // reset to first tab
        this.loadAll(id);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────

  private loadAll(orderId: string) {
    this.loadPaymentData(orderId);
    this.loadExpenseData(orderId);
  }

  private loadPaymentData(orderId: string) {
    this.isLoadingPayments.set(true);
    this.errorPayments.set(null);

    this.orderService.getPaymentByJobId(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payments) => {
          this.payments.set(payments ?? []);
          this.isLoadingPayments.set(false);
        },
        error: (err) => {
          console.error('Error loading payments:', err);
          this.errorPayments.set('Failed to load payment data.');
          this.isLoadingPayments.set(false);
        }
      });
  }

  private loadExpenseData(orderId: string) {
    this.isLoadingExpenses.set(true);
    this.errorExpenses.set(null);

    this.orderService.getExpenseByJobId(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenses) => {
          this.expenses.set(expenses ?? []);
          this.isLoadingExpenses.set(false);
        },
        error: (err) => {
          console.error('Error loading expenses:', err);
          this.errorExpenses.set('Failed to load expense data.');
          this.isLoadingExpenses.set(false);
        }
      });
  }

  // ── Template helpers ──────────────────────

  selectTab(tab: 'payment' | 'expense' | 'cr_dt') {
    this.activeTab.set(tab);
  }

  toggleHeader() {
    this.headerExpanded.update(v => !v);
  }

  getColumnValue(obj: any, col: string): any {
    return obj?.[col] ?? '-';
  }

  trackByIndex(index: number, _item: any): number {
    return index;
  }

  // ── CSV Export ────────────────────────────

  exportPaymentsCsv() {
    const headers = ['Date', 'Remark', 'Entry By', 'Mode', 'Cash In', 'Cash Out', 'Balance'];
    const fields  = ['cashInDate', 'description', 'entryBy', 'paymentMode',
                     'amountReceived', 'cashOut', 'balanceDue'];
    const rows    = this.payments().map(p => fields.map(f => this.csvCell(p, f)));
    // Append Final Balance summary row
    rows.push(['', '', '', 'Final Balance', '', '', this.finalBalance ?? '']);
    this.downloadCsv(
      `payments_${this.orderId}_${this.today()}.csv`,
      headers,
      rows
    );
  }

  exportExpensesCsv() {
    const headers = ['Date', 'Description', 'Vendor', 'Receipt #',
                     'Amount', 'Mode', 'Paid', 'Tax', 'Due'];
    const fields  = ['transactionDate', 'expenseDescription', 'vendorName', 'receiptNumber',
                     'transactionAmount', 'typeOfExpense', 'paidAmount', 'taxAmount', 'dueAmount'];
    const rows    = this.expenses().map(e => fields.map(f => this.csvCell(e, f)));
    this.downloadCsv(
      `expenses_${this.orderId}_${this.today()}.csv`,
      headers,
      rows
    );
  }

  private csvCell(obj: any, field: string): string {
    const val = String(obj?.[field] ?? '');
    // Wrap in quotes if value contains comma, newline or double-quote
    return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private downloadCsv(filename: string, headers: string[], rows: string[][]) {
    const lines = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

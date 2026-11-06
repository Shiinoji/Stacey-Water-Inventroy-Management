import { ArrowDownLeft, ArrowRight, Clock, Package, Wallet } from "lucide-react";
import { MetricCard, PageHeading } from "../components/Common.jsx";
import { TransactionTable } from "../components/TransactionTable.jsx";
import { formatDate, formatMoney } from "../utils/formatters.js";

export function DashboardPage({ transactions, totalIssued, totalReturned, pendingDeliveryCount, totalSales, currency, dateFormat, setPage, onViewTransaction }) {
  return (
    <div className="dashboard-page">
      <PageHeading eyebrow={formatDate(new Date(), dateFormat).toUpperCase()} title="Dashboard" description="A clear snapshot of your inventory and delivery activity." />

      <section className="metrics-grid dashboard-metrics">
        <MetricCard label="Containers issued" value={totalIssued} icon={Package} tone="blue" />
        <MetricCard label="Containers returned" value={totalReturned} icon={ArrowDownLeft} tone="green" />
        <MetricCard label="Pending Deliveries" value={pendingDeliveryCount} icon={Clock} tone="amber" />
        <MetricCard label="Recorded sales" value={formatMoney(totalSales, currency)} icon={Wallet} tone="purple" />
      </section>

      <section className="panel table-panel dashboard-activity">
        <div className="panel-heading table-heading">
          <div><h2>Recent activity</h2><p>Your latest container movements</p></div>
          <button className="text-link" onClick={() => setPage("Transactions")}>View all transactions <ArrowRight size={15} /></button>
        </div>
        <TransactionTable transactions={transactions.slice(0, 5)} compact dateFormat={dateFormat} onViewTransaction={onViewTransaction} />
      </section>
    </div>
  );
}

// Provides transaction search, staged filters, and an empty state when nothing matches.

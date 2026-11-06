import { useState } from "react";
import { CalendarDays, ChevronDown, Package, ShoppingBag, Wallet } from "lucide-react";
import { MetricCard, PageHeading } from "../components/Common.jsx";
import { formatDate, formatMoney } from "../utils/formatters.js";

export function SalesPage({ transactions, currency, dateFormat }) {
  const [period, setPeriod] = useState("This month");
  const sales = transactions
    .map((item) => ({ id: `SL-${item.id.replace("TR-", "")}`, transaction: item.id, date: item.date, employee: item.employee, containers: item.issued - item.returned, price: item.unitPrice }))
    .filter((sale) => sale.containers > 0);
  const now = new Date();
  let rangeStart;
  let rangeEnd;
  if (period === "Today") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    rangeEnd = rangeStart;
  } else if (period === "This week") {
    const daysSinceMonday = (now.getDay() + 6) % 7;
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 6);
  } else if (period === "This year") {
    rangeStart = new Date(now.getFullYear(), 0, 1);
    rangeEnd = new Date(now.getFullYear(), 11, 31);
  } else if (period === "Last month") {
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  } else {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  const periodSales = sales.filter((sale) => {
    const saleDate = new Date(`${sale.date}T00:00:00`);
    return saleDate >= rangeStart && saleDate <= rangeEnd;
  });
  const totalOut = periodSales.reduce((sum, sale) => sum + sale.containers, 0);
  const periodSalesAmount = periodSales.reduce((sum, sale) => sum + sale.containers * sale.price, 0);
  const dateLabel = `${formatDate(rangeStart, dateFormat)} – ${formatDate(rangeEnd, dateFormat)}`;
  return (
    <>
      <PageHeading eyebrow="REVENUE & PERFORMANCE" title="Sales" description="Sales are recorded automatically when a delivery is confirmed, based on containers issued minus returns." />
      <div className="sales-toolbar"><label className="filter-select"><CalendarDays size={16} /><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Today</option><option>This week</option><option>This month</option><option>Last month</option><option>This year</option></select><ChevronDown size={14} /></label><div className="sales-date-note">{dateLabel}</div></div>
      <section className="metrics-grid sales-metrics">
        <MetricCard label="Total sales" value={formatMoney(periodSalesAmount, currency)} icon={Wallet} tone="purple" />
        <MetricCard label="Containers out" value={totalOut} icon={Package} tone="blue" />
        <MetricCard label="Number of sales" value={periodSales.length} icon={ShoppingBag} tone="green" />
      </section>
      <section className="panel table-panel">
        <div className="panel-heading table-heading"><div><h2>Recent sales</h2><p>Every sale is linked to its original transaction</p></div></div>
        <div className="table-scroll"><table className="data-table sales-table"><thead><tr><th>Sale ID</th><th>Date</th><th>Transaction</th><th>Containers out</th><th>Unit price</th><th>Total amount</th><th>Recorded by</th></tr></thead>
          <tbody>{periodSales.length ? periodSales.map((sale) => <tr key={sale.id}><td><span className="table-id">{sale.id}</span></td><td>{formatDate(sale.date, dateFormat)}</td><td><span className="table-id secondary-id">{sale.transaction}</span></td><td><strong>{sale.containers}</strong></td><td>{formatMoney(sale.price, currency)}</td><td className="money-cell">{formatMoney(sale.containers * sale.price, currency)}</td><td><span className="person-cell">{sale.employee}</span></td></tr>) : <tr><td colSpan="7" className="sales-empty">No sales recorded in this period.</td></tr>}</tbody>
        </table></div>
        <div className="sales-note">Sales are based on containers issued minus returns, multiplied by the unit price.</div>
      </section>
    </>
  );
}

// Master data tabs manage the employee, container, and delivery-area lists.
// Switches between the employee, container, and delivery-area management sections.

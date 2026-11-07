import { X } from "lucide-react";
import { Button, StatusPill } from "./Common.jsx";
import { formatDate, formatMoney, formatTime } from "../utils/formatters.js";

export function TransactionTable({ transactions, compact = false, dateFormat, onComplete, onViewTransaction }) {
  const transactionLink = (item) => onViewTransaction
    ? <button type="button" className="table-id transaction-view-link" onClick={() => onViewTransaction(item, Boolean(item.isPending || onComplete))}>{item.id}</button>
    : <span className="table-id">{item.id}</span>;

  return (
    <div className="table-scroll">
      <table className={compact ? "data-table compact-table" : "data-table"}>
        <thead><tr>{(compact ? ["Transaction", "Employee", "Delivery area", "Date", "Containers", "Status"] : ["Transaction", "Date", "Employee", "Container", "Delivery area", "Issued", "Returned", "Damaged", "Lost", ...(onComplete ? ["Action"] : [])]).map((label) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>
          {transactions.map((item) => {
            if (compact) return <tr key={item.id}>
              <td>{transactionLink(item)}</td>
              <td><span className="person-cell">{item.employee}</span></td>
              <td>{item.area}</td><td>{formatDate(item.date, dateFormat)}</td><td><strong>{item.issued}</strong></td>
              <td><StatusPill kind={item.isPending ? "amber" : "green"}>{item.isPending ? "Pending" : "Delivered"}</StatusPill></td>
            </tr>;
            return <tr key={item.id}>
              <td>{transactionLink(item)}</td><td>{formatDate(item.date, dateFormat)}</td>
              <td><span className="person-cell">{item.employee}</span></td>
              <td>{item.container}</td><td>{item.area}</td><td><strong>{item.issued}</strong></td>
              <td>{item.returned}</td>
              <td>{item.damaged ? <span className="number-alert">{item.damaged}</span> : <span className="muted">—</span>}</td>
              <td>{item.lost ? <span className="number-alert">{item.lost}</span> : <span className="muted">—</span>}</td>
              {onComplete && <td><button type="button" className="button button-primary pending-complete" onClick={() => onComplete(item)}>Confirm delivery</button></td>}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

// Shows the key delivery, container-count, and sales details for one transaction.

export function TransactionSummaryModal({ transaction, pending, currency, dateFormat, onClose }) {
  const stillOut = Math.max(0, transaction.issued - transaction.returned - transaction.damaged - transaction.lost);
  const totalAmount = Math.max(0, transaction.issued - transaction.returned) * transaction.unitPrice;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="transaction-modal transaction-summary-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-summary-title">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">TRANSACTION SUMMARY</div>
            <h2 id="transaction-summary-title">{transaction.id}</h2>
            <p>{formatDate(transaction.date, dateFormat)} · {formatTime(transaction.time)}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close transaction summary" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="transaction-summary-details">
          <div><span>Employee</span><strong>{transaction.employee}</strong></div>
          <div><span>Delivery area</span><strong>{transaction.area}</strong></div>
          <div><span>Container</span><strong>{transaction.container}</strong></div>
          <div className="transaction-summary-status"><span>Status</span><StatusPill kind={pending ? "amber" : "green"}>{pending ? "Pending delivery" : "Delivered"}</StatusPill></div>
          <div><span>Quantity issued</span><strong>{transaction.issued}</strong></div>
          <div><span>Returned</span><strong>{transaction.returned}</strong></div>
          <div><span>Damaged</span><strong>{transaction.damaged}</strong></div>
          <div><span>Lost</span><strong>{transaction.lost}</strong></div>
          <div><span>Still out</span><strong>{stillOut}</strong></div>
          <div><span>Unit price</span><strong>{formatMoney(transaction.unitPrice, currency)}</strong></div>
        </div>
        <div className="transaction-summary-total">
          <span>Total sales</span>
          <strong>{formatMoney(totalAmount, currency)}</strong>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </section>
    </div>
  );
}

// Sales are derived from transaction quantities and filtered to the selected period.

import { useState } from "react";
import { Check } from "lucide-react";
import { Button, PageHeading } from "../components/Common.jsx";
import { formatDate, formatMoney } from "../utils/formatters.js";

export function DeliveryConfirmationPage({ transaction, dateFormat, currency, onBack, onConfirm }) {
  const [quantities, setQuantities] = useState({
    returned: String(transaction.returned ?? 0),
    damaged: String(transaction.damaged ?? 0),
    lost: String(transaction.lost ?? 0),
  });
  const [error, setError] = useState("");

  // Updates a delivery result count and clears any previous validation message.
  const updateQuantity = (field, value) => {
    setQuantities((current) => ({ ...current, [field]: value }));
    setError("");
  };

  // Submits the final delivery counts to the app for validation and completion.
  const submit = (event) => {
    event.preventDefault();
    const updatedTransaction = {
      ...transaction,
      returned: Number(quantities.returned),
      damaged: Number(quantities.damaged),
      lost: Number(quantities.lost),
    };
    const validationError = onConfirm(updatedTransaction);
    if (validationError) setError(validationError);
  };

  return (
    <section className="delivery-confirmation-page">
      <PageHeading eyebrow="DELIVERY COMPLETION" title="Confirm successful delivery" description="Review this transaction and enter the final container counts." />
      <form className="panel delivery-confirmation-panel" onSubmit={submit}>
        <div className="delivery-confirmation-heading">
          <div><span className="eyebrow">CURRENT TRANSACTION</span><h2>{transaction.id}</h2></div>
          <span className="status-pill status-amber">Pending delivery</span>
        </div>
        <div className="delivery-details">
          <div><span>Employee</span><strong>{transaction.employee}</strong></div>
          <div><span>Delivery area</span><strong>{transaction.area}</strong></div>
          <div><span>Container</span><strong>{transaction.container}</strong></div>
          <div><span>Delivery date</span><strong>{formatDate(transaction.date, dateFormat)}</strong></div>
          <div><span>Quantity issued</span><strong>{transaction.issued}</strong></div>
          <div><span>Unit price</span><strong>{formatMoney(transaction.unitPrice, currency)}</strong></div>
        </div>
        <div className="delivery-quantity-section">
          <div className="settings-section-heading">
            <h2>Delivery results</h2>
            <p>Enter the quantities returned, damaged, or lost for this delivery.</p>
          </div>
          <div className="delivery-quantity-grid">
            {[
              ["returned", "Returned"],
              ["damaged", "Damaged"],
              ["lost", "Lost"],
            ].map(([field, label]) => (
              <label key={field}>{label}
                <input
                  type="number"
                  min="0"
                  max={transaction.issued}
                  step="1"
                  required
                  value={quantities[field]}
                  onChange={(event) => updateQuantity(field, event.target.value)}
                />
              </label>
            ))}
          </div>
          <p className="delivery-quantity-hint">The combined quantity cannot exceed {transaction.issued} issued containers.</p>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="delivery-confirmation-actions">
          <Button type="button" variant="secondary" onClick={onBack}>Cancel</Button>
          <Button type="submit"><Check size={16} /> Confirm successful delivery</Button>
        </div>
      </form>
    </section>
  );
}

// Edits workspace preferences and provides backup and reset actions.

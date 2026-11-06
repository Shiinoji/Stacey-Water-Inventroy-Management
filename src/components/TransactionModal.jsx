import { useState } from "react";
import { Check, Package, X } from "lucide-react";
import { Button } from "./Common.jsx";
import { localInputDate } from "../utils/dates.js";
import { formatMoney } from "../utils/formatters.js";

export function TransactionModal({ employees, containers, areas, currency, onClose, onSave }) {
  const [form, setForm] = useState({
    date: localInputDate(),
    employee: employees[0] ? `${employees[0].first} ${employees[0].last}` : "",
    area: areas[0]?.name || "",
    containerId: containers[0] ? String(containers[0].id) : "",
    issued: 1,
  });
  const [returnLater, setReturnLater] = useState(false);
  const [returnError, setReturnError] = useState("");
  const selectedArea = areas.find((area) => area.name === form.area);
  // Container types can repeat with different ownership and prices, so select by record ID.
  const selectedContainer = containers.find((item) => String(item.id) === form.containerId);
  // Updates a transaction field while preserving the other form values.
  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // Validates transaction details and sends the new delivery data to the app.
  const submit = (event) => {
    event.preventDefault();
    if (!form.employee || !selectedContainer || !form.area || Number(form.issued) < 1) return;
    const accountedFor = returnLater
      ? Number(form.returned || 0) + Number(form.damaged || 0) + Number(form.lost || 0)
      : 0;
    if (accountedFor > Number(form.issued)) {
      setReturnError("Returned, damaged and lost quantities can’t exceed the quantity issued.");
      return;
    }
    onSave({
      date: form.date,
      employee: form.employee,
      area: form.area,
      container: selectedContainer.type,
      issued: Number(form.issued),
      returned: returnLater ? Number(form.returned || 0) : 0,
      damaged: returnLater ? Number(form.damaged || 0) : 0,
      lost: returnLater ? Number(form.lost || 0) : 0,
      unitPrice: selectedContainer?.price || 0,
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><div className="eyebrow">INVENTORY MOVEMENT</div><h2 id="modal-title">New transaction</h2><p>Issue containers to a delivery area.</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={submit}>
          <div className="transaction-form-grid">
            <label>Transaction date<input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} required /></label>
            <label>Employee<select value={form.employee} onChange={(event) => updateForm("employee", event.target.value)} required><option value="" disabled>Select an employee</option>{employees.map((employee) => <option key={employee.id}>{employee.first} {employee.last}</option>)}</select></label>
            <label>Delivery area<select value={form.area} onChange={(event) => updateForm("area", event.target.value)} required><option value="" disabled>Select a delivery area</option>{areas.map((area) => <option key={area.id}>{area.name}</option>)}</select><small>{selectedArea ? `${selectedArea.barangay} · ${selectedArea.employee}` : "Choose a delivery area"}</small></label>
            <label>Container<select value={form.containerId} onChange={(event) => updateForm("containerId", event.target.value)} required><option value="" disabled>Select a container</option>{containers.map((item) => <option key={item.id} value={item.id}>{item.type} · {item.ownership}</option>)}</select><small>{selectedContainer ? `${selectedContainer.ownership} · ${formatMoney(selectedContainer.price, currency)} per unit` : "Choose a container"}</small></label>
            <label className="issued-field">Quantity issued<input type="number" min="1" value={form.issued} onChange={(event) => { updateForm("issued", event.target.value); setReturnError(""); }} required /></label>
          </div>
          <label className="return-toggle"><input type="checkbox" checked={returnLater} onChange={(event) => setReturnLater(event.target.checked)} /><span className="toggle-track" /><span><strong>Record a return now</strong><small>Skip this if containers are still out for delivery.</small></span></label>
          {returnLater && <div className="return-fields">{[["returned", "Returned"], ["damaged", "Damaged"], ["lost", "Lost"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={form[key] || 0} onChange={(event) => { updateForm(key, event.target.value); setReturnError(""); }} /></label>)}</div>}
          {returnError && <p className="form-error" role="alert">{returnError}</p>}
          <div className="transaction-summary">
            <span><span className="summary-icon"><Package size={16} /></span><span><strong>{form.issued || 0} containers</strong><small>Estimated sale after returns</small></span></span>
            <strong>{formatMoney(
              Math.max(0, (Number(form.issued) || 0) - (returnLater ? Number(form.returned || 0) : 0)) * (selectedContainer?.price || 0),
              currency,
            )}</strong>
          </div>
          <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><Button type="submit"><Check size={16} /> Save transaction</Button></div>
        </form>
      </section>
    </div>
  );
}

// Formats a date using one of the workspace's supported display formats.

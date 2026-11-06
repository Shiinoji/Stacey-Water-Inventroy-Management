import { useEffect, useRef, useState } from "react";
import { Check, Download, Trash2, Upload } from "lucide-react";
import { Button, PageHeading } from "../components/Common.jsx";

export function SettingsPage({ settings, defaultSettings, isWorkspaceBackup, onSave, onResetData, onExportData, onImportData, notify }) {
  const [form, setForm] = useState(settings);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [backupToImport, setBackupToImport] = useState(null);
  const [backupFileName, setBackupFileName] = useState("");
  const importInput = useRef(null);
  useEffect(() => setForm(settings), [settings]);
  // Updates one field in the editable settings form.
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  // Saves the form after trimming the required business name.
  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, businessName: form.businessName.trim() });
  };
  // Opens the in-app confirmation before any workspace data can be erased.
  const resetData = () => {
    setShowResetConfirmation(true);
  };
  // Resets data only after the user confirms in the dialog.
  const confirmResetData = () => {
    if (onResetData()) {
      setForm({ ...defaultSettings });
      setShowResetConfirmation(false);
    }
  };
  // Reads and validates the selected backup before asking for import confirmation.
  const selectBackupFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());
      if (!isWorkspaceBackup(backup)) {
        notify("The selected file is not a valid workspace backup.");
        return;
      }
      setBackupToImport(backup);
      setBackupFileName(file.name);
    } catch (error) {
      console.error("Unable to read workspace backup.", error);
      notify("The selected file is not valid JSON.");
    }
  };
  // Imports the validated backup only after the user confirms in the dialog.
  const confirmImportBackup = () => {
    if (onImportData(backupToImport)) {
      setBackupToImport(null);
      setBackupFileName("");
    }
  };

  return (
    <form className="settings-page" onSubmit={submit}>
      <PageHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Manage your business profile and inventory defaults." />
      <section className="panel settings-section">
        <div className="settings-section-heading">
          <h2>Business profile</h2>
          <p>Set up your business information and contact details.</p>
        </div>
        <div className="settings-grid">
          <label>Business name
            <input value={form.businessName} onChange={(event) => update("businessName", event.target.value)} required />
          </label>
          <label>Contact email
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Business Email" />
          </label>
          <label>Phone number
            <input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+63 9XX XXX XXXX" />
          </label>
          <label>Business address
            <input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Street, city, province" />
          </label>
        </div>
      </section>

      <section className="panel settings-section regional-preferences-section">
        <div className="settings-section-heading">
          <h2>Regional preferences</h2>
          <p>Choose how prices and dates appear throughout the app.</p>
        </div>
        <div className="settings-grid">
          <label>Currency
            <select value={form.currency} onChange={(event) => update("currency", event.target.value)}>
              <option value="PHP">Philippine peso (PHP)</option>
              <option value="USD">US dollar (USD)</option>
            </select>
          </label>
          <label>Date format
            <select value={form.dateFormat} onChange={(event) => update("dateFormat", event.target.value)}>
              <option value="MMM d, yyyy">Nov 5, 2026</option>
              <option value="dd/MM/yyyy">05/11/2026</option>
              <option value="yyyy-MM-dd">2026-11-05</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel settings-section inventory-defaults-section">
        <div className="settings-section-heading">
          <h2>Inventory defaults</h2>
          <p>Set the default ownership type for new container records.</p>
        </div>
        <div className="settings-grid">
          <label>Default container ownership
            <select value={form.defaultOwnership} onChange={(event) => update("defaultOwnership", event.target.value)}>
              <option value="Company-owned">Company-owned</option>
              <option value="Customer-owned">Customer-owned</option>
            </select>
          </label>
        </div>
      </section>
      <section className="panel settings-section reset-section">
        <div className="settings-section-heading">
          <h2>Backup workspace data</h2>
          <p>Import a backup to replace your current workspace, or download a copy of your settings and records.</p>
        </div>
        <div className="backup-actions">
          <input
            ref={importInput}
            className="visually-hidden"
            type="file"
            accept=".json,application/json"
            aria-label="Choose a workspace backup file"
            onChange={selectBackupFile}
          />
          <button type="button" className="button button-secondary" onClick={() => importInput.current?.click()}><Upload size={16} /> Import backup</button>
          <button type="button" className="button button-secondary" onClick={onExportData}><Download size={16} /> Download backup</button>
        </div>
      </section>
      <section className="panel settings-section reset-section">
        <div className="settings-section-heading">
          <h2>Reset workspace data</h2>
          <p>Permanently delete all records and restore settings to their defaults.</p>
        </div>
        <button type="button" className="button button-danger" onClick={resetData}><Trash2 size={16} /> Reset all data</button>
      </section>
      <div className="settings-actions"><Button type="submit"><Check size={16} /> Save settings</Button></div>
      {showResetConfirmation && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowResetConfirmation(false);
          }}
        >
          <section className="transaction-modal reset-confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">WARNING</div>
                <h2 id="reset-dialog-title">Reset all workspace data?</h2>
                <p id="reset-dialog-description">This permanently deletes employees, containers, delivery areas, pending deliveries, transaction history, and saved settings. This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowResetConfirmation(false)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={confirmResetData}><Trash2 size={16} /> Reset all data</Button>
            </div>
          </section>
        </div>
      )}
      {backupToImport && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setBackupToImport(null);
              setBackupFileName("");
            }
          }}
        >
          <section className="transaction-modal reset-confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="import-dialog-title" aria-describedby="import-dialog-description">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">IMPORT BACKUP</div>
                <h2 id="import-dialog-title">Replace workspace data?</h2>
                <p id="import-dialog-description">Import <strong>{backupFileName}</strong>? This replaces all current workspace records and settings. This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => {
                setBackupToImport(null);
                setBackupFileName("");
              }}>Cancel</Button>
              <Button type="button" variant="primary" onClick={confirmImportBackup}><Upload size={16} /> Import backup</Button>
            </div>
          </section>
        </div>
      )}
    </form>
  );
}

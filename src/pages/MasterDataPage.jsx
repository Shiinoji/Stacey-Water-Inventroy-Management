import { useState } from "react";
import { Boxes, Check, MapPin, Package, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { Button, PageHeading, StatusPill } from "../components/Common.jsx";
import { formatMoney } from "../utils/formatters.js";

export function MasterDataPage({ section, setSection, employees, setEmployees, containers, setContainers, currency, defaultOwnership, areas, setAreas, notify }) {
  return (
    <>
      <PageHeading eyebrow="YOUR BUSINESS, YOUR WAY" title="Master data" description="Set up the people, containers and places behind every delivery." />
      <div className="master-tabs">{["Employees", "Containers", "Delivery areas"].map((item) => {
        const Icon = item === "Employees" ? Users : item === "Containers" ? Boxes : MapPin;
        const count = item === "Employees" ? employees.length : item === "Containers" ? containers.length : areas.length;
        return <button key={item} className={`master-tab ${section === item ? "master-tab-active" : ""}`} onClick={() => setSection(item)}><Icon size={17} />{item}<span>{count}</span></button>;
      })}</div>
      {section === "Employees" && <EmployeesMaster employees={employees} setEmployees={setEmployees} setAreas={setAreas} notify={notify} />}
      {section === "Containers" && <ContainersMaster containers={containers} setContainers={setContainers} currency={currency} defaultOwnership={defaultOwnership} notify={notify} />}
      {section === "Delivery areas" && <AreasMaster areas={areas} setAreas={setAreas} employees={employees} notify={notify} />}
    </>
  );
}

function MasterEditModal({ title, fields, value, onChange, onClose, onSave }) {
  const submit = (event) => {
    event.preventDefault();
    onSave();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="transaction-modal master-edit-modal" role="dialog" aria-modal="true" aria-labelledby="master-edit-title">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">MASTER DATA</div>
            <h2 id="master-edit-title">Edit {title}</h2>
            <p>Update this record's information.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close edit dialog" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="settings-grid master-edit-fields">
            {fields.map((field) => (
              <label key={field.key}>
                {field.label}
                {field.options ? (
                  <select
                    value={value[field.key]}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    required={field.required !== false}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    min={field.min}
                    step={field.step}
                    value={value[field.key]}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    required={field.required !== false}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit"><Check size={16} /> Save changes</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MasterDeleteModal({ title, description, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="transaction-modal reset-confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="master-delete-title" aria-describedby="master-delete-description">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">CONFIRM DELETION</div>
            <h2 id="master-delete-title">Delete {title}?</h2>
            <p id="master-delete-description">{description} Existing transactions will be kept. This action cannot be undone.</p>
          </div>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="danger" onClick={onConfirm}><Trash2 size={16} /> Delete</Button>
        </div>
      </section>
    </div>
  );
}

// Each master form keeps its draft local and commits a validated record on submit.

export function EmployeesMaster({ employees, setEmployees, setAreas, notify }) {
  const [form, setForm] = useState({ first: "", last: "", phone: "", team: "Delivery team" });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  // Adds a validated employee record and clears the entry form.
  const submit = (event) => {
    event.preventDefault();
    if (!form.first.trim() || !form.last.trim()) return;
    setEmployees((current) => [...current, { ...form, id: Date.now() }]);
    setForm({ first: "", last: "", phone: "", team: "Delivery team" });
    notify("Employee added successfully");
  };
  // Deletes an employee and clears any delivery-area assignment no longer valid.
  const removeEmployee = (person) => {
    const name = `${person.first} ${person.last}`;
    const remainingEmployees = employees.filter((item) => item.id !== person.id);
    setEmployees(remainingEmployees);
    setAreas((current) => current.map((area) => (
      area.employee === name && !remainingEmployees.some((item) => `${item.first} ${item.last}` === name)
        ? { ...area, employee: "Not assigned" }
        : area
    )));
    setDeletingEmployee(null);
    notify("Employee deleted successfully");
  };
  const editEmployee = (person) => {
    setEditingEmployee({ ...person });
  };
  const saveEmployee = () => {
    if (!editingEmployee.first.trim() || !editingEmployee.last.trim()) return;
    const previousEmployee = employees.find((person) => person.id === editingEmployee.id);
    const previousName = previousEmployee ? `${previousEmployee.first} ${previousEmployee.last}` : "";
    const updatedName = `${editingEmployee.first.trim()} ${editingEmployee.last.trim()}`;
    setEmployees((current) => current.map((person) => (
      person.id === editingEmployee.id
        ? { ...editingEmployee, first: editingEmployee.first.trim(), last: editingEmployee.last.trim(), phone: editingEmployee.phone.trim(), team: editingEmployee.team || "Delivery team" }
        : person
    )));
    if (previousName !== updatedName) {
      setAreas((current) => current.map((area) => (
        area.employee === previousName ? { ...area, employee: updatedName } : area
      )));
    }
    setEditingEmployee(null);
    notify("Employee updated successfully");
  };
  return <section className="master-content">
    <div className="master-intro"><span className="master-intro-icon people-intro"><Users size={19} /></span><div><h2>Employees</h2><p>People who make every delivery possible.</p></div></div>
    <div className="master-columns">
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add an employee</h3></div><label>First name<input value={form.first} onChange={(event) => setForm({ ...form, first: event.target.value })} placeholder="e.g. Jamie" required /></label><label>Last name<input value={form.last} onChange={(event) => setForm({ ...form, last: event.target.value })} placeholder="e.g. Rivera" required /></label><label>Contact number <span className="optional">(optional)</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+63 9XX XXX XXXX" /></label><label>Team<select value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })}><option>Delivery team</option><option>Refilling team</option></select></label><Button type="submit"><Plus size={16} /> Add employee</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Your team</h3><p>Manage your delivery staff</p></div><span className="list-count">{employees.length}</span></div><div className="master-list">{employees.length ? employees.map((person) => <div className="master-list-row" key={person.id}><span className="master-person-name"><strong>{person.first} {person.last}</strong><small>{person.team || "Delivery team"} · {person.phone || "No contact number"}</small></span><button type="button" className="icon-button edit-button" aria-label={`Edit ${person.first} ${person.last}`} title="Edit employee" onClick={() => editEmployee(person)}><Pencil size={16} /></button><button type="button" className="icon-button delete-button" aria-label={`Delete ${person.first} ${person.last}`} title="Delete employee" onClick={() => setDeletingEmployee(person)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No employees added yet.</p>}</div></div>
    </div>
    {editingEmployee && <MasterEditModal
      title="employee"
      fields={[
        { key: "first", label: "First name" },
        { key: "last", label: "Last name" },
        { key: "phone", label: "Contact number", required: false },
        {
          key: "team",
          label: "Team",
          options: ["Delivery team", "Refilling team"].map((team) => ({ value: team, label: team })),
        },
      ]}
      value={{ ...editingEmployee, team: editingEmployee.team || "Delivery team" }}
      onChange={(key, value) => setEditingEmployee((current) => ({ ...current, [key]: value }))}
      onClose={() => setEditingEmployee(null)}
      onSave={saveEmployee}
    />}
    {deletingEmployee && <MasterDeleteModal
      title={`${deletingEmployee.first} ${deletingEmployee.last}`}
      description="This employee will be removed from your team."
      onClose={() => setDeletingEmployee(null)}
      onConfirm={() => removeEmployee(deletingEmployee)}
    />}
  </section>;
}

export function ContainersMaster({ containers, setContainers, currency, defaultOwnership, notify }) {
  const initialForm = { type: "", ownership: defaultOwnership, status: "Active", price: "" };
  const [form, setForm] = useState(initialForm);
  const [editingContainer, setEditingContainer] = useState(null);
  const [deletingContainer, setDeletingContainer] = useState(null);
  // Adds a container record with its price stored as a number.
  const submit = (event) => {
    event.preventDefault();
    if (!form.type.trim() || !form.price) return;
    setContainers((current) => [...current, { ...form, price: Number(form.price), id: Date.now() }]);
    setForm(initialForm);
    notify("Container added successfully");
  };
  // Deletes a container type after confirmation, preserving existing transactions.
  const removeContainer = (item) => {
    setContainers((current) => current.filter((container) => container.id !== item.id));
    setDeletingContainer(null);
    notify("Container deleted successfully");
  };
  const saveContainer = () => {
    if (!editingContainer.type.trim() || editingContainer.price === "") return;
    setContainers((current) => current.map((item) => (
      item.id === editingContainer.id
        ? { ...editingContainer, type: editingContainer.type.trim(), price: Number(editingContainer.price) }
        : item
    )));
    setEditingContainer(null);
    notify("Container updated successfully");
  };
  return <section className="master-content">
    <div className="master-intro"><span className="master-intro-icon container-intro"><Boxes size={19} /></span><div><h2>Containers</h2><p>Keep track of every container type and its value.</p></div></div>
    <div className="master-columns">
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add a container</h3></div><label>Container type<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} placeholder="e.g. 20L Jug" required /></label><label>Ownership type<select value={form.ownership} onChange={(event) => setForm({ ...form, ownership: event.target.value })}><option>Company-owned</option><option>Customer-owned</option></select></label><div className="form-two-col"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>Inactive</option></select></label><label>Unit price<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="₱ 0.00" required /></label></div><Button type="submit"><Plus size={16} /> Add container</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Container types</h3><p>Pricing and availability</p></div><span className="list-count">{containers.length}</span></div><div className="master-list">{containers.length ? containers.map((item) => <div className="master-list-row container-list-row" key={item.id}><span className="container-list-icon"><Package size={18} /></span><span className="master-person-name"><strong>{item.type}</strong><small>{item.ownership} · {formatMoney(item.price, currency)} / unit</small></span><StatusPill kind={item.status === "Active" ? "green" : "gray"}>{item.status}</StatusPill><button type="button" className="icon-button edit-button" aria-label={`Edit ${item.type} (${item.ownership})`} title="Edit container" onClick={() => setEditingContainer({ ...item, price: String(item.price) })}><Pencil size={16} /></button><button type="button" className="icon-button delete-button" aria-label={`Delete ${item.type} (${item.ownership})`} title="Delete container type" onClick={() => setDeletingContainer(item)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No container types added yet.</p>}</div></div>
    </div>
    {editingContainer && <MasterEditModal
      title="container"
      fields={[
        { key: "type", label: "Container type" },
        { key: "ownership", label: "Ownership type", options: ["Company-owned", "Customer-owned"].map((item) => ({ value: item, label: item })) },
        { key: "status", label: "Status", options: ["Active", "Inactive"].map((item) => ({ value: item, label: item })) },
        { key: "price", label: "Unit price", type: "number", min: "0", step: "0.01" },
      ]}
      value={editingContainer}
      onChange={(key, value) => setEditingContainer((current) => ({ ...current, [key]: value }))}
      onClose={() => setEditingContainer(null)}
      onSave={saveContainer}
    />}
    {deletingContainer && <MasterDeleteModal
      title={`${deletingContainer.type} (${deletingContainer.ownership})`}
      description="This container type will be removed from your inventory options."
      onClose={() => setDeletingContainer(null)}
      onConfirm={() => removeContainer(deletingContainer)}
    />}
  </section>;
}

export function AreasMaster({ areas, setAreas, employees, notify }) {
  const [form, setForm] = useState({ name: "", barangay: "", employee: "" });
  const [editingArea, setEditingArea] = useState(null);
  const [deletingArea, setDeletingArea] = useState(null);
  // Adds a delivery area, defaulting its employee assignment when none is selected.
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.barangay.trim()) return;
    setAreas((current) => [...current, { ...form, id: Date.now(), employee: form.employee || "Not assigned" }]);
    setForm({ name: "", barangay: "", employee: "" });
    notify("Delivery area added successfully");
  };
  // Deletes a delivery area after confirmation without changing historical records.
  const removeArea = (area) => {
    setAreas((current) => current.filter((item) => item.id !== area.id));
    setDeletingArea(null);
    notify("Delivery area deleted successfully");
  };
  const saveArea = () => {
    if (!editingArea.name.trim() || !editingArea.barangay.trim()) return;
    setAreas((current) => current.map((area) => (
      area.id === editingArea.id
        ? { ...editingArea, name: editingArea.name.trim(), barangay: editingArea.barangay.trim(), employee: editingArea.employee || "Not assigned" }
        : area
    )));
    setEditingArea(null);
    notify("Delivery area updated successfully");
  };
  return <section className="master-content">
    <div className="master-intro"><span className="master-intro-icon area-intro"><MapPin size={19} /></span><div><h2>Delivery areas</h2><p>Organize your routes by neighborhood and barangay.</p></div></div>
    <div className="master-columns">
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add a delivery area</h3></div><label>Area name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sipocot" required /></label><label>Barangay<input value={form.barangay} onChange={(event) => setForm({ ...form, barangay: event.target.value })} placeholder="e.g. San Juan" required /></label><label>Assigned employee <span className="optional">(optional)</span><select value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })}><option value="">Not assigned</option>{employees.map((employee) => <option key={employee.id}>{employee.first} {employee.last}</option>)}</select></label><Button type="submit"><Plus size={16} /> Add delivery area</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Your delivery areas</h3><p>Areas and assigned team members</p></div><span className="list-count">{areas.length}</span></div><div className="master-list">{areas.length ? areas.map((area) => <div className="master-list-row area-list-row" key={area.id}><span className="area-list-icon"><MapPin size={17} /></span><span className="master-person-name"><strong>{area.name}</strong><small>{area.barangay} barangay</small></span><span className="area-assignee">{area.employee === "Not assigned" ? <span className="unassigned">Not assigned</span> : area.employee}</span><button type="button" className="icon-button edit-button" aria-label={`Edit ${area.name} delivery area`} title="Edit delivery area" onClick={() => setEditingArea({ ...area })}><Pencil size={16} /></button><button type="button" className="icon-button delete-button" aria-label={`Delete ${area.name} delivery area`} title="Delete delivery area" onClick={() => setDeletingArea(area)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No delivery areas added yet.</p>}</div></div>
    </div>
    {editingArea && <MasterEditModal
      title="delivery area"
      fields={[
        { key: "name", label: "Area name" },
        { key: "barangay", label: "Barangay" },
        {
          key: "employee",
          label: "Assigned employee",
          options: [
            { value: "Not assigned", label: "Not assigned" },
            ...employees.map((employee) => ({
              value: `${employee.first} ${employee.last}`,
              label: `${employee.first} ${employee.last}`,
            })),
          ],
        },
      ]}
      value={editingArea}
      onChange={(key, value) => setEditingArea((current) => ({ ...current, [key]: value }))}
      onClose={() => setEditingArea(null)}
      onSave={saveArea}
    />}
    {deletingArea && <MasterDeleteModal
      title={`${deletingArea.name} delivery area`}
      description="This delivery area will be removed from your workspace."
      onClose={() => setDeletingArea(null)}
      onConfirm={() => removeArea(deletingArea)}
    />}
  </section>;
}

// Creates a delivery transaction and validates its container counts before saving.

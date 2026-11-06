import { useState } from "react";
import { Boxes, MapPin, Package, Plus, Trash2, Users } from "lucide-react";
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

// Each master form keeps its draft local and commits a validated record on submit.

export function EmployeesMaster({ employees, setEmployees, setAreas, notify }) {
  const [form, setForm] = useState({ first: "", last: "", phone: "" });
  // Adds a validated employee record and clears the entry form.
  const submit = (event) => {
    event.preventDefault();
    if (!form.first.trim() || !form.last.trim()) return;
    setEmployees((current) => [...current, { ...form, id: Date.now() }]);
    setForm({ first: "", last: "", phone: "" });
    notify("Employee added successfully");
  };
  // Deletes an employee and clears any delivery-area assignment no longer valid.
  const removeEmployee = (person) => {
    const name = `${person.first} ${person.last}`;
    if (!window.confirm(`Delete ${name}? Existing transactions will be kept.`)) return;
    const remainingEmployees = employees.filter((item) => item.id !== person.id);
    setEmployees(remainingEmployees);
    setAreas((current) => current.map((area) => (
      area.employee === name && !remainingEmployees.some((item) => `${item.first} ${item.last}` === name)
        ? { ...area, employee: "Not assigned" }
        : area
    )));
    notify("Employee deleted successfully");
  };
  return <section className="master-content">
    <div className="master-intro"><span className="master-intro-icon people-intro"><Users size={19} /></span><div><h2>Employees</h2><p>People who make every delivery possible.</p></div></div>
    <div className="master-columns">
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add an employee</h3></div><label>First name<input value={form.first} onChange={(event) => setForm({ ...form, first: event.target.value })} placeholder="e.g. Jamie" required /></label><label>Last name<input value={form.last} onChange={(event) => setForm({ ...form, last: event.target.value })} placeholder="e.g. Rivera" required /></label><label>Contact number <span className="optional">(optional)</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+63 9XX XXX XXXX" /></label><Button type="submit"><Plus size={16} /> Add employee</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Your team</h3><p>Manage your delivery staff</p></div><span className="list-count">{employees.length}</span></div><div className="master-list">{employees.length ? employees.map((person) => <div className="master-list-row" key={person.id}><span className="master-person-name"><strong>{person.first} {person.last}</strong><small>{person.phone || "No contact number"}</small></span><button type="button" className="icon-button delete-button" aria-label={`Delete ${person.first} ${person.last}`} title="Delete employee" onClick={() => removeEmployee(person)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No employees added yet.</p>}</div></div>
    </div>
  </section>;
}

export function ContainersMaster({ containers, setContainers, currency, defaultOwnership, notify }) {
  const initialForm = { type: "", ownership: defaultOwnership, status: "Active", price: "" };
  const [form, setForm] = useState(initialForm);
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
    if (!window.confirm(`Delete ${item.type} (${item.ownership})? Existing transactions will be kept.`)) return;
    setContainers((current) => current.filter((container) => container.id !== item.id));
    notify("Container deleted successfully");
  };
  return <section className="master-content">
    <div className="master-intro"><span className="master-intro-icon container-intro"><Boxes size={19} /></span><div><h2>Containers</h2><p>Keep track of every container type and its value.</p></div></div>
    <div className="master-columns">
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add a container</h3></div><label>Container type<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} placeholder="e.g. 20L Jug" required /></label><label>Ownership type<select value={form.ownership} onChange={(event) => setForm({ ...form, ownership: event.target.value })}><option>Company-owned</option><option>Customer-owned</option></select></label><div className="form-two-col"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>Inactive</option></select></label><label>Unit price<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="₱ 0.00" required /></label></div><Button type="submit"><Plus size={16} /> Add container</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Container types</h3><p>Pricing and availability</p></div><span className="list-count">{containers.length}</span></div><div className="master-list">{containers.length ? containers.map((item) => <div className="master-list-row container-list-row" key={item.id}><span className="container-list-icon"><Package size={18} /></span><span className="master-person-name"><strong>{item.type}</strong><small>{item.ownership} · {formatMoney(item.price, currency)} / unit</small></span><StatusPill kind={item.status === "Active" ? "green" : "gray"}>{item.status}</StatusPill><button type="button" className="icon-button delete-button" aria-label={`Delete ${item.type} (${item.ownership})`} title="Delete container type" onClick={() => removeContainer(item)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No container types added yet.</p>}</div></div>
    </div>
  </section>;
}

export function AreasMaster({ areas, setAreas, employees, notify }) {
  const [form, setForm] = useState({ name: "", barangay: "", employee: "" });
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
    if (!window.confirm(`Delete the ${area.name} delivery area? Existing transactions will be kept.`)) return;
    setAreas((current) => current.filter((item) => item.id !== area.id));
    notify("Delivery area deleted successfully");
  };
  return <section className="master-content">
    <div className="master-intro"><span className="master-intro-icon area-intro"><MapPin size={19} /></span><div><h2>Delivery areas</h2><p>Organize your routes by neighborhood and barangay.</p></div></div>
    <div className="master-columns">
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add a delivery area</h3></div><label>Area name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sipocot" required /></label><label>Barangay<input value={form.barangay} onChange={(event) => setForm({ ...form, barangay: event.target.value })} placeholder="e.g. San Juan" required /></label><label>Assigned employee <span className="optional">(optional)</span><select value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })}><option value="">Not assigned</option>{employees.map((employee) => <option key={employee.id}>{employee.first} {employee.last}</option>)}</select></label><Button type="submit"><Plus size={16} /> Add delivery area</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Your delivery areas</h3><p>Areas and assigned team members</p></div><span className="list-count">{areas.length}</span></div><div className="master-list">{areas.length ? areas.map((area) => <div className="master-list-row area-list-row" key={area.id}><span className="area-list-icon"><MapPin size={17} /></span><span className="master-person-name"><strong>{area.name}</strong><small>{area.barangay} barangay</small></span><span className="area-assignee">{area.employee === "Not assigned" ? <span className="unassigned">Not assigned</span> : area.employee}</span><button type="button" className="icon-button delete-button" aria-label={`Delete ${area.name} delivery area`} title="Delete delivery area" onClick={() => removeArea(area)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No delivery areas added yet.</p>}</div></div>
    </div>
  </section>;
}

// Creates a delivery transaction and validates its container counts before saving.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Droplets,
  Filter,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Settings2,
  ShoppingBag,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";

// Build date-input values from local calendar fields to avoid UTC date shifts.
const localInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Returns a YYYY-MM-DD string for a date a given number of days in the past.
const relativeDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return localInputDate(date);
};

// These in-memory records seed the demo workspace when the app first loads.
const initialEmployees = [
  { id: 1, first: "Marco", last: "Reyes", phone: "0917 555 0182" },
  { id: 2, first: "Ana", last: "Santos", phone: "0918 240 7721" },
  { id: 3, first: "Rafael", last: "Cruz", phone: "0920 318 6640" },
];

const initialContainers = [
  { id: 1, type: "5-gallon jug", ownership: "Company-owned", status: "Active", price: 35 },
  { id: 2, type: "Water dispenser", ownership: "Company-owned", status: "Active", price: 250 },
  { id: 3, type: "5-gallon jug", ownership: "Customer-owned", status: "Active", price: 30 },
];

const initialAreas = [
  { id: 1, name: "Riverside", barangay: "San Isidro", employee: "Marco Reyes" },
  { id: 2, name: "North Park", barangay: "Poblacion", employee: "Ana Santos" },
  { id: 3, name: "Lakeside", barangay: "San Roque", employee: "Rafael Cruz" },
];

const initialTransactions = [
  { id: "TR-1048", date: relativeDate(0), employee: "Marco Reyes", container: "5-gallon jug", area: "Riverside", issued: 18, returned: 12, damaged: 1, lost: 0, unitPrice: 35 },
  { id: "TR-1047", date: relativeDate(0), employee: "Ana Santos", container: "5-gallon jug", area: "North Park", issued: 24, returned: 19, damaged: 0, lost: 1, unitPrice: 35 },
  { id: "TR-1046", date: relativeDate(1), employee: "Rafael Cruz", container: "Water dispenser", area: "Lakeside", issued: 4, returned: 3, damaged: 0, lost: 0, unitPrice: 250 },
  { id: "TR-1045", date: relativeDate(1), employee: "Marco Reyes", container: "5-gallon jug", area: "Riverside", issued: 16, returned: 14, damaged: 0, lost: 0, unitPrice: 35 },
  { id: "TR-1044", date: relativeDate(2), employee: "Ana Santos", container: "5-gallon jug", area: "North Park", issued: 20, returned: 17, damaged: 1, lost: 0, unitPrice: 35 },
  { id: "TR-1043", date: relativeDate(2), employee: "Rafael Cruz", container: "Water dispenser", area: "Lakeside", issued: 6, returned: 5, damaged: 0, lost: 0, unitPrice: 250 },
];

const defaultSettings = {
  businessName: "Stacey Water",
  email: "",
  phone: "",
  address: "",
  currency: "PHP",
  dateFormat: "MMM d, yyyy",
  defaultOwnership: "Company-owned",
};

const settingOptions = {
  currency: ["PHP", "USD"],
  dateFormat: ["MMM d, yyyy", "dd/MM/yyyy", "yyyy-MM-dd"],
  defaultOwnership: ["Company-owned", "Customer-owned"],
};

// Ensures a selected JSON file has the shape expected by the backup importer.
function isWorkspaceBackup(value) {
  const isObject = (item) => item !== null && typeof item === "object" && !Array.isArray(item);
  const isText = (item) => typeof item === "string";
  const isNumber = (item) => typeof item === "number" && Number.isFinite(item);
  const hasValidSettings = (item) => isObject(item) &&
    Object.keys(defaultSettings).every((key) => (
      typeof item[key] === "string" &&
      (settingOptions[key] ? settingOptions[key].includes(item[key]) : true)
    )) &&
    item.businessName.trim().length > 0;
  const hasValidEmployees = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isNumber(item.id) && isText(item.first) && isText(item.last) && isText(item.phone)
  );
  const hasValidContainers = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isNumber(item.id) && isText(item.type) &&
    ["Company-owned", "Customer-owned"].includes(item.ownership) &&
    ["Active", "Inactive"].includes(item.status) && isNumber(item.price) && item.price >= 0
  );
  const hasValidAreas = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isNumber(item.id) && isText(item.name) &&
    isText(item.barangay) && isText(item.employee)
  );
  const hasValidTransactions = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isText(item.id) && isText(item.date) &&
    !Number.isNaN(new Date(`${item.date}T00:00:00`).getTime()) &&
    isText(item.employee) && isText(item.container) && isText(item.area) &&
    isNumber(item.issued) && item.issued >= 1 &&
    isNumber(item.returned) && item.returned >= 0 &&
    isNumber(item.damaged) && item.damaged >= 0 &&
    isNumber(item.lost) && item.lost >= 0 &&
    item.returned + item.damaged + item.lost <= item.issued &&
    isNumber(item.unitPrice) && item.unitPrice >= 0
  );

  return isObject(value) &&
    value.version === 1 &&
    hasValidSettings(value.businessSettings) &&
    hasValidEmployees(value.employees) &&
    hasValidContainers(value.containers) &&
    hasValidAreas(value.deliveryAreas) &&
    hasValidTransactions(value.transactionHistory) &&
    hasValidTransactions(value.pendingDeliveries);
}

// Reads saved business settings and validates them against the supported options.
function loadSettings() {
  try {
    const saved = window.localStorage.getItem("stacey-water-settings");
    if (!saved) return defaultSettings;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaultSettings;
    return Object.fromEntries(Object.keys(defaultSettings).map((key) => {
      const value = parsed[key];
      const valid = settingOptions[key]
        ? settingOptions[key].includes(value)
        : typeof value === "string";
      return [key, valid ? value : defaultSettings[key]];
    }));
  } catch (error) {
    console.error("Unable to load saved business settings.", error);
    return defaultSettings;
  }
}

// Loads a saved list from local storage, falling back to the supplied seed data.
function loadMasterData(key, initialData) {
  try {
    const saved = window.localStorage.getItem(`stacey-water-${key}`);
    if (!saved) return initialData;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new Error(`Saved ${key} data is not a list.`);
    }
    return parsed;
  } catch (error) {
    console.error(`Unable to load saved ${key} data.`, error);
    return initialData;
  }
}

// Shared navigation and currency helpers keep labels and totals consistent.
const navItems = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Transactions", label: "Transactions", icon: ArrowDownRight },
  { id: "Sales", label: "Sales", icon: Wallet },
];

// Formats a number as a currency amount for display.
const formatMoney = (value, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

// Small presentational components keep repeated dashboard UI consistent.
// Displays the brand mark alongside the configured business name.
function Logo({ businessName }) {
  return (
    <a className="brand" href="#" aria-label={`${businessName} home`}>
      <span className="brand-mark"><Droplets size={20} strokeWidth={2.2} /></span>
      <span>{businessName}</span>
    </a>
  );
}

// Renders the app's shared button styles while forwarding native button props.
function Button({ children, variant = "primary", className = "", ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

// Displays a labeled metric with its icon and color treatment.
function MetricCard({ label, value, icon: Icon, tone = "blue" }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon size={19} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}

// Displays a short status label with a visual status color.
function StatusPill({ children, kind = "green" }) {
  return <span className={`status-pill status-${kind}`}>{children}</span>;
}

// Shows a consistent message when a section has no content to display.
function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={24} /></span>
      <strong>{title}</strong>
      <span>{text}</span>
      {action}
    </div>
  );
}

// Owns workspace state and routes the selected page to its content component.
function App() {
  const [page, setPage] = useState("Dashboard");
  const [masterSection, setMasterSection] = useState("Employees");
  const [deliveryConfirmationId, setDeliveryConfirmationId] = useState(null);
  const [transactions, setTransactions] = useState(() => loadMasterData("transactions", initialTransactions));
  const [pendingTransactions, setPendingTransactions] = useState(() => loadMasterData("pending-transactions", []));
  const [employees, setEmployees] = useState(() => loadMasterData("employees", initialEmployees));
  const [containers, setContainers] = useState(() => loadMasterData("containers", initialContainers));
  const [areas, setAreas] = useState(() => loadMasterData("areas", initialAreas));
  const [settings, setSettings] = useState(loadSettings);
  const [showTransaction, setShowTransaction] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ employee: "All employees", area: "All areas", container: "All containers" });
  const [appliedFilters, setAppliedFilters] = useState({ employee: "All employees", area: "All areas", container: "All containers" });
  const [toast, setToast] = useState("");
  const toastTimeout = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem("stacey-water-employees", JSON.stringify(employees));
      window.localStorage.setItem("stacey-water-containers", JSON.stringify(containers));
      window.localStorage.setItem("stacey-water-areas", JSON.stringify(areas));
      window.localStorage.setItem("stacey-water-transactions", JSON.stringify(transactions));
      window.localStorage.setItem("stacey-water-pending-transactions", JSON.stringify(pendingTransactions));
    } catch (error) {
      console.error("Unable to save workspace data.", error);
    }
  }, [employees, containers, areas, transactions, pendingTransactions]);

  useEffect(() => () => window.clearTimeout(toastTimeout.current), []);

  const activeTransactions = useMemo(() => {
    const employeeNames = new Set(employees.map((employee) => `${employee.first} ${employee.last}`));
    const areaNames = new Set(areas.map((area) => area.name));
    const containerTypes = new Set(containers.map((container) => container.type));
    return transactions.filter((item) => (
      employeeNames.has(item.employee) &&
      areaNames.has(item.area) &&
      containerTypes.has(item.container)
    ));
  }, [transactions, employees, areas, containers]);

  // Totals are calculated from transactions that still match current master data.
  const totalIssued = activeTransactions.reduce((sum, item) => sum + item.issued, 0);
  const totalReturned = activeTransactions.reduce((sum, item) => sum + item.returned, 0);
  const totalStillOut = activeTransactions.reduce(
    (sum, item) => sum + item.issued - item.returned - item.damaged - item.lost,
    0,
  );
  const totalSales = activeTransactions.reduce((sum, item) => sum + (item.issued - item.returned) * item.unitPrice, 0);

  // Search is immediate; the selected dropdown filters apply on user action.
  const filteredTransactions = useMemo(() => transactions.filter((item) => {
    const matchesSearch = `${item.id} ${item.employee} ${item.container} ${item.area}`.toLowerCase().includes(search.toLowerCase());
    const matchesEmployee = appliedFilters.employee === "All employees" || item.employee === appliedFilters.employee;
    const matchesArea = appliedFilters.area === "All areas" || item.area === appliedFilters.area;
    const matchesContainer = appliedFilters.container === "All containers" || item.container === appliedFilters.container;
    return matchesSearch && matchesEmployee && matchesArea && matchesContainer;
  }), [transactions, search, appliedFilters]);

  // Opens the form for recording a new delivery.
  const openNewTransaction = () => setShowTransaction(true);
  // Opens the summary for a transaction selected from a table.
  const openTransactionSummary = (transaction, pending = false) => {
    setSelectedTransaction({ transaction, pending });
  };

  // Shows a temporary toast message, replacing any message already on screen.
  const notify = (message) => {
    window.clearTimeout(toastTimeout.current);
    setToast(message);
    toastTimeout.current = window.setTimeout(() => setToast(""), 3200);
  };

  // Validates and persists business settings before updating the app state.
  const saveSettings = (updatedSettings) => {
    if (!updatedSettings.businessName.trim()) {
      notify("Business name is required.");
      return;
    }

    try {
      window.localStorage.setItem("stacey-water-settings", JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      notify("Settings saved");
    } catch (error) {
      console.error("Unable to save business settings.", error);
      notify("Settings could not be saved. Check your browser storage and try again.");
    }
  };

  // Downloads all workspace settings and records as a JSON backup.
  const exportWorkspaceData = () => {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        businessSettings: settings,
        employees,
        containers,
        deliveryAreas: areas,
        transactionHistory: transactions,
        pendingDeliveries: pendingTransactions,
      };
      const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      const safeBusinessName = settings.businessName.trim().replace(/[^a-z0-9_-]+/gi, "-") || "workspace";
      link.href = url;
      link.download = `${safeBusinessName}-backup-${localInputDate()}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      notify("Workspace backup downloaded");
    } catch (error) {
      console.error("Unable to export workspace data.", error);
      notify("Workspace backup could not be downloaded. Please try again.");
    }
  };

  // Replaces the current workspace with a backup already validated by SettingsPage.
  const importWorkspaceData = (backup) => {
    try {
      const importedSettings = {
        ...backup.businessSettings,
        businessName: backup.businessSettings.businessName.trim(),
      };
      window.localStorage.setItem("stacey-water-employees", JSON.stringify(backup.employees));
      window.localStorage.setItem("stacey-water-containers", JSON.stringify(backup.containers));
      window.localStorage.setItem("stacey-water-areas", JSON.stringify(backup.deliveryAreas));
      window.localStorage.setItem("stacey-water-transactions", JSON.stringify(backup.transactionHistory));
      window.localStorage.setItem("stacey-water-pending-transactions", JSON.stringify(backup.pendingDeliveries));
      window.localStorage.setItem("stacey-water-settings", JSON.stringify(importedSettings));
      setEmployees(backup.employees);
      setContainers(backup.containers);
      setAreas(backup.deliveryAreas);
      setTransactions(backup.transactionHistory);
      setPendingTransactions(backup.pendingDeliveries);
      setSettings(importedSettings);
      setSearch("");
      const allFilters = { employee: "All employees", area: "All areas", container: "All containers" };
      setFilters(allFilters);
      setAppliedFilters(allFilters);
      notify("Workspace backup imported successfully");
      return true;
    } catch (error) {
      console.error("Unable to import workspace backup.", error);
      notify("Workspace backup could not be imported. Check your browser storage and try again.");
      return false;
    }
  };

  // Clears stored workspace records and restores the default business settings.
  const resetWorkspaceData = () => {
    try {
      const emptyList = JSON.stringify([]);
      window.localStorage.setItem("stacey-water-employees", emptyList);
      window.localStorage.setItem("stacey-water-containers", emptyList);
      window.localStorage.setItem("stacey-water-areas", emptyList);
      window.localStorage.setItem("stacey-water-transactions", emptyList);
      window.localStorage.setItem("stacey-water-pending-transactions", emptyList);
      window.localStorage.removeItem("stacey-water-settings");
      setEmployees([]);
      setContainers([]);
      setAreas([]);
      setTransactions([]);
      setPendingTransactions([]);
      setSettings({ ...defaultSettings });
      notify("All workspace data has been reset");
      return true;
    } catch (error) {
      console.error("Unable to reset workspace data.", error);
      notify("Workspace data could not be reset. Please try again.");
      return false;
    }
  };

  // Add a saved transaction to the front of the activity list and notify the user.
  const saveTransaction = (values) => {
    const nextTransactionNumber = [...transactions, ...pendingTransactions].reduce((highest, item) => {
      const number = Number(item.id.replace("TR-", ""));
      return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 1048) + 1;
    const newItem = {
      ...values,
      id: `TR-${nextTransactionNumber}`,
    };
    setPendingTransactions((current) => [newItem, ...current]);
    setShowTransaction(false);
    setPage("Transactions");
    notify("Delivery added to pending");
  };

  // Selects a pending delivery and navigates to its completion form.
  const openDeliveryConfirmation = (item) => {
    setDeliveryConfirmationId(item.id);
    setPage("Delivery confirmation");
  };

  // Validates a completed delivery, then moves it from pending to transaction history.
  const completeDelivery = (item) => {
    const accountedFor = Number(item.returned || 0) + Number(item.damaged || 0) + Number(item.lost || 0);
    if (accountedFor > Number(item.issued)) {
      return "Returned, damaged and lost quantities can’t exceed the quantity issued.";
    }
    setPendingTransactions((current) => current.filter((transaction) => transaction.id !== item.id));
    setTransactions((current) => [item, ...current]);
    setSearch("");
    const allFilters = { employee: "All employees", area: "All areas", container: "All containers" };
    setFilters(allFilters);
    setAppliedFilters(allFilters);
    setDeliveryConfirmationId(null);
    setPage("Transactions");
    notify("Delivery confirmed and saved to transaction history");
    return null;
  };

  // Navigates to the selected page and closes the mobile navigation drawer.
  const handleNav = (id) => {
    setPage(id);
    setSidebarOpen(false);
  };

  const pageTitle = page === "Master data" ? masterSection : page;
  const deliveryForConfirmation = pendingTransactions.find((item) => item.id === deliveryConfirmationId);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><Logo businessName={settings.businessName} /><button className="mobile-close icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => handleNav(id)} className={`nav-link ${page === id ? "nav-active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === "Transactions" && pendingTransactions.length > 0 && <span className="nav-count">{pendingTransactions.length}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => { setPage("Master data"); setMasterSection("Employees"); setSidebarOpen(false); }} className={`nav-link ${page === "Master data" ? "nav-active" : ""}`}>
          <Settings2 size={18} strokeWidth={1.8} /><span>Master data</span>
        </button>
        <button onClick={() => handleNav("Settings")} className={`nav-link ${page === "Settings" ? "nav-active" : ""}`}>
          <Settings size={18} strokeWidth={1.8} /><span>Settings</span>
        </button>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            <div className="breadcrumbs"><span className="workspace-breadcrumb">Workspace</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div>
          </div>
        </header>

        <div className="page-content">
          {page === "Dashboard" && <DashboardPage transactions={activeTransactions} totalIssued={totalIssued} totalReturned={totalReturned} totalStillOut={totalStillOut} totalSales={totalSales} currency={settings.currency} dateFormat={settings.dateFormat} setPage={setPage} onViewTransaction={openTransactionSummary} />}
          {page === "Transactions" && <TransactionsPage
            transactions={filteredTransactions}
            pendingTransactions={pendingTransactions}
            allTransactions={transactions}
            totalCount={transactions.length}
            employees={employees}
            areas={areas}
            containers={containers}
            filters={filters}
            setFilters={setFilters}
            setAppliedFilters={setAppliedFilters}
            search={search}
            setSearch={setSearch}
            openNewTransaction={openNewTransaction}
            onConfirmDelivery={openDeliveryConfirmation}
            onViewTransaction={openTransactionSummary}
            dateFormat={settings.dateFormat}
          />}
          {page === "Sales" && <SalesPage transactions={activeTransactions} currency={settings.currency} dateFormat={settings.dateFormat} />}
          {page === "Delivery confirmation" && deliveryForConfirmation && <DeliveryConfirmationPage
            transaction={deliveryForConfirmation}
            dateFormat={settings.dateFormat}
            currency={settings.currency}
            onBack={() => { setDeliveryConfirmationId(null); setPage("Transactions"); }}
            onConfirm={completeDelivery}
          />}
          {page === "Delivery confirmation" && !deliveryForConfirmation && <EmptyState icon={Search} title="Pending delivery not found" text="This delivery may already have been confirmed." action={<Button onClick={() => setPage("Transactions")}>Back to transactions</Button>} />}
          {page === "Master data" && <MasterDataPage
            section={masterSection}
            setSection={setMasterSection}
            employees={employees}
            setEmployees={setEmployees}
            containers={containers}
            setContainers={setContainers}
            currency={settings.currency}
            defaultOwnership={settings.defaultOwnership}
            areas={areas}
            setAreas={setAreas}
            notify={notify}
          />}
          {page === "Settings" && <SettingsPage settings={settings} onSave={saveSettings} onResetData={resetWorkspaceData} onExportData={exportWorkspaceData} onImportData={importWorkspaceData} notify={notify} />}
        </div>
      </main>

      {showTransaction && <TransactionModal
        employees={employees}
        containers={containers}
        areas={areas}
        currency={settings.currency}
        onClose={() => setShowTransaction(false)}
        onSave={saveTransaction}
      />}
      {selectedTransaction && <TransactionSummaryModal
        transaction={selectedTransaction.transaction}
        pending={selectedTransaction.pending}
        currency={settings.currency}
        dateFormat={settings.dateFormat}
        onClose={() => setSelectedTransaction(null)}
      />}
      {toast && <div className="toast"><span><Check size={16} /></span>{toast}</div>}
    </div>
  );
}

// Page-level sections share the same heading and optional action layout.
function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}

// The dashboard highlights current totals and recent transaction activity.
function DashboardPage({ transactions, totalIssued, totalReturned, totalStillOut, totalSales, currency, dateFormat, setPage, onViewTransaction }) {
  return (
    <div className="dashboard-page">
      <PageHeading eyebrow={formatDate(new Date(), dateFormat).toUpperCase()} title="Dashboard" description="A clear snapshot of your inventory and delivery activity." />

      <section className="metrics-grid dashboard-metrics">
        <MetricCard label="Containers issued" value={totalIssued} icon={Package} tone="blue" />
        <MetricCard label="Containers returned" value={totalReturned} icon={ArrowDownLeft} tone="green" />
        <MetricCard label="Still out" value={totalStillOut} icon={ArrowDownRight} tone="amber" />
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
function TransactionsPage({ transactions, pendingTransactions, allTransactions, totalCount, employees, areas, containers, filters, setFilters, setAppliedFilters, search, setSearch, openNewTransaction, onConfirmDelivery, onViewTransaction, dateFormat }) {
  const employeeOptions = [...new Set([...employees.map((employee) => `${employee.first} ${employee.last}`), ...allTransactions.map((item) => item.employee)])];
  const areaOptions = [...new Set([...areas.map((area) => area.name), ...allTransactions.map((item) => item.area)])];
  const containerOptions = [...new Set([...containers.map((item) => item.type), ...allTransactions.map((item) => item.container)])];
  return (
    <>
      <PageHeading eyebrow="INVENTORY MOVEMENT" title="Transactions" description="Track every container as it moves through your business.">
        <Button onClick={openNewTransaction}><Plus size={17} /> New transaction</Button>
      </PageHeading>
      <section className="panel table-panel pending-panel">
        <div className="panel-heading table-heading">
          <div><h2>Pending deliveries</h2><p>Mark a delivery complete to add it to transaction history.</p></div>
          <span className="list-count">{pendingTransactions.length}</span>
        </div>
        {pendingTransactions.length
          ? <TransactionTable
            transactions={pendingTransactions}
            dateFormat={dateFormat}
            onComplete={onConfirmDelivery}
            onViewTransaction={onViewTransaction}
          />
          : <p className="pending-empty">No pending deliveries.</p>}
      </section>
      <section className="filter-toolbar">
        <div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions..." /></div>
        <label className="filter-select"><select value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })}><option>All employees</option>{employeeOptions.map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={15} /></label>
        <label className="filter-select"><select value={filters.area} onChange={(event) => setFilters({ ...filters, area: event.target.value })}><option>All areas</option>{areaOptions.map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={15} /></label>
        <label className="filter-select"><select value={filters.container} onChange={(event) => setFilters({ ...filters, container: event.target.value })}><option>All containers</option>{containerOptions.map((type) => <option key={type}>{type}</option>)}</select><ChevronDown size={15} /></label>
        <Button variant="secondary" className="filter-button" onClick={() => setAppliedFilters(filters)}><Filter size={15} /> Filter</Button>
      </section>
      <div className="result-caption"><strong>{transactions.length}</strong> matching transactions</div>
      <section className="panel table-panel transactions-table-panel">
        {transactions.length ? <TransactionTable transactions={transactions} dateFormat={dateFormat} onViewTransaction={onViewTransaction} /> : <EmptyState icon={Search} title="No transactions found" text="Try changing your search or filters to find what you’re looking for." action={<button className="text-link" onClick={() => { setSearch(""); setFilters({ employee: "All employees", area: "All areas", container: "All containers" }); setAppliedFilters({ employee: "All employees", area: "All areas", container: "All containers" }); }}>Clear all filters</button>} />}
      </section>
      <div className="table-footer">Showing {transactions.length} of {totalCount} transactions</div>
    </>
  );
}

// Collects final returned, damaged, and lost counts for a pending delivery.
function DeliveryConfirmationPage({ transaction, dateFormat, currency, onBack, onConfirm }) {
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
function SettingsPage({ settings, onSave, onResetData, onExportData, onImportData, notify }) {
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
          <p>These details identify your Stacey Water workspace.</p>
        </div>
        <div className="settings-grid">
          <label>Business name
            <input value={form.businessName} onChange={(event) => update("businessName", event.target.value)} required />
          </label>
          <label>Contact email
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com" />
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
                <div className="eyebrow">DANGER ZONE</div>
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

// Supports a compact dashboard table and a detailed transaction ledger.
function TransactionTable({ transactions, compact = false, dateFormat, onComplete, onViewTransaction }) {
  const transactionLink = (item) => onViewTransaction
    ? <button type="button" className="table-id transaction-view-link" onClick={() => onViewTransaction(item, Boolean(onComplete))}>{item.id}</button>
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
              <td><StatusPill kind="green">Delivered</StatusPill></td>
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
function TransactionSummaryModal({ transaction, pending, currency, dateFormat, onClose }) {
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
            <p>{formatDate(transaction.date, dateFormat)}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close transaction summary" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="transaction-summary-details">
          <div><span>Employee</span><strong>{transaction.employee}</strong></div>
          <div><span>Delivery area</span><strong>{transaction.area}</strong></div>
          <div><span>Container</span><strong>{transaction.container}</strong></div>
          <div><span>Status</span><StatusPill kind={pending ? "amber" : "green"}>{pending ? "Pending delivery" : "Delivered"}</StatusPill></div>
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
function SalesPage({ transactions, currency, dateFormat }) {
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
function MasterDataPage({ section, setSection, employees, setEmployees, containers, setContainers, currency, defaultOwnership, areas, setAreas, notify }) {
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
function EmployeesMaster({ employees, setEmployees, setAreas, notify }) {
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

function ContainersMaster({ containers, setContainers, currency, defaultOwnership, notify }) {
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
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add a container</h3></div><label>Container type<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} placeholder="e.g. 5-gallon jug" required /></label><label>Ownership type<select value={form.ownership} onChange={(event) => setForm({ ...form, ownership: event.target.value })}><option>Company-owned</option><option>Customer-owned</option></select></label><div className="form-two-col"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>Inactive</option></select></label><label>Unit price<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="₱ 0.00" required /></label></div><Button type="submit"><Plus size={16} /> Add container</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Container types</h3><p>Pricing and availability</p></div><span className="list-count">{containers.length}</span></div><div className="master-list">{containers.length ? containers.map((item) => <div className="master-list-row container-list-row" key={item.id}><span className="container-list-icon"><Package size={18} /></span><span className="master-person-name"><strong>{item.type}</strong><small>{item.ownership} · {formatMoney(item.price, currency)} / unit</small></span><StatusPill kind={item.status === "Active" ? "green" : "gray"}>{item.status}</StatusPill><button type="button" className="icon-button delete-button" aria-label={`Delete ${item.type} (${item.ownership})`} title="Delete container type" onClick={() => removeContainer(item)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No container types added yet.</p>}</div></div>
    </div>
  </section>;
}

function AreasMaster({ areas, setAreas, employees, notify }) {
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
      <form className="panel form-panel" onSubmit={submit}><div className="form-panel-title"><h3>Add a delivery area</h3></div><label>Area name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Riverside" required /></label><label>Barangay<input value={form.barangay} onChange={(event) => setForm({ ...form, barangay: event.target.value })} placeholder="e.g. San Isidro" required /></label><label>Assigned employee <span className="optional">(optional)</span><select value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })}><option value="">Not assigned</option>{employees.map((employee) => <option key={employee.id}>{employee.first} {employee.last}</option>)}</select></label><Button type="submit"><Plus size={16} /> Add delivery area</Button></form>
      <div className="panel master-list-panel"><div className="list-panel-heading"><div><h3>Your delivery areas</h3><p>Areas and assigned team members</p></div><span className="list-count">{areas.length}</span></div><div className="master-list">{areas.length ? areas.map((area) => <div className="master-list-row area-list-row" key={area.id}><span className="area-list-icon"><MapPin size={17} /></span><span className="master-person-name"><strong>{area.name}</strong><small>{area.barangay} barangay</small></span><span className="area-assignee">{area.employee === "Not assigned" ? <span className="unassigned">Not assigned</span> : area.employee}</span><button type="button" className="icon-button delete-button" aria-label={`Delete ${area.name} delivery area`} title="Delete delivery area" onClick={() => removeArea(area)}><Trash2 size={16} /></button></div>) : <p className="master-list-empty">No delivery areas added yet.</p>}</div></div>
    </div>
  </section>;
}

// Creates a delivery transaction and validates its container counts before saving.
function TransactionModal({ employees, containers, areas, currency, onClose, onSave }) {
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
function formatDate(value, format = "MMM d, yyyy") {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (format === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (format === "yyyy-MM-dd") return `${year}-${month}-${day}`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default App;

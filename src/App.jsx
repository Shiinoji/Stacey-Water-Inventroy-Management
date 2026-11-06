import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, Check, ChevronRight, Info, LayoutDashboard, Menu, Settings, Settings2, Wallet, X } from "lucide-react";
import { Logo } from "./components/Common.jsx";
import { TransactionSummaryModal } from "./components/TransactionTable.jsx";
import { TransactionModal } from "./components/TransactionModal.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { TransactionsPage } from "./pages/TransactionsPage.jsx";
import { DeliveryConfirmationPage } from "./pages/DeliveryConfirmationPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { SalesPage } from "./pages/SalesPage.jsx";
import { MasterDataPage } from "./pages/MasterDataPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { localInputDate, relativeDate } from "./utils/dates.js";
import { defaultSettings, initialAreas, initialContainers, initialEmployees, initialTransactions, isWorkspaceBackup, loadMasterData, loadSettings } from "./data/workspace.js";

// Shared navigation and currency helpers keep labels and totals consistent.
const navItems = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Transactions", label: "Transactions", icon: ArrowDownRight },
  { id: "Sales", label: "Sales", icon: Wallet },
];

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

  // Transactions retain their original details and remain reportable after master data changes.
  const activeTransactions = transactions;

  const recentTransactions = useMemo(() => [
    ...pendingTransactions.map((transaction) => ({ ...transaction, isPending: true })),
    ...activeTransactions,
  ].sort((first, second) => (
    second.date.localeCompare(first.date) ||
    Number(Boolean(second.isPending)) - Number(Boolean(first.isPending))
  )), [pendingTransactions, activeTransactions]);

  // Totals use transaction snapshots so deleting master data never hides history.
  const totalIssued = activeTransactions.reduce((sum, item) => sum + item.issued, 0);
  const totalReturned = activeTransactions.reduce((sum, item) => sum + item.returned, 0);
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
        <div className="sidebar-bottom">
          <button onClick={() => handleNav("Settings")} className={`nav-link ${page === "Settings" ? "nav-active" : ""}`}>
            <Settings size={18} strokeWidth={1.8} /><span>Settings</span>
          </button>
          <button onClick={() => handleNav("About")} className={`nav-link ${page === "About" ? "nav-active" : ""}`}>
            <Info size={18} strokeWidth={1.8} /><span>About</span>
          </button>
        </div>
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
          {page === "Dashboard" && <DashboardPage transactions={recentTransactions} totalIssued={totalIssued} totalReturned={totalReturned} pendingDeliveryCount={pendingTransactions.length} totalSales={totalSales} currency={settings.currency} dateFormat={settings.dateFormat} setPage={setPage} onViewTransaction={openTransactionSummary} />}
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
          {page === "About" && <AboutPage businessName={settings.businessName} />}
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
          {page === "Settings" && <SettingsPage defaultSettings={defaultSettings} isWorkspaceBackup={isWorkspaceBackup} settings={settings} onSave={saveSettings} onResetData={resetWorkspaceData} onExportData={exportWorkspaceData} onImportData={importWorkspaceData} notify={notify} />}
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

export default App;

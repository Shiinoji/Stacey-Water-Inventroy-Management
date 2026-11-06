import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { Button, EmptyState, PageHeading } from "../components/Common.jsx";
import { TransactionTable } from "../components/TransactionTable.jsx";

export function TransactionsPage({ transactions, pendingTransactions, allTransactions, totalCount, employees, areas, containers, filters, setFilters, setAppliedFilters, search, setSearch, openNewTransaction, onConfirmDelivery, onViewTransaction, dateFormat }) {
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

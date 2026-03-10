import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  RefreshCw,
  Search,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { findValue } from "@/lib/dataUtils";
import { AnimatePresence, motion } from 'framer-motion';
import { X } from "lucide-react";

export type RowData = {
  id?: number;
  deviceId: string;
  timestamp: string | number;
  type: number;
  details: Record<string, any>;
  member_code?: string;
  hhid?: string;
};

const columns: ColumnDef<RowData>[] = [
  {
    id: "srNo",
    header: "Sr No",
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "event",
    header: "Status",
    accessorFn: (row) => findValue(row.details, "event") ?? "—",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return (
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            val === 'connected' || val === 'active' ? "bg-emerald-500" : "bg-rose-500"
          )} />
          <span className="capitalize">{val}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "deviceId",
    header: ({ column }) => (
      <button 
        className="flex items-center gap-2 hover:text-brand-accent transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Device ID <ArrowUpDown size={14} />
      </button>
    ),
  },
  {
    id: "hhid",
    header: "HHID",
    accessorKey: "hhid",
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
        {(getValue() as string) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <button 
        className="flex items-center gap-2 hover:text-brand-accent transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Timestamp <ArrowUpDown size={14} />
      </button>
    ),
    cell: ({ row }) => {
      const ts = row.getValue("timestamp") as string | number;
      const timestampNum = typeof ts === "string" ? Number(ts) : ts;
      const date = new Date(timestampNum * 1000);
      return <div className="text-brand-muted">{isNaN(date.getTime()) ? "—" : date.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "type",
    id: "Type",
    header: "Type",
    filterFn: (row, id, filterValue) => {
      if (filterValue === undefined || filterValue === "all") return true;
      const value = row.getValue(id) as number;
      return String(value) === filterValue;
    },
  },
  {
    id: "member",
    header: "Member",
    accessorKey: "member_code",
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
        {getValue() as string ?? "—"}
      </span>
    ),
  },
  // {
  //   id: "sourceIP",
  //   header: "Source IP",
  //   accessorFn: (row) => findValue(row.details, ["source_ip_v4", "ip", "ip_v4", "source_ip"]) ?? "—",
  //   cell: ({ getValue }) => <span className="font-mono text-brand-muted">{getValue() as string}</span>
  // },
  {
    id: "platform",
    header: "Platform",
    accessorFn: (row) => findValue(row.details, "platform") ?? "—",
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-wider">
        {getValue() as string}
      </span>
    )
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (row) => findValue(row.details, ["category", "service_category"]) ?? "—",
  },
  {
    id: "deviceType",
    header: "Device Type",
    accessorKey: "device_type",
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold capitalize">
        {(getValue() as string) ?? "—"}
      </span>
    ),
  },
  {
    id: "hostname",
    header: "Hostname",
    accessorFn: (row) => findValue(row.details, "hostname") ?? "—",
  },
  // {
  //   id: "mac",
  //   header: "MAC",
  //   accessorFn: (row) => findValue(row.details, "mac") ?? "—",
  //   cell: ({ getValue }) => <span className="font-mono text-xs text-brand-muted">{getValue() as string}</span>
  // },
  {
    id: "connected_duration",
    header: "Duration",
    accessorFn: (row) => {
      const sec = findValue(row.details, "connected_duration_sec");
      return sec != null ? `${Number(sec).toLocaleString()} s` : "—";
    },
  },
];

interface DataTableProps {
  data: RowData[];
}

export const DataTable = ({ data }: DataTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = React.useState(false);

  const table = useReactTable<RowData>({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="font-semibold text-lg">Recent Events</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={14} />
            <input 
              type="text" 
              placeholder="Filter Device ID..."
              value={(table.getColumn("deviceId")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("deviceId")?.setFilterValue(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                setIsColumnsOpen(!isColumnsOpen);
                setIsFilterOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-medium transition-colors",
                isColumnsOpen
                  ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                  : "bg-brand-bg border-brand-border text-brand-muted hover:bg-brand-accent/10 hover:text-brand-accent"
              )}
            >
              <ArrowUpDown size={14} className="rotate-90" />
              Columns
            </button>

            <AnimatePresence>
              {isColumnsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-brand-card border border-brand-border rounded-2xl shadow-2xl z-50 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm">Toggle Columns</h4>
                    <button onClick={() => setIsColumnsOpen(false)} className="text-brand-muted hover:text-brand-text">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <label
                            key={column.id}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-brand-bg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={column.getIsVisible()}
                              onChange={(e) => column.toggleVisibility(!!e.target.checked)}
                              className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-transparent"
                            />
                            <span className="text-xs capitalize text-brand-text">
                              {column.id.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsColumnsOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-medium transition-colors",
                isFilterOpen || columnFilters.length > 0
                  ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                  : "bg-brand-bg border-brand-border text-brand-muted hover:bg-brand-accent/10 hover:text-brand-accent"
              )}
            >
              <Filter size={14} />
              Filters
              {columnFilters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-brand-accent text-white rounded-full text-[10px]">
                  {columnFilters.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-brand-card border border-brand-border rounded-2xl shadow-2xl z-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm">Advanced Filters</h4>
                    <button onClick={() => setIsFilterOpen(false)} className="text-brand-muted hover:text-brand-text">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Platform</label>
                      <input 
                        type="text"
                        placeholder="e.g. Windows, Android"
                        value={(table.getColumn("platform")?.getFilterValue() as string) ?? ""}
                        onChange={(e) => table.getColumn("platform")?.setFilterValue(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Type</label>
                      <select 
                        value={(table.getColumn("Type")?.getFilterValue() as string) ?? "all"}
                        onChange={(e) => table.getColumn("Type")?.setFilterValue(e.target.value === "all" ? "" : e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                      >
                        <option value="all">All Types</option>
                        <option value="10">Type 10</option>
                        <option value="11">Type 11</option>
                        <option value="0">Type 0</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Source IP</label>
                      <input 
                        type="text"
                        placeholder="e.g. 192.168.1.1"
                        value={(table.getColumn("sourceIP")?.getFilterValue() as string) ?? ""}
                        onChange={(e) => table.getColumn("sourceIP")?.setFilterValue(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Category</label>
                      <input 
                        type="text"
                        placeholder="e.g. STREAMING"
                        value={(table.getColumn("category")?.getFilterValue() as string) ?? ""}
                        onChange={(e) => table.getColumn("category")?.setFilterValue(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        table.resetColumnFilters();
                        setIsFilterOpen(false);
                      }}
                      className="w-full py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-white/[0.02] border-b border-brand-border">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-brand-border">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-brand-muted">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-brand-muted">
          Showing <span className="text-brand-text font-medium">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
          </span> of <span className="text-brand-text font-medium">{table.getFilteredRowModel().rows.length}</span> entries
        </p>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-accent/10 transition-all disabled:opacity-30"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-brand-muted px-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
          <button 
            className="p-2 rounded-lg border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-accent/10 transition-all disabled:opacity-30"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

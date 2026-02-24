"use client"

import * as React from "react"
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
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Filter, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"
import { DateRangePicker } from "@/components/date-range-picker"

function getPayload(details: any): any | null {
  if (!details || typeof details !== 'object') return null
  for (const value of Object.values(details)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value
    }
  }
  return null
}

type RowData = {
  id?: number
  device_id: string
  timestamp: string | number
  type: number
  details: Record<string, any>
}

// Custom filter function for timestamp (Unix seconds → Date comparison)
const dateRangeFilterFn = (
    row: any,
    columnId: string,
    filterValue: DateRange | undefined
  ) => {
    if (!filterValue?.from && !filterValue?.to) return true
  
    const ts = row.getValue(columnId) as string | number
    const timestampNum = typeof ts === "string" ? Number(ts) : ts
    const rowDate = new Date(timestampNum * 1000) // assuming seconds → ms
  
    if (isNaN(rowDate.getTime())) return false
  
    const start = filterValue.from ? new Date(filterValue.from) : undefined
    const end = filterValue.to ? new Date(filterValue.to) : undefined
  
    // Normalize to start/end of day if needed (optional)
    if (start) start.setHours(0, 0, 0, 0)
    if (end) end.setHours(23, 59, 59, 999)
  
    if (start && end) {
      return rowDate >= start && rowDate <= end
    }
    if (start) {
      return rowDate >= start
    }
    if (end) {
      return rowDate <= end
    }
  
    return true
  }

const columns: ColumnDef<RowData>[] = [
  {
    id: "srNo",
    header: "Sr No",
    cell: ({ row, table }) =>
      row.index + 1 + table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "device_id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Device ID <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "timestamp",
    id: "timestamp",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Timestamp <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const ts = row.getValue("timestamp") as string | number
      const timestampNum = typeof ts === "string" ? Number(ts) : ts
      const date = new Date(timestampNum * 1000)
      return <div>{isNaN(date.getTime()) ? "—" : date.toLocaleString()}</div>
    },
    filterFn: dateRangeFilterFn, // ← attach the custom filter here
  },
  {
    accessorKey: "type",
    id: "type",
    header: "Type",
    filterFn: (row, id, filterValue: string | undefined) => {
      if (!filterValue || filterValue === "all") return true
      return String(row.getValue(id)) === filterValue
    },
  },
  {
    id: "sourceIP",
    header: "Source IP",
    accessorFn: (row) => {
      const payload = getPayload(row.details)
      return payload?.source_ip ?? payload?.ip ?? "—"
    },
  },
  {
    id: "event",
    header: "Event",
    accessorFn: (row) => {
      const payload = getPayload(row.details)
      return payload?.event ?? payload?.event_type ?? payload?.action ?? "—"
    },
  },
  {
    id: "connected_duration",
    header: "Conn. Duration",
    accessorFn: (row) => {
      const payload = getPayload(row.details);
      const sec = payload?.connected_duration_sec;
      return sec != null ? `${sec.toLocaleString()} s` : "—";
    },
  },
]

export default function Type0And1Page() {
  const [data, setData] = React.useState<RowData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [autoRefresh, setAutoRefresh] = React.useState(false)
  const [refreshInterval, setRefreshInterval] = React.useState<3 | 5 | 10>(5)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Date range state (shared with filter)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("http://localhost:4000/api/router-event", {
        credentials: "include",
      })
      if (!response.ok) throw new Error(`Failed: ${response.status}`)
      const allData: RowData[] = await response.json()

      // Only type 0 and 1
      const filtered = allData.filter(row => row.type === 0 || row.type === 1)
      setData(filtered)
    } catch (err: any) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, refreshInterval * 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refreshInterval, fetchData])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

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
      pagination: { pageSize: 25 },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    table.getColumn("timestamp")?.setFilterValue(dateRange)
  }, [dateRange, table])

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const filteredRows = table.getFilteredRowModel().rows.length
  const totalRows = data.length
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min(startRow + pageSize - 1, filteredRows)

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Device Details</h1>
        </div>
        <Separator className="-mt-5 mb-2" />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive flex items-center justify-between">
            <span className="font-medium">Failed to load data: {error}</span>
            <Button size="sm" variant="outline" onClick={fetchData}>
              Retry
            </Button>
          </div>
        )}

        {(loading || data.length > 0) && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              <Input
                placeholder="Filter by Device ID..."
                value={(table.getColumn("device_id")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("device_id")?.setFilterValue(e.target.value)}
                className="max-w-sm"
              />

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
                    Refresh: {autoRefresh ? "On" : "Off"}
                  </Button>

                  {autoRefresh && (
                    <Select
                      value={`${refreshInterval}`}
                      onValueChange={(v) => setRefreshInterval(Number(v) as 3 | 5 | 10)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3s</SelectItem>
                        <SelectItem value="5">5s</SelectItem>
                        <SelectItem value="10">10s</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {columnFilters.length > 0 && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                          {columnFilters.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <h4 className="font-medium">Filter by Column</h4>

                      {/* Type Filter – only 0 and 1 */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={
                            (table.getColumn("type")?.getFilterValue() as string | undefined) ?? "all"
                          }
                          onValueChange={(value) =>
                            table.getColumn("type")?.setFilterValue(value === "all" ? undefined : value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="0">Type 0</SelectItem>
                            <SelectItem value="1">Type 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Source IP</label>
                        <Input
                          placeholder="e.g. 192.168.1.100"
                          value={(table.getColumn("sourceIP")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("sourceIP")?.setFilterValue(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Event</label>
                        <Input
                          placeholder="e.g. connect, disconnect"
                          value={(table.getColumn("event")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("event")?.setFilterValue(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date Range</label>
                        <div className="flex items-center gap-2">
                            <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            className="flex-1"
                            />
                            {dateRange && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDateRange(undefined)}
                                className="h-9 px-3 text-xs"
                            >
                                Clear
                            </Button>
                            )}
                        </div>
                        </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table.getAllColumns()
                      .filter((col) => col.getCanHide())
                      .map((col) => (
                        <DropdownMenuCheckboxItem
                          key={col.id}
                          className="capitalize"
                          checked={col.getIsVisible()}
                          onCheckedChange={(v) => col.toggleVisibility(!!v)}
                        >
                          {col.id === "connDuration" ? "Conn. Duration" : col.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center">
                          <p className="text-muted-foreground text-lg">
                            {loading ? "Loading data..." : "No matching records found"}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <TableFooter className="border-t bg-muted/30 shrink-0">
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-3 px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                      <div>
                        Showing {startRow}–{endRow} of {filteredRows} entries
                        {filteredRows !== totalRows && ` (filtered from ${totalRows} total)`}
                      </div>

                      <div className="flex items-center gap-4">
                        <Select
                          value={`${pageSize}`}
                          onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Rows" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">Page {pageIndex + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </div>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-20 text-xl text-muted-foreground">
            No data found for type 0 or 1.
          </div>
        )}
      </main>
    </div>
  )
}
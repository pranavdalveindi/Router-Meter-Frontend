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
import { Downtime } from "@/components/Downtime"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"


type RowData = {
  id?: number;
  deviceId: string;
  timestamp: string | number;
  type: number;
  details: Record<string, any>;   // ← more flexible than fixed domain_activity
};

function findValue(
  details: Record<string, any> | null | undefined,
  fieldNames: string | string[],
  sectionPriority: string[] = ["domain_activity", "device_details"]
): any {
  if (!details || typeof details !== "object") return undefined;

  const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

  // 1. Try preferred sections first (in the order given)
  for (const section of sectionPriority) {
    const obj = details[section];
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      for (const field of fields) {
        if (obj[field] !== undefined && obj[field] !== null) {
          return obj[field];
        }
      }
    }
  }

  // 2. Fallback: search in any sub-object
  for (const value of Object.values(details)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const field of fields) {
        if (value[field] !== undefined && value[field] !== null) {
          return value[field];
        }
      }
    }
  }

  return undefined;
}

const columns: ColumnDef<RowData>[] = [
  // your existing srNo, deviceId, timestamp, type columns stay the same

  // ────────────────────────────────────────────────
  // Flexible columns that search across details sub-objects
  // ────────────────────────────────────────────────
{
      id: "srNo",
      header: "Sr No",
      cell: ({ row, table }) =>
      row.index + 1 + table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
      enableSorting: false,
      enableHiding: false,
  },
    {
      accessorKey: "deviceId",
        header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Device ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "timestamp",
        header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Timestamp <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
        ),
        cell: ({ row }) => {
        const ts = row.getValue("timestamp") as string | number;
        const timestampNum = typeof ts === "string" ? Number(ts) : ts;
        const date = new Date(timestampNum * 1000);
        return <div>{isNaN(date.getTime()) ? "—" : date.toLocaleString()}</div>;
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
    id: "sourceIP",
    header: "Source IP",
    accessorFn: (row) =>
      findValue(row.details, ["source_ip_v4", "ip", "ip_v4"]) ?? "—",
  },
  {
    id: "platform",
    header: "Platform",
    accessorFn: (row) =>
      findValue(row.details, "platform") ?? "—",
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (row) =>
      findValue(row.details, ["category", "service_category"]) ?? "—",
  },

  // ────────────────────────────────────────────────
  // Device-event specific columns
  // ────────────────────────────────────────────────
  {
    id: "event",
    header: "Event",
    accessorFn: (row) =>
      findValue(row.details, "event") ?? "—",
  },
  {
    id: "hostname",
    header: "Hostname",
    accessorFn: (row) =>
      findValue(row.details, "hostname") ?? "—",
  },
  {
    id: "mac",
    header: "MAC",
    accessorFn: (row) =>
      findValue(row.details, "mac") ?? "—",
  },
  {
    id: "connected_duration",
    header: "Conn. Duration",
    accessorFn: (row) => {
      const sec = findValue(row.details, "connected_duration_sec");
      return sec != null ? `${Number(sec).toLocaleString()} s` : "—";
    },
  },

  // You can add more later the same way, example:
  // {
  //   id: "domain",
  //   header: "Domain",
  //   accessorFn: (row) => findValue(row.details, "domain") ?? "—",
  // },
];

export default function DashboardPage() {
  
  const [data, setData] = React.useState<RowData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [autoRefresh, setAutoRefresh] = React.useState(false)
  const [refreshInterval, setRefreshInterval] = React.useState<3 | 5 | 10>(5)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedIP, setSelectedIP] = React.useState<string>("")
  const [downtimeData, setDowntimeData] = React.useState<any>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("http://localhost:4000/api/router-event")
      if (!response.ok) throw new Error(`Failed: ${response.status}`)
      const fetchedData: RowData[] = await response.json()
      setData(fetchedData)
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
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refreshInterval, fetchData])

  const uniqueIPs = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
  
    const ips = new Set(
      data
        .map(row => {
          // Look for any of these IP-related fields, in priority order
          return (
            findValue(row.details, ["source_ip", "source_ip_v4", "ip", "ip_v4"]) ??
            findValue(row.details, "source_ip_v6")   // optional: include IPv6 if you want
          );
        })
        .filter((ip): ip is string => typeof ip === "string" && ip.trim().length > 0)
    );
  
    return Array.from(ips).sort();
  }, [data]);

  // Downtime calculation (unchanged from previous version)
  React.useEffect(() => {
    if (!selectedIP || data.length === 0) {
      setDowntimeData(null)
      return
    }

    const ipLogs = data
    .filter(row => {
      const ip = findValue(row.details, [
        "source_ip",
        "source_ip_v4",
        "ip",
        "ip_v4",
        // optionally add more aliases if needed: "client_ip", etc.
      ]);
      return ip === selectedIP;
    })
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    if (ipLogs.length === 0) {
      setDowntimeData(null)
      return
    }

    const SESSION_GAP = 1800
    const sessions: { start: number; end: number; platforms: Set<string> }[] = []
    let currentSession = {
      start: Number(ipLogs[0].timestamp),
      end: Number(ipLogs[0].timestamp),
      platforms: new Set([ipLogs[0].details.domain_activity.platform]),
    }

    for (let i = 1; i < ipLogs.length; i++) {
      const log = ipLogs[i]
      const ts = Number(log.timestamp)
      if (ts - currentSession.end <= SESSION_GAP) {
        currentSession.end = ts
        currentSession.platforms.add(log.details.domain_activity.platform)
      } else {
        sessions.push(currentSession)
        currentSession = {
          start: ts,
          end: ts,
          platforms: new Set([log.details.domain_activity.platform]),
        }
      }
    }
    sessions.push(currentSession)

    const totalActiveTime = sessions.reduce((sum, s) => sum + (s.end - s.start), 0)

    const platformMap: Record<string, number> = {}
    sessions.forEach(session => {
      const duration = session.end - session.start
      session.platforms.forEach(plat => {
        platformMap[plat] = (platformMap[plat] || 0) + duration
      })
    })

    const platformTimes = Object.entries(platformMap).map(([platform, duration]) => ({
      platform,
      duration,
    }))

    let totalDowntime = 0
    for (let i = 1; i < sessions.length; i++) {
      const gap = sessions[i].start - sessions[i - 1].end
      if (gap > SESSION_GAP) totalDowntime += gap
    }

    setDowntimeData({
      totalActiveTime,
      totalDowntime,
      platformTimes,
      sessionCount: sessions.length,
    })
  }, [selectedIP, data])

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
          <h1 className="text-2xl font-bold">Network Activity</h1>
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
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              {/* Global search / Device ID filter */}
              <Input
                placeholder="Filter by Device ID..."
                value={(table.getColumn("deviceId")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("deviceId")?.setFilterValue(e.target.value)}
                className="max-w-sm"
              />

              <div className="flex flex-wrap items-center gap-4">
                {/* Refresh + interval selector */}
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

                {/* Downtime button */}
                {/* <Downtime
                  data={data}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                /> */}

                {/* New Filters Popover */}
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

                      {/* Filter: Type */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={(table.getColumn("Type")?.getFilterValue() as string) ?? "all"}
                          onValueChange={(value) =>
                            table.getColumn("Type")?.setFilterValue(value === "all" ? undefined : value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="11">11</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter: Platform */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Platform</label>
                        <Input
                          placeholder="e.g. Windows, Android, macOS"
                          value={(table.getColumn("platform")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("platform")?.setFilterValue(e.target.value)}
                        />
                      </div>

                      {/* Filter: Source IP */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Source IP</label>
                        <Input
                          placeholder="e.g. 192.168.1.100"
                          value={(table.getColumn("sourceIP")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("sourceIP")?.setFilterValue(e.target.value)}
                        />
                      </div>

                      {/* Filter: Category */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Category</label>
                        <Input
                          placeholder="e.g. Social, Streaming, OTT"
                          value={(table.getColumn("category")?.getFilterValue() as string) ?? ""}
                          onChange={(e) => table.getColumn("category")?.setFilterValue(e.target.value)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Existing Columns visibility dropdown – keep it */}
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
                          {col.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Table Container */}
            <div className="rounded-md border overflow-hidden flex flex-col">
              {/* Scrollable Table Area */}
              <div className="flex-1 overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
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
                      table.getRowModel().rows.map(row => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map(cell => (
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

              {/* Fixed Footer - always visible */}
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
                          onValueChange={value => table.setPageSize(Number(value))}
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
                          <span className="text-sm">
                            Page {pageIndex + 1}
                          </span>
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
            No data found.
          </div>
        )}
      </main>
    </div>
  )
}
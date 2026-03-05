// components/Downtime.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DowntimeData {
  totalActiveTime: number
  totalDowntime: number
  platformTimes: { platform: string; duration: number }[]
  sessionCount: number
}

interface DowntimeProps {
  data: any[]           // replace with proper RowData[] type when possible
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Downtime({
  data,
  open,
  onOpenChange,
}: DowntimeProps) {
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>("")
  const [selectedIP, setSelectedIP] = React.useState<string>("")
  const [downtimeData, setDowntimeData] = React.useState<DowntimeData | null>(null)

  const [devicePopoverOpen, setDevicePopoverOpen] = React.useState(false)
  const [ipPopoverOpen, setIpPopoverOpen] = React.useState(false)

  // ── Computed values ──
  const uniqueDeviceIds = React.useMemo(() => {
    const devices = new Set(data.map((row: any) => row.DEVICE_ID))
    return Array.from(devices).sort() as string[]
  }, [data])

  const uniqueIPs = React.useMemo(() => {
    let filtered: any[] = data || []; // fallback if data is undefined/null
  
    if (selectedDeviceId) {
      filtered = filtered.filter((row: any) => row?.DEVICE_ID === selectedDeviceId);
    }
  
    const ips = new Set(
      filtered
        .map((row: any) => row?.Details?.domain_activity?.source_ip)
        .filter((ip): ip is string => typeof ip === 'string' && ip.trim().length > 0) // only valid non-empty strings
    );
  
    return Array.from(ips).sort() as string[];
  }, [data, selectedDeviceId]);

  // ── Downtime calculation ──
  React.useEffect(() => {
    if (!selectedIP || data.length === 0) {
      setDowntimeData(null)
      return
    }

    const ipLogs = data
      .filter((row: any) => row.Details.domain_activity.source_ip === selectedIP)
      .sort((a: any, b: any) => a.TS - b.TS)

    if (ipLogs.length === 0) {
      setDowntimeData(null)
      return
    }

    const SESSION_GAP = 1800 // 30 minutes

    const sessions: { start: number; end: number; platforms: Set<string> }[] = []
    let currentSession = {
      start: ipLogs[0].TS,
      end: ipLogs[0].TS,
      platforms: new Set([ipLogs[0].Details.domain_activity.platform]),
    }

    for (let i = 1; i < ipLogs.length; i++) {
      const log = ipLogs[i]
      if (log.TS - currentSession.end <= SESSION_GAP) {
        currentSession.end = log.TS
        currentSession.platforms.add(log.Details.domain_activity.platform)
      } else {
        sessions.push(currentSession)
        currentSession = {
          start: log.TS,
          end: log.TS,
          platforms: new Set([log.Details.domain_activity.platform]),
        }
      }
    }
    sessions.push(currentSession)

    const totalActiveTime = sessions.reduce((sum, s) => sum + (s.end - s.start), 0)

    const platformMap: Record<string, number> = {}
    sessions.forEach((session) => {
      const duration = session.end - session.start
      session.platforms.forEach((plat) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Downtime Analysis</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Downtime & Platform Watch Time</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Device ID Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Device ID (optional)</label>
            <Popover open={devicePopoverOpen} onOpenChange={setDevicePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={devicePopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedDeviceId || "All Devices"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search Device ID..." />
                  <CommandEmpty>No Device ID found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setSelectedDeviceId("")
                        setDevicePopoverOpen(false)
                        setSelectedIP("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !selectedDeviceId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Devices
                    </CommandItem>

                    {uniqueDeviceIds.map((devId: any) => (
                      <CommandItem
                        key={devId}
                        value={devId}
                        onSelect={(val: any) => {
                          setSelectedDeviceId(val === selectedDeviceId ? "" : val)
                          setDevicePopoverOpen(false)
                          setSelectedIP("")
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDeviceId === devId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {devId}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* IP Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Source IP</label>
            <Popover open={ipPopoverOpen} onOpenChange={setIpPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={ipPopoverOpen}
                  className="w-full justify-between font-normal"
                  disabled={uniqueIPs.length === 0}
                >
                  {selectedIP || (uniqueIPs.length === 0 ? "No IPs available" : "Choose an IP")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search IP..." />
                  <CommandEmpty>No IP found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {uniqueIPs.map((ip: any) => (
                      <CommandItem
                        key={ip}
                        value={ip}
                        onSelect={(val: any) => {
                          setSelectedIP(val === selectedIP ? "" : val)
                          setIpPopoverOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIP === ip ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {ip}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Results */}
          {downtimeData && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Overall Activity</h4>
                <div className="space-y-2">
                  <p>
                    Total active time:{" "}
                    <Badge variant="secondary">{formatDuration(downtimeData.totalActiveTime)}</Badge>
                  </p>
                  <p>
                    Number of sessions:{" "}
                    <Badge variant="outline">{downtimeData.sessionCount}</Badge>
                  </p>
                  <p>
                    Total downtime (gaps &gt; 30 min):{" "}
                    <Badge variant="destructive">{formatDuration(downtimeData.totalDowntime)}</Badge>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Time Spent on Each Platform</h4>
                {downtimeData.platformTimes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead className="text-right">Watch Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {downtimeData.platformTimes
                        .sort((a: { duration: number }, b: { duration: number }) => b.duration - a.duration)
                        .map((p: { platform: any; duration: number }) => (
                          <TableRow key={p.platform}>
                            <TableCell className="capitalize font-medium">{p.platform}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{formatDuration(p.duration)}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No platform activity recorded
                  </p>
                )}
              </div>
            </div>
          )}

          {!selectedIP && (
            <p className="text-center text-muted-foreground py-8">
              {uniqueIPs.length === 0 && selectedDeviceId
                ? "No IPs found for the selected Device ID"
                : "Select a Source IP to view analysis"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
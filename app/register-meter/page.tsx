// app/register-device/page.tsx   (or wherever you want this page/component)

"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus } from "lucide-react"

// ──────────────────────────────────────────────
// 1. Form Schema (same as before)
const formSchema = z.object({
  householdId: z.string().min(3, "Household ID is required"),
  meterId: z.string().min(4, "Meter ID is required"),
  macId: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address format"),
  deviceName: z.string().min(1, "Device name is required"),
})

// ──────────────────────────────────────────────
// 2. Mock device type (same)
type Device = {
  id: string
  householdId: string
  meterId: string
  macId: string
  deviceName: string
  registeredAt: string
}

const mockDevices: Device[] = [
  {
    id: "dev_001",
    householdId: "HH-12345",
    meterId: "MTR-9876",
    macId: "00:1A:2B:3C:4D:5E",
    deviceName: "Living Room Router",
    registeredAt: "2025-12-10",
  },
  {
    id: "dev_002",
    householdId: "HH-67890",
    meterId: "MTR-5432",
    macId: "AA:BB:CC:DD:EE:FF",
    deviceName: "Kitchen Meter",
    registeredAt: "2025-12-15",
  },
]

// ──────────────────────────────────────────────
// 3. Main Component
export default function RegisterDevicePage() {
  const [devices, setDevices] = useState<Device[]>(mockDevices)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false) // controls dialog visibility

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      householdId: "",
      meterId: "",
      macId: "",
      deviceName: "",
    },
  })

  const macId = form.watch("macId")

  // Auto-fill device name based on MAC ID (mock lookup)
  useEffect(() => {
    if (!macId || form.getFieldState("macId").invalid) {
      form.setValue("deviceName", "")
      return
    }

    const timer = setTimeout(() => {
      const mockNames: Record<string, string> = {
        "00:1A:2B:3C:4D:5E": "Living Room Router",
        "AA:BB:CC:DD:EE:FF": "Kitchen Meter",
        "11:22:33:44:55:66": "Bedroom Gateway",
      }

      const foundName = mockNames[macId.toUpperCase()] || "Unknown Device"
      form.setValue("deviceName", foundName, { shouldValidate: true })
    }, 600)

    return () => clearTimeout(timer)
  }, [macId, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const newDevice: Device = {
        id: `dev_${Date.now()}`,
        householdId: values.householdId,
        meterId: values.meterId,
        macId: values.macId,
        deviceName: values.deviceName,
        registeredAt: new Date().toLocaleDateString(),
      }

      setDevices((prev) => [newDevice, ...prev])
      form.reset()
      setOpen(false) // close dialog on success
      // toast.success("Device registered!")
    } catch (error) {
      console.error(error)
      // toast.error("Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
          <p className="text-muted-foreground">
            View and register router/meter devices
          </p>
        </div>

        {/* Button that opens the dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Device Registration
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
              <DialogDescription>
                Enter device details below. Device name will auto-populate based on the MAC ID.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="householdId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Household ID</FormLabel>
                        <FormControl>
                          <Input placeholder="HH-12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meter ID</FormLabel>
                        <FormControl>
                          <Input placeholder="MTR-987654" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="macId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC ID</FormLabel>
                      <FormControl>
                        <Input placeholder="00:1A:2B:3C:4D:5E" {...field} />
                      </FormControl>
                      <FormDescription>Format: XX:XX:XX:XX:XX:XX</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Auto-filled from MAC ID"
                          {...field}
                          disabled={!!macId && !form.getFieldState("macId").invalid}
                          className="bg-muted/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isValid}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Device
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Registered Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>
            All currently registered router/meter devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No devices registered yet. Click "Device Registration" to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Household ID</TableHead>
                  <TableHead>Meter ID</TableHead>
                  <TableHead>MAC ID</TableHead>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.householdId}</TableCell>
                    <TableCell>{device.meterId}</TableCell>
                    <TableCell className="font-mono">{device.macId}</TableCell>
                    <TableCell>{device.deviceName}</TableCell>
                    <TableCell>{device.registeredAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
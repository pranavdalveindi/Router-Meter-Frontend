// types/device.ts
export interface DeviceLog {
    DEVICE_ID: string
    TS: number
    Type: string
    Details: {
      domain_activity: {
        platform: string
        source_ip: string
        destination_ip?: string
        category: string
        // add more fields as needed
      }
    }
    // any other top-level fields
  }
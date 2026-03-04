export function findValue(
    details: Record<string, any> | null | undefined,
    fieldNames: string | string[],
    sectionPriority: string[] = ["domain_activity", "device_details"]
  ): any {
    if (!details || typeof details !== "object") return undefined;
  
    const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  
    // 1. Try preferred sections first
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
  
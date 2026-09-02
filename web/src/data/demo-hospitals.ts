/**
 * Demo Hospital Dataset
 * 
 * Demo-safe coordinates around Manhattan, New York area
 * All coordinates are safe for demonstration purposes
 * 
 * This can be easily replaced with Firestore data in production
 */

export interface DemoHospital {
  hospital_id: string
  hospital_name: string
  address: string
  latitude: number
  longitude: number
  blood_groups_supported: string[]
  email?: string
  phone_number?: string
  region?: number
}

/**
 * Demo hospital data with predefined safe coordinates
 * All coordinates are in Manhattan area (demo-safe)
 */
export const DEMO_HOSPITALS: DemoHospital[] = [
  {
    hospital_id: "demo_hosp_001",
    hospital_name: "Central Manhattan Medical Center",
    address: "123 Medical Plaza, Manhattan, NY 10001",
    latitude: 40.7589,
    longitude: -73.9851,
    blood_groups_supported: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    email: "central@demo-hospital.com",
    phone_number: "+1-212-555-0100",
    region: 1,
  },
  {
    hospital_id: "demo_hosp_002",
    hospital_name: "St. Mary's Blood Donation Center",
    address: "456 Health Avenue, Manhattan, NY 10002",
    latitude: 40.7505,
    longitude: -73.9934,
    blood_groups_supported: ["O+", "A+", "B+", "AB+"],
    email: "stmarys@demo-hospital.com",
    phone_number: "+1-212-555-0200",
    region: 2,
  },
  {
    hospital_id: "demo_hosp_003",
    hospital_name: "Downtown Emergency Hospital",
    address: "789 Emergency Way, Manhattan, NY 10003",
    latitude: 40.7328,
    longitude: -74.0060,
    blood_groups_supported: ["O+", "O-", "A+", "A-"],
    email: "downtown@demo-hospital.com",
    phone_number: "+1-212-555-0300",
    region: 3,
  },
  {
    hospital_id: "demo_hosp_004",
    hospital_name: "Riverside Medical Complex",
    address: "321 Riverside Drive, Manhattan, NY 10025",
    latitude: 40.7851,
    longitude: -73.9782,
    blood_groups_supported: ["O+", "O-", "A+", "A-", "B+", "B-"],
    email: "riverside@demo-hospital.com",
    phone_number: "+1-212-555-0400",
    region: 4,
  },
  {
    hospital_id: "demo_hosp_005",
    hospital_name: "Upper East Side Clinic",
    address: "654 Park Avenue, Manhattan, NY 10021",
    latitude: 40.7689,
    longitude: -73.9654,
    blood_groups_supported: ["O+", "A+", "B+", "AB+", "AB-"],
    email: "uppereast@demo-hospital.com",
    phone_number: "+1-212-555-0500",
    region: 1,
  },
  {
    hospital_id: "demo_hosp_006",
    hospital_name: "West Side Medical Center",
    address: "987 Broadway Street, Manhattan, NY 10023",
    latitude: 40.7749,
    longitude: -73.9842,
    blood_groups_supported: ["O+", "O-", "A+", "B+", "AB+"],
    email: "westside@demo-hospital.com",
    phone_number: "+1-212-555-0600",
    region: 2,
  },
  {
    hospital_id: "demo_hosp_007",
    hospital_name: "Midtown Blood Bank",
    address: "147 Times Square Plaza, Manhattan, NY 10036",
    latitude: 40.7580,
    longitude: -73.9855,
    blood_groups_supported: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    email: "midtown@demo-hospital.com",
    phone_number: "+1-212-555-0700",
    region: 3,
  },
  {
    hospital_id: "demo_hosp_008",
    hospital_name: "Harlem Community Hospital",
    address: "258 Malcolm X Boulevard, Manhattan, NY 10027",
    latitude: 40.8075,
    longitude: -73.9479,
    blood_groups_supported: ["O+", "A+", "B+", "AB+"],
    email: "harlem@demo-hospital.com",
    phone_number: "+1-212-555-0800",
    region: 4,
  },
  {
    hospital_id: "demo_hosp_009",
    hospital_name: "Financial District Medical Center",
    address: "369 Wall Street, Manhattan, NY 10005",
    latitude: 40.7074,
    longitude: -74.0113,
    blood_groups_supported: ["O+", "O-", "A+", "B+"],
    email: "financial@demo-hospital.com",
    phone_number: "+1-212-555-0900",
    region: 1,
  },
  {
    hospital_id: "demo_hosp_010",
    hospital_name: "East Village Health Clinic",
    address: "741 First Avenue, Manhattan, NY 10009",
    latitude: 40.7269,
    longitude: -73.9804,
    blood_groups_supported: ["O+", "A+", "A-", "B+", "AB+"],
    email: "eastvillage@demo-hospital.com",
    phone_number: "+1-212-555-1000",
    region: 2,
  },
]

/**
 * Default map center (Nagpur, Maharashtra, India)
 */
export const DEFAULT_MAP_CENTER: [number, number] = [21.1458, 79.0882] // Nagpur, Maharashtra, India
export const DEFAULT_MAP_ZOOM = 12

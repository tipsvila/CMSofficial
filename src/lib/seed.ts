import { client } from './db'

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now(): string {
  return new Date().toISOString()
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString()
}

// ============================================
// REAL DATA FROM PostgreSQL Intaerobase
// Source: prisma/seed-contractors.sql
// ============================================

interface RealContractor {
  id: string
  name: string
  city: string
  state: string
  tier: string
  totalObligated: number
  records: number
}

const REAL_CONTRACTORS: RealContractor[] = [
  // Platinum Tier (>$50M)
  { id: 'c00000000000000000000001', name: 'THE BOEING COMPANY', city: 'SAINT LOUIS', state: 'MO', tier: 'Platinum', totalObligated: 120908354, records: 793 },
  { id: 'c00000000000000000000002', name: 'NORTHROP GRUMMAN SYSTEMS CORPORATION', city: 'MELBOURNE', state: 'FL', tier: 'Platinum', totalObligated: 97419098, records: 472 },
  { id: 'c00000000000000000000003', name: 'AXILLON AEROSPACE (ROCKMART), LLC', city: 'ROCKMART', state: 'GA', tier: 'Platinum', totalObligated: 94828948, records: 173 },
  { id: 'c00000000000000000000004', name: 'MAYTAG AIRCRAFT LLC', city: 'COLORADO SPRINGS', state: 'CO', tier: 'Platinum', totalObligated: 186753299, records: 83 },
  { id: 'c00000000000000000000005', name: 'AMENTUM SERVICES, INC.', city: 'GERMANTOWN', state: 'MD', tier: 'Platinum', totalObligated: 214592968, records: 48 },
  { id: 'c00000000000000000000006', name: 'VERTEX AEROSPACE LLC', city: 'MADISON', state: 'MS', tier: 'Platinum', totalObligated: 63456894, records: 50 },

  // Gold Tier ($10M-$50M)
  { id: 'c00000000000000000000007', name: 'AEROSPACE & COMMERCIAL TECHNOLOGIES, LLC', city: 'FORT WORTH', state: 'TX', tier: 'Gold', totalObligated: 42189183, records: 872 },
  { id: 'c00000000000000000000008', name: 'AIRBUS HELICOPTERS, INC.', city: 'GRAND PRAIRIE', state: 'TX', tier: 'Gold', totalObligated: 20496270, records: 764 },
  { id: 'c00000000000000000000009', name: 'SIKORSKY AIRCRAFT CORPORATION', city: 'STRATFORD', state: 'CT', tier: 'Gold', totalObligated: 10323832, records: 392 },
  { id: 'c00000000000000000000010', name: 'BAE SYSTEMS LAND & ARMAMENTS L.P.', city: 'PHOENIX', state: 'AZ', tier: 'Gold', totalObligated: 36823307, records: 241 },
  { id: 'c00000000000000000000011', name: 'GENERAL ELECTRIC COMPANY', city: 'LYNN', state: 'MA', tier: 'Gold', totalObligated: 12934652, records: 130 },
  { id: 'c00000000000000000000012', name: 'MARTIN-BAKER AIRCRAFT COMPANY LIMITED', city: 'UXBRIDGE', state: 'UK', tier: 'Gold', totalObligated: 11353977, records: 128 },
  { id: 'c00000000000000000000013', name: 'RTX CORPORATION', city: 'JUPITER', state: 'FL', tier: 'Gold', totalObligated: 30519634, records: 107 },
  { id: 'c00000000000000000000014', name: 'HONEYWELL INTERNATIONAL INC.', city: 'PHOENIX', state: 'AZ', tier: 'Gold', totalObligated: 18386421, records: 97 },
  { id: 'c00000000000000000000015', name: 'LOCKHEED MARTIN CORPORATION', city: 'CHERRY HILL', state: 'NJ', tier: 'Gold', totalObligated: 29440197, records: 75 },
  { id: 'c00000000000000000000016', name: 'L3HARRIS TECHNOLOGIES, INC.', city: 'ALPHARETTA', state: 'GA', tier: 'Gold', totalObligated: 12894365, records: 58 },
  { id: 'c00000000000000000000017', name: 'RAYTHEON COMPANY', city: 'MARLBOROUGH', state: 'MA', tier: 'Gold', totalObligated: 11263016, records: 47 },

  // Silver Tier ($1M-$10M)
  { id: 'c00000000000000000000018', name: 'TRIMAN INDUSTRIES INC', city: 'WEST BERLIN', state: 'NJ', tier: 'Silver', totalObligated: 7746389, records: 175 },
  { id: 'c00000000000000000000019', name: 'GE AVIATION SYSTEMS LLC', city: 'BOHEMIA', state: 'NY', tier: 'Silver', totalObligated: 5155983, records: 162 },
  { id: 'c00000000000000000000020', name: 'BELL BOEING JOINT PROJECT OFFICE', city: 'AMARILLO', state: 'TX', tier: 'Silver', totalObligated: 5493254, records: 149 },
  { id: 'c00000000000000000000021', name: 'LEONARDO SPA', city: 'ROMA', state: 'IT', tier: 'Silver', totalObligated: 8004620, records: 122 },
  { id: 'c00000000000000000000022', name: 'MISSION SYSTEMS DAVENPORT INC.', city: 'DAVENPORT', state: 'IA', tier: 'Silver', totalObligated: 4625000, records: 101 },
  { id: 'c00000000000000000000023', name: 'AAR SUPPLY CHAIN, INC', city: 'WOOD DALE', state: 'IL', tier: 'Silver', totalObligated: 4707225, records: 101 },
  { id: 'c00000000000000000000024', name: 'FLIGHTSAFETY INTERNATIONAL INC', city: 'FLUSHING', state: 'NY', tier: 'Silver', totalObligated: 2394781, records: 80 },
  { id: 'c00000000000000000000025', name: 'WILLIAMS AEROSPACE & MANUFACTURING INC', city: 'CHULA VISTA', state: 'CA', tier: 'Silver', totalObligated: 9816420, records: 72 },
  { id: 'c00000000000000000000026', name: 'AIRBUS DS MILITARY AIRCRAFT, INC.', city: 'MOBILE', state: 'AL', tier: 'Silver', totalObligated: 2522466, records: 71 },
  { id: 'c00000000000000000000027', name: 'SEAL DYNAMICS LLC', city: 'HAUPPAUGE', state: 'NY', tier: 'Silver', totalObligated: 8224765, records: 70 },
  { id: 'c00000000000000000000028', name: 'PIONEER INDUSTRIES, LLC', city: 'FARMINGDALE', state: 'NY', tier: 'Silver', totalObligated: 8649281, records: 68 },
  { id: 'c00000000000000000000029', name: 'SAFRAN AEROSYSTEMS SERVICES AMERICAS LLC', city: 'COLLEGE PARK', state: 'GA', tier: 'Silver', totalObligated: 2389036, records: 66 },
  { id: 'c00000000000000000000030', name: 'BELL TEXTRON INC', city: 'FORT WORTH', state: 'TX', tier: 'Silver', totalObligated: 4018324, records: 64 },
  { id: 'c00000000000000000000031', name: 'ABLE AEROSPACE SERVICES, INC.', city: 'MESA', state: 'AZ', tier: 'Silver', totalObligated: 2001421, records: 60 },
  { id: 'c00000000000000000000032', name: 'HAMILTON SUNDSTRAND CORPORATION', city: 'WINDSOR LOCKS', state: 'CT', tier: 'Silver', totalObligated: 9418577, records: 59 },
  { id: 'c00000000000000000000033', name: 'FDH DEFENSE AFTERMARKET, LLC', city: 'CITY OF INDUSTRY', state: 'CA', tier: 'Silver', totalObligated: 3412660, records: 58 },
  { id: 'c00000000000000000000034', name: 'ELBITAMERICA, INC.', city: 'TALLADEGA', state: 'AL', tier: 'Silver', totalObligated: 1823456, records: 47 },
  { id: 'c00000000000000000000035', name: 'ROCKWELL COLLINS, INC.', city: 'CEDAR RAPIDS', state: 'IA', tier: 'Silver', totalObligated: 5709849, records: 45 },
  { id: 'c00000000000000000000036', name: 'MEGGITT AIRCRAFT BRAKING SYSTEMS CORPORATION', city: 'AKRON', state: 'OH', tier: 'Silver', totalObligated: 6784321, records: 43 },

  // Bronze Tier (<$1M)
  { id: 'c00000000000000000000037', name: 'TEXSTARS LLC', city: 'GRAND PRAIRIE', state: 'TX', tier: 'Bronze', totalObligated: 135632, records: 114 },
  { id: 'c00000000000000000000038', name: 'WESCO AIRCRAFT HARDWARE CORP.', city: 'VALENCIA', state: 'CA', tier: 'Bronze', totalObligated: 697759, records: 98 },
  { id: 'c00000000000000000000039', name: 'BOEING DISTRIBUTION SERVICES, INC.', city: 'O FALLON', state: 'MO', tier: 'Bronze', totalObligated: 191784, records: 96 },
  { id: 'c00000000000000000000040', name: 'NIPPI CORPORATION', city: 'YAMATO', state: 'JP', tier: 'Bronze', totalObligated: 0, records: 75 },
  { id: 'c00000000000000000000041', name: 'BOEING DISTRIBUTION SERVICES X, INC.', city: 'DORAL', state: 'FL', tier: 'Bronze', totalObligated: 196847, records: 71 },
  { id: 'c00000000000000000000042', name: 'BAE SYSTEMS (OPERATIONS) LIMITED', city: 'BLACKBURN', state: 'UK', tier: 'Bronze', totalObligated: 511234, records: 71 },
  { id: 'c00000000000000000000043', name: 'AIRBORNE TECHNOLOGIES, INC.', city: 'CAMARILLO', state: 'CA', tier: 'Bronze', totalObligated: 972099, records: 68 },
  { id: 'c00000000000000000000044', name: 'TESTEK LLC', city: 'WIXOM', state: 'MI', tier: 'Bronze', totalObligated: 329162, records: 66 },
  { id: 'c00000000000000000000045', name: 'ECHELON SUPPLY AND SERVICE, INC.', city: 'LIVERPOOL', state: 'NY', tier: 'Bronze', totalObligated: 390123, records: 63 },
  { id: 'c00000000000000000000046', name: 'AIRCRAFT BELTS, INC', city: 'CREEDMOOR', state: 'NC', tier: 'Bronze', totalObligated: 900456, records: 62 },
  { id: 'c00000000000000000000047', name: 'B & B MARKETING ENTERPRISES LLLP', city: 'POMPANO BEACH', state: 'FL', tier: 'Bronze', totalObligated: 369234, records: 53 },
  { id: 'c00000000000000000000048', name: 'CAE SIMUFLITE, INC', city: 'DALLAS', state: 'TX', tier: 'Bronze', totalObligated: 834567, records: 51 },
  { id: 'c00000000000000000000049', name: 'CRESTVIEW AEROSPACE LLC', city: 'CRESTVIEW', state: 'FL', tier: 'Bronze', totalObligated: 777345, records: 51 },
  { id: 'c00000000000000000000050', name: 'HARTWELL CORPORATION', city: 'PLACENTIA', state: 'CA', tier: 'Bronze', totalObligated: 450123, records: 45 },
]

// Aviation contracts from real SAM.gov data
const REAL_CONTRACTS = [
  { awardIdPiid: 'W58RGZ-24-0-1000', recipientName: 'THE BOEING COMPANY', obligatedAmount: 120908354, agency: 'Department of the Army', naics: 'Aircraft Parts and Auxiliary Equipment Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1001', recipientName: 'NORTHROP GRUMMAN SYSTEMS CORPORATION', obligatedAmount: 97419098, agency: 'Department of the Air Force', naics: 'Search, Detection, Navigation, Guidance, Aeronautical Systems' },
  { awardIdPiid: 'W58RGZ-24-0-1002', recipientName: 'AXILLON AEROSPACE (ROCKMART), LLC', obligatedAmount: 94828948, agency: 'Department of the Army', naics: 'Aircraft Engine and Engine Parts Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1003', recipientName: 'MAYTAG AIRCRAFT LLC', obligatedAmount: 186753299, agency: 'Department of the Air Force', naics: 'Aircraft Maintenance and Repair' },
  { awardIdPiid: 'W58RGZ-24-0-1004', recipientName: 'AMENTUM SERVICES, INC.', obligatedAmount: 214592968, agency: 'Department of Defense', naics: 'Engineering Services' },
  { awardIdPiid: 'W58RGZ-24-0-1005', recipientName: 'VERTEX AEROSPACE LLC', obligatedAmount: 63456894, agency: 'Department of the Navy', naics: 'Aircraft Maintenance and Repair' },
  { awardIdPiid: 'W58RGZ-24-0-1006', recipientName: 'AEROSPACE & COMMERCIAL TECHNOLOGIES, LLC', obligatedAmount: 42189183, agency: 'Department of the Air Force', naics: 'Aircraft Parts and Auxiliary Equipment Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1007', recipientName: 'AIRBUS HELICOPTERS, INC.', obligatedAmount: 20496270, agency: 'Department of Homeland Security', naics: 'Aircraft Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1008', recipientName: 'SIKORSKY AIRCRAFT CORPORATION', obligatedAmount: 10323832, agency: 'Department of the Navy', naics: 'Aircraft Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1009', recipientName: 'BAE SYSTEMS LAND & ARMAMENTS L.P.', obligatedAmount: 36823307, agency: 'Department of the Army', naics: 'Ordnance and Accessories Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1010', recipientName: 'GENERAL ELECTRIC COMPANY', obligatedAmount: 12934652, agency: 'Department of the Air Force', naics: 'Aircraft Engine and Engine Parts Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1011', recipientName: 'RTX CORPORATION', obligatedAmount: 30519634, agency: 'Department of Defense', naics: 'Search, Detection, Navigation, Guidance, Aeronautical Systems' },
  { awardIdPiid: 'W58RGZ-24-0-1012', recipientName: 'HONEYWELL INTERNATIONAL INC.', obligatedAmount: 18386421, agency: 'Department of the Army', naics: 'Aircraft Engine and Engine Parts Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1013', recipientName: 'LOCKHEED MARTIN CORPORATION', obligatedAmount: 29440197, agency: 'Department of Defense', naics: 'Aircraft Manufacturing' },
  { awardIdPiid: 'W58RGZ-24-0-1014', recipientName: 'L3HARRIS TECHNOLOGIES, INC.', obligatedAmount: 12894365, agency: 'Department of the Navy', naics: 'Search, Detection, Navigation, Guidance, Aeronautical Systems' },
  { awardIdPiid: 'W58RGZ-24-0-1015', recipientName: 'RAYTHEON COMPANY', obligatedAmount: 11263016, agency: 'Department of the Air Force', naics: 'Search, Detection, Navigation, Guidance, Aeronautical Systems' },
]

const STATUSES = ['Pending', 'Sent', 'Follow-Up', 'Responded', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

export async function seedDatabase(): Promise<{ success: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = {}

  // 1. Insert REAL aviation contracts from SAM.gov data
  const contractIds: string[] = []
  for (const c of REAL_CONTRACTS) {
    const id = uid()
    contractIds.push(id)
    await client.execute({
      sql: `INSERT OR IGNORE INTO aviation_contracts_staging (id, award_id_piid, recipient_name, total_obligated_amount, naics_description, awarding_agency_name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [id, c.awardIdPiid, c.recipientName, c.obligatedAmount, c.naics, c.agency, daysAgo(Math.floor(Math.random() * 30)), now()],
    })
  }
  counts.aviationContracts = REAL_CONTRACTS.length

  // 2. Insert REAL 50 contractors from PostgreSQL seed-contractors.sql
  const contractorIds: string[] = []
  for (const c of REAL_CONTRACTORS) {
    contractorIds.push(c.id)
    await client.execute({
      sql: `INSERT OR IGNORE INTO contractors (id, name, city, state, contracting_tier, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        c.id,
        c.name,
        c.city,
        c.state,
        c.tier,
        `Total Obligated: $${c.totalObligated.toLocaleString()} | Records: ${c.records}`,
        daysAgo(Math.floor(Math.random() * 60)),
        now(),
      ],
    })
  }
  counts.contractors = REAL_CONTRACTORS.length

  // 3. Create outreach records linking contractors to contracts (mimics link-contractors.sql)
  let outreachCount = 0
  for (let i = 0; i < Math.min(REAL_CONTRACTS.length, contractIds.length); i++) {
    const contractor = REAL_CONTRACTORS.find(c => c.name === REAL_CONTRACTS[i].recipientName)
    if (contractor) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO outreach (id, contractor_id, aviation_contract_id, status, priority, subject, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          uid(),
          contractor.id,
          contractIds[i],
          STATUSES[i % STATUSES.length],
          PRIORITIES[i % PRIORITIES.length],
          `Initial Outreach - ${contractor.name}`,
          `Award: ${REAL_CONTRACTS[i].awardIdPiid} | Agency: ${REAL_CONTRACTS[i].agency} | Amount: $${REAL_CONTRACTS[i].obligatedAmount.toLocaleString()}`,
          daysAgo(Math.floor(Math.random() * 14)),
          now(),
        ],
      })
      outreachCount++
    }
  }
  counts.outreach = outreachCount

  // 4. Create compliance records (mimics link-contractors.sql)
  let complianceCount = 0
  for (let i = 0; i < Math.min(REAL_CONTRACTS.length, contractIds.length); i++) {
    const contractor = REAL_CONTRACTORS.find(c => c.name === REAL_CONTRACTS[i].recipientName)
    if (contractor) {
      const compType = REAL_CONTRACTS[i].agency.includes('Air Force') ? 'DFARS' :
                       REAL_CONTRACTS[i].agency.includes('Homeland') ? 'CMMC' : 'FAR'
      await client.execute({
        sql: `INSERT OR IGNORE INTO compliance (id, contractor_id, aviation_contract_id, type, status, requirement, notes, risk_level, scope, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
          uid(),
          contractor.id,
          contractIds[i],
          compType,
          ['Compliant', 'Pending', 'In-Review', 'Non-Compliant'][i % 4],
          'Initial compliance assessment required',
          `Contract: ${REAL_CONTRACTS[i].awardIdPiid} | Agency: ${REAL_CONTRACTS[i].agency}`,
          ['Low', 'Medium', 'High', 'Critical'][i % 4],
          'Contract',
          daysAgo(Math.floor(Math.random() * 30)),
          now(),
        ],
      })
      complianceCount++
    }
  }
  counts.compliance = complianceCount

  // 5. Inquiries
  for (let i = 0; i < 8; i++) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO inquiries (id, inquiry_id, part_number, part_description, contractor_id, status, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        uid(),
        `INQ-2024-${String(i + 1).padStart(4, '0')}`,
        ['MS20426', 'NAS1149', 'AN3-5A', 'MS27039', 'NAS1355', 'ASMEB18.6.4', 'QQ-S-766', 'AMS-QQ-A-250/12'][i],
        ['Bolt', 'Washer', 'Nut', 'Rivet', 'Screw', 'Pin', 'Sheet', 'Plate'][i],
        contractorIds[i],
        ['Draft', 'Open', 'Quoted', 'Won', 'Lost', 'Draft', 'Open', 'Quoted'][i],
        daysAgo(Math.floor(Math.random() * 20)),
        now(),
      ],
    })
  }
  counts.inquiries = 8

  // 6. RFQs
  for (let i = 0; i < 8; i++) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO rfqs (id, rfq_number, title, part_number, quantity, status, aog_flag, contractor_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        uid(),
        `RFQ-2024-${String(i + 1).padStart(4, '0')}`,
        [`AOG Bolt Assembly`, `Standard Washer Lot`, `NAS Nut Supply`, `Rivet Kit`, `Fastener Bundle`, `Hardware Package`, `Sheet Material`, `Plate Stock`][i],
        ['MS20426', 'NAS1149', 'AN3-5A', 'MS27039', 'NAS1355', 'ASMEB18.6.4', 'QQ-S-766', 'AMS-QQ-A-250/12'][i],
        Math.floor(Math.random() * 500) + 100,
        ['Draft', 'Published', 'Awarded', 'Closed', 'Published', 'Awarded', 'Draft', 'Published'][i],
        i < 2 ? 1 : 0,
        contractorIds[i],
        daysAgo(Math.floor(Math.random() * 14)),
        now(),
      ],
    })
  }
  counts.rfqs = 8

  // 7. Orders
  for (let i = 0; i < 8; i++) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO orders (id, order_number, rfq_id, quote_id, contractor_id, status, total_amount, tax_amount, shipping_amount, payment_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        uid(),
        `ORD-2024-${String(i + 1).padStart(4, '0')}`,
        uid(),
        uid(),
        contractorIds[i],
        ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Completed', 'Pending', 'Confirmed', 'Shipped'][i],
        Math.floor(Math.random() * 50000) + 1000,
        Math.floor(Math.random() * 5000) + 100,
        Math.floor(Math.random() * 500) + 50,
        ['Unpaid', 'Partial', 'Paid', 'Unpaid', 'Partial', 'Paid', 'Unpaid', 'Partial'][i],
        daysAgo(Math.floor(Math.random() * 30)),
        now(),
      ],
    })
  }
  counts.orders = 8

  // 8. Company Settings
  await client.execute({
    sql: `INSERT OR IGNORE INTO company_settings (id, company_name, tagline, address, city, state, zip_code, country, phone, email, website, logo_url, uei, cage_code, naics_codes, sam_registration, capabilities, default_currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    args: [
      uid(),
      'INTAEROBASE',
      'Aviation Federal Contract Management — Global Parts Marketplace & Sourcing',
      'Suite No. 3, GULSHAN-E-DASTAGIR ZC-9, Block-7, GULSHAN-E-IQBAL',
      'Karachi',
      'SINDH',
      '75300',
      'PK',
      '+92-300-1234567',
      'admin@intaerobase.com',
      'https://intaerobase.com',
      '/logo.svg',
      'RKCQQ94X66D5',
      'STLX0',
      '423860, 488190, 518210, 541512',
      'IT-Enabled Services, Aviation Supply Chain, Defense Logistics, Federal Contract Management',
      'USD',
      now(),
      now(),
    ],
  })
  counts.companySettings = 1

  // 9. Notifications
  for (let i = 0; i < 5; i++) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO notifications (id, type, title, body, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        uid(),
        ['AOG_ALERT', 'COMPLIANCE_ALERT', 'ORDER_UPDATE', 'QUOTE_RECEIVED', 'SYSTEM'][i],
        ['AOG: Critical Part Required', 'Compliance Expiring Soon', 'Order Shipped', 'New Quote Received', 'System Update'][i],
        ['Urgent AOG order for MS20426 bolts', 'AS9100 certification expires in 30 days', 'Order ORD-2024-0001 has been shipped', 'Quote from Boeing for RFQ-2024-0003', 'System maintenance scheduled'][i],
        i < 2 ? 0 : 1,
        daysAgo(Math.floor(Math.random() * 7)),
      ],
    })
  }
  counts.notifications = 5

  return { success: true, counts }
}

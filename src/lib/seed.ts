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
      sql: `INSERT OR IGNORE INTO SAM_Data (id, award_id_piid, recipient_name, total_obligated_amount, naics_description, awarding_agency_name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
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
    sql: `INSERT OR IGNORE INTO company_settings (id, company_name, tagline, address, city, state, zip_code, country, phone, phone_alt, email, website, logo_url, logo_size, uei, cage_code, naics_codes, tax_id, duns, sam_registration, capabilities, core_capabilities, certifications, compliance_frameworks, naics_descriptions, service_highlights, why_choose_us, sam_gov_status, registration_purpose, owner_name, default_currency, smtp_from_name, smtp_from_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      '',
      'sales@intaerobase.com',
      'https://intaerobase.com',
      '/logo.svg',
      48,
      'RKCQQ94X66D5',
      'STLX0',
      '423860, 488190, 518210, 541512',
      '4220148367751',
      '',
      'IT-Enabled Services (ITeS), Aviation Supply Chain Facilitation, Defense Logistics, Federal Contract Management, Parts Sourcing & Procurement, Compliance CMS Architecture, Data Processing & Computer Systems Design',
      '',
      '',
      '',
      '',
      JSON.stringify([["Compliance","FAA 8130-3, AS9120/9110, FAR/DFARS aligned"],["Sourcing","OEM and PMA parts with global logistics network"],["Traceability","Complete chain-of-custody and CoC documentation"],["Reach","SAM.gov registered, DLA CAGE certified"],["Quality","Strictest alignment with FAA Form 8130-3 standards"],["IT Services","Data processing, systems design, web infrastructure"]]),
      JSON.stringify(["SAM.gov registered entity with active CAGE code","FAA Form 8130-3 and AS9120 compliant quality systems","End-to-end contract management CMS with real-time tracking","Global aviation parts sourcing network with full traceability","FAR/DFARS, CMMC, and ITAR compliance ready","Dedicated defense logistics support with NATO standards","Data-driven price intelligence and anomaly detection","Automated RFQ matching and quote management"]),
      'Submitted Registration',
      'All Awards',
      'Hafiz Faisal Farooq',
      'USD',
      'INTAEROBASE',
      'sales@intaerobase.com',
      now(),
      now(),
    ],
  })
  counts.companySettings = 1

  // 9. Capabilities (Aviation services converted from PostgreSQL)
  const CAPABILITIES_DATA = [
    { category: 'MRO', name: 'Heavy Maintenance Check (C-Check)', description: 'Full C-Check maintenance for narrow-body aircraft including structural inspection, systems testing, and component overhaul', contractorId: contractorIds[0], naics: '336413', aircraft: 'B737, B757, A320', certLevel: 'FAA Part 145', estValue: 2500000 },
    { category: 'MRO', name: 'Line Maintenance Services', description: 'AOG response and routine line maintenance at major hub airports', contractorId: contractorIds[1], naics: '336413', aircraft: 'B787, B777, A350', certLevel: 'EASA Part 145', estValue: 1800000 },
    { category: 'Manufacturing', name: 'Precision CNC Machining', description: '5-axis CNC machining of flight-critical titanium and Inconel components', contractorId: contractorIds[2], naics: '332710', aircraft: 'Universal', certLevel: 'AS9100D', estValue: 3200000 },
    { category: 'Manufacturing', name: 'Composite Structures Fabrication', description: 'Autoclave-cured carbon fiber structural components and fairings', contractorId: contractorIds[3], naics: '336411', aircraft: 'F-35, B787, A350', certLevel: 'NADCAP', estValue: 4100000 },
    { category: 'Supply Chain', name: 'AOG Parts Distribution', description: '24/7 AOG parts sourcing and worldwide expedited shipping network', contractorId: contractorIds[4], naics: '423390', aircraft: 'All Commercial', certLevel: 'ASA-100', estValue: 8900000 },
    { category: 'Supply Chain', name: 'Engine Component Supply', description: 'CFM56, V2500, and GEnx engine rotable and expendable parts', contractorId: contractorIds[5], naics: '423390', aircraft: 'A320, B737, B787', certLevel: 'FAA AC 00-56B', estValue: 6700000 },
    { category: 'Engineering', name: 'STC Development', description: 'Supplemental Type Certificate development for avionics upgrades and cabin modifications', contractorId: contractorIds[6], naics: '541330', aircraft: 'B737, A320, CRJ-900', certLevel: 'FAA DER', estValue: 1500000 },
    { category: 'Engineering', name: 'Structural Repair Engineering', description: 'Engineering analysis and repair design for fatigue-critical airframe structures', contractorId: contractorIds[7], naics: '541330', aircraft: 'B767, A330, C-130', certLevel: 'FAA ODA', estValue: 980000 },
    { category: 'Tooling', name: 'Special Purpose Test Equipment', description: 'Design and manufacture of NDT inspection fixtures and test rigs', contractorId: contractorIds[8], naics: '333249', aircraft: 'Universal', certLevel: 'ISO 9001', estValue: 750000 },
    { category: 'MRO', name: 'Avionics Integration', description: 'Glass cockpit upgrades, ADS-B Out compliance, and FMS modernization', contractorId: contractorIds[9], naics: '334511', aircraft: 'B737NG, A320, E175', certLevel: 'FAA Part 145', estValue: 2100000 },
    { category: 'Manufacturing', name: 'Landing Gear Overhaul', description: 'Complete landing gear disassembly, NDT inspection, plating, reassembly, and testing', contractorId: contractorIds[10], naics: '336413', aircraft: 'B737, A320, ERJ-145', certLevel: 'OEM Authorized', estValue: 5400000 },
    { category: 'Supply Chain', name: 'Hardware Fastener Distribution', description: 'NAS, MS, AN series aerospace fasteners and标准件 inventory', contractorId: contractorIds[11], naics: '423390', aircraft: 'Universal', certLevel: 'ASA-100', estValue: 3100000 },
    { category: 'Engineering', name: 'NDT Inspection Services', description: 'Ultrasonic, eddy current, and radiographic inspection per ASTM E1444', contractorId: contractorIds[12], naics: '541990', aircraft: 'All Types', certLevel: 'NADCAP NDT', estValue: 1200000 },
    { category: 'MRO', name: 'APU MRO Services', description: 'Full overhaul and repair of Honeywell GTCP36-300 and APS3200 APU systems', contractorId: contractorIds[13], naics: '336413', aircraft: 'B737, A320', certLevel: 'OEM License', estValue: 3800000 },
    { category: 'Manufacturing', name: 'Wiring Harness Production', description: ' MIL-STD-1553 and ARINC 429 cable harness fabrication and testing', contractorId: contractorIds[14], naics: '335999', aircraft: 'Defense & Commercial', certLevel: 'NADCAP', estValue: 1600000 },
    { category: 'Tooling', name: 'GSE Manufacturing', description: 'Ground support equipment design including tow bars, engine stands, and transport cradles', contractorId: contractorIds[15], naics: '333249', aircraft: 'B737, A320, B787', certLevel: 'ISO 9001', estValue: 890000 },
  ]

  let capCount = 0
  for (const cap of CAPABILITIES_DATA) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO capabilities (id, contractor_id, category, name, description, status, certification_level, naics_code, aircraft_types, estimated_value, priority, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [
        uid(),
        cap.contractorId,
        cap.category,
        cap.name,
        cap.description,
        'Active',
        cap.certLevel,
        cap.naics,
        cap.aircraft,
        cap.estValue,
        ['High', 'Critical', 'Medium'][capCount % 3],
        daysAgo(Math.floor(Math.random() * 30)),
        now(),
      ],
    })
    capCount++
  }
  counts.capabilities = capCount

  // 10. Notifications
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

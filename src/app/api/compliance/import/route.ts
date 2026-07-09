import { createCrudHandlers } from '@/lib/crud'
import { complianceConfig } from '@/lib/entity-configs'

const { import: POST } = createCrudHandlers(complianceConfig)
export { POST }

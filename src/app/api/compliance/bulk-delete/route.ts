import { createCrudHandlers } from '@/lib/crud'
import { complianceConfig } from '@/lib/entity-configs'

const { bulkDelete: POST } = createCrudHandlers(complianceConfig)
export { POST }

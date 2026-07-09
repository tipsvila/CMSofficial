import { createCrudHandlers } from '@/lib/crud'
import { complianceConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(complianceConfig)
export { GET, POST }

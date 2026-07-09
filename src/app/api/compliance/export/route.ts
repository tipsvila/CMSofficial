import { createCrudHandlers } from '@/lib/crud'
import { complianceConfig } from '@/lib/entity-configs'

const { export: GET } = createCrudHandlers(complianceConfig)
export { GET }

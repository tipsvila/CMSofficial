import { createCrudHandlers } from '@/lib/crud'
import { complianceConfig } from '@/lib/entity-configs'

const { GETById: GET, PUT, DELETE } = createCrudHandlers(complianceConfig)
export { GET, PUT, DELETE }

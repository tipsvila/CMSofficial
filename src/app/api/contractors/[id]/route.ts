import { createCrudHandlers } from '@/lib/crud'
import { contractorsConfig } from '@/lib/entity-configs'

const { GETById: GET, PUT, DELETE } = createCrudHandlers(contractorsConfig)
export { GET, PUT, DELETE }

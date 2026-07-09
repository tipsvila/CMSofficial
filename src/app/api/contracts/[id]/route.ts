import { createCrudHandlers } from '@/lib/crud'
import { contractsConfig } from '@/lib/entity-configs'

const { GETById: GET, PUT, DELETE } = createCrudHandlers(contractsConfig)
export { GET, PUT, DELETE }

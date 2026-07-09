import { createCrudHandlers } from '@/lib/crud'
import { contractsConfig } from '@/lib/entity-configs'

const { export: GET } = createCrudHandlers(contractsConfig)
export { GET }

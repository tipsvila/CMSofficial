import { createCrudHandlers } from '@/lib/crud'
import { contractsConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(contractsConfig)
export { GET, POST }

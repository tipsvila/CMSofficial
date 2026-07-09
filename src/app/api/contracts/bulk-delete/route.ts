import { createCrudHandlers } from '@/lib/crud'
import { contractsConfig } from '@/lib/entity-configs'

const { bulkDelete: POST } = createCrudHandlers(contractsConfig)
export { POST }

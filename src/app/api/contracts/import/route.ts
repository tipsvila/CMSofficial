import { createCrudHandlers } from '@/lib/crud'
import { contractsConfig } from '@/lib/entity-configs'

const { import: POST } = createCrudHandlers(contractsConfig)
export { POST }

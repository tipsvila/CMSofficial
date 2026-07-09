import { createCrudHandlers } from '@/lib/crud'
import { contractorsConfig } from '@/lib/entity-configs'

const { bulkDelete: POST } = createCrudHandlers(contractorsConfig)
export { POST }

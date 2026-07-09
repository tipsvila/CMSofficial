import { createCrudHandlers } from '@/lib/crud'
import { contractorsConfig } from '@/lib/entity-configs'

const { import: POST } = createCrudHandlers(contractorsConfig)
export { POST }

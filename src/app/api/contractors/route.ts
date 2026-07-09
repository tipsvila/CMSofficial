import { createCrudHandlers } from '@/lib/crud'
import { contractorsConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(contractorsConfig)
export { GET, POST }

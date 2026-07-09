import { createCrudHandlers } from '@/lib/crud'
import { contractorsConfig } from '@/lib/entity-configs'

const { export: GET } = createCrudHandlers(contractorsConfig)
export { GET }

import { createCrudHandlers } from '@/lib/crud'
import { outreachConfig } from '@/lib/entity-configs'

const { bulkDelete: POST } = createCrudHandlers(outreachConfig)
export { POST }

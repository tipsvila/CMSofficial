import { createCrudHandlers } from '@/lib/crud'
import { inquiriesConfig } from '@/lib/entity-configs'

const { bulkDelete: POST } = createCrudHandlers(inquiriesConfig)
export { POST }

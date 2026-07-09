import { createCrudHandlers } from '@/lib/crud'
import { inquiriesConfig } from '@/lib/entity-configs'

const { import: POST } = createCrudHandlers(inquiriesConfig)
export { POST }

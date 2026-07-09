import { createCrudHandlers } from '@/lib/crud'
import { inquiriesConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(inquiriesConfig)
export { GET, POST }

import { createCrudHandlers } from '@/lib/crud'
import { rfqsConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(rfqsConfig)
export { GET, POST }

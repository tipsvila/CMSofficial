import { createCrudHandlers } from '@/lib/crud'
import { inquiriesConfig } from '@/lib/entity-configs'

const { export: GET } = createCrudHandlers(inquiriesConfig)
export { GET }

import { createCrudHandlers } from '@/lib/crud'
import { inquiriesConfig } from '@/lib/entity-configs'

const { GETById: GET, PUT, DELETE } = createCrudHandlers(inquiriesConfig)
export { GET, PUT, DELETE }

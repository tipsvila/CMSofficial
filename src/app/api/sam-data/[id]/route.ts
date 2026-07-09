import { createCrudHandlers } from '@/lib/crud'
import { samDataConfig } from '@/lib/entity-configs'

const { GETById, PUT, DELETE } = createCrudHandlers(samDataConfig)
export { GETById as GET, PUT, DELETE }

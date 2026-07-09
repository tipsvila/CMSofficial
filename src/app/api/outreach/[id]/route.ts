import { createCrudHandlers } from '@/lib/crud'
import { outreachConfig } from '@/lib/entity-configs'

const { GETById: GET, PUT, DELETE } = createCrudHandlers(outreachConfig)
export { GET, PUT, DELETE }

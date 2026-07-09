import { createCrudHandlers } from '@/lib/crud'
import { outreachConfig } from '@/lib/entity-configs'

const { export: GET } = createCrudHandlers(outreachConfig)
export { GET }

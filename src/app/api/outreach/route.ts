import { createCrudHandlers } from '@/lib/crud'
import { outreachConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(outreachConfig)
export { GET, POST }

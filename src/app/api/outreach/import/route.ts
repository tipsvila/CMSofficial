import { createCrudHandlers } from '@/lib/crud'
import { outreachConfig } from '@/lib/entity-configs'

const { import: POST } = createCrudHandlers(outreachConfig)
export { POST }

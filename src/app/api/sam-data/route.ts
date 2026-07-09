import { createCrudHandlers } from '@/lib/crud'
import { samDataConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(samDataConfig)
export { GET, POST }

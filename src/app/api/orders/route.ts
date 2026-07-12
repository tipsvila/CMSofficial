import { createCrudHandlers } from '@/lib/crud'
import { ordersConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(ordersConfig)
export { GET, POST }

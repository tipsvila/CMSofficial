import { createCrudHandlers } from '@/lib/crud'
import { samDataConfig } from '@/lib/entity-configs'

const { bulkDelete } = createCrudHandlers(samDataConfig)
export { bulkDelete as POST }

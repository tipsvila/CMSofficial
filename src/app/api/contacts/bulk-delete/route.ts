import { createCrudHandlers } from '@/lib/crud'
import { contactsConfig } from '@/lib/entity-configs'

const { bulkDelete: POST } = createCrudHandlers(contactsConfig)
export { POST }

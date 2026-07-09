import { createCrudHandlers } from '@/lib/crud'
import { contactsConfig } from '@/lib/entity-configs'

const { GET, POST } = createCrudHandlers(contactsConfig)
export { GET, POST }

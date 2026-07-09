import { createCrudHandlers } from '@/lib/crud'
import { contactsConfig } from '@/lib/entity-configs'

const { import: POST } = createCrudHandlers(contactsConfig)
export { POST }

import { createCrudHandlers } from '@/lib/crud'
import { contactsConfig } from '@/lib/entity-configs'

const { export: GET } = createCrudHandlers(contactsConfig)
export { GET }

import { createCrudHandlers } from '@/lib/crud'
import { contactsConfig } from '@/lib/entity-configs'

const { GETById: GET, PUT, DELETE } = createCrudHandlers(contactsConfig)
export { GET, PUT, DELETE }

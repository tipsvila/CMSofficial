import { createCrudHandlers } from '@/lib/crud'
import { samDataConfig } from '@/lib/entity-configs'

const { import: handleImport } = createCrudHandlers(samDataConfig)
export { handleImport as POST }

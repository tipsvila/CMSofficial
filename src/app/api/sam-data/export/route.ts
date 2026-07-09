import { createCrudHandlers } from '@/lib/crud'
import { samDataConfig } from '@/lib/entity-configs'

const { export: handleExport } = createCrudHandlers(samDataConfig)
export { handleExport as GET }

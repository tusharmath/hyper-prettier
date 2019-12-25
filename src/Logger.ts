import {QIO} from '@qio/core'

import {EnvLogger, EnvWorkerId} from './Env'

export const logger = (scope: string) => (entity: string, operation: string) =>
  QIO.accessM((_: EnvWorkerId) => _.worker.id).chain(id =>
    QIO.access((_: EnvLogger) => {
      _.logger.log(`HPrettier${scope}_${id.toString().padStart(3, '0')}`)(
        `${entity}:`,
        operation
      )
    })
  )

import {QIO} from '@qio/core'

import {EnvLogger} from './Env'

export const D = (...t: unknown[]): QIO<void, never, EnvLogger> =>
  QIO.access((_: EnvLogger) => {
    _.logger.log('HPrettier')(...t)
  })

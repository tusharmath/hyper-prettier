import {QIO} from '@qio/core'

import {WORKER_ID_ENV} from './MasterProgram'
export const workerId = QIO.lift(() => {
  const env = Number(process.env[WORKER_ID_ENV])

  return Number.isFinite(env) ? Number(env) : 999
})

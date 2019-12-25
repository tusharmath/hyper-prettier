import {QIO} from '@qio/core'

import {EnvMaster, EnvMasterProgram, EnvWorkerProgram} from './Env'

// ENV Helpers
const isMaster = QIO.access((_: EnvMaster) => _.cluster.isMaster)
const getMasterProgram = (filePaths: string[], concurrency: number) =>
  QIO.accessM((_: EnvMasterProgram) => _.masterProgram(filePaths, concurrency))
const getWorkerProgram = () =>
  QIO.accessM((_: EnvWorkerProgram) => _.workerProgram())

export const program = (filePaths: QIO<string[]>, concurrency: number) =>
  filePaths.chain(paths =>
    isMaster.chain(cond =>
      QIO.if(cond, getMasterProgram(paths, concurrency), getWorkerProgram())
    )
  )

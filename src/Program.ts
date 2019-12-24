import {QIO} from '@qio/core'

import {EnvMaster, EnvMasterProgram, EnvStdin, EnvWorkerProgram} from './Env'

// ENV Helpers
const isMaster = QIO.access((_: EnvMaster) => _.cluster.isMaster)
const getMasterProgram = (filePaths: string[], concurrency: number) =>
  QIO.accessM((_: EnvMasterProgram) => _.masterProgram(filePaths, concurrency))
const getWorkerProgram = () =>
  QIO.accessM((_: EnvWorkerProgram) => _.workerProgram())
const stdin = QIO.accessM((_: EnvStdin) => _.stdin.data)

export const program = (concurrency: number) =>
  stdin.chain(M =>
    M.use(
      stream =>
        stream
          .map(_ => _.toString().split('\n'))
          .mapM(filePaths =>
            isMaster.chain(cond =>
              QIO.if(
                cond,
                getMasterProgram(filePaths, concurrency),
                getWorkerProgram()
              )
            )
          ).drain
    )
  )

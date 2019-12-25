import {Managed, QIO, testRuntime} from '@qio/core'
import {Stream} from '@qio/stream'
import {spy} from 'chai'

import {program} from '../src/Program'

describe('Program', () => {
  const buffer = [Buffer.from(['./A', './B', './C'].join('\n'))]
  const mockEnv = (_ = {isMaster: true}) => {
    const masterProgram = spy()
    const workerProgram = spy()

    return {
      __spy__: {masterProgram, workerProgram},
      cluster: {
        isMaster: _.isMaster
      },
      masterProgram: QIO.encase(masterProgram),
      stdin: {
        data: QIO.resolve(
          Managed.make(QIO.resolve(Stream.fromArray(buffer)), QIO.void)
        )
      },
      workerProgram: QIO.encase(workerProgram)
    }
  }

  context('is master', () => {
    it('should call masterProgram', () => {
      const env = mockEnv()
      testRuntime().unsafeExecuteSync(program(2).provide(env))
      env.__spy__.masterProgram.should.have.been.first.called.with.exactly(
        ['./A', './B', './C'],
        2
      )
    })
  })

  context('is worker', () => {
    it('should call masterProgram', () => {
      const env = mockEnv({isMaster: false})
      testRuntime().unsafeExecuteSync(program(2).provide(env))
      env.__spy__.workerProgram.should.have.been.called()
    })
  })
})

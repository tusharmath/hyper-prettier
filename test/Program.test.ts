import {QIO, testRuntime} from '@qio/core'
import {spy} from 'chai'

import {program} from '../src/Program'

describe('Program', () => {
  const mockEnv = (_ = {isMaster: true}) => {
    const masterProgram = spy()
    const workerProgram = spy()

    return {
      __spy__: {masterProgram, workerProgram},
      cluster: {
        isMaster: _.isMaster
      },
      masterProgram: QIO.encase(masterProgram),
      workerProgram: QIO.encase(workerProgram)
    }
  }

  context('is master', () => {
    it('should call masterProgram', () => {
      const env = mockEnv()
      testRuntime().unsafeExecuteSync(
        program(QIO.resolve(['./A', './B', './C']), 2).provide(env)
      )
      env.__spy__.masterProgram.should.have.been.first.called.with.exactly(
        ['./A', './B', './C'],
        2
      )
    })
  })

  context('is worker', () => {
    it('should call masterProgram', () => {
      const env = mockEnv({isMaster: false})
      testRuntime().unsafeExecuteSync(program(QIO.resolve([]), 2).provide(env))
      env.__spy__.workerProgram.should.have.been.called()
    })
  })
})

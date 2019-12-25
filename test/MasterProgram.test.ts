import {QIO, testRuntime} from '@qio/core'
import {assert} from 'chai'

import {masterProgram} from '../src/MasterProgram'
import {MasterSocket} from '../src/QMasterSocket'
import {QWorker} from '../src/QWorker'

import {testLogger} from './internal/TestLogger'

const fork = (): QWorker => ({kill: () => {}})
const masterSocket = QIO.encase(
  (): MasterSocket => ({
    bind: address => QIO.void(),
    close: QIO.void(),
    send: message => QIO.resolve([])
  })
)
const env = {
  cluster: {
    fork,
    masterSocket
  },
  logger: testLogger(),
  worker: {
    id: QIO.resolve(100)
  }
}
describe('masterProgram', () => {
  it('should start the program', () => {
    const L = testLogger()
    testRuntime().unsafeExecuteSync(
      masterProgram([], 1).provide({
        ...env,
        logger: L
      })
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettierMasterProgram_100 program: START',
      'HPrettierMasterProgram_100 concurrency: 1',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 worker pool: 1 OK',
      'HPrettierMasterProgram_100 socket: ACQUIRED',
      'HPrettierMasterProgram_100 file count: 0',
      'HPrettierMasterProgram_100 file sent: 0',
      'HPrettierMasterProgram_100 socket: RELEASED'
    ])
  })

  it('should create 4 workers', () => {
    const L = testLogger()
    testRuntime().unsafeExecuteSync(
      masterProgram([], 4).provide({
        ...env,
        logger: L
      })
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettierMasterProgram_100 program: START',
      'HPrettierMasterProgram_100 concurrency: 4',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 worker pool: 4 OK',
      'HPrettierMasterProgram_100 socket: ACQUIRED',
      'HPrettierMasterProgram_100 file count: 0',
      'HPrettierMasterProgram_100 file sent: 0',
      'HPrettierMasterProgram_100 socket: RELEASED'
    ])
  })

  it('should send 2 files', () => {
    const L = testLogger()
    testRuntime().unsafeExecuteSync(
      masterProgram(['A', 'B', 'C'], 1).provide({
        ...env,
        logger: L
      })
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettierMasterProgram_100 program: START',
      'HPrettierMasterProgram_100 concurrency: 1',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 worker pool: 1 OK',
      'HPrettierMasterProgram_100 socket: ACQUIRED',
      'HPrettierMasterProgram_100 file count: 3',
      'HPrettierMasterProgram_100 send: A',
      'HPrettierMasterProgram_100 send: B',
      'HPrettierMasterProgram_100 send: C',
      'HPrettierMasterProgram_100 file sent: 3',
      'HPrettierMasterProgram_100 socket: RELEASED'
    ])
  })
})

import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'

import {masterProgram} from '../src/MasterProgram'
import {MasterSocket} from '../src/QMasterSocket'
import {QWorker} from '../src/QWorker'

import {testLogger} from './internal/TestLogger'

const fork = (): QWorker => ({kill: () => {}})
const masterSocket = () => {
  const send = spy(() => new Array<Buffer>())
  const bind = spy((address: string) => void 0)
  const close = spy()

  return {
    __spy__: {send},
    bind: QIO.encase(bind),
    close: QIO.lift(close),
    send: QIO.encase(send)
  }
}

const mockEnv = () => {
  const mSocket = masterSocket()

  return {
    __spy__: {masterSocket: mSocket.__spy__},
    cluster: {
      fork,
      masterSocket: QIO.encase((): MasterSocket => mSocket)
    },
    logger: testLogger(),
    worker: {
      id: QIO.resolve(100)
    }
  }
}

describe('masterProgram', () => {
  it('should start the program', () => {
    const env = mockEnv()

    testRuntime().unsafeExecuteSync(masterProgram([], 1).provide(env))

    assert.deepStrictEqual(env.logger.stdout, [
      'HPrettierMasterProgram_100 program: START',
      'HPrettierMasterProgram_100 concurrency: 1',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 worker pool: 1 OK',
      'HPrettierMasterProgram_100 socket: ACQUIRED',
      'HPrettierMasterProgram_100 file count: 0',
      'HPrettierMasterProgram_100 sent count: 0',
      'HPrettierMasterProgram_100 socket: RELEASED'
    ])
  })

  it('should create 4 workers', () => {
    const env = mockEnv()

    testRuntime().unsafeExecuteSync(masterProgram([], 4).provide(env))

    assert.deepStrictEqual(env.logger.stdout, [
      'HPrettierMasterProgram_100 program: START',
      'HPrettierMasterProgram_100 concurrency: 4',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 worker pool: 4 OK',
      'HPrettierMasterProgram_100 socket: ACQUIRED',
      'HPrettierMasterProgram_100 file count: 0',
      'HPrettierMasterProgram_100 sent count: 0',
      'HPrettierMasterProgram_100 socket: RELEASED'
    ])
  })

  it('should send N files', () => {
    const env = mockEnv()

    testRuntime().unsafeExecuteSync(
      masterProgram(['A', 'B', 'C'], 1).provide(env)
    )

    assert.deepStrictEqual(env.logger.stdout, [
      'HPrettierMasterProgram_100 program: START',
      'HPrettierMasterProgram_100 concurrency: 1',
      'HPrettierMasterProgram_100 process: FORK',
      'HPrettierMasterProgram_100 worker pool: 1 OK',
      'HPrettierMasterProgram_100 socket: ACQUIRED',
      'HPrettierMasterProgram_100 file count: 3',
      'HPrettierMasterProgram_100 sent: A,B,C',
      'HPrettierMasterProgram_100 sent count: 3',
      'HPrettierMasterProgram_100 socket: RELEASED'
    ])
  })

  it('should distribute files equally', () => {
    const env = mockEnv()
    const files = Array.from({length: 10}).map((_, i) => `./FILE_${i}`)

    testRuntime().unsafeExecuteSync(masterProgram(files, 5).provide(env))

    env.__spy__.masterSocket.send.should.have.been.first.called.with.exactly(
      ['./FILE_0', './FILE_1'].join('\n')
    )
  })
})

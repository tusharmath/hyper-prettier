import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'

import {workerProgram} from '../src/WorkerProgram'

import {testLogger} from './internal/TestLogger'

const workerSocket = (msg: string[]) => {
  const m = msg.slice(0)
  const send = spy()

  return {
    __spy__: {send},
    close: QIO.void(),
    connect: () => QIO.void(),
    get receive(): QIO<Buffer[], Error> {
      return QIO.flatten(
        QIO.lift(() => {
          const el = m.shift()

          return el !== undefined ? QIO.resolve([Buffer.from(el)]) : QIO.never()
        })
      )
    },
    send: QIO.encase(send)
  }
}
const mockEnv = (_ = {receive: ['A', 'B', 'C']}) => {
  const worker = workerSocket(_.receive)

  return {
    __spy__: {
      worker: worker.__spy__
    },
    cluster: {
      workerSocket: QIO.encase(() => worker)
    },
    formatter: {
      format: QIO.void
    },
    logger: testLogger(),
    worker: {id: QIO.resolve(0)}
  }
}
describe('workerProgram', () => {
  it('should start the program', () => {
    const L = testLogger()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({...mockEnv(), logger: L})
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettierWorkerProgram_000 program: START',
      'HPrettierWorkerProgram_000 socket: ACQUIRED',
      'HPrettierWorkerProgram_000 recv: A',
      'HPrettierWorkerProgram_000 format: A OK',
      'HPrettierWorkerProgram_000 recv: B',
      'HPrettierWorkerProgram_000 format: B OK',
      'HPrettierWorkerProgram_000 recv: C',
      'HPrettierWorkerProgram_000 format: C OK'
    ])
  })

  it('should open socket', () => {
    const L = testLogger()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({...mockEnv(), logger: L})
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettierWorkerProgram_000 program: START',
      'HPrettierWorkerProgram_000 socket: ACQUIRED',
      'HPrettierWorkerProgram_000 recv: A',
      'HPrettierWorkerProgram_000 format: A OK',
      'HPrettierWorkerProgram_000 recv: B',
      'HPrettierWorkerProgram_000 format: B OK',
      'HPrettierWorkerProgram_000 recv: C',
      'HPrettierWorkerProgram_000 format: C OK'
    ])
  })

  it('should format the files', () => {
    const format = spy()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({
        ...mockEnv(),
        formatter: {format: QIO.encase(format)}
      })
    )

    format.should.have.been.first.called.with('A')
  })

  it('should send update count back to master', () => {
    const env = mockEnv()
    testRuntime().unsafeExecuteSync(workerProgram().provide({...env}))

    env.__spy__.worker.send.should.have.been.first.called.with.exactly('1')
  })
})

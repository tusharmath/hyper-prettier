import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'

import {WorkerSocket} from '../src/QWorkerSocket'
import {workerProgram} from '../src/WorkerProgram'

import {testLogger} from './internal/TestLogger'

const workerSocket = QIO.encase(
  (msg: string[]): WorkerSocket => {
    const m = msg.slice(0)

    return {
      close: QIO.void(),
      connect: address => QIO.void(),
      get receive(): QIO<Buffer[], Error> {
        return QIO.flatten(
          QIO.lift(() => {
            const el = m.shift()

            return el !== undefined
              ? QIO.resolve([Buffer.from(el)])
              : QIO.never()
          })
        )
      },
      send: QIO.void
    }
  }
)
const env = {
  cluster: {
    workerSocket: () => workerSocket(['A', 'B', 'C'])
  },
  formatter: {
    format: QIO.void
  },
  logger: testLogger(),
  worker: {id: QIO.resolve(0)}
}
describe('workerProgram', () => {
  it('should start the program', () => {
    const L = testLogger()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({...env, logger: L})
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
      workerProgram().provide({...env, logger: L})
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
      workerProgram().provide({...env, formatter: {format: QIO.encase(format)}})
    )

    format.should.have.been.first.called.with('A')
  })
})

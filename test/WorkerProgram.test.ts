import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'

import {WorkerSocket} from '../src/QWorkerSocket'
import {workerProgram} from '../src/WorkerProgram'

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
      }
    }
  }
)
const logger = (regex: RegExp = /.*/) => {
  const log = new Array<string>()

  return {
    get stdout() {
      return log.filter(_ => _.match(regex))
    },
    log: (scope: string) => (...t: unknown[]) => {
      log.push([scope, ...t].join(' '))
    }
  }
}
describe('workerProgram', () => {
  it('should start the program', () => {
    const L = logger()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({
        cluster: {
          workerSocket: () => workerSocket(['A', 'B', 'C'])
        },
        formatter: {
          format: QIO.void
        },
        logger: L
      })
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettier . program:             START',
      'HPrettier . socket:              ACQUIRED',
      'HPrettier . data:                A',
      'HPrettier . data:                B',
      'HPrettier . data:                C'
    ])
  })

  it('should open socket', () => {
    const L = logger()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({
        cluster: {
          workerSocket: () => workerSocket(['A', 'B', 'C'])
        },
        formatter: {
          format: QIO.void
        },
        logger: L
      })
    )

    assert.deepStrictEqual(L.stdout, [
      'HPrettier . program:             START',
      'HPrettier . socket:              ACQUIRED',
      'HPrettier . data:                A',
      'HPrettier . data:                B',
      'HPrettier . data:                C'
    ])
  })

  it('should format the files', () => {
    const format = spy()
    testRuntime().unsafeExecuteSync(
      workerProgram().provide({
        cluster: {
          workerSocket: () => workerSocket(['A', 'B', 'C'])
        },
        formatter: {
          format: QIO.encase(format)
        },
        logger: {log: () => QIO.void}
      })
    )

    format.should.be.called.with('A')
  })
})

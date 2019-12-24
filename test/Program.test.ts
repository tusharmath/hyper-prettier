import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'

import {masterProgram} from '../src/MasterProgram'
import {MasterSocket} from '../src/QMasterSocket'
import {QWorker} from '../src/QWorker'
import {WorkerSocket} from '../src/QWorkerSocket'
import {workerProgram} from '../src/WorkerProgram'

const fork = (): QWorker => ({kill: () => {}})
const masterSocket = QIO.encase(
  (): MasterSocket => ({
    bind: address => QIO.void(),
    close: QIO.void(),
    send: message => QIO.void()
  })
)
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

const logger = () => {
  const log = new Array<string>()

  return {
    get stdout() {
      return log
    },
    log: (scope: string) => (...t: unknown[]) => {
      log.push([scope, ...t].join(' '))
    }
  }
}

describe('HPrettier', () => {
  describe('onMaster', () => {
    it('should start the program', () => {
      const L = logger()
      testRuntime().unsafeExecuteSync(
        masterProgram([], 1).provide({
          cluster: {
            fork,
            masterSocket
          },
          logger: L
        })
      )

      assert.deepStrictEqual(L.stdout, [
        'HPrettier * program:             START',
        'HPrettier * concurrency:         1',
        'HPrettier * process:             FORK',
        'HPrettier * worker pool:         1 OK',
        'HPrettier * socket:              ACQUIRED',
        'HPrettier * file count:          0',
        'HPrettier * file sent:           0',
        'HPrettier * socket:              RELEASED'
      ])
    })

    it('should create 4 workers', () => {
      const L = logger()
      testRuntime().unsafeExecuteSync(
        masterProgram([], 4).provide({
          cluster: {
            fork,
            masterSocket
          },
          logger: L
        })
      )

      assert.deepStrictEqual(L.stdout, [
        'HPrettier * program:             START',
        'HPrettier * concurrency:         4',
        'HPrettier * process:             FORK',
        'HPrettier * process:             FORK',
        'HPrettier * process:             FORK',
        'HPrettier * process:             FORK',
        'HPrettier * worker pool:         4 OK',
        'HPrettier * socket:              ACQUIRED',
        'HPrettier * file count:          0',
        'HPrettier * file sent:           0',
        'HPrettier * socket:              RELEASED'
      ])
    })

    it('should send 2 files', () => {
      const L = logger()
      testRuntime().unsafeExecuteSync(
        masterProgram(['A', 'B', 'C'], 1).provide({
          cluster: {
            fork,
            masterSocket
          },
          logger: L
        })
      )

      assert.deepStrictEqual(L.stdout, [
        'HPrettier * program:             START',
        'HPrettier * concurrency:         1',
        'HPrettier * process:             FORK',
        'HPrettier * worker pool:         1 OK',
        'HPrettier * socket:              ACQUIRED',
        'HPrettier * file count:          3',
        'HPrettier * send:                A',
        'HPrettier * send:                B',
        'HPrettier * send:                C',
        'HPrettier * file sent:           3',
        'HPrettier * socket:              RELEASED'
      ])
    })
  })

  describe('onWorker', () => {
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
})

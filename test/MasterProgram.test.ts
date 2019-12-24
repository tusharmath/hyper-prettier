import {QIO, testRuntime} from '@qio/core'
import {assert} from 'chai'

import {masterProgram} from '../src/MasterProgram'
import {MasterSocket} from '../src/QMasterSocket'
import {QWorker} from '../src/QWorker'

const fork = (): QWorker => ({kill: () => {}})
const masterSocket = QIO.encase(
  (): MasterSocket => ({
    bind: address => QIO.void(),
    close: QIO.void(),
    send: message => QIO.void()
  })
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
describe('masterProgram', () => {
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

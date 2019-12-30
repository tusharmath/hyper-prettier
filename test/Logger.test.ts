import {QIO, testRuntime} from '@qio/core'
import {assert} from 'chai'

import {logger} from '../src/Logger'

import {testLogger} from './internal/TestLogger'

describe('logger', () => {
  it('should log', () => {
    const mLogger = testLogger()
    const program = logger('User')('click', 'OK')
    testRuntime().unsafeExecuteSync(
      program.provide({worker: {id: QIO.resolve(0)}, logger: mLogger})
    )

    assert.deepStrictEqual(mLogger.stdout, ['HPrettierUser_000 click: OK'])
  })
})

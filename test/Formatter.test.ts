import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'
import * as prettier from 'prettier'
import {testScheduler} from 'ts-scheduler'

import {format} from '../src/Formatter'

import {testLogger} from './internal/TestLogger'

const mockFS = (content: string) => {
  const writeFile = spy(() => {})
  const readFile = spy(() => Buffer.from(content))
  const open = spy(() => 10)
  const close = spy()

  return {
    __spy__: {writeFile, readFile, open, close},
    close: QIO.encase(close),
    open: QIO.encase(open),
    readFile: QIO.encase(readFile),
    writeFile: QIO.encase(writeFile)
  }
}

const worker = {id: QIO.resolve(1)}

describe('format', () => {
  const TEST_FILE_CONTENT = 'const A =    1000'

  it('should prettify files', () => {
    const fs = mockFS(TEST_FILE_CONTENT)
    testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
      format('./xyz.ts').provide({fs, logger: testLogger(), worker})
    )

    fs.__spy__.writeFile.should.have.been.called.with(
      10,
      Buffer.from(
        prettier.format(TEST_FILE_CONTENT, {
          filepath: './xyz.ts'
        })
      )
    )
  })

  it('should log input files', () => {
    const logger = testLogger()
    testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
      format('./xyz.ts').provide({
        fs: mockFS(TEST_FILE_CONTENT),
        logger,
        worker
      })
    )

    assert.deepStrictEqual(logger.stdout, [
      'HPrettierFormatter_001 path: ./xyz.ts',
      'HPrettierFormatter_001 fs.open: 10 ./xyz.ts',
      'HPrettierFormatter_001 fs.readFile: 10 ./xyz.ts',
      'HPrettierFormatter_001 fs.close: 10 ./xyz.ts',
      'HPrettierFormatter_001 format: ./xyz.ts OK'
    ])
  })
})

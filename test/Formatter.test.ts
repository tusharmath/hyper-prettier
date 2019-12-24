import {QIO, testRuntime} from '@qio/core'
import {spy} from 'chai'
import * as prettier from 'prettier'
import {testScheduler} from 'ts-scheduler'

import {format} from '../src/Formatter'

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

describe('format', () => {
  const TEST_FILE_CONTENT = 'const A =    1000'

  it('should prettify files', () => {
    const fs = mockFS(TEST_FILE_CONTENT)
    testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
      format('./xyz', {parser: 'typescript'}).provide({fs})
    )

    fs.__spy__.writeFile.should.have.been.called.with(
      10,
      Buffer.from(prettier.format(TEST_FILE_CONTENT, {parser: 'typescript'}))
    )
  })
})

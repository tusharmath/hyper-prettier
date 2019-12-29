import {QIO, testRuntime} from '@qio/core'
import {assert, spy} from 'chai'
import * as prettier from 'prettier'
import {testScheduler} from 'ts-scheduler'

import {format} from '../src/Formatter'

import {testLogger} from './internal/TestLogger'

const TEST_FILE_CONTENT = 'const A =    1000'
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
const mockEnv = (_: {content: string} = {content: TEST_FILE_CONTENT}) => ({
  fs: mockFS(_.content),
  logger: testLogger(),
  worker: {id: QIO.resolve(1)}
})

describe('format', () => {
  it('should prettify files', () => {
    const env = mockEnv()
    testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
      format('./xyz.ts').provide(env)
    )

    env.fs.__spy__.writeFile.should.have.been.first.called.with(
      10,
      prettier.format(TEST_FILE_CONTENT, {
        filepath: './xyz.ts'
      })
    )
  })

  it('should open file with r+', () => {
    const env = mockEnv()
    testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
      format('./xyz.ts').provide(env)
    )
    env.fs.__spy__.open.should.have.been.first.called.with('./xyz.ts', 'r+')
  })

  it('should log input files', () => {
    const env = mockEnv()
    testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
      format('./xyz.ts').provide(env)
    )

    assert.deepStrictEqual(env.logger.stdout, [
      'HPrettierFormatter_001 path: ./xyz.ts',
      'HPrettierFormatter_001 fs.open: 10 ./xyz.ts',
      'HPrettierFormatter_001 fs.readFile: 10 ./xyz.ts',
      'HPrettierFormatter_001 format: ./xyz.ts OK',
      'HPrettierFormatter_001 fs.close: 10 ./xyz.ts'
    ])
  })

  context('already formatted', () => {
    it('should not write', () => {
      const env = mockEnv({
        content: prettier.format('const A = () => 10', {parser: 'typescript'})
      })
      testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
        format('./xyz.ts').provide(env)
      )
      env.fs.__spy__.writeFile.should.not.be.called()
    })

    it('should log input files', () => {
      const env = mockEnv({
        content: prettier.format('const A = () => 10', {parser: 'typescript'})
      })
      testRuntime(testScheduler({bailout: 200})).unsafeExecuteSync(
        format('./xyz.ts').provide(env)
      )

      assert.deepStrictEqual(env.logger.stdout, [
        'HPrettierFormatter_001 path: ./xyz.ts',
        'HPrettierFormatter_001 fs.open: 10 ./xyz.ts',
        'HPrettierFormatter_001 fs.readFile: 10 ./xyz.ts',
        'HPrettierFormatter_001 format: ./xyz.ts SKIP',
        'HPrettierFormatter_001 fs.close: 10 ./xyz.ts'
      ])
    })
  })
})

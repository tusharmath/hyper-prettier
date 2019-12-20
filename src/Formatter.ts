import {QIO} from '@qio/core'
import * as prettier from 'prettier'

import {EnvFSClose, EnvFSOpen, EnvFSReadFile, EnvFSWriteFile} from './Env'

const open = (path: string, mode: string) =>
  QIO.accessM((_: EnvFSOpen) => _.fs.open(path, mode))
const close = (fd: number) => QIO.accessM((_: EnvFSClose) => _.fs.close(fd))
const writeFile = (fd: number, content: Buffer) =>
  QIO.accessM((_: EnvFSWriteFile) => _.fs.writeFile(fd, content))
const readFile = (fd: number) =>
  QIO.accessM((_: EnvFSReadFile) => _.fs.readFile(fd))

/**
 * Reads the file at the provided path and tries to format it
 */
export const format = (path: string, options?: prettier.Options) =>
  open(path, 'w').bracket(close)(fd =>
    readFile(fd)
      .map(buffer => prettier.format(buffer.toString(), options))
      .chain(content => writeFile(fd, Buffer.from(content)))
  )

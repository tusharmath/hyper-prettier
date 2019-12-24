import {FS} from '@qio/fs'
import * as prettier from 'prettier'

/**
 * Reads the file at the provided path and tries to format it
 */
export const format = (path: string, options?: prettier.Options) =>
  FS.open(path, 'w').bracket(FS.close)(fd =>
    FS.readFile(fd)
      .map(buffer => prettier.format(buffer.toString(), options))
      .chain(content => FS.writeFile(fd, Buffer.from(content)))
  )

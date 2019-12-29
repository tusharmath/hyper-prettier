import {defaultRuntime} from '@qio/core'

import {runner} from './ProgramProduction'

defaultRuntime().unsafeExecute(
  runner,
  // tslint:disable-next-line: no-unbound-method no-console
  console.log
)

import { registerNewsHandlers } from './news-handlers'
import { registerPublishHandlers } from './publish-handlers'
import { registerAgentHandlers } from './agent-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerTerminalHandlers } from './terminal-handlers'

export function registerAllHandlers(): void {
  registerNewsHandlers()
  registerPublishHandlers()
  registerAgentHandlers()
  registerSettingsHandlers()
  registerTerminalHandlers()
}

import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { ScrollShadow, Tab, Tabs } from '@nextui-org/react'
import _ from 'lodash'

import AppGeneralPanel from '~/features/settings/panels/general/AppGeneralPanel'
import NewConnectionPanel from '~/features/settings/panels/general/NewConnectionPanel'

import { connectionModelStore } from '~/features/connections/ConnectionModelStore'
import ConnectionPanel from '~/features/settings/panels/general/ConnectionPanel'

const GeneralModelPanel = observer(() => {
  const { selectedConnectionModelId, connections } = connectionModelStore

  const [selectedTabId, setSelectedTabId] = useState<string>(selectedConnectionModelId ?? 'App')

  useEffect(() => {
    setSelectedTabId(selectedConnectionModelId ?? 'App')
  }, [selectedConnectionModelId])

  const selectedPanel = useMemo(() => {
    if (selectedTabId === 'App') {
      return <AppGeneralPanel />
    } else if (selectedTabId === 'new_connection') {
      return <NewConnectionPanel />
    }

    const connection = connectionModelStore.getConnectionById(selectedTabId)

    if (connection) {
      return <ConnectionPanel connection={connection} />
    }

    setSelectedTabId('App')

    return null
  }, [selectedTabId, connections])

  return (
    <div className="flex w-full flex-col">
      <ScrollShadow orientation="horizontal" className="border-b border-divider">
        <Tabs
          aria-label="Options"
          variant="underlined"
          selectedKey={selectedTabId}
          onSelectionChange={key => setSelectedTabId(_.toString(key))}
          classNames={{
            tab: 'overflow-hidden flex-shrink-0 w-fit',
            tabList:
              'gap-3 w-full flex max-w-full relative rounded-none p-0 overflow-x-scroll flex-shrink-0',
            cursor: 'group-data-[selected=true]:bg-primary w-full bg-base-content',
            tabContent:
              'group-data-[selected=true]:text-primary group-data-[selected=true]:border-b-primary flex-shrink-0 group-[.is-active-parent]:text-primary/60',
          }}
        >
          <Tab
            key="App"
            title="App"
            className={selectedConnectionModelId === 'App' ? 'is-active-parent' : ''}
          />

          {_.map(connections, connection => (
            <Tab
              key={connection.id}
              title={connection.label}
              className={connection.id === selectedConnectionModelId ? 'is-active-parent' : ''}
            />
          ))}

          <Tab
            key="new_connection"
            title="New Connection +"
            className={selectedConnectionModelId === 'new_connection' ? 'is-active-parent' : ''}
          />
        </Tabs>
      </ScrollShadow>

      {selectedPanel && (
        <div className="flex-1 overflow-y-hidden pt-2">
          <ScrollShadow className="flex h-full max-h-full w-full place-content-center">
            {selectedPanel}
          </ScrollShadow>
        </div>
      )}
    </div>
  )
})

export default GeneralModelPanel

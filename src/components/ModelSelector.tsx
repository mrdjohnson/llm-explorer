import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import _ from 'lodash'
import { useNavigate } from 'react-router-dom'
import { Input } from '@nextui-org/react'
import useMedia from 'use-media'

import ChevronDown from '~/icons/ChevronDown'
import { connectionStore } from '~/core/connection/ConnectionStore'

const ModelSelector = observer(() => {
  const navigate = useNavigate()

  const isMobile = useMedia('(max-width: 768px)')

  const { selectedModelLabel, isAnyServerConnected, selectedConnection } = connectionStore
  const noServer = !isAnyServerConnected

  const label = useMemo(() => {
    if (noServer) {
      return 'No Servers connected'
    }

    if (selectedModelLabel && selectedConnection) {
      return isMobile ? undefined : selectedConnection.label
    }

    if (!selectedConnection) return 'Add a Server here'

    if (_.isEmpty(selectedConnection.models)) {
      return `No ${selectedConnection.label} models available`
    }

    return `No ${selectedConnection.label} models selected`
  }, [noServer, selectedConnection?.models, selectedModelLabel, isMobile])

  const handleClick = () => {
    if (!selectedConnection) {
      navigate('/models')
    } else {
      navigate('/models/' + selectedConnection.id)
    }
  }

  return (
    <Input
      isReadOnly
      label={label}
      variant="bordered"
      value={selectedModelLabel}
      className="w-full !cursor-pointer"
      classNames={{
        inputWrapper:
          'btn !cursor-pointer border-base-content/20 rounded-md hover:!border-base-content/30 p-2 pr-1',
        input: '!cursor-pointer',
        label: '!cursor-pointer mr-2',
        innerWrapper: '!cursor-pointer',
      }}
      endContent={
        <ChevronDown className="-rotate-90 place-self-center !stroke-[3px]  text-base-content/45" />
      }
      onClick={handleClick}
    />
  )
})

export default ModelSelector

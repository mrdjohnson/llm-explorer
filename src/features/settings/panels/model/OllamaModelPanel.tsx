import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import _ from 'lodash'
import { useNavigate, useParams } from 'react-router-dom'

import { settingStore } from '~/core/setting/SettingStore'
import { OllamaLanguageModel } from '~/core/connection/types'

import { CorrectShowResponse } from '~/features/ollama/OllamaStore'

import { NavButtonDiv } from '~/components/NavButton'
import SelectionPanelTable from '~/components/SelectionTablePanel'
import CopyButton from '~/components/CopyButton'
import NotConnectedPanelSection from '~/features/settings/panels/model/NotConnectedPanelSection'

import Globe from '~/icons/Globe'
import DownloadTray from '~/icons/DownloadTray'
import Delete from '~/icons/Delete'
import Edit from '~/icons/Edit'

import OllamaConnectionViewModel from '~/core/connection/viewModels/OllamaConnectionViewModel'
import { connectionStore } from '~/core/connection/ConnectionStore'
import { useCrumb } from '~/containers/Drawer'

type PanelTableProps = {
  connection: OllamaConnectionViewModel
}

const OllamaModelPanelTable = observer(({ connection }: PanelTableProps) => {
  const navigate = useNavigate()

  const selectedModelId = settingStore.setting?.selectedModelId
  const ollamaStore = connection.store

  const [filterText, setFilterText] = useState('')

  const pullModel = () => {
    ollamaStore.pull(filterText)

    navigate('/')
  }

  const updateAllModels = () => {
    ollamaStore.updateAll()

    navigate('/')
  }

  if (!connection.isConnected) {
    return <NotConnectedPanelSection connection={connection} />
  }

  const renderRow = (model: OllamaLanguageModel) => (
    <>
      <td>
        <span className="block max-w-52 overflow-hidden font-semibold xl:max-w-80">
          {model.name}
        </span>
      </td>

      <td>{model.details.parameter_size}</td>

      <td>
        <input
          type="checkbox"
          defaultChecked={model.supportsImages}
          className="checkbox checkbox-xs tooltip tooltip-bottom"
          data-tip="Supports Images?"
          onClick={e => e.preventDefault()}
        />
      </td>

      <td>{model.gbSize}</td>
      <td className="hidden opacity-65 md:flex">{model.timeAgo}</td>

      <td className="w-fit">
        <NavButtonDiv
          to={'ollama/' + model.modelName}
          className="align-center flex opacity-30 transition-opacity duration-200 ease-in-out hover:opacity-100"
        >
          <Edit />
        </NavButtonDiv>
      </td>
    </>
  )

  return (
    <SelectionPanelTable
      items={connection.models}
      sortTypes={connection.modelTableHeaders}
      primarySortTypeLabel="name"
      itemFilter={connection.modelFilter}
      renderRow={renderRow}
      getItemKey={model => model.id}
      onItemSelected={model => connection.selectModel(model)}
      onFilterChanged={setFilterText}
      getIsItemSelected={model => selectedModelId === model.id}
      filterInputPlaceholder="Filter by name or pull..."
      includeEmptyHeader
    >
      <div className="mx-auto mt-auto flex flex-row content-center gap-2">
        <a
          href="https://ollama.com/library"
          className="btn btn-outline btn-neutral btn-sm flex w-fit flex-row gap-2 px-4"
          target="__blank"
          title="Open Ollama Library in new tab"
        >
          <span className="whitespace-nowrap text-sm">Ollama Library</span>
          <Globe />
        </a>

        {filterText ? (
          <button
            className="btn btn-neutral btn-sm flex w-fit flex-row gap-2 px-4"
            onClick={pullModel}
          >
            <span className="whitespace-nowrap text-sm">
              Pull model: {filterText.includes(':') ? filterText : `${filterText}:latest`}
            </span>
            <DownloadTray />
          </button>
        ) : (
          <button
            className="btn btn-neutral btn-sm flex w-fit flex-row gap-2 px-4"
            onClick={updateAllModels}
          >
            <span className="whitespace-nowrap text-sm">Update all models</span>
            <DownloadTray />
          </button>
        )}
      </div>
    </SelectionPanelTable>
  )
})

export const OllamaModelSettings = observer(() => {
  const { modelName, id } = useParams()
  const navigate = useNavigate()

  const viewModel = connectionStore.getConnectionById(id)!

  useCrumb({ label: modelName!, path: 'ollama/' + modelName! })

  if (viewModel.type !== 'Ollama') {
    throw new Error('Ollama connection not found')
  }

  const ollamaStore = viewModel.store
  const model = _.find<OllamaLanguageModel>(viewModel.models, { modelName })!

  const selectedModelName = model.modelName

  const [modelData, setModelData] = useState<CorrectShowResponse | undefined>()

  useEffect(() => {
    if (!selectedModelName) return

    ollamaStore.show(selectedModelName).then(setModelData)
  }, [selectedModelName])

  if (!selectedModelName || !modelData || !model) return

  const details = modelData.details || {}

  const updateModel = () => {
    navigate('/')

    ollamaStore.pull(selectedModelName)
  }

  return (
    <div className="flex h-full w-full flex-col p-2">
      <label className="text-lg font-semibold text-base-content">
        {_.capitalize(selectedModelName)}

        {details && (
          <label className="text-md ml-2 text-base-content/70">
            {[modelData.details.parameter_size, modelData.details.quantization_level].join(' ')}
          </label>
        )}
      </label>

      <div className="mt-2 flex flex-col gap-1">
        <p>
          Size on disk:
          <span className="ml-2 scale-90 text-base-content/70">{model.fullGbSize}</span>
        </p>

        <p>
          Last Update:
          <span className="ml-2 scale-90 text-base-content/70">{model.timeAgo}</span>
        </p>
      </div>

      <div className="my-4">
        <div className="flex justify-between">
          <label>ModelFile:</label>

          <CopyButton
            className="text-base-content/30 hover:text-base-content"
            text={modelData.modelfile}
          />
        </div>

        <div className="flex max-h-52 w-full overflow-scroll whitespace-pre-line rounded-md border border-base-content/30 p-2 text-base-content/70">
          {modelData.modelfile.replace(/\n/g, '  \n')}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {Object.entries(modelData.details).map(
          ([key, value]) =>
            value && (
              <p key={key}>
                {key}:
                <span className="ml-2 scale-90 text-base-content/70">{JSON.stringify(value)}</span>
              </p>
            ),
        )}
      </div>

      <div className="mt-auto flex justify-between">
        <button onClick={updateModel} className="btn btn-neutral btn-sm">
          Update {selectedModelName}
          <DownloadTray />
        </button>

        <button
          onClick={() => ollamaStore.delete(selectedModelName)}
          className="btn btn-ghost btn-sm self-end text-error"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
})

const OllamaModelPanel = observer(({ connection }: { connection: OllamaConnectionViewModel }) => {
  return (
    <div className="relative flex h-full w-full flex-col">
      <OllamaModelPanelTable connection={connection} />
    </div>
  )
})

export default OllamaModelPanel

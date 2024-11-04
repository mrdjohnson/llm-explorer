import { useEffect, useRef, useState } from 'react'
import _ from 'lodash'
import { observer } from 'mobx-react-lite'
import { Controller, useForm } from 'react-hook-form'

import Check from '~/icons/Check'
import Delete from '~/icons/Delete'
import DocumentArrowDown from '~/icons/DocumentArrowDown'
import Back from '~/icons/Back'

import Tooltip from '~/components/Tooltip'
import FormInput from '~/components/form/FormInput'

import { chatStore } from '~/core/chat/ChatStore'
import { chatTable } from '~/core/chat/ChatTable'

import { CURRENT_DB_TIMESTAMP_MILLISECONDS } from '~/core/setting/SettingModel'

export const ChatSettingsSection = observer(({ onBackClicked }: { onBackClicked: () => void }) => {
  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty, errors },
  } = useForm<{ name: string }>()

  const [isExportOpen, setIsExportOpen] = useState(false)

  const modalRef = useRef<HTMLDialogElement>(null)

  const chat = chatStore.selectedChat!

  const chatModel = chat.source

  const onExportClose = () => {
    setIsExportOpen(false)
  }

  const openExportDialog = () => {
    setIsExportOpen(true)
  }

  const handleFormSubmit = handleSubmit(async formData => {
    await chatTable.put({ ...chatModel, ...formData })

    reset(formData)
  })

  const exportChat = async (includeImages: boolean) => {
    const dataToExport: Record<string, unknown> = {
      _chat: await chatTable.export(chat.source, { includeImages }),
      databaseTimestamp: CURRENT_DB_TIMESTAMP_MILLISECONDS,
    }

    const data = JSON.stringify(dataToExport, null, 2)

    onExportClose()

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    link.download = `llm-x-chat-${_.snakeCase(chatModel.name).replace('_', '-')}.json`
    link.click()
  }

  useEffect(() => {
    reset({ name: chatModel.name || 'new chat' })
  }, [chat])

  useEffect(() => {
    if (isExportOpen) {
      modalRef.current?.showModal()
    } else {
      modalRef.current?.close()
    }
  }, [isExportOpen])

  const validateName = (name: string) => {
    if (name.length < 2 || name.length > 30) return 'Name length must be 2-30 chars'

    return true
  }

  if (!chat) return null

  return (
    <>
      <div className="flex min-h-[48px] flex-1 flex-col overflow-y-hidden">
        <div className="flex flex-row gap-2">
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onBackClicked}>
            <Back />
          </button>

          <span className="flex-shrink-1 line-clamp-1 max-w-[85%] flex-1 text-left md:text-lg">
            {chatModel.name || 'new chat'}
          </span>
        </div>

        <div className=" mt-2 flex flex-1 flex-col text-base-content">
          <div className="no-scrollbar flex h-full flex-1 flex-col overflow-y-scroll rounded-md">
            <div className="flex flex-col gap-2 rounded-box bg-base-300 text-base-content">
              <form className="flex w-full flex-row gap-2" onSubmit={handleFormSubmit}>
                <Controller
                  render={({ field }) => (
                    <FormInput
                      id={chat.id + ''}
                      label="Name"
                      errorMessage={errors.name?.message}
                      endContent={
                        isDirty && (
                          <button
                            className="btn btn-ghost btn-sm px-2"
                            disabled={!!errors.name?.message}
                            onClick={handleFormSubmit}
                          >
                            <Check />
                          </button>
                        )
                      }
                      {...field}
                    />
                  )}
                  control={control}
                  name="name"
                  defaultValue={chatModel.name || 'new chat'}
                  rules={{
                    validate: validateName,
                  }}
                />
              </form>
            </div>
          </div>

          <div className="flex flex-row gap-2">
            <Tooltip label="Export Chat">
              <button
                onClick={openExportDialog}
                className="btn btn-ghost flex flex-1"
                title="Export Chat"
              >
                <DocumentArrowDown />
              </button>
            </Tooltip>

            <Tooltip label="Delete Chat">
              <button
                onClick={() => chatStore.destroyChat(chatModel)}
                className="btn btn-ghost text-error"
              >
                <Delete className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <dialog className="modal modal-middle" ref={modalRef} onClose={onExportClose}>
        <div className="modal-box">
          <h3 className="mb-4 text-center text-lg font-bold">Export type:</h3>

          <div className="flex flex-row justify-between px-6">
            <div className="flex flex-col justify-center">
              <button className="btn btn-neutral" onClick={() => exportChat(true)}>
                With images
              </button>

              <span className="label-text text-center">(larger file size)</span>
            </div>

            <div className="flex flex-col justify-center">
              <button className="btn btn-neutral" onClick={() => exportChat(false)}>
                Without images
              </button>

              <span className="label-text text-center">(smaller file size)</span>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">✕</button>
            </form>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
})

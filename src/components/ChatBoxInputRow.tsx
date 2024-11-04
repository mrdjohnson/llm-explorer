import { useRef, PropsWithChildren, useEffect, useState, KeyboardEvent } from 'react'
import _ from 'lodash'
import { observer } from 'mobx-react-lite'
import TextareaAutosize from 'react-textarea-autosize'

import { ChatViewModel } from '~/core/chat/ChatViewModel'
import { settingStore } from '~/core/setting/SettingStore'
import { personaStore } from '~/core/persona/PersonaStore'
import { connectionStore } from '~/core/connection/ConnectionStore'
import { incomingMessageStore } from '~/core/IncomingMessageStore'

import AttachmentWrapper from '~/components/AttachmentWrapper'
import CachedImage from '~/components/CachedImage'

import { TransferHandler } from '~/utils/transfer/TransferHandler'

import Paperclip from '~/icons/Paperclip'
import ChevronDown from '~/icons/ChevronDown'

import { lightboxStore } from '~/features/lightbox/LightboxStore'

type ChatBoxInputRowProps = PropsWithChildren<{
  chat: ChatViewModel
  onSend: (message: string, imageUrls?: string[]) => void
}>

const ChatBoxInputRow = observer(({ chat, onSend, children }: ChatBoxInputRowProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [messageContent, setMessageContent] = useState('')

  const { messageToEdit, previewImageHandler } = chat

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    sendMessage()
  }

  const sendMessage = async () => {
    if (!textareaRef.current) return

    const messageToSend = textareaRef.current.value || ''

    await onSend(messageToSend)

    setMessageContent('')
    textareaRef.current.focus()
  }

  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey || !textareaRef.current) return

    if (e.key === 'Enter' && messageContent) {
      await sendMessage()

      textareaRef.current.blur()

      e.preventDefault()
    }

    const { selectionStart, selectionEnd } = textareaRef.current

    // we either want the start, or the end to be the same
    if (selectionStart !== selectionEnd) return

    if (e.key === 'ArrowUp' && selectionStart === 0) {
      await chat.findAndEditPreviousMessage()
    }

    if (e.key === 'ArrowDown' && selectionStart === messageContent.length) {
      await chat.findAndEditNextMessage()
    }

    if (e.key === 'Escape') {
      await chat.setMessageToEdit(undefined)

      e.preventDefault()
    }
  }

  const noModelSelected = !connectionStore.selectedModelName
  const inputDisabled =
    incomingMessageStore.isGettingData || noModelSelected || !!lightboxStore.lightboxMessage

  useEffect(() => {
    if (!textareaRef.current) return

    setMessageContent(messageToEdit?.selectedVariation?.content || '')
  }, [messageToEdit])

  useEffect(() => {
    if (inputDisabled) {
      textareaRef.current?.blur()
    } else {
      textareaRef.current?.focus()
    }
  }, [inputDisabled, chat, messageToEdit])

  return (
    <div
      className={
        'no-scrollbar join join-vertical relative mt-2 h-fit max-h-[700px] w-full shrink-0 rounded-md border border-base-content/20 ' +
        (noModelSelected && 'tooltip cursor-not-allowed')
      }
      data-tip={
        connectionStore.isAnyServerConnected ? 'No Models Selected' : 'Server is not connected'
      }
    >
      <div
        className={
          'join-item max-h-[600px] overflow-y-scroll p-2 pb-0' +
          (inputDisabled ? ' bg-base-200' : '')
        }
      >
        {previewImageHandler.previewImages[0] && (
          <div className="relative">
            <div className="flex max-h-[200px] flex-row flex-wrap gap-2 overflow-hidden overflow-y-scroll pb-0">
              {previewImageHandler.list.map(previewImage => (
                <div
                  className="group relative h-24 place-content-center overflow-hidden rounded-sm border border-base-content/30 bg-base-content/30"
                  key={previewImage.url}
                >
                  <button
                    className="btn btn-circle btn-neutral btn-xs absolute right-0 top-0 z-20 scale-75 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                    onClick={() => previewImageHandler.removePreviewImage(previewImage)}
                    role="button"
                  >
                    ✕
                  </button>

                  <CachedImage
                    src={previewImage.url}
                    className="max-h-24 min-w-16 max-w-24 rounded-sm object-contain object-center"
                  />
                </div>
              ))}
            </div>

            {previewImageHandler.list.length >= 5 && (
              <div className="absolute inset-x-0 -bottom-1 flex justify-around">
                <button
                  className="btn btn-neutral btn-xs"
                  role="button"
                  onClick={() => previewImageHandler.removePreviewImages(chat.previewImages)}
                >
                  Clear {previewImageHandler.list.length} images
                </button>
              </div>
            )}

            <div className="divider my-0" />
          </div>
        )}

        <TextareaAutosize
          className="no-scrollbar textarea m-0 min-h-8 w-full resize-none border-0 p-0 text-base focus:outline-none "
          placeholder="Enter Prompt..."
          ref={textareaRef}
          value={messageContent}
          disabled={inputDisabled}
          minRows={1}
          onKeyDown={handleKeyDown}
          onChange={e => setMessageContent(_.trimStart(e.target.value))}
          onPaste={e => TransferHandler.handleImport(e.clipboardData.files)}
          autoFocus
        />
      </div>

      {/* TODO, this will be moot in the coming updates */}
      {/* {connectionStore.isImageGenerationMode && (
          <div className=" px-2 pb-2">
            <div className="divider my-0" />

            <div
              className="join-item flex w-full cursor-pointer flex-row gap-4 text-base-content/45 [&>span]:text-sm"
              onClick={() => settingStore.openSettingsModal('general')}
            >
              <span>
                Dimensions: {settingStore.a1111Width ?? 512} x {settingStore.a1111Height ?? 512}
              </span>

              <span>Steps: {settingStore.a1111Steps}</span>

              <span>Batch Size: {settingStore.a1111BatchSize}</span>

              <span>
                <Edit />
              </span>
            </div>
          </div>
        )} */}

      <form
        className={' h-full min-h-fit w-full ' + (inputDisabled ? 'bg-base-200' : '')}
        onSubmit={onFormSubmit}
      >
        <div className="join-item flex w-full flex-col justify-between bg-base-200 align-middle md:flex-row md:gap-2">
          <button
            tabIndex={0}
            type="button"
            className="btn btn-active hidden rounded-none rounded-bl-md md:flex"
            disabled={inputDisabled || connectionStore.isImageGenerationMode}
            onClick={() => settingStore.openSettingsModal('personas')}
          >
            {personaStore.selectedPersona?.name || 'No personas selected'}
            <ChevronDown />
          </button>

          <div className="flex">
            <AttachmentWrapper className="mr-auto md:mr-0">
              <button className="btn btn-ghost rounded-none" type="button" disabled={inputDisabled}>
                <Paperclip />
              </button>
            </AttachmentWrapper>

            {chat.isEditingMessage && (
              <button
                className="btn btn-ghost rounded-none text-error/50 hover:text-error"
                type="button"
                onClick={() => chat.setMessageToEdit(undefined)}
              >
                Cancel
              </button>
            )}

            {children || (
              <button
                className="btn btn-ghost rounded-none rounded-br-md bg-base-100"
                disabled={noModelSelected || _.isEmpty(messageContent)}
              >
                Send
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
})

export default ChatBoxInputRow

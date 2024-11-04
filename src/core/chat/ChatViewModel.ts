import { makeAutoObservable } from 'mobx'
import _ from 'lodash'

import EntityCache from '~/utils/EntityCache'

import { PreviewImageHandler } from '~/core/chat/PreviewImageHandler'
import { ChatModel } from '~/core/chat/ChatModel'
import { chatTable } from '~/core/chat/ChatTable'
import { EditedMessageHandler } from '~/core/chat/EditedMessageHandler'
import { incomingMessageStore } from '~/core/IncomingMessageStore'

import { MessageViewModel } from '~/core/message/MessageViewModel'
import { MessageModel } from '~/core/message/MessageModel'
import { messageTable } from '~/core/message/MessageTable'

import { connectionStore } from '~/core/connection/ConnectionStore'

export class ChatViewModel {
  messageViewModelCache = new EntityCache<MessageModel, MessageViewModel>(
    message => new MessageViewModel(message),
  )

  previewImageHandler = new PreviewImageHandler()
  editedMessageHandler = new EditedMessageHandler()

  constructor(public source: ChatModel) {
    makeAutoObservable(this)
  }

  async fetchMessages() {
    messageTable
      .findByIds(this.source.messageIds)
      .then(loadedMessages =>
        loadedMessages.forEach(message => this.messageViewModelCache.put(message)),
      )
  }

  get id() {
    return this.source.id
  }

  get messages() {
    return _.compact(this.source.messageIds.map(this.messageViewModelCache.get))
  }

  get previewImages() {
    return this.previewImageHandler.previewImages
  }

  get messageToEdit() {
    return this.editedMessageHandler.messageToEdit
  }

  get variationToEdit() {
    return this.editedMessageHandler.variationToEdit
  }

  get isEditingMessage() {
    return this.editedMessageHandler.isEditing
  }

  async setName(name?: string) {
    if (name) {
      await this.update({ name })
    }
  }

  async update(patch: Partial<ChatModel>) {
    await chatTable.put({ ...this.source, ...patch })
  }

  async setMessageToEdit(messageOrVariation?: MessageViewModel) {
    this.editedMessageHandler.setMessageToEdit(messageOrVariation)

    await this.previewImageHandler.setMessage(messageOrVariation)
  }

  async destroy() {
    await this.previewImageHandler.cancelPreviewImages()
    await chatTable.destroy(this.source)

    // remove all connected messages
    await messageTable.destroyMany(this.source.messageIds)
  }

  async destroyMessage({ source: message }: MessageViewModel) {
    await messageTable.destroy(message)

    this.messageViewModelCache.remove(message.id)

    await this.update({ messageIds: _.without(this.source.messageIds, message.id) })
  }

  async dispose() {
    for (const messageId of this.source.messageIds) {
      messageTable.cache.remove(messageId)
    }

    await this.previewImageHandler.cancelPreviewImages()
  }

  async commitMessageToEdit(content: string) {
    const imageUrls = await this.previewImageHandler.commitPreviewImages()

    this.editedMessageHandler.commit(content, imageUrls)
  }

  async addIncomingMessage(modelName: string) {
    // const selectedConnectionName
    const incomingMessage = await messageTable.create({ fromBot: true, botName: modelName })

    this.messages.push(new MessageViewModel(incomingMessage))

    const nextIds = this.source.messageIds.concat(incomingMessage.id)
    await chatTable.put({ ...this.source, messageIds: nextIds })
  }

  async findAndRegenerateResponse() {
    const messageIds = _.map(this.messages, 'id')
    const messageToEditIndex = _.indexOf(messageIds, this.editedMessageHandler.messageToEdit?.id)
    const messageAfterEditedMessage: MessageViewModel = this.messages[messageToEditIndex + 1]

    let botMessageToEdit: MessageViewModel

    // edited message was the last message
    if (!messageAfterEditedMessage) {
      botMessageToEdit = await this.createAndPushIncomingMessage()
      // if the previous bot message was deleted
    } else if (!messageAfterEditedMessage.source.fromBot) {
      const incomingMessage = await this.createIncomingMessage()

      botMessageToEdit = this.messageViewModelCache.put(incomingMessage)

      await messageTable.put(botMessageToEdit.source)

      // add new id at index
      messageIds.splice(messageToEditIndex + 1, 0, botMessageToEdit.id)

      await this.update({ messageIds })
    } else {
      botMessageToEdit = messageAfterEditedMessage
    }

    this.setMessageToEdit(undefined)
    await incomingMessageStore.generateVariation(this, botMessageToEdit)
  }

  async findAndEditPreviousMessage() {
    const { messageToEdit } = this.editedMessageHandler

    // this goes in a loop, letting it happen though.
    const currentIndex = messageToEdit
      ? _.indexOf(this.messages, messageToEdit)
      : this.messages.length

    const previousMessageToEdit = _.findLast(
      this.messages,
      viewModel => viewModel.source.fromBot === false,
      currentIndex - 1,
    )

    await this.setMessageToEdit(previousMessageToEdit)
  }

  async findAndEditNextMessage() {
    const { messageToEdit } = this.editedMessageHandler

    const currentIndex = messageToEdit
      ? _.indexOf(this.messages, messageToEdit)
      : this.messages.length

    const nextMessageToEdit = _.find(
      this.messages,
      viewModel => viewModel.source.fromBot === false,
      currentIndex + 1,
    )

    await this.setMessageToEdit(nextMessageToEdit)
  }

  async createIncomingMessage() {
    const incomingMessage = await messageTable.create({
      fromBot: true,
      botName: connectionStore.selectedModelName,
      modelType: connectionStore.selectedConnection?.type,
      content: '',
    })

    return incomingMessage
  }

  async createAndPushIncomingMessage() {
    const incomingMessage: MessageModel = await this.createIncomingMessage()

    const messageIds = this.source.messageIds.concat(incomingMessage.id)

    await this.update({ messageIds, lastMessageTimestamp: incomingMessage.timestamp })

    return this.messageViewModelCache.put(incomingMessage)
  }

  async addUserMessage(content: string = '') {
    if (_.isEmpty(content) && _.isEmpty(this.previewImageHandler.previewImages)) return

    // create the message
    const userMessage = await messageTable.create({
      fromBot: false,
      content,
    })

    const imageUrls = await this.previewImageHandler.commitPreviewImages(userMessage.id)

    if (!_.isEmpty(imageUrls)) {
      await messageTable.put({ ...userMessage, imageUrls })
    }

    this.messageViewModelCache.put(userMessage)

    // if there was not a name before, auto make one now
    const name = this.source.name || content.substring(0, 40)
    // add the message (and new name) to the chat
    await this.update({
      name,
      messageIds: this.source.messageIds.concat(userMessage.id),
      lastMessageTimestamp: userMessage.timestamp,
    })
  }
}

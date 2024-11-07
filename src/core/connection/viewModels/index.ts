import A1111ConnectionViewModel from '~/core/connection/viewModels/A1111ConnectionViewModel'
import LmsConnectionViewModel from '~/core/connection/viewModels/LmsConnectionViewModel'
import OllamaConnectionViewModel from '~/core/connection/viewModels/OllamaConnectionViewModel'
import OpenAiConnectionViewModel from '~/core/connection/viewModels/OpenAiConnectionViewModel'
import GeminiConnectionViewModel from '~/core/connection/viewModels/GeminiConnectionViewModel'

export type ConnectionViewModelTypes =
  | LmsConnectionViewModel
  | A1111ConnectionViewModel
  | OllamaConnectionViewModel
  | OpenAiConnectionViewModel
  | GeminiConnectionViewModel

export const connectionViewModelByType = {
  A1111: () => A1111ConnectionViewModel,
  Ollama: () => OllamaConnectionViewModel,
  OpenAi: () => OpenAiConnectionViewModel,
  Gemini: () => GeminiConnectionViewModel,

  // if we try to connect to LMS and fail, the try catch does not catch the error
  LMS: () => LmsConnectionViewModel,
}

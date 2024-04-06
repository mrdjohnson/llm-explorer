import { observer } from 'mobx-react-lite'
import Lightbox from 'yet-another-react-lightbox'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Download from 'yet-another-react-lightbox/plugins/download'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import _ from 'lodash'

import { chatStore } from '~/models/ChatStore'
import CachedImage from '~/components/CachedImage'
import CachedStorage from '~/utils/CachedStorage'

import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/captions.css'

const LazyLightbox = observer(() => {
  const chat = chatStore.selectedChat

  if (!chat) return null

  const index = chat.lightboxMessageIndex
  if (index === -1) return null

  const slides = chat.lightboxSlides

  return (
    <Lightbox
      close={chat.closeLightbox}
      plugins={[Thumbnails, Download, Captions, Zoom]}
      download={{
        download: ({ slide, saveAs }) => {
          CachedStorage.get(slide.src).then(imageData => {
            if (!imageData) return

            let name: string | undefined

            if (_.isString(slide.description)) {
              name = _.snakeCase(slide.description)
            }

            return saveAs(imageData, name)
          })
        },
      }}
      index={index}
      carousel={{ finite: true }}
      on={{
        view: ({ index }) => chat.setLightboxMessageById(slides[index].uniqId),
      }}
      slides={slides}
      render={{
        slide: ({ slide }) => <CachedImage src={slide.src} />,
        thumbnail: ({ slide }) => <CachedImage src={slide.src} />,
      }}
      controller={{ closeOnBackdropClick: true }}
      zoom={{ maxZoomPixelRatio: 7 }}
      open
    />
  )
})

export default LazyLightbox

import { observer } from 'mobx-react-lite'
import { SnapshotIn, getSnapshot } from 'mobx-state-tree'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import _ from 'lodash'
import { Input, ScrollShadow } from '@nextui-org/react'

import { ServerConnectionTypes } from '~/features/connections/servers'
import ConnectionDataParameterSection from '~/features/settings/panels/general/ConnectionParameterSection'
import { connectionModelStore } from '~/features/connections/ConnectionModelStore'

import HostInput from '~/components/HostInput'
import EnabledCheckbox from '~/components/EnabledCheckbox'

import { IConnectionDataModel } from '~/models/types'

export type ConnectionFormDataType = SnapshotIn<IConnectionDataModel>

const ConnectionPanel = observer(({ connection }: { connection: ServerConnectionTypes }) => {
  const methods = useForm<ConnectionFormDataType>({})

  const formRef = useRef<HTMLFormElement>(null)

  const {
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { isDirty, errors, dirtyFields },
  } = methods

  const handleFormSubmit = handleSubmit(formData => {
    console.log('submitting form')

    const isHostChanged = !!dirtyFields.host

    connectionModelStore.updateDataModel(formData, isHostChanged)

    reset(formData)
  })

  const isEnabled = !!getValues('enabled')

  const connectionDataSnapshot = useMemo(() => {
    return getSnapshot(connection.connectionModel)
  }, [connection])

  const resetToSnapshot = () => reset(connectionDataSnapshot, { keepDirty: false })

  useEffect(() => {
    resetToSnapshot()
  }, [connection])

  return (
    <div className="flex h-full w-full flex-col">
      <FormProvider {...methods}>
        <form className="contents" onSubmit={handleFormSubmit} ref={formRef}>
          <ScrollShadow className="h-full max-h-full">
            <div className="my-2 flex w-full flex-col gap-2 overflow-scroll">
              <EnabledCheckbox connection={connection} control={control} />

              <Controller
                render={({ field }) => (
                  <Input
                    id={connection.id}
                    type="text"
                    variant="bordered"
                    size="sm"
                    label="Connection display name"
                    disabled={!isEnabled}
                    placeholder={connection.label}
                    isInvalid={!!errors.label?.message}
                    errorMessage={errors.label?.message}
                    classNames={{
                      label: '!text-base-content/45',
                      inputWrapper:
                        '!bg-base-transparent border-base-content/30' +
                        (isEnabled ? '' : ' opacity-30 hover:!border-base-content/30'),
                    }}
                    {...field}
                  />
                )}
                control={control}
                name="label"
                defaultValue={connection.label}
              />

              <HostInput connection={connection} isEnabled={isEnabled} />

              <ConnectionDataParameterSection />
            </div>
          </ScrollShadow>

          <div className="mt-auto flex justify-between py-2">
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm mr-8 text-error"
                onClick={() => connectionModelStore.deleteConnection(connection.id)}
              >
                Delete Connection
              </button>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm mx-4"
                onClick={() => reset()}
                disabled={!isDirty}
              >
                Reset
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                onClick={handleFormSubmit}
                disabled={!isDirty && _.isEmpty(errors)}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
})

export default ConnectionPanel

import { observer } from 'mobx-react-lite'
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import _ from 'lodash'
import { twMerge } from 'tailwind-merge'

import ChevronDown from '~/icons/ChevronDown'
import FormInput from '~/components/form/FormInput'

export type SortType<SelectorType> = {
  label: ReactNode
  value?: keyof SelectorType
  invertOrder?: boolean
  tooltip?: string
  hideOnMobile?: true
}

const EmptySortType = {
  label: 'None',
  value: undefined,
  invertOrder: false,
  tooltip: undefined,
}

export type SelectionPanelTableProps<SelectorType> = PropsWithChildren<{
  items: SelectorType[]
  className?: string
  sortTypes: SortType<SelectorType>[]
  onItemSelected: (item: SelectorType) => void
  renderRow: (item: SelectorType, index: number) => ReactNode
  getIsItemSelected: (item: SelectorType) => boolean
  getItemKey: (item: SelectorType, index: number) => string | number
  filterInputPlaceholder?: string
  onFilterChanged?: (text: string) => void
  itemFilter?: (item: SelectorType, filter: string) => boolean
  primarySortTypeLabel?: keyof SelectorType
  includeEmptyHeader?: boolean
}>

const SelectionPanelTable = observer(
  <SelectorType,>({
    items,
    className = '',
    sortTypes,
    primarySortTypeLabel,
    includeEmptyHeader,
    itemFilter,
    renderRow,
    onFilterChanged,
    getIsItemSelected,
    onItemSelected,
    getItemKey,
    filterInputPlaceholder,
    children,
  }: SelectionPanelTableProps<SelectorType>) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const [activeSortType, setActiveSortType] = useState<
      SortType<SelectorType> | typeof EmptySortType
    >(EmptySortType)
    const [ascendingSort, setAscendingSort] = useState(true)
    const [filterText, setFilterText] = useState('')

    const sortedItems: SelectorType[] = useMemo(() => {
      if (!activeSortType.value) return items

      let direction: 'asc' | 'desc'

      if (activeSortType.invertOrder) {
        direction = ascendingSort ? 'desc' : 'asc'
      } else {
        direction = ascendingSort ? 'asc' : 'desc'
      }

      return _.orderBy(items, [activeSortType.value, primarySortTypeLabel], direction)
    }, [activeSortType, ascendingSort, items.length])

    const filteredItems = useMemo(() => {
      if (!filterText || !itemFilter) return sortedItems

      return sortedItems.filter(item => itemFilter(item, filterText))
    }, [filterText, sortedItems])

    const handleSortTypeChanged = (nextSortType: SortType<SelectorType>) => {
      if (nextSortType.value === undefined) return

      if (activeSortType !== nextSortType) {
        setAscendingSort(true)
        setActiveSortType(nextSortType)
      } else if (ascendingSort) {
        setAscendingSort(false)
      } else {
        setActiveSortType(EmptySortType)
        setAscendingSort(true)
      }
    }

    const makeChevron = (sortType: SortType<SelectorType>) => {
      return (
        <span
          className={twMerge(
            'transition-[opacity transform] -mr-2 ml-2 h-fit scale-90 opacity-0 duration-300 ease-in-out',
            ascendingSort && 'rotate-180',
            activeSortType === sortType && 'opacity-100',
          )}
        >
          <ChevronDown />
        </span>
      )
    }

    const handleFilterChanged = (text: string) => {
      setFilterText(text)
      onFilterChanged?.(text)
    }

    useEffect(() => {
      inputRef.current?.focus()
    }, [])

    return (
      <>
        {itemFilter && (
          <label className="flex w-full flex-row gap-2">
            <FormInput
              type="text"
              placeholder={filterInputPlaceholder}
              onChange={e => handleFilterChanged(e.target.value)}
              value={filterText}
              ref={inputRef}
              autoFocus
            />
          </label>
        )}

        <div
          className={twMerge('mt-2 flex h-full flex-col overflow-y-scroll rounded-md', className)}
        >
          <table className="table table-zebra table-sm -mt-4 mb-4 border-separate border-spacing-y-2 pt-0">
            <thead className="sticky top-0 z-20 bg-base-300 text-base-content">
              <tr>
                {sortTypes.map(sortType => (
                  <th
                    key={sortType.label as string | number}
                    className={sortType.hideOnMobile ? ' hidden md:flex' : ''}
                  >
                    <span
                      className={twMerge(
                        'tooltip tooltip-bottom -mr-2 flex w-fit select-none flex-row items-center',
                        sortType.value && 'cursor-pointer',
                      )}
                      onClick={() => handleSortTypeChanged(sortType)}
                      data-tip={sortType.tooltip}
                    >
                      <span
                        className={twMerge(
                          'border-b-current leading-[1.25]',
                          sortType.value && 'border-b-[1.5px]',
                        )}
                      >
                        {sortType.label}
                      </span>

                      {makeChevron(sortType)}
                    </span>
                  </th>
                ))}

                {includeEmptyHeader && <th className="w-fit" />}
              </tr>
              <tr />
            </thead>

            <tbody className="-mt-4 gap-2 px-2">
              {filteredItems?.map((item, index) => (
                <tr
                  className={twMerge(
                    'cursor-pointer hover:!bg-primary/30',
                    getIsItemSelected(item) && '!bg-primary text-primary-content hover:!bg-primary',
                  )}
                  onClick={() => onItemSelected(item)}
                  key={getItemKey(item, index)}
                >
                  {renderRow(item, index)}
                </tr>
              ))}
            </tbody>
          </table>

          {children}
        </div>
      </>
    )
  },
)

export default SelectionPanelTable

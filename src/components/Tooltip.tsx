import type { PropsWithChildren, ReactNode } from 'react'
import { Tooltip as NextUiTooltip, TooltipProps as NextUiTooltipProps } from '@nextui-org/react'

type ToolTipProps = PropsWithChildren<{
  label: ReactNode
  className?: string
  placement?: NextUiTooltipProps['placement']
  delay?: number
}>

const ToolTip = ({ label, placement, children, className = '', delay }: ToolTipProps) => {
  return (
    <NextUiTooltip
      content={label}
      className={
        '-translate-y-[0.5px] rounded-full border border-base-content/10 bg-base-200 p-2 font-semibold text-base-content/80 shadow-none ' +
        className
      }
      classNames={{
        base: 'before:bg-base-200 before:shadow-none before:border before:border-base-content/10 before:z-10  before:border-t-0 before:border-l-0 ',
      }}
      placement={placement}
      delay={delay}
      showArrow
    >
      {children}
    </NextUiTooltip>
  )
}

export default ToolTip

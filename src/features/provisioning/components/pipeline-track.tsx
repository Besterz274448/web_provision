import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import type { VehicleCounts } from '../api/types';
import {
  type ProgressInput,
  type StageState,
  progressSummary,
  tenantStages,
  vehicleStageState
} from '../lib/progress';

const STATE_FILL: Record<StageState, string> = {
  done: 'bg-success',
  active: 'track-active',
  retry: 'bg-warning',
  failed: 'bg-destructive',
  idle: 'bg-track'
};

const STATE_TEXT: Record<StageState, string> = {
  done: 'สำเร็จ',
  active: 'กำลังทำ',
  retry: 'รอลองใหม่',
  failed: 'ล้ม',
  idle: 'รอ'
};

const STATE_TEXT_COLOR: Record<StageState, string> = {
  done: 'text-success',
  active: 'text-primary',
  retry: 'text-warning',
  failed: 'text-destructive',
  idle: 'text-muted-foreground'
};

// Above this count one tick per vehicle stops being readable, so the ticks merge into a bar.
const MAX_TICKS = 16;

function VehicleTicks({
  vehicles,
  state,
  className
}: {
  vehicles: VehicleCounts;
  state: StageState;
  className?: string;
}) {
  const { total, completed, failed, active } = vehicles;
  if (total === 0) {
    return <span className={cn('block w-4 rounded-[2px]', STATE_FILL[state], className)} />;
  }
  if (total > MAX_TICKS) {
    const widths: [string, number][] = [
      ['bg-success', completed],
      ['bg-destructive', failed],
      ['track-active', active]
    ];
    return (
      <span className={cn('flex w-24 overflow-hidden rounded-[2px] bg-track', className)}>
        {widths.map(([fill, count]) => (
          <span key={fill} className={fill} style={{ width: `${(count / total) * 100}%` }} />
        ))}
      </span>
    );
  }
  const pending = total - completed - failed - active;
  const ticks = [
    ...Array<string>(completed).fill('bg-success'),
    ...Array<string>(failed).fill('bg-destructive'),
    ...Array<string>(active).fill('track-active'),
    ...Array<string>(pending).fill(state === 'retry' ? 'bg-warning' : 'bg-track')
  ];
  return (
    <span className='flex gap-[2px]'>
      {ticks.map((fill, index) => (
        <span key={index} className={cn('block w-2 rounded-[2px]', fill, className)} />
      ))}
    </span>
  );
}

/** The compact track of a table row: four tenant writes, a gap, then one tick per vehicle. */
export function PipelineTrack({
  request,
  ...props
}: { request: ProgressInput } & ComponentProps<'div'>) {
  const summary = progressSummary(request);
  const vehicleState = vehicleStageState(request);
  return (
    <div {...props}>
      <div className='flex items-center gap-2' aria-hidden='true'>
        <span className='flex gap-[2px]'>
          {tenantStages(request).map((stage) => (
            <span
              key={stage.key}
              className={cn('block h-1.5 w-5 rounded-[2px]', STATE_FILL[stage.state])}
            />
          ))}
        </span>
        <VehicleTicks vehicles={request.vehicles} state={vehicleState} className='h-1.5' />
      </div>
      <p className='mt-1.5 text-xs text-muted-foreground'>{summary}</p>
    </div>
  );
}

function StageColumn({
  label,
  state,
  detail,
  children
}: {
  label: string;
  state: StageState;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <li className='min-w-0'>
      {children}
      <p className='mt-2 text-sm font-medium'>{label}</p>
      <p className={cn('text-xs', STATE_TEXT_COLOR[state])}>
        {STATE_TEXT[state]}
        {detail && <span className='text-muted-foreground'> · {detail}</span>}
      </p>
    </li>
  );
}

/** The full track of the detail page, with each stage named and how long it took. */
export function PipelineStages({
  request,
  stageDetails
}: {
  request: ProgressInput;
  stageDetails: Record<string, string>;
}) {
  const vehicleState = vehicleStageState(request);
  const { total, completed } = request.vehicles;
  return (
    <ol className='grid grid-cols-2 gap-x-1 gap-y-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]'>
      {tenantStages(request).map((stage) => (
        <StageColumn
          key={stage.key}
          label={stage.label}
          state={stage.state}
          detail={stage.state === 'done' ? stageDetails[stage.key] : undefined}
        >
          <span className={cn('block h-2 rounded-[2px]', STATE_FILL[stage.state])} />
        </StageColumn>
      ))}
      <StageColumn label={total === 0 ? 'รถ' : `รถ ${completed}/${total} คัน`} state={vehicleState}>
        <span className='flex h-2 sm:ml-3'>
          <VehicleTicks vehicles={request.vehicles} state={vehicleState} className='h-2 flex-1' />
        </span>
      </StageColumn>
    </ol>
  );
}

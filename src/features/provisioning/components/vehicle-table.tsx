import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { Vehicle } from '../api/types';
import { displayStatus } from '../lib/status';
import { StatusLabel } from './status-label';

const isFailed = (v: Vehicle) => v.status === 'failed' || v.status === 'rejected';

function vehicleType(v: Vehicle) {
  const type = v.vehicle_type === 'van' ? 'รถเร่' : 'รถส่ง';
  return v.is_trial ? `${type}ทดลอง` : type;
}

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  // Sort is stable, so failed vehicles come first and the rest keep the API's order.
  const rows = vehicles.toSorted((a, b) => Number(isFailed(b)) - Number(isFailed(a)));

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead>รถ</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>สาเหตุ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <p className='font-medium'>{vehicleType(vehicle)}</p>
                <code className='font-mono text-xs text-muted-foreground'>{vehicle.van_code}</code>
              </TableCell>
              <TableCell>
                {vehicle.full_username ? (
                  <code className='font-mono text-xs'>{vehicle.full_username}</code>
                ) : (
                  <span className='text-muted-foreground'>–</span>
                )}
              </TableCell>
              <TableCell>
                <StatusLabel status={displayStatus(vehicle)} />
              </TableCell>
              <TableCell className='min-w-56 whitespace-normal'>
                {vehicle.last_error_code ? (
                  <>
                    <code className='font-mono text-xs font-medium'>{vehicle.last_error_code}</code>
                    <p className='text-xs text-muted-foreground'>{vehicle.last_error_message}</p>
                  </>
                ) : (
                  <span className='text-muted-foreground'>–</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

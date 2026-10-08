import { useScannerStation } from '../contexts/ScannerStationContext';
import { stationModeLabel } from '../utils/stationDisplay';
import BaseDialog from './BaseDialog';
import ScannerStationSettings from './ScannerStationSettings';

export default function ScannerRulesDialog({ dialogRef, onClose, editorVersion }) {
    const { stations, stationId } = useScannerStation();
    const station = stations.find(item => item.id === stationId);
    return <BaseDialog onClose={onClose} dialogRef={dialogRef} title="Scanner-Regeln" size="large" className="scanner-station-dialog" showDefaultClose={false}>
        <div className="station-dialog-intro"><span>Für diesen Scanner · {station ? stationModeLabel(station) : 'Wird geladen …'}</span></div>
        <ScannerStationSettings key={editorVersion + '-' + stationId} stationId={stationId}
            onCancel={() => dialogRef.current?.close()}
            onSaved={() => dialogRef.current?.close()} />
    </BaseDialog>;
}

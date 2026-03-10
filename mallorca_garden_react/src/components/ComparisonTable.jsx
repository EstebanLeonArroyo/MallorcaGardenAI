import { getWaterLabel, getMaintenanceLabel } from '../services/proposalEngine';

export default function ComparisonTable({ proposalData }) {
    if (!proposalData) return null;

    const { sustainable, aesthetic } = proposalData;

    const sustainablePlants = sustainable?.plants || [];
    const aestheticPlants = aesthetic?.plants || [];

    const sustainableCount = sustainablePlants.reduce((sum, p) => sum + (p.quantity || p.qty || 0), 0);
    const aestheticCount = aestheticPlants.reduce((sum, p) => sum + (p.quantity || p.qty || 0), 0);

    const sustainableCost = sustainable?.totalCost || sustainable?.cost || 0;
    const aestheticCost = aesthetic?.totalCost || aesthetic?.cost || 0;

    const sustainableMaintenance = sustainable?.estimatedMaintenance || sustainable?.maintenance || 'low';
    const aestheticMaintenance = aesthetic?.estimatedMaintenance || aesthetic?.maintenance || 'medium';

    const sustainableWater = sustainable?.estimatedWaterConsumption || sustainable?.water || 'low';
    const aestheticWater = aesthetic?.estimatedWaterConsumption || aesthetic?.water || 'medium';

    return (
        <table className="comparison-table">
            <thead>
                <tr>
                    <th>Metrica</th>
                    <th>Sostenible</th>
                    <th>Estetica</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="metric-name">Coste Total</td>
                    <td className="metric-value highlight">{sustainableCost} EUR</td>
                    <td className="metric-value highlight">{aestheticCost} EUR</td>
                </tr>
                <tr>
                    <td className="metric-name">Numero de Plantas</td>
                    <td className="metric-value">{sustainableCount}</td>
                    <td className="metric-value">{aestheticCount}</td>
                </tr>
                <tr>
                    <td className="metric-name">Mantenimiento</td>
                    <td className="metric-value">
                        <span className={`badge-mini ${sustainableMaintenance}`}>
                            {getMaintenanceLabel(sustainableMaintenance)}
                        </span>
                    </td>
                    <td className="metric-value">
                        <span className={`badge-mini ${aestheticMaintenance}`}>
                            {getMaintenanceLabel(aestheticMaintenance)}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td className="metric-name">Necesidades de Agua</td>
                    <td className="metric-value">
                        <span className={`badge-mini ${sustainableWater}`}>
                            {getWaterLabel(sustainableWater)}
                        </span>
                    </td>
                    <td className="metric-value">
                        <span className={`badge-mini ${aestheticWater}`}>
                            {getWaterLabel(aestheticWater)}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td className="metric-name">Especies Unicas</td>
                    <td className="metric-value">{sustainablePlants.length} tipos</td>
                    <td className="metric-value">{aestheticPlants.length} tipos</td>
                </tr>
                <tr>
                    <td className="metric-name">Recomendacion</td>
                    <td className="metric-value">
                        {sustainableCost < aestheticCost ? 'Mas economica' : ''}
                    </td>
                    <td className="metric-value">
                        {aestheticCost < sustainableCost ? 'Mas economica' : ''}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

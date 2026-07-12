import { wealthEngine } from '@/logic/wealthEngine';
import type { ClientData } from '@/logic/wealthEngine';

interface ClientPortalProps {
  client: ClientData;
}

export const ClientPortal = ({ client }: ClientPortalProps) => {
  const report = wealthEngine.generateHealthReport(client);
  const isAlert = report.maintenanceAlert.startsWith('CRITICAL');

  return (
    <section className="bg-[#111111] p-8 rounded-lg mt-10 border border-gray-800">
      <div className="mb-6">
        <h3 className="text-[#ffcc00] text-xl font-bold uppercase tracking-widest">
          JWORDENAI™ Pavement Health Report
        </h3>
        {client.clientName && (
          <p className="text-gray-200 text-sm mt-1">Client: {client.clientName}</p>
        )}
        <p className="text-gray-300 text-xs mt-1">{report.logic}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black p-4 rounded border-l-4 border-[#ffcc00]">
          <h4 className="text-gray-200 text-xs uppercase tracking-widest mb-1">PCI Score</h4>
          <p className="text-[#ffcc00] text-3xl font-bold">{report.pciScore}</p>
          <p className="text-gray-300 text-xs mt-1">Pavement Condition Index</p>
        </div>

        <div className={`bg-black p-4 rounded border-l-4 ${isAlert ? 'border-red-500' : 'border-green-500'}`}>
          <h4 className="text-gray-200 text-xs uppercase tracking-widest mb-1">Maintenance Status</h4>
          <p className={`text-sm font-bold mt-1 ${isAlert ? 'text-red-400' : 'text-green-400'}`}>
            {report.maintenanceAlert}
          </p>
          <p className="text-gray-300 text-xs mt-1">Last service: {client.lastServiceDate} months ago</p>
        </div>

        <div className="bg-black p-4 rounded border-l-4 border-[#ffcc00]">
          <h4 className="text-gray-200 text-xs uppercase tracking-widest mb-1">Estimated Repair Value</h4>
          <p className="text-[#ffcc00] text-2xl font-bold">
            ${report.estimatedRepairValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-gray-300 text-xs mt-1">{client.squareFootage.toLocaleString()} sq ft analyzed</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-black rounded border border-gray-800">
        <p className="text-xs text-gray-300">
          <span className="text-[#ffcc00] font-bold">J. Worden &amp; Sons</span> — 4th Generation. Since 1984. Virginia Class A Licensed Contractor.
          All assessments follow VDOT Section 315 standards and 96% Marshall Unit Weight compliance.
        </p>
      </div>
    </section>
  );
};

export default ClientPortal;

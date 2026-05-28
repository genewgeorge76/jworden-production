import React from 'react';
import { Home, Building2, Factory, Droplet, Wrench, PaintBucket } from 'lucide-react';

/**
 * Services strip — signals to Google that this page covers multiple service types
 * and captures long-tail searches like "driveway paving virginia" + "sealcoating virginia".
 */
const SERVICES = [
  { icon: Home, label: 'Residential Driveways', query: 'Driveway paving' },
  { icon: Building2, label: 'Commercial Lots', query: 'Parking lot paving' },
  { icon: Factory, label: 'Industrial Paving', query: 'Heavy-duty asphalt' },
  { icon: Droplet, label: 'Sealcoating', query: 'Asphalt sealing' },
  { icon: Wrench, label: 'Crack Repair', query: 'Pothole & crack fill' },
  { icon: PaintBucket, label: 'Line Striping', query: 'ADA striping' },
];

export default function LocationsServicesStrip() {
  return (
    <section className="border-b border-border py-12 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-6 text-center">
          // Services Available in Every Virginia Market
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICES.map(({ icon: Icon, label, query }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center p-4 border border-border hover:border-primary/40 transition-colors"
            >
              <Icon className="w-6 h-6 text-primary mb-3" />
              <p className="font-display font-bold text-foreground text-xs tracking-wider uppercase leading-tight">
                {label}
              </p>
              <p className="font-body text-muted-foreground text-[10px] mt-1.5 leading-tight">
                {query}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

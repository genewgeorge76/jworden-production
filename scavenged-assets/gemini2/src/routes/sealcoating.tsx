import { createFileRoute } from '@tanstack/react-router';
import ServiceDetailPage from '../components/ServiceDetailPage';
import { useSeo } from '../lib/useSeo';

export const Route = createFileRoute('/sealcoating')({
  component: SealcoatingPage,
});

function SealcoatingPage() {
  useSeo({
    title: 'Asphalt Sealcoating Contractor',
    description:
      'Commercial and residential sealcoating across Virginia and the Mid-Atlantic. Coal-tar and asphalt-emulsion. Crack-fill, striping, and ADA included. Call 804-446-1296.',
    path: '/sealcoating',
  });

  return (
    <ServiceDetailPage
      eyebrow="Sealcoating"
      hero="Sealcoat protects what you already paid for."
      intro="Sealcoating doubles the service life of asphalt by sealing the surface against UV, oxidation, fuel spills, and water. We apply commercial and residential sealcoat the right way, on the right cure window."
      features={[
        {
          title: 'Coal-tar emulsion',
          body: 'Maximum chemical resistance. Standard for parking lots, drive-thrus, and fueling pads.',
        },
        {
          title: 'Asphalt emulsion',
          body: 'Lower-VOC alternative for residential driveways and HOA-restricted areas.',
        },
        {
          title: 'Crack-fill first',
          body: 'Hot-applied rubberized crack sealant before sealcoat. Skip this step and water still gets to your base.',
        },
        {
          title: 'Striping & stencils',
          body: 'Re-stripe lines, accessible parking, fire lanes, stop bars, and directional arrows after the seal cures.',
        },
        {
          title: 'Cure-window scheduling',
          body: 'New asphalt needs 6–12 months to cure before sealing. We won’t take a job that won’t last.',
        },
        {
          title: 'Maintenance programs',
          body: 'Multi-site portfolios? We build a 3- to 5-year reseal and crack-fill schedule with budgeted line items.',
        },
      ]}
      faqs={[
        {
          q: 'How often should asphalt be sealcoated?',
          a: 'Every 2 to 4 years for commercial lots, every 3 to 5 years for residential driveways. Wait at least 6–12 months after a fresh paving job.',
        },
        {
          q: 'How long does sealcoat take to dry?',
          a: 'Foot traffic the same day. Vehicle traffic after 24 hours in good weather. We block the lot during application and post clear re-open times.',
        },
        {
          q: 'Coal-tar or asphalt emulsion — which is better?',
          a: 'Coal-tar is more durable and chemical-resistant; asphalt emulsion is greener and lower-odor. We recommend coal-tar for commercial and asphalt emulsion for most residential. We’ll quote either.',
        },
      ]}
    />
  );
}

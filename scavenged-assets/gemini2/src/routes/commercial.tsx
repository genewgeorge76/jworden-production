import { createFileRoute } from '@tanstack/react-router';
import ServiceDetailPage from '../components/ServiceDetailPage';
import { useSeo } from '../lib/useSeo';

export const Route = createFileRoute('/commercial')({
  component: CommercialPage,
});

function CommercialPage() {
  useSeo({
    title: 'Commercial Asphalt Paving Contractor',
    description:
      'Commercial parking lot paving, drive-thru lanes, and multi-site rollouts in Virginia, Maryland, and the Mid-Atlantic. KFC, Taco Bell, and Arby’s preferred contractor. Call 804-446-1296.',
    path: '/commercial',
  });

  return (
    <ServiceDetailPage
      eyebrow="Commercial paving"
      hero="Commercial asphalt paving built for traffic, not photo ops."
      intro="From single parking lots to 100-store rollouts, we deliver structural pavement to VDOT spec, on a developer schedule, with zero subcontracted labor."
      features={[
        {
          title: 'Parking lots & drive-thrus',
          body: 'New construction and full-depth reconstruction for retail, restaurants, medical, and industrial sites.',
        },
        {
          title: 'National multi-site rollouts',
          body: '100+ franchise sites delivered for KFC, Taco Bell, Arby’s, CVS and more. One PM, one schedule, one invoice.',
        },
        {
          title: '6-inch structural stone base',
          body: 'Engineered subgrade on every job. The reason our pavement holds up under loaded trucks year after year.',
        },
        {
          title: '96% Marshall compaction',
          body: 'Density-tested in the field. Spec-grade aggregate, spec-grade mix, spec-grade results.',
        },
        {
          title: 'Striping & ADA',
          body: 'Lines, stencils, accessible parking and ramps included or restored at handover.',
        },
        {
          title: 'After-hours & phased work',
          body: 'We sequence around your operating hours so the lot stays open while we pave.',
        },
      ]}
      faqs={[
        {
          q: 'How long does a commercial parking lot take to pave?',
          a: 'A typical 30,000–50,000 sq ft lot is 3–5 working days for full-depth installation including base, binder, and surface course. Phased after-hours work extends that timeline but keeps the business open.',
        },
        {
          q: 'Do you handle multi-state rollouts?',
          a: 'Yes. We hold or partner for licensure across all 50 states and have run national rollouts for QSR brands. One project manager owns every site from punch-list to final striping.',
        },
        {
          q: 'What is your standard warranty?',
          a: 'One-year material and workmanship on commercial work, with documented compaction results and mix tickets delivered at closeout.',
        },
      ]}
    />
  );
}

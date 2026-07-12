import { createFileRoute } from '@tanstack/react-router';
import ServiceDetailPage from '../components/ServiceDetailPage';
import { useSeo } from '../lib/useSeo';

export const Route = createFileRoute('/residential')({
  component: ResidentialPage,
});

function ResidentialPage() {
  useSeo({
    title: 'Residential Asphalt Driveway Paving',
    description:
      'Asphalt driveway installation, replacement, and historic estate paving across Richmond, Chesterfield, Henrico, and Central Virginia. 6-inch stone base on every driveway. Call 804-446-1296.',
    path: '/residential',
  });

  return (
    <ServiceDetailPage
      eyebrow="Residential paving"
      hero="A driveway built to outlast the mortgage."
      intro="Family-owned residential asphalt driveway installation and replacement in Central Virginia. The same engineered base and density standards we lay for commercial clients."
      features={[
        {
          title: 'New driveway installation',
          body: 'Custom driveways from cottage to estate. Existing surface removal, grading, base, paving, and clean edges.',
        },
        {
          title: 'Driveway replacement',
          body: 'Full tear-out and rebuild for failing driveways. We diagnose drainage and base issues before laying anything new.',
        },
        {
          title: '6-inch compacted stone base',
          body: 'The Worden minimum. Required on every job. The single biggest factor in whether your driveway lasts 10 years or 40.',
        },
        {
          title: 'Estate & historic properties',
          body: 'Long drives, complex grades, brick or stone aprons, and historic preservation considerations welcomed.',
        },
        {
          title: 'Sealcoating add-on',
          body: 'Optional sealcoat at the right cure window to lock in the new surface and double its service life.',
        },
        {
          title: 'Family-owned, four generations',
          body: 'No call center, no commissioned salesman. A Worden walks the job and quotes the job.',
        },
      ]}
      faqs={[
        {
          q: 'How much does an asphalt driveway cost in Virginia?',
          a: 'Residential asphalt driveways in Central Virginia typically run $3.50 to $7.00 per square foot installed, depending on size, accessibility, base condition, and grade. We provide free on-site estimates.',
        },
        {
          q: 'How long should I stay off a new asphalt driveway?',
          a: 'Foot traffic the next day, light vehicle traffic after 24–48 hours, and avoid sharp turns or stationary heavy loads for the first 14 days while the asphalt fully cures.',
        },
        {
          q: 'When can I sealcoat a brand-new driveway?',
          a: 'Wait 6 to 12 months. New asphalt needs to cure and shed surface oils before a sealcoat will properly bond.',
        },
      ]}
    />
  );
}

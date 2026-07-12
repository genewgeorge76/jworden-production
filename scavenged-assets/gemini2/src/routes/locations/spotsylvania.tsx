import { createFileRoute } from '@tanstack/react-router';
import LocationPage from '../../components/LocationPage';
import { findCity, CITIES } from '../../data/cities';

export const Route = createFileRoute('/locations/spotsylvania')({
  component: CityRoute,
});

function CityRoute() {
  const city = findCity('spotsylvania')!;
  const nearby = CITIES.filter((c) => c.region === city.region && c.slug !== city.slug).slice(0, 8);
  return <LocationPage city={city} nearby={nearby} />;
}
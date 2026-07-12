import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { Root } from './routes/__root';
import { HomePage } from './routes/index';
import { AboutPage } from './routes/about';
import { ServicesPage } from './routes/services';
import { EstimatorPage } from './routes/estimator';
import { ContactPage } from './routes/contact';
import { LocationsPage } from './routes/locations';
import { LocationPageRoute } from './routes/location-page';
import { BlogPage } from './routes/blog';
import { BlogPostPage } from './routes/blog-post';
import { PhotoInspectPage } from './routes/photo-inspect';
import { GalleryPage } from './routes/gallery';
import { CommandCenterPage } from './routes/command-center';
import { OSPage } from './routes/os';
import { ClientPortalPage } from './routes/client-portal';
import { LMSPage } from './routes/lms';
import { LMSCoursePage } from './routes/lms-course';

const rootRoute = createRootRoute({ component: Root });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage });
const servicesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/services', component: ServicesPage });
const estimatorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/estimator', component: EstimatorPage });
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', component: ContactPage });

const locationsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/locations', component: LocationsPage });
const locationPageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/locations/$slug', component: LocationPageRoute });

const blogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/blog', component: BlogPage });
const blogPostRoute = createRoute({ getParentRoute: () => rootRoute, path: '/blog/$slug', component: BlogPostPage });

const photoInspectRoute = createRoute({ getParentRoute: () => rootRoute, path: '/photo-inspect', component: PhotoInspectPage });
const galleryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/gallery', component: GalleryPage });
const commandCenterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/command-center', component: CommandCenterPage });
const osRoute = createRoute({ getParentRoute: () => rootRoute, path: '/os', component: OSPage });
const clientPortalRoute = createRoute({ getParentRoute: () => rootRoute, path: '/portal', component: ClientPortalPage });
const lmsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/lms', component: LMSPage });
const lmsCourseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/lms/$courseId', component: LMSCoursePage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  estimatorRoute,
  contactRoute,
  locationsRoute,
  locationPageRoute,
  blogRoute,
  blogPostRoute,
  photoInspectRoute,
  galleryRoute,
  commandCenterRoute,
  osRoute,
  clientPortalRoute,
  lmsRoute,
  lmsCourseRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

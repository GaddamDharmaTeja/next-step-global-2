import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appBasePath } from "@/lib/runtime";

import HomePage from "./spa-pages/home";
import DestinationsPage from "./spa-pages/destinations";
import DestinationDetailPage from "./spa-pages/destination-detail";
import ConsultantsPage from "./spa-pages/consultants";
import ServicesPage from "./spa-pages/services";
import AboutPage from "./spa-pages/about";
import ContactPage from "./spa-pages/contact";
import SignInPage from "./spa-pages/sign-in";
import SignUpPage from "./spa-pages/sign-up";
import UserPortalPage from "./spa-pages/user-portal";
import AdminDashboardPage from "./spa-pages/admin/dashboard";
import AdminContentPage from "./spa-pages/admin/content";
import AdminInquiriesPage from "./spa-pages/admin/inquiries";
import AdminPipelinePage from "./spa-pages/admin/pipeline";
import AdminAppointmentsPage from "./spa-pages/admin/appointments";
import AdminConsultantsPage from "./spa-pages/admin/consultants";
import AdminProgramsPage from "./spa-pages/admin/programs";
import AdminDestinationsPage from "./spa-pages/admin/destinations";
import AdminGalleryPage from "./spa-pages/admin/gallery";
import AdminTestimonialsPage from "./spa-pages/admin/testimonials";
import AdminUsersPage from "./spa-pages/admin/users";
import AdminRolesPage from "./spa-pages/admin/roles";
import AdminNotificationsPage from "./spa-pages/admin/notifications";
import AdminTemplatesPage from "./spa-pages/admin/templates";
import AdminOwnerSettingsPage from "./spa-pages/admin/owner-settings";
import AdminAuditLogsPage from "./spa-pages/admin/audit-logs";
import AdminDocumentsPage from "./spa-pages/admin/documents";
import NotFoundPage from "./spa-pages/not-found";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/destinations" component={DestinationsPage} />
      <Route path="/destinations/:slug" component={DestinationDetailPage} />
      <Route path="/consultants" component={ConsultantsPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/user-portal" component={UserPortalPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/content" component={AdminContentPage} />
      <Route path="/admin/inquiries" component={AdminInquiriesPage} />
      <Route path="/admin/pipeline" component={AdminPipelinePage} />
      <Route path="/admin/appointments" component={AdminAppointmentsPage} />
      <Route path="/admin/consultants" component={AdminConsultantsPage} />
      <Route path="/admin/programs" component={AdminProgramsPage} />
      <Route path="/admin/destinations" component={AdminDestinationsPage} />
      <Route path="/admin/gallery" component={AdminGalleryPage} />
      <Route path="/admin/testimonials" component={AdminTestimonialsPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/roles" component={AdminRolesPage} />
      <Route path="/admin/notifications" component={AdminNotificationsPage} />
      <Route path="/admin/templates" component={AdminTemplatesPage} />
      <Route path="/admin/settings" component={AdminOwnerSettingsPage} />
      <Route path="/admin/audit-logs" component={AdminAuditLogsPage} />
      <Route path="/admin/documents" component={AdminDocumentsPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={appBasePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

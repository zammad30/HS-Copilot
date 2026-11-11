import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { RequireSession } from "@/entities/session";
import { routes } from "@/shared/config";

const LandingPage = lazy(() => import("@/pages/landing").then((m) => ({ default: m.LandingPage })));
const MethodologyPage = lazy(() =>
  import("@/pages/methodology").then((m) => ({ default: m.MethodologyPage })),
);
const SignInPage = lazy(() => import("@/pages/auth").then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import("@/pages/auth").then((m) => ({ default: m.SignUpPage })));
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth").then((m) => ({ default: m.ResetPasswordPage })),
);
const PrivacyPage = lazy(() => import("@/pages/legal").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/legal").then((m) => ({ default: m.TermsPage })));
const TryPage = lazy(() => import("@/pages/public-try").then((m) => ({ default: m.TryPage })));
const HomePage = lazy(() => import("@/pages/home").then((m) => ({ default: m.HomePage })));
const ClassifyNewPage = lazy(() =>
  import("@/pages/classify-new").then((m) => ({ default: m.ClassifyNewPage })),
);
const ClassificationDetailPage = lazy(() =>
  import("@/pages/classification-detail").then((m) => ({ default: m.ClassificationDetailPage })),
);
const BatchUploadPage = lazy(() =>
  import("@/pages/batch-upload").then((m) => ({ default: m.BatchUploadPage })),
);
const BatchReviewPage = lazy(() =>
  import("@/pages/batch-review").then((m) => ({ default: m.BatchReviewPage })),
);
const LibraryPage = lazy(() => import("@/pages/library").then((m) => ({ default: m.LibraryPage })));
const SettingsGeneralPage = lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.SettingsGeneralPage })),
);
const SettingsMembersPage = lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.SettingsMembersPage })),
);
const SettingsRulesPage = lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.SettingsRulesPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/not-found").then((m) => ({ default: m.NotFoundPage })),
);

// Dev-only: keep the component kit out of the production route tree entirely.
const devOnlyRoutes = import.meta.env.DEV
  ? [
      {
        path: routes.kit,
        lazy: async () => {
          const { KitPage } = await import("@/pages/kit");
          return { Component: KitPage };
        },
      },
    ]
  : [];

export const router = createBrowserRouter([
  { path: routes.landing, Component: LandingPage },
  { path: routes.methodology, Component: MethodologyPage },
  { path: routes.signIn, Component: SignInPage },
  { path: routes.signUp, Component: SignUpPage },
  { path: routes.resetPassword, Component: ResetPasswordPage },
  { path: routes.privacy, Component: PrivacyPage },
  { path: routes.terms, Component: TermsPage },
  { path: routes.try, Component: TryPage },
  {
    Component: RequireSession,
    children: [
      { path: routes.home, Component: HomePage },
      { path: routes.classifyNew, Component: ClassifyNewPage },
      { path: "/app/classifications/:id", Component: ClassificationDetailPage },
      { path: routes.batchUpload, Component: BatchUploadPage },
      { path: "/app/batches/:id", Component: BatchReviewPage },
      { path: routes.library, Component: LibraryPage },
      { path: routes.settingsGeneral, Component: SettingsGeneralPage },
      { path: routes.settingsMembers, Component: SettingsMembersPage },
      { path: routes.settingsRules, Component: SettingsRulesPage },
    ],
  },
  ...devOnlyRoutes,
  { path: "*", Component: NotFoundPage },
]);

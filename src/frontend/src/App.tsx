import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppProvider } from "./contexts/AppContext";
import { CreateRoomPage } from "./pages/CreateRoomPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GamePage } from "./pages/GamePage";
import { JoinRoomPage } from "./pages/JoinRoomPage";
import { LandingPage } from "./pages/LandingPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RoomPage } from "./pages/RoomPage";

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <AppProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </AppProvider>
  ),
});

// Routes
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const createRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/room/create",
  component: CreateRoomPage,
});

const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/room/$roomId",
  component: RoomPage,
});

const joinRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join/$code",
  component: JoinRoomPage,
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game/$gameId",
  component: GamePage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  dashboardRoute,
  // createRoomRoute MUST come before roomRoute so static "/room/create"
  // is matched before the dynamic "/room/$roomId" segment
  createRoomRoute,
  roomRoute,
  // joinRoomRoute MUST come before roomRoute (already separate path prefix)
  joinRoomRoute,
  gameRoute,
  leaderboardRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

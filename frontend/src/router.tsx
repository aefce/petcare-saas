import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import BookingPage from "./pages/BookingPage";
import HotelBookingPage from "./pages/HotelBookingPage";
import GroomingDetailPage from "./pages/GroomingDetailPage";
import HotelDetailPage from "./pages/HotelDetailPage";
import CareDetailPage from "./pages/CareDetailPage";
import MembershipDetailPage from "./pages/MembershipDetailPage";
import FAQPage from "./pages/FAQPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import StaffLayout from "./components/layout/StaffLayout";
import StaffHomePage from "./pages/staff/StaffHomePage";
import StaffReceptionPage from "./pages/staff/StaffReceptionPage";
import StaffGroomingPage from "./pages/staff/StaffGroomingPage";
import StaffCarePage from "./pages/staff/StaffCarePage";
import StaffHotelPage from "./pages/staff/StaffHotelPage";
import StaffAdminPage from "./pages/staff/StaffAdminPage";
import StaffNotificationsPage from "./pages/staff/StaffNotificationsPage";
import { useAuthStore } from "./store/authStore";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const account = useAuthStore((state) => state.account);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && account && !allowedRoles.includes(account.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RootRedirect = () => {
  const account = useAuthStore((state) => state.account);
  if (!account) return <LandingPage />;
  if (account.role === 'STAFF' || account.role === 'ADMIN') {
    return <Navigate to="/staff" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/services/grooming",
    element: <GroomingDetailPage />,
  },
  {
    path: "/services/hotel",
    element: <HotelDetailPage />,
  },
  {
    path: "/services/care",
    element: <CareDetailPage />,
  },
  {
    path: "/membership",
    element: <MembershipDetailPage />,
  },
  {
    path: "/faq",
    element: <FAQPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={['OWNER']}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/booking",
    element: (
      <ProtectedRoute allowedRoles={['OWNER']}>
        <BookingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hotel-booking",
    element: (
      <ProtectedRoute allowedRoles={['OWNER']}>
        <HotelBookingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff",
    element: (
      <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StaffHomePage />,
      },
      {
        path: "reception",
        element: <StaffReceptionPage />,
      },
      {
        path: "grooming",
        element: <StaffGroomingPage />,
      },
      {
        path: "care",
        element: <StaffCarePage />,
      },
      {
        path: "hotel",
        element: <StaffHotelPage />,
      },
      {
        path: "admin",
        element: <StaffAdminPage />,
      },
      {
        path: "notifications",
        element: <StaffNotificationsPage />,
      },
    ],
  },
]);

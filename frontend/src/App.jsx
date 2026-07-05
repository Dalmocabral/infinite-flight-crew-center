import { ThemeProvider } from '@mui/material/styles';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout'; // New Layout Wrapper
import aviationTheme from './theme/aviationTheme'; // Global Theme

import ProtectedRoutes from './components/ProtectedRoutes';
import AdminRedirect from './pages/AdminRedirect';
import AwardDetail from './pages/AwardDetail';
import Awards from './pages/Awards';
import Dashboard from './pages/Dashboard';
import EditPirep from './pages/EditPirep';
import Home from './pages/Home';
import Login from './pages/Login';
import Map from './pages/Map';
import Members from './pages/Members';
import MyAwards from './pages/MyAwards';
import MyFlights from './pages/MyFlights';
import PasswordResetConfirm from './pages/PassworldResetConfirm';
import PassworldResetRequest from './pages/PassworldResetRequest';
import PirepsFlights from './pages/PirepsFlights';
import ProfileEdit from './pages/ProfileEdit';
import Register from './pages/Register';
import UserDetail from './pages/UserDetail';
import Briefing from './pages/briefing';

import WikiLayout from './layouts/WikiLayout';
import ComingSoon from './pages/wiki/ComingSoon';
import FaqWiki from './pages/wiki/FaqWiki';
import WorldToursWiki from './pages/wiki/WorldToursWiki';
import RatingSystem from './pages/wiki/RatingSystem';
import PirepsWiki from './pages/wiki/PirepsWiki';
import LiveMapWiki from './pages/wiki/LiveMapWiki';
import DashboardWiki from './pages/wiki/DashboardWiki';
import MembersWiki from './pages/wiki/MembersWiki';
import ReactivateAccount from './pages/ReactivateAccount';
import InactiveProfile from './pages/InactiveProfile';

function App() {
  return (
    <ThemeProvider theme={aviationTheme}>
      <Routes>
        {/* Public Routes - Wrapped in Box or Fragment to apply theme background if needed, but pages handle it self */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/request/passworld_reset" element={<PassworldResetRequest />} />
        <Route path="/password_reset" element={<PasswordResetConfirm />} />
        <Route path="/reactivate-account" element={<ReactivateAccount />} />
        <Route path="/inactive-profile" element={<InactiveProfile />} />
        
        {/* Redirect /admin to Django Admin */}
        <Route path="/admin" element={<AdminRedirect />} />
        
        {/* Wiki Layout (Completely detached from dashboard) */}
        <Route path="/wiki" element={<WikiLayout />}>
            <Route index element={<DashboardWiki />} />
            <Route path="faq" element={<FaqWiki />} />
            <Route path="world-tours" element={<WorldToursWiki />} />
            <Route path="rating-system" element={<RatingSystem />} />
            <Route path="my-flights" element={<PirepsWiki />} />
            <Route path="live-map" element={<LiveMapWiki />} />
            <Route path="dashboard" element={<DashboardWiki />} />
            <Route path="members" element={<MembersWiki />} />
            {/* Catch-all for other unimplemented pages */}
            <Route path="*" element={<ComingSoon />} />
        </Route>
        
        {/* Protected Application Routes - Wrapped in Layout */}
        <Route path="/app" element={<Layout />}>
          <Route element={<ProtectedRoutes />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="awards" element={<Awards />} />
            <Route path="my-flights" element={<MyFlights />} />
            <Route path="my-awards" element={<MyAwards />} />
            <Route path="map" element={<Map />} />

            <Route path="members" element={<Members />} />
            <Route path="pirepsflights" element={<PirepsFlights />} />
            <Route path="edit-pirep/:id" element={<EditPirep />} />
            <Route path="briefing/:id" element={<Briefing />} />
            <Route path="awards/awardDetail/:id" element={<AwardDetail />} />
            <Route path="userdetail/:id" element={<UserDetail />} />
            <Route path="profile/edit" element={<ProfileEdit />} />    
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
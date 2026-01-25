import { ThemeProvider } from '@mui/material/styles';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout'; // New Layout Wrapper
import aviationTheme from './theme/aviationTheme'; // Global Theme

import ProtectedRoutes from './components/ProtectedRoutes';
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
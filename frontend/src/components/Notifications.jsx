import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  FlightTakeoff as FlightTakeoffIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import AxiosInstance from '../components/AxiosInstance';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  const fetchNotifications = () => {
    AxiosInstance.get("notifications/")
      .then((res) => {
        setNotifications(res.data);
        setError(null);
      })
      .catch((error) => {
        console.error("Erro ao buscar notificações:", error);
        setError("Erro ao carregar notificações. Tente novamente mais tarde.");
      });
  };

  const handleDismissNotification = (id) => {
    AxiosInstance.post(`notifications/${id}/mark_as_read/`)
      .then(() => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      })
      .catch((error) => {
        console.error("Erro ao marcar notificação como lida:", error);
      });
  };

  return { notifications, error, fetchNotifications, handleDismissNotification };
};

const Notifications = () => {
  const { notifications, error, fetchNotifications, handleDismissNotification } = useNotifications();
  const [anchorNotif, setAnchorNotif] = useState(null);
  const notifOpen = Boolean(anchorNotif);

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton color="inherit" onClick={(e) => setAnchorNotif(e.currentTarget)}>
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorNotif}
        open={notifOpen}
        onClose={() => setAnchorNotif(null)}
        PaperProps={{
          sx: { width: 320, maxHeight: 400, overflowY: "auto" },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem>No notifications</MenuItem>
        ) : (
          notifications.map((notif, index) => (
            <Box key={notif.id}>
              <MenuItem sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {notif.message.includes("aprovado") ? (
                  <FlightTakeoffIcon color="success" sx={{ fontSize: 40 }} />
                ) : notif.message.includes("rejeitado") ? (
                  <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                ) : (
                  <Avatar src={notif.image} sx={{ width: 40, height: 40, borderRadius: "50%" }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                    {notif.message}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => handleDismissNotification(notif.id)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Menu>
    </>
  );
};

export default Notifications;
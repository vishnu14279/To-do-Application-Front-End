import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import { jwtDecode } from "jwt-decode";
import { Badge, Row, Col, Layout, Card, Dropdown, Menu, Avatar, Modal, notification } from "antd";
import { BellOutlined, UserOutlined, HistoryOutlined } from "@ant-design/icons";
import TaskManager from "./components/TaskManager";
import axios from "axios";
import ActivityLog from "./components/ActivityLog";
import { useDispatch } from "react-redux";
import { setAllUsers } from "./store/userSlice";
import NotificationCenter from "./components/NotificationCenter";
import io from "socket.io-client";

const { Header, Content } = Layout;

const App = () => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? { token, user: jwtDecode(token) } : null;
  });
  const [userData, setUserData] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const apiUrl = "https://to-do-application-back-end.onrender.com";
  const dispatch = useDispatch();
  const socket = io(apiUrl);

  useEffect(() => {
    if (auth?.user?.id) {
      axios.get(`${apiUrl}/api/users/fetchUser/${auth.user.id}`)
        .then((response) => {
          setUserData(response.data);
        })
        .catch((error) => console.error("Error fetching user data:", error));
    }
  }, [auth]);

  useEffect(() => {
    axios.get(`${apiUrl}/api/users/all`)
      .then((response) => {
        dispatch(setAllUsers(response.data));
      })
      .catch((error) => console.error("Error fetching all users:", error));
  }, [dispatch]);

  useEffect(() => {
    if (auth?.user?.id) {
      axios.get(`${apiUrl}/api/notifications/${auth.user.id}`)
        .then((response) => {
          setNotifications(response.data);
          socket.emit("newNotification", response.data);

        })
        .catch((error) => console.error("Error fetching notifications:", error));
    }
  }, [auth]);
  useEffect(() => {
    if (auth?.user?.id) {
      socket.on("newNotification", (newNotification) => {
        if (auth?.user?.id === newNotification.userId) {
          axios.get(`${apiUrl}/api/notifications/${newNotification.userId}`)
            .then((response) => {
              // Only set notifications that belong to the logged-in user
              setNotifications(response.data);
              response.data
                .filter(notificationData => !notificationData.read) // Filter out read notifications
                .reverse()
                .forEach(notificationData => {
                  notification.open({
                    message: "New Notification",
                    description: notificationData.message || "You have a new notification.",
                    placement: 'topRight',
                    duration: 0,
                    onClick: () => {
                      console.log("Notification clicked");
                    },
                  });
                })
            })
            .catch((error) => console.error("Error fetching notifications:", error));

        }
      });

      return () => {
        socket.off("newNotification");
      };
    }
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuth({ token: null, user: null });
    setUserData(null);
    window.location.reload();
  };

  const profileMenu = (
    <Menu>
      <Menu.Item key="user-info" disabled>
        <div style={{ lineHeight: "1.5" }}>
          <span style={{ fontWeight: "bold" }}>Name:</span>{" "}
          <span style={{ fontWeight: "500" }}>{userData?.name || "User"}</span> <br />
          <span style={{ fontWeight: "bold" }}>Role:</span>{" "}
          <span style={{ fontWeight: "500" }}>{userData?.role || "Role"}</span>
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        onClick={handleLogout}
        style={{
          backgroundColor: "red",
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
          borderRadius: "5px",
          padding: "10px",
        }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );


  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ padding: "0 20px", backgroundColor: "#001529", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Row justify="space-between" align="middle" style={{ width: "100%" }}>
          <Col>
               <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Icon */}
                  <img 
                    src="https://play-lh.googleusercontent.com/-HVJ0Nk8pks9-172JJSBsORCJpKd9b2A6E6EcQfVsgQzBQgI5uqsFiy8bGSwscyD_w" 
                    alt="App Icon" 
                    style={{ width: 40, height: 40, marginRight: 10 }} 
                  />
                  {/* Text */}
                  <h2 style={{ color: "white", margin: 0 }}>To Do</h2>
                </div>
          </Col>
          {auth && (
            <Col>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Badge count={notifications.filter(notification => !notification.read).length} style={{ marginRight: 20 }}>
                  <BellOutlined
                    style={{ fontSize: 24, color: "white", cursor: "pointer" }}
                    onClick={() => setNotificationVisible(true)}
                  />
                </Badge>
                <Badge count={0} style={{ marginRight: 20 }}>
                  <HistoryOutlined
                    style={{ fontSize: 24, color: "white", cursor: "pointer" }}
                    onClick={() => setDrawerVisible(true)}
                  />
                </Badge>
                <Dropdown overlay={profileMenu} trigger={['click']}>
                  <Avatar
                    style={{ backgroundColor: "#87d068", cursor: "pointer" }}
                    icon={<UserOutlined />}
                  />
                </Dropdown>
              </div>
            </Col>
          )}
        </Row>
      </Header>

      <Content style={{ padding: "20px" }}>
        <Row justify="center" gutter={[16, 16]}>
          {auth ? (
            <Col xs={24} sm={24} md={20} lg={18}>
              <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
                <TaskManager userData={userData?.userId} userRole={userData?.role} username={userData?.name} />
              </Card>
            </Col>
          ) : (
            <Col xs={24} sm={24} md={16} lg={12}>
              <Auth setAuth={setAuth} />
            </Col>
          )}
        </Row>
      </Content>

      <ActivityLog
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        userId={auth?.user?.id}
      />

      <NotificationCenter
        notifications={notifications}

        setNotifications={setNotifications}
        notificationVisible={notificationVisible}
        setNotificationVisible={setNotificationVisible}
        userId={auth?.user?.id}

      />
    </Layout>
  );
};

export default App;

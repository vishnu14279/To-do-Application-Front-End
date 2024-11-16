import React, { useState } from "react";
import axios from "axios";
import { Input, Button, Row, Col, Typography, message, Select } from "antd";
import { jwtDecode } from "jwt-decode";

const { Title } = Typography;
const { Option } = Select;

const Auth = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", role: "User" });
  const apiUrl = "http://localhost:3001";

  const toggleMode = () => setIsLogin((prev) => !prev);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setForm({ ...form, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isLogin ? `${apiUrl}/api/auth/login` : `${apiUrl}/api/auth/register`;
      const { data } = await axios.post(url, form);

      if (isLogin) {
        const decoded = jwtDecode(data.token);
        localStorage.setItem("token", data.token);
        setAuth({ token: data.token, user: decoded });
        message.success("Login successful!");
      } else {
        message.success("Registration successful! Please log in.");
        toggleMode();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      message.error("Authentication failed! Please try again.");
    }
  };

  return (
    <Row justify="center" align="middle" style={{ height: "100vh", backgroundColor: "#f7f7f7" }}>
      <Col xs={24} sm={22} md={18} lg={12} xl={8} style={{ minWidth: "300px" }}>
        <div style={{ padding: "30px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", backgroundColor: "#ffffff" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <Title level={3} style={{ color: "#444" }}>{isLogin ? "Login" : "Register"}</Title>
          </div>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <Input
                placeholder="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                style={{ marginBottom: "15px", width: "100%" }}
              />
            )}
            <Input
              placeholder="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ marginBottom: "15px", width: "100%" }}
            />
            <Input
              placeholder="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ marginBottom: "15px", width: "100%" }}
            />
            {!isLogin && (
              <Select
                placeholder="Select Role"
                name="role"
                value={form.role}
                onChange={handleRoleChange}
                required
                style={{ marginBottom: "15px", width: "100%" }}
              >
                <Option value="User">User</Option>
                <Option value="Admin">Admin</Option>
              </Select>
            )}
            <Button type="primary" htmlType="submit" block style={{ marginBottom: "15px", fontSize: "16px" }}>
              {isLogin ? "Login" : "Register"}
            </Button>
            <Button type="link" onClick={toggleMode} block style={{ color: "#1890ff", fontSize: "16px" }}>
              {isLogin ? "Need an account? Register" : "Already registered? Login"}
            </Button>
          </form>
        </div>
      </Col>
    </Row>
  );
};

export default Auth;

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTasks, addTask, updateTask, deleteTask } from "../store/taskSlice";
import { Button, List, message, Modal, Form, Input, DatePicker, Select, Divider, Row, Col, Typography, Card } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import axios from "axios";
import io from "socket.io-client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "./TaskManager.css"
dayjs.extend(utc);
const { Option } = Select;

const TaskManager = ({ userData, userRole, username }) => {
    const dispatch = useDispatch();
    const tasks = useSelector((state) => state.tasks.tasks);
    const apiUrl = "https://to-do-application-back-end.onrender.com";
    const { Title } = Typography;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [filters, setFilters] = useState({ status: "", dueDate: "" });
    const [isUpdating, setIsUpdating] = useState(false);
    const [users, setUsers] = useState([]);
    const [currentTaskId, setCurrentTaskId] = useState(null);
    const [sortAscending, setSortAscending] = useState(true);
    const [currentTaskDetails, setCurrentTaskDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const token = localStorage.getItem("token");

    const axiosInstance = axios.create({
        baseURL: apiUrl,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const socket = io(apiUrl);

    const fetchTasks = async (filters = {}) => {
        try {
            const { data } = await axiosInstance.get("/api/tasks", { params: { ...filters, sortOrder: sortAscending ? "asc" : "desc" }, });
            dispatch(setTasks(data));
        } catch (error) {
            console.error("Error fetching tasks:", error);
            message.error("Failed to fetch tasks!");
        }
    };
    const fetchUsers = async () => {
        try {
            const { data } = await axiosInstance.get("/api/users/all");
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            message.error("Failed to fetch users!");
        }
    };
    const hasPermission = (task) => {
        if (userRole === "Admin") return true; // Admin can always perform actions
        return userData === task.privilegeId; // User can only perform actions on their own tasks
    };

    const handleDetailsModal = (task) => {
        setCurrentTaskDetails(task);
        setIsDetailsModalOpen(true);
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setCurrentTaskDetails(null);
    };

    const handleAddTask = async (values) => {
        try {
            const newTask = {
                ...values,
                dueDate: dayjs(values.dueDate).utc().format(),
                privilegeId: userData,
                userid: userData,
                username: username
            };
            const { data } = await axiosInstance.post("/api/tasks", newTask);
            socket.emit("taskCreated", data);
            dispatch(addTask(data));
            message.success("Task added successfully!");
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error("Error adding task:", error);
            message.error("Failed to add task!");
        }
    };

    const handleUpdateTask = async (taskId, updatedTask) => {
        try {

            if (userData) {
                updatedTask.dueDate = dayjs(updatedTask.dueDate).utc().format();
                updatedTask.privilegeId = userData;
                updatedTask.userid = userData;
                updatedTask.username = username
            }

            const { data } = await axiosInstance.put(`/api/tasks/updateTask/${taskId}`, updatedTask);
            socket.emit("taskUpdated", data);
            dispatch(updateTask(data));
            message.success("Task updated successfully!");
            setIsModalOpen(false);
            form.resetFields();
            setIsUpdating(false);
        } catch (error) {
            console.error("Error updating task:", error);
            message.error("Failed to update task!");
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await axiosInstance.delete(`/api/tasks/deleteTask/${taskId}/${userData}`);
            socket.emit("taskDeleted", taskId);
            dispatch(deleteTask(taskId));
            message.success("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            message.error("Failed to delete task!");
        }
    };

    useEffect(() => {
        fetchTasks(filters); // Fetch tasks with filters
        fetchUsers();
    }, [filters, dispatch]);

    // Listen for socket events to update tasks in real-time
    useEffect(() => {
        socket.on("taskCreated", (task) => {
            dispatch(addTask(task));
        });

        socket.on("taskUpdated", (task) => {
            dispatch(updateTask(task));
        });

        socket.on("taskDeleted", (taskId) => {
            dispatch(deleteTask(taskId));
        });

        return () => {
            socket.off("taskAdded");
            socket.off("taskUpdated");
            socket.off("taskDeleted");
        };
    }, [dispatch]);

    const showModal = (task) => {
        if (task) {
            setIsUpdating(true);
            setCurrentTaskId(task._id);  // current task ID for updating
            form.setFieldsValue({
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ? dayjs(task.dueDate) : null,
                status: task.status,
                assignedUser: task.assignedUser,
            });
        } else {
            setIsUpdating(false);
        }
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
        setIsUpdating(false);
    };

    const handleFilterChange = (value, field) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: value,
        }));
    };

    const getButtonColor = (status) => {
        switch (status) {
            case "Done":
                return "green";
            case "In Progress":
                return "blue";
            case "To Do":
                return "red";
            default:
                return "default";
        }
    };
    const toggleSortDirection = () => {
        setSortAscending(!sortAscending);
        fetchTasks(filters);
    };
    return (
        <div>

            <div style={{ marginBottom: "20px" }}>
                <Row gutter={16}>
                    {/* Filter by Status */}
                    <Col span={8}>
                        <Select
                            style={{ width: "100%" }}
                            placeholder="Filter by Status"
                            onChange={(value) => handleFilterChange(value, "status")}
                            defaultValue={""}
                        >
                            <Option value="">All Status</Option>
                            <Option value="To Do">To Do</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Done">Done</Option>
                        </Select>
                    </Col>

                    {/* Filter by Due Date */}
                    <Col span={8}>
                        <DatePicker
                            style={{ width: "100%" }}
                            placeholder="Filter by Due Date"
                            onChange={(date) => handleFilterChange(date, "dueDate")}
                        />
                    </Col>

                    {/* Add Task Button */}
                    <Col span={8}>
                        <Button type="primary" onClick={() => showModal(null)} style={{ width: "100%" }}>
                            Add Task
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Main Layout with Flex */}
            <div style={{ display: "flex", justifyContent: "space-between", height: "600px" }}>
                {/* Left Section - Current Tasks */}
                <div style={{ width: "48%", overflowY: "auto" }}>
                    <div className="sortIcon">
                        <h3>Current Tasks</h3>
                        <Button onClick={toggleSortDirection}>
                            {sortAscending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                        </Button>
                    </div>
                    <List
                        dataSource={tasks.filter((task) => task.status !== "Done")}
                        renderItem={(task) => (

                            <List.Item
                                actions={[
                                    hasPermission(task) && (
                                        <Button
                                            onClick={() => handleUpdateTask(task._id, { status: "Done" })}
                                            style={{ backgroundColor: getButtonColor("Done"), color: "white" }}
                                        >
                                            Mark as Done
                                        </Button>
                                    ),
                                    hasPermission(task) && (
                                        <Button
                                            onClick={() => showModal(task)} // Open the task in edit mode
                                            style={{ backgroundColor: "orange", color: "white" }}
                                        >
                                            Update
                                        </Button>
                                    ),
                                    hasPermission(task) && (
                                        <Button
                                            onClick={() => handleDetailsModal(task)} // Show task details in modal
                                            style={{ backgroundColor: "gray", color: "white" }}
                                        >
                                            Details
                                        </Button>
                                    ),
                                    hasPermission(task) && (
                                        <Button
                                            onClick={() => handleDeleteTask(task._id)}
                                            danger
                                            icon={<DeleteOutlined />}
                                        />
                                    ),
                                ]}
                            >
                                <List.Item.Meta
                                    title={task.title}
                                    description={`${task.description} - ${task.status} - Due: ${task.dueDate}`}
                                />
                            </List.Item>
                        )}
                    />
                </div>

                {/* Divider Line */}
                <Divider type="vertical" style={{ height: "100%", margin: "0 20px" }} />

                {/* Right Section - Completed Tasks */}
                <div style={{ width: "48%", overflowY: "auto" }}>
                    <div className="sortIcon">
                        <h3>Completed Tasks</h3>
                        <Button onClick={toggleSortDirection}>
                            {sortAscending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                        </Button>
                    </div>
                    <List
                        dataSource={tasks.filter((task) => task.status === "Done")}
                        renderItem={(task) => (
                            <List.Item
                                actions={[
                                    hasPermission(task) && (
                                        <Button
                                            onClick={() => handleUpdateTask(task._id, { status: "To Do" })}
                                            style={{ backgroundColor: getButtonColor("To Do"), color: "white" }}
                                        >
                                            Mark as Undone
                                        </Button>
                                    ),
                                    hasPermission(task) && (
                                        <Button
                                            onClick={() => handleDeleteTask(task._id)}
                                            danger
                                            icon={<DeleteOutlined />}
                                        />
                                    ),
                                ]}
                            >
                                <List.Item.Meta
                                    title={task.title}
                                    description={`${task.description} - ${task.status} - Due: ${task.dueDate}`}
                                />
                            </List.Item>
                        )}
                    />
                </div>
                <Modal
                    title="Task Details"
                    visible={isDetailsModalOpen}
                    onCancel={handleDetailsModalClose}
                    footer={null}
                    width={600}
                >
                    {currentTaskDetails && (
                        <Card>
                            <p><strong>Title:</strong> {currentTaskDetails.title}</p>
                            <p><strong>Description:</strong> {currentTaskDetails.description}</p>
                            <p><strong>Status:</strong> {currentTaskDetails.status}</p>
                            <p><strong>Due Date:</strong> {dayjs(currentTaskDetails.dueDate).format("YYYY-MM-DD")}</p>
                            <p><strong>Assigned User:</strong> {currentTaskDetails.assignedUser}</p>
                        </Card>
                    )}
                </Modal>
            </div>

            {/* Modal to Add or Update Task */}
            <Modal
                visible={isModalOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={() => form.submit()}
                    >
                        {isUpdating ? "Update Task" : "Add Task"}
                    </Button>,
                ]}
            >

                <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                    <Title level={3} style={{ textAlign: "center", marginBottom: "20px" }}>
                        {isUpdating ? "Update Task" : "Add Task"}
                    </Title>

                    <Form
                        form={form}
                        onFinish={(values) => {
                            const updatedTask = {
                                ...values,
                                dueDate: values.dueDate.format("YYYY-MM-DD"),
                            };
                            if (isUpdating) {
                                handleUpdateTask(currentTaskId, updatedTask);
                            } else {
                                handleAddTask(updatedTask);
                            }
                        }}
                        layout="vertical"
                    >
                        {/* Title Input */}
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: "Please input the title!" }]}
                        >
                            <Input placeholder="Enter task title" />
                        </Form.Item>

                        {/* Description Input */}
                        <Form.Item
                            label="Description"
                            name="description"
                            rules={[{ required: true, message: "Please input the description!" }]}
                        >
                            <Input.TextArea placeholder="Enter task description" rows={4} />
                        </Form.Item>

                        {/* Due Date Picker */}
                        <Form.Item
                            name="dueDate"
                            label="Due Date"
                            rules={[{ required: true, message: "Please select a due date" }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                placeholder="Select due date"
                            />
                        </Form.Item>

                        {/* Status Select */}
                        <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                            <Select placeholder="Select task status">
                                <Option value="To Do">To Do</Option>
                                <Option value="In Progress">In Progress</Option>
                                <Option value="Done">Done</Option>
                            </Select>
                        </Form.Item>

                        {/* Assigned User Select */}
                        <Form.Item
                            label="Assigned User"
                            name="assignedUser"
                            rules={[{ required: true, message: "Please select a user to assign" }]}
                        >
                            <Select placeholder="Select user to assign">
                                {users.map((user) => (
                                    <Option key={user._id} value={user._id}>
                                        {user.username}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default TaskManager;

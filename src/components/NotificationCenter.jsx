import React, { useState } from 'react';
import { Modal, List, Button } from 'antd';
import axios from 'axios';

const NotificationCenter = ({ notifications, setNotifications, setNotificationVisible, notificationVisible, userId }) => {
    const token = localStorage.getItem("token");
    const apiUrl = "https://to-do-application-back-end.onrender.com";

    const axiosInstance = axios.create({
        baseURL: apiUrl,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const markAsRead = async (notificationId) => {
        try {
            await axiosInstance.patch(`/api/notifications/${notificationId}`, { read: true });
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification._id === notificationId ? { ...notification, read: true } : notification
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };


    return (
        <>
            <Modal
                title="Notifications"
                visible={notificationVisible}
                onCancel={() => setNotificationVisible(false)}
                footer={null}
            >
                <List
                    dataSource={notifications}
                    renderItem={(notification) => (
                        <List.Item
                            actions={[
                                !notification.read && (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={() => markAsRead(notification._id)}
                                    >
                                        Mark as Read
                                    </Button>
                                ),
                            ]}
                        >
                            <List.Item.Meta
                                title={notification.message}
                                description={new Date(notification.timestamp).toLocaleString()}
                            />
                        </List.Item>
                    )}
                    locale={{ emptyText: 'No new notifications' }}
                />
            </Modal>
        </>
    );
};

export default NotificationCenter;

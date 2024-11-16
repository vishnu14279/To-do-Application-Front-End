import React, { useState, useEffect } from "react";
import { Drawer, Timeline } from "antd";
import { io } from "socket.io-client";
import { useSelector } from 'react-redux';
import { selectAllUsers } from '../store/userSlice';

const ActivityLog = ({ visible, onClose, userId }) => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = io("http://localhost:3001");
  const allUsers = useSelector(selectAllUsers);

  const formatActivityLog = (log) => {
    const user = allUsers.find((user) => user._id === log.userId);
    const taskDescription = log.description || `Task ${log.taskId}`;

    let actionDescription = `${user ? user.username : 'User'}`;

    if (log.action === "created") {
      actionDescription += ` created the task ${log.title}`;
    } else if (log.action === "updated") {
      actionDescription += ` updated the task ${log.title}`;
    } else {
      actionDescription += ` performed an action on the task ${log.title}`;
    }

    if (log.status === "In Progress") {
      actionDescription += ` and marked it as In-Progress`;
    } else if (log.status === "To Do") {
      actionDescription += ` and moved it to To-Do`;
    } else if (log.status === "Done") {
      actionDescription += ` and marked it as Done`;
    }

    actionDescription += ` on ${new Date(log.timestamp).toLocaleString()}`;

    return actionDescription;
  };



  useEffect(() => {
    if (visible && userId) {
      socket.emit("get-activity-logs");

      socket.on("activity-logs", (logs) => {
        setActivityLogs(logs);
        setLoading(false);
      });

      return () => {
        socket.off("activity-logs");
      };
    }
  }, [visible, userId, socket]);

  return (
    <Drawer
      title="Activity Log"
      placement="right"
      width={400}
      visible={visible}
      onClose={onClose}
    >
      <Timeline>
        {loading ? (
          <Timeline.Item>Loading...</Timeline.Item>
        ) : activityLogs.length > 0 ? (
          activityLogs.map((log) => (
            <Timeline.Item key={log._id}>
              <strong>{formatActivityLog(log)}</strong>
            </Timeline.Item>
          ))
        ) : (
          <Timeline.Item>No activity logs available</Timeline.Item>
        )}
      </Timeline>
    </Drawer>
  );
};

export default ActivityLog;

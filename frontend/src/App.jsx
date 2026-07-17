import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, Calendar, AlertCircle, Filter, 
  ArrowUpDown, CheckCircle, FolderPlus, Folder, 
  X, Loader2, Sparkles, UserCheck, Users, ShieldAlert, CheckSquare, Search, Bell
} from 'lucide-react';

export default function App() {
  // Enterprise Users State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Application State
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [columns, setColumns] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [sortBy, setSortBy] = useState('sequence');
  const [sortOrder, setSortOrder] = useState('asc');

  // Drag and Drop Visual States
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const shownToastsRef = useRef(new Set());

  // Modal Dialog States
  const [modals, setModals] = useState({
    workspace: { show: false, mode: 'create', data: null },
    column: { show: false, mode: 'create', data: null },
    task: { show: false, mode: 'create', data: null, columnId: null },
    members: { show: false }
  });

  // Form Fields
  const [workspaceForm, setWorkspaceForm] = useState({ name: '' });
  const [columnForm, setColumnForm] = useState({ name: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [inviteMemberId, setInviteMemberId] = useState('');
  const [userForm, setUserForm] = useState({ username: '', email: '', role: 'CONTRIBUTOR' });

  // Active Task Subtasks and Comments
  const [activeTaskComments, setActiveTaskComments] = useState([]);
  const [activeTaskSubtasks, setActiveTaskSubtasks] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Login form
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Change password states
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [changePasswordForm, setChangePasswordForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });

  // Helper: Request Headers with Authentication Context
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-User-Id': currentUser ? currentUser.id.toString() : ''
    };
  };

  // ----------------------------------------------------
  // Lifecycle & Fetching Data
  // ----------------------------------------------------
  useEffect(() => {
    loadUsers();
    const saved = localStorage.getItem("activeUser");
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) return;
    const interval = setInterval(() => {
      loadUsers();
    }, 2000);
    return () => clearInterval(interval);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      if (shownToastsRef.current) {
        shownToastsRef.current.clear();
      }
      fetchWorkspaces();
      fetchNotifications();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
      const wsUrl = `ws://${window.location.hostname}:8085/ws-updates`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        if (event.data === 'REFRESH') {
          fetchFilteredTasks();
          fetchNotifications();
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser, currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchColumns(currentWorkspace.id);
    } else {
      setColumns([]);
      setFilteredTasks([]);
    }
  }, [currentWorkspace]);

  // Re-fetch tasks whenever filters, sorting, workspace, or active user changes
  useEffect(() => {
    if (currentWorkspace && currentUser) {
      fetchFilteredTasks();
    }
  }, [currentWorkspace, currentUser, searchQuery, priorityFilter, overdueFilter, sortBy, sortOrder]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      if (!res.ok) throw new Error('Failed to load system users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        
        // Detect new unread notifications and trigger toast alert
        const now = new Date();
        
        data.forEach(n => {
          if (!n.readStatus && !shownToastsRef.current.has(n.id)) {
            // Only trigger toast for recently created alerts (last 15 seconds) to prevent duplicates on user switch
            const created = new Date(n.createdAt);
            if (now - created < 15000) {
              showToast(`🔔 ${n.message}`, 'success');
            }
            shownToastsRef.current.add(n.id);
          }
        });

        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/v1/notifications/read', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      }
    } catch (err) {
      showToast('Failed to mark notifications as read', 'error');
    }
  };

  const fetchWorkspaces = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/v1/workspaces', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      const data = await res.json();
      setWorkspaces(data);
      
      // Select the first available workspace if none selected or the previous one is not available
      if (data.length > 0) {
        const stillExists = currentWorkspace ? data.find(w => w.id === currentWorkspace.id) : null;
        if (stillExists) {
          setCurrentWorkspace(stillExists);
        } else {
          setCurrentWorkspace(data[0]);
        }
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchColumns = async (workspaceId) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/columns`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load board columns');
      const data = await res.json();
      setColumns(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredTasks = async () => {
    if (!currentWorkspace || !currentUser) return;
    try {
      const params = new URLSearchParams();
      if (priorityFilter) params.append('priority', priorityFilter);
      if (overdueFilter) params.append('overdue', 'true');
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const res = await fetch(`/api/v1/workspaces/${currentWorkspace.id}/tasks/filter?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to filter tasks');
      const data = await res.json();
      setFilteredTasks(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // Authentication & Session Handlers
  // ----------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    try {
      const res = await fetch('/api/v1/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Invalid username or password');
      }
      const user = await res.json();
      setCurrentUser(user);
      localStorage.setItem("activeUser", JSON.stringify(user));
      showToast(`Welcome back, ${user.username}!`, 'success');
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("activeUser");
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setColumns([]);
    setFilteredTasks([]);
    showToast('Logged out successfully', 'success');
  };

  const handleSendOtp = async () => {
    try {
      const res = await fetch('/api/v1/users/send-otp', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setOtpMessage(data.message);
      setOtpSent(true);
      showToast('OTP code has been generated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!changePasswordForm.otp || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    try {
      const res = await fetch('/api/v1/users/change-password', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          otp: changePasswordForm.otp,
          newPassword: changePasswordForm.newPassword
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Invalid or expired OTP code');
      }
      showToast('Password updated successfully', 'success');
      setChangePasswordModal(false);
      setOtpSent(false);
      setOtpMessage('');
      setChangePasswordForm({ otp: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // Subtasks & Comments Detail Modal Handlers
  // ----------------------------------------------------
  const handleOpenTaskModal = (task, column) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      assigneeId: task.assigneeId || ''
    });
    
    setActiveTaskComments(task.comments || []);
    setActiveTaskSubtasks(task.subtasks || []);
    setNewCommentText('');
    setNewSubtaskTitle('');
    
    setModals(prev => ({ 
      ...prev, 
      task: { 
        show: true, 
        mode: isAdmin ? 'edit' : 'view', 
        data: task, 
        columnId: column.id 
      } 
    }));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !modals.task.data) return;
    try {
      const res = await fetch(`/api/v1/tasks/${modals.task.data.id}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: newCommentText })
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to add comment');
      
      setActiveTaskComments(prev => [...prev, resJson]);
      setNewCommentText('');
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !modals.task.data) return;
    try {
      const res = await fetch(`/api/v1/tasks/${modals.task.data.id}/subtasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newSubtaskTitle })
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to add subtask');
      
      setActiveTaskSubtasks(prev => [...prev, resJson]);
      setNewSubtaskTitle('');
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const res = await fetch(`/api/v1/subtasks/${subtaskId}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to toggle subtask');
      
      setActiveTaskSubtasks(prev => prev.map(s => s.id === subtaskId ? resJson : s));
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const res = await fetch(`/api/v1/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to delete subtask');
      }
      
      setActiveTaskSubtasks(prev => prev.filter(s => s.id !== subtaskId));
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // CRUD Actions - Workspaces
  // ----------------------------------------------------
  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    try {
      const url = modals.workspace.mode === 'edit' 
        ? `/api/v1/workspaces/${modals.workspace.data.id}`
        : '/api/v1/workspaces';
      const method = modals.workspace.mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(workspaceForm)
      });
      
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to save workspace');

      showToast(`Workspace "${resJson.name}" saved successfully`, 'success');
      setModals(prev => ({ ...prev, workspace: { show: false } }));
      setWorkspaceForm({ name: '' });
      
      fetchWorkspaces().then(() => {
        if (modals.workspace.mode === 'create') {
          setCurrentWorkspace(resJson);
        }
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm('Delete workspace? This soft-deletes all child columns and tasks recursively!')) return;
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to delete workspace');
      }
      showToast('Workspace deleted', 'success');
      fetchWorkspaces();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteMemberId) return;
    try {
      const res = await fetch(`/api/v1/workspaces/${currentWorkspace.id}/invite?memberId=${inviteMemberId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Invitation failed');

      showToast('Member invited successfully', 'success');
      setInviteMemberId('');
      fetchWorkspaces(); // Reload workspace details (assignedMembers)
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // CRUD Actions - Columns
  // ----------------------------------------------------
  const handleSaveColumn = async (e) => {
    e.preventDefault();
    try {
      const url = modals.column.mode === 'edit'
        ? `/api/v1/columns/${modals.column.data.id}`
        : `/api/v1/workspaces/${currentWorkspace.id}/columns`;
      const method = modals.column.mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(columnForm)
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to save column');
      
      showToast('Column saved', 'success');
      setModals(prev => ({ ...prev, column: { show: false } }));
      setColumnForm({ name: '' });
      fetchColumns(currentWorkspace.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm('Delete this column and all its tasks?')) return;
    try {
      const res = await fetch(`/api/v1/columns/${columnId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to delete column');
      }
      showToast('Column deleted', 'success');
      fetchColumns(currentWorkspace.id);
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // CRUD Actions - Tasks
  // ----------------------------------------------------
  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const url = modals.task.mode === 'edit'
        ? `/api/v1/tasks/${modals.task.data.id}`
        : `/api/v1/columns/${modals.task.columnId}/tasks`;
      const method = modals.task.mode === 'edit' ? 'PUT' : 'POST';

      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || null,
        assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to save task card');

      showToast('Task card saved', 'success');
      setModals(prev => ({ ...prev, task: { show: false } }));
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task card?')) return;
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to delete task');
      }
      showToast('Task card deleted', 'success');
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...userForm,
        password: userForm.username.trim().toLowerCase() + '123'
      };
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to register user');

      showToast(`User "${resJson.username}" registered! Default password: ${resJson.username.toLowerCase()}123`, 'success');
      setUserForm({ username: '', email: '', role: 'CONTRIBUTOR' });
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user from the entire enterprise system? This will unassign them from all tasks.')) return;
    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to delete user');
      }
      showToast('User deleted successfully', 'success');
      loadUsers();
      // Refresh current workspace to update members list
      if (currentWorkspace) {
        fetchWorkspaces();
        const wsRes = await fetch(`/api/v1/workspaces/${currentWorkspace.id}`, { headers: getAuthHeaders() });
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setCurrentWorkspace(wsData);
        }
      }
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to approve task');
      }
      showToast('Task approved successfully', 'success');
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/reject`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to reject task');
      }
      showToast('Task rejected and sent back to To Do', 'success');
      fetchFilteredTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ----------------------------------------------------
  // Optimistic Drag & Drop Reshuffling with Rollback
  // ----------------------------------------------------
  const handleDragStart = (e, taskId, sourceColumnId, index) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, sourceColumnId, index }));
    setDraggingTaskId(taskId);
  };

  const handleDragOverColumn = (e, columnId) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  const handleDropOnColumn = (e, targetColumnId) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;

    const { taskId, sourceColumnId, index: sourceIndex } = JSON.parse(dataStr);
    
    setDraggingTaskId(null);
    setDragOverColumnId(null);

    const targetTasks = filteredTasks.filter(t => t.columnId === targetColumnId).sort((a,b) => a.sequenceIndex - b.sequenceIndex);
    
    if (sourceColumnId === targetColumnId) {
      moveTaskOptimistically(taskId, sourceColumnId, targetColumnId, sourceIndex, targetTasks.length - 1);
    } else {
      moveTaskOptimistically(taskId, sourceColumnId, targetColumnId, sourceIndex, targetTasks.length);
    }
  };

  const handleDropOnCard = (e, targetColumnId, targetIndex) => {
    e.stopPropagation();
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;

    const { taskId, sourceColumnId, index: sourceIndex } = JSON.parse(dataStr);

    setDraggingTaskId(null);
    setDragOverColumnId(null);

    moveTaskOptimistically(taskId, sourceColumnId, targetColumnId, sourceIndex, targetIndex);
  };

  const moveTaskOptimistically = async (taskId, sourceColId, targetColId, sourceIdx, targetIdx) => {
    const taskToMove = filteredTasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // Check if Developer is moving to Done
    const targetCol = columns.find(c => c.id === targetColId);
    const isTargetDone = targetCol && targetCol.name.trim().toLowerCase() === 'done';
    if (currentUser?.role === 'CONTRIBUTOR' && isTargetDone) {
      if (!window.confirm("Moving this task to Done requires QA verification. Are you sure you want to submit it for approval?")) {
        return;
      }
    }

    // Backup current state for potential rollback
    const backupState = [...filteredTasks];

    // Local clone for mutation
    let updatedTasks = filteredTasks.map(t => ({ ...t }));

    if (sourceColId === targetColId) {
      // Intra-column move
      const colTasks = updatedTasks.filter(t => t.columnId === sourceColId).sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      const item = colTasks.find(t => t.id === taskId);
      if (!item) return;

      colTasks.splice(sourceIdx, 1);
      
      let finalTargetIdx = targetIdx;
      if (finalTargetIdx > colTasks.length) finalTargetIdx = colTasks.length;
      colTasks.splice(finalTargetIdx, 0, item);

      colTasks.forEach((t, i) => {
        t.sequenceIndex = i;
      });

      updatedTasks = updatedTasks.map(t => {
        const match = colTasks.find(ct => ct.id === t.id);
        return match ? match : t;
      });
    } else {
      // Inter-column move
      const sourceColTasks = updatedTasks.filter(t => t.columnId === sourceColId).sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      const targetColTasks = updatedTasks.filter(t => t.columnId === targetColId).sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      
      const item = sourceColTasks.find(t => t.id === taskId);
      if (!item) return;

      sourceColTasks.splice(sourceIdx, 1);
      sourceColTasks.forEach((t, i) => {
        t.sequenceIndex = i;
      });

      item.columnId = targetColId;
      let finalTargetIdx = targetIdx;
      if (finalTargetIdx > targetColTasks.length) finalTargetIdx = targetColTasks.length;
      targetColTasks.splice(finalTargetIdx, 0, item);
      targetColTasks.forEach((t, i) => {
        t.sequenceIndex = i;
      });

      updatedTasks = updatedTasks.map(t => {
        if (t.id === taskId) return { ...item };
        const matchSrc = sourceColTasks.find(ct => ct.id === t.id);
        if (matchSrc) return matchSrc;
        const matchTgt = targetColTasks.find(ct => ct.id === t.id);
        if (matchTgt) return matchTgt;
        return t;
      });
    }

    // Instantly update UI optimistically
    setFilteredTasks(updatedTasks);

    // Call API in background
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/move`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetColumnId: targetColId, newSequenceIndex: targetIdx })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Server rejected sequence adjustment.');
      }
      showToast('Card position updated', 'success');
    } catch (err) {
      // Rollback UI
      setFilteredTasks(backupState);
      showToast(err.message, 'error');
    }
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
  };

  // Helper: check if current user is admin
  const isAdmin = currentUser?.role === 'WORKSPACE_ADMIN';

  if (!currentUser) {
    return (
      <div className="animated-fade" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at bottom, #171923 0%, #0F1117 100%)', padding: '1.5rem' }}>
        
        {/* Toast Notification Bar */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : 'success'}`}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.message}</span>
              <X size={16} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ cursor: 'pointer', opacity: 0.7 }} />
            </div>
          ))}
        </div>

        <form onSubmit={handleLogin} className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--accent-primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Agile Workflow Engine</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Log in to access your workspaces</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Username</label>
              <select
                className="glass-input"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                onFocus={loadUsers}
                style={{ width: '100%' }}
              >
                <option value="">Select Enterprise User...</option>
                {users.map(u => (
                  <option key={u.id} value={u.username} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {u.username} ({u.role.replace('WORKSPACE_', '').replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                className="glass-input"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
            Log In
          </button>

          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEFAULT TEST PASSWORDS</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sarah (Admin): <b>admin123</b></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>David (Developer): <b>dev123</b></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Alice (QA Auditor): <b>qa123</b></span>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animated-fade" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification Bar */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : 'success'}`}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.message}</span>
            <X size={16} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ cursor: 'pointer', opacity: 0.7 }} />
          </div>
        ))}
      </div>

      {/* Premium Header */}
      <header className="glass-panel" style={{ margin: '1.5rem', padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--accent-primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Agile Workflow Engine</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Collaborative Team Workspaces</p>
          </div>
        </div>

        {/* Logged in User Profile Info */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <div style={{ background: 'var(--accent-secondary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
              {currentUser?.username.charAt(0)}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{currentUser?.username}</span>
            <span className={`role-badge ${
              currentUser?.role === 'WORKSPACE_ADMIN' ? 'admin' :
              currentUser?.role === 'QUALITY_ASSURANCE' ? 'qa' : 'contributor'
            }`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              {currentUser?.role.replace('WORKSPACE_', '').replace('_', ' ')}
            </span>
          </div>

          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setChangePasswordModal(true)}>
            Change Password
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={handleLogout}>
            Log Out
          </button>

          <div style={{ borderLeft: '1px solid var(--glass-border)', height: '24px' }}></div>

          {/* Workspace Operations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <Folder size={16} color="var(--accent-primary)" />
              <select 
                value={currentWorkspace ? currentWorkspace.id : ''} 
                onChange={(e) => {
                  const ws = workspaces.find(w => w.id === Number(e.target.value));
                  if (ws) setCurrentWorkspace(ws);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', paddingRight: '0.5rem' }}
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{w.name}</option>
                ))}
                {workspaces.length === 0 && <option value="">No Workspaces</option>}
              </select>
            </div>

            {isAdmin && (
              <button className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem' }} onClick={() => {
                setWorkspaceForm({ name: '' });
                setModals(prev => ({ ...prev, workspace: { show: true, mode: 'create', data: null } }));
              }}>
                <FolderPlus size={16} />
                <span style={{ fontSize: '0.85rem' }}>New</span>
              </button>
            )}

            {currentWorkspace && (
              <>
                <button className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: '36px', height: '36px' }} onClick={() => setModals(prev => ({ ...prev, members: { show: true } }))}>
                  <Users size={16} />
                </button>
                
                {isAdmin && (
                  <>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: '36px', height: '36px' }} onClick={() => {
                      setWorkspaceForm({ name: currentWorkspace.name });
                      setModals(prev => ({ ...prev, workspace: { show: true, mode: 'edit', data: currentWorkspace } }));
                    }}>
                      <Edit2 size={15} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.5rem', minWidth: '36px', height: '36px' }} onClick={() => handleDeleteWorkspace(currentWorkspace.id)}>
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <div style={{ borderLeft: '1px solid var(--glass-border)', height: '24px' }}></div>

          {/* Notification Tray Toggle */}
          <button 
            className={`btn ${showNotifications ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '0.5rem', minWidth: '36px', height: '36px', position: 'relative' }} 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={16} color={showNotifications ? '#0F172A' : 'var(--text-secondary)'} />
            {notifications.filter(n => !n.readStatus).length > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                background: 'var(--priority-high)', 
                color: showNotifications ? '#0F172A' : '#fff', 
                borderRadius: '50%', 
                width: '16px', 
                height: '16px', 
                fontSize: '0.65rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {notifications.filter(n => !n.readStatus).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main style={{ flexGrow: 1, padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'stretch', overflow: 'hidden' }}>
        {currentWorkspace ? (
          <>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Dynamic Filter Controls */}
            <section className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderRadius: 'var(--radius-md)' }}>
              
              {/* Search & Query Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', flexGrow: 1 }}>
                
                <div style={{ position: 'relative', minWidth: '220px', flexGrow: 0.3 }}>
                  <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Search task cards..." 
                    className="glass-input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.2rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority:</span>
                  <select 
                    className="glass-input" 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <button 
                  className={`btn ${overdueFilter ? 'btn-danger' : 'btn-secondary'}`} 
                  onClick={() => setOverdueFilter(!overdueFilter)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  <AlertCircle size={15} />
                  <span>Overdue Tasks</span>
                </button>
              </div>

              {/* Sorting & Columns */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={15} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort by:</span>
                  <select 
                    className="glass-input" 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    <option value="sequence">Sequence</option>
                    <option value="title">Title</option>
                    <option value="duedate">Due Date</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>

                <button className="btn btn-secondary" style={{ padding: '0.4rem', height: '34px', width: '34px' }} onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                  <ArrowUpDown size={15} />
                </button>

                {isAdmin && (
                  <>
                    <div style={{ borderLeft: '1px solid var(--glass-border)', height: '24px', margin: '0 0.25rem' }}></div>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => {
                      setColumnForm({ name: '' });
                      setModals(prev => ({ ...prev, column: { show: true, mode: 'create', data: null } }));
                    }}>
                      <Plus size={16} />
                      <span>Add Column</span>
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Role Notice for non-admins */}
            {!isAdmin && (
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={16} color="var(--priority-medium)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {currentUser?.role === 'CONTRIBUTOR' 
                    ? 'Contributor View: You can only drag tasks assigned directly to you from "To Do" to "In Progress". Card creation and property editing are blocked.'
                    : 'QA Auditor View: You can only move task cards to "Done" (marking them verified) or throw them back to "To Do" (rejecting review).'
                  }
                </span>
              </div>
            )}

            {/* Kanban Board Grid */}
            {loading ? (
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <Loader2 className="animated-slide" size={32} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>Loading workspace boards...</span>
              </div>
            ) : (
              <div className="kanban-board">
                {columns.map(column => {
                  const columnTasks = filteredTasks
                    .filter(t => t.columnId === column.id)
                    .sort((a, b) => {
                      if (sortBy === 'sequence') {
                        return a.sequenceIndex - b.sequenceIndex;
                      }
                      return filteredTasks.indexOf(a) - filteredTasks.indexOf(b);
                    });

                  return (
                    <div 
                      key={column.id} 
                      className={`kanban-column glass-panel ${dragOverColumnId === column.id ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOverColumn(e, column.id)}
                      onDragLeave={() => setDragOverColumnId(null)}
                      onDrop={(e) => handleDropOnColumn(e, column.id)}
                    >
                      <div className="column-header">
                        <div className="column-title-area">
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{column.name}</h3>
                          <span className="column-count">{columnTasks.length}</span>
                        </div>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem', minWidth: '24px', height: '24px', borderRadius: '4px' }}
                              onClick={() => {
                                setColumnForm({ name: column.name });
                                setModals(prev => ({ ...prev, column: { show: true, mode: 'edit', data: column } }));
                              }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem', minWidth: '24px', height: '24px', borderRadius: '4px' }}
                              onClick={() => handleDeleteColumn(column.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Task Cards Stack */}
                      <div className="column-cards-container">
                        {columnTasks.map((task, idx) => (
                          <div 
                            key={task.id} 
                            className={`task-card glass-panel animated-slide ${draggingTaskId === task.id ? 'dragging' : ''}`}
                            draggable={!task.awaitingQaApproval}
                            onDragStart={(e) => handleDragStart(e, task.id, column.id, idx)}
                            onDragEnd={() => { setDraggingTaskId(null); setDragOverColumnId(null); }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnCard(e, column.id, idx)}
                            onClick={() => handleOpenTaskModal(task, column)}
                          >
                            <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <div className={`card-priority-badge ${task.priority.toLowerCase()}`}>
                                  {task.priority}
                                </div>
                                {task.awaitingQaApproval && (
                                  <span className="role-badge qa" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                    ⏳ Awaiting QA
                                  </span>
                                )}
                              </div>
                              
                              {/* Assignee initials/name indicator */}
                              {task.assigneeName && (
                                <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <UserCheck size={10} color="var(--accent-secondary)" />
                                  <span>{task.assigneeName.split(' ')[0]}</span>
                                </div>
                              )}
                            </div>
                            
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{task.title}</h4>
                            {task.description && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {task.description}
                              </p>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem', alignItems: 'center' }}>
                              {task.dueDate && (
                                <div className={`card-due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`} style={{ margin: 0 }}>
                                  <Calendar size={12} />
                                  <span>{task.dueDate}</span>
                                </div>
                              )}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem', 
                                  fontSize: '0.75rem', 
                                  color: 'var(--text-secondary)',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid var(--glass-border)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px'
                                }}>
                                  <CheckSquare size={11} color="var(--accent-primary)" />
                                  <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                                </div>
                              )}
                              {task.comments && task.comments.length > 0 && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem', 
                                  fontSize: '0.75rem', 
                                  color: 'var(--text-secondary)',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid var(--glass-border)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px'
                                }}>
                                  <Bell size={11} color="var(--accent-secondary)" />
                                  <span>{task.comments.length}</span>
                                </div>
                              )}
                            </div>

                            {task.awaitingQaApproval && (currentUser?.role === 'QUALITY_ASSURANCE' || currentUser?.role === 'WORKSPACE_ADMIN') && (
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.6rem' }} onClick={(e) => e.stopPropagation()}>
                                <button 
                                  className="btn btn-primary" 
                                  style={{ flex: 1, padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'var(--role-qa)', color: '#0F172A', border: 'none' }}
                                  onClick={() => handleApproveTask(task.id)}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn btn-danger" 
                                  style={{ flex: 1, padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--priority-high)', background: 'none', color: 'var(--priority-high)' }}
                                  onClick={() => handleRejectTask(task.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Task Card (Admin Only) */}
                      {isAdmin && (
                        <div style={{ padding: '0.8rem 1rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ width: '100%', borderStyle: 'dashed', padding: '0.45rem', fontSize: '0.8rem' }}
                            onClick={() => {
                              setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
                              setModals(prev => ({ ...prev, task: { show: true, mode: 'create', data: null, columnId: column.id } }));
                            }}
                          >
                            <Plus size={14} />
                            <span>Add Task Card</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            {/* Right Notification Sidebar */}
            {showNotifications && (
              <div 
                className="glass-panel" 
                style={{ 
                  width: '320px', 
                  flexShrink: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.8rem', 
                  padding: '1.25rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-secondary)',
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notifications</span>
                  {notifications.filter(n => !n.readStatus).length > 0 && (
                    <button 
                      onClick={handleMarkNotificationsRead}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{ 
                        padding: '0.5rem 0.6rem', 
                        borderRadius: '4px', 
                        background: n.readStatus ? 'var(--bg-tertiary)' : 'rgba(56, 189, 248, 0.08)', 
                        border: n.readStatus ? '1px solid transparent' : '1px solid rgba(56, 189, 248, 0.2)',
                        fontSize: '0.85rem',
                        lineHeight: 1.3
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>
                      No notifications yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)', minHeight: '350px' }}>
            <FolderPlus size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Workspaces</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You don't have access to any workspaces. Switch active roles or invite users.</p>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => {
                setWorkspaceForm({ name: '' });
                setModals(prev => ({ ...prev, workspace: { show: true, mode: 'create', data: null } }));
              }}>
                <Plus size={16} />
                <span>Create Workspace</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* Workspace Dialog Modal */}
      {/* ---------------------------------------------------- */}
      {modals.workspace.show && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveWorkspace}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                {modals.workspace.mode === 'create' ? 'Create Workspace' : 'Edit Workspace Name'}
              </h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModals(prev => ({ ...prev, workspace: { show: false } }))} />
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Workspace Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sprint Board, Product Launch" 
                  className="glass-input"
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm({ name: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, workspace: { show: false } }))}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Workspace</button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Column Dialog Modal */}
      {/* ---------------------------------------------------- */}
      {modals.column.show && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveColumn}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                {modals.column.mode === 'create' ? 'Add Status Column' : 'Edit Column Title'}
              </h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModals(prev => ({ ...prev, column: { show: false } }))} />
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Column Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Backlog, Blocked, QA" 
                  className="glass-input"
                  value={columnForm.name}
                  onChange={(e) => setColumnForm({ name: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, column: { show: false } }))}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Column</button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Workspace Members Modal */}
      {/* ---------------------------------------------------- */}
      {modals.members.show && currentWorkspace && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Workspace Share Directory</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModals(prev => ({ ...prev, members: { show: false } }))} />
            </div>
            <div className="modal-body">
              
              {/* Creator/Owner */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Workspace Administrator</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ background: 'var(--accent-primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    {currentWorkspace.creator?.username.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.9rem', flexGrow: 1 }}>{currentWorkspace.creator?.username}</span>
                  <span className="role-badge admin" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>ADMIN</span>
                </div>
              </div>

              {/* Members List */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Assigned Members</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {(currentWorkspace.assignedMembers || []).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ background: 'var(--accent-secondary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {m.username.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.85rem', flexGrow: 1 }}>{m.username}</span>
                      <span className={`role-badge ${
                        m.role === 'WORKSPACE_ADMIN' ? 'admin' :
                        m.role === 'QUALITY_ASSURANCE' ? 'qa' : 'contributor'
                      }`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        {m.role.replace('WORKSPACE_', '').replace('_', ' ')}
                      </span>
                      {isAdmin && m.role !== 'WORKSPACE_ADMIN' && (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.2rem', minWidth: '22px', height: '22px', border: 'none', background: 'none', color: 'var(--priority-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          onClick={() => handleDeleteUser(m.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {(currentWorkspace.assignedMembers || []).length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No members added yet.</span>
                  )}
                </div>
              </div>

              {/* Invite Form (Admin Only) */}
              {isAdmin && (
                <form onSubmit={handleInviteMember} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Invite Enterprise Member</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      className="glass-input" 
                      required
                      value={inviteMemberId}
                      onChange={(e) => setInviteMemberId(e.target.value)}
                      style={{ flexGrow: 1 }}
                    >
                      <option value="">Select User...</option>
                      {users
                        .filter(u => u.id !== currentWorkspace.creator?.id) // exclude owner
                        .filter(u => !(currentWorkspace.assignedMembers || []).some(m => m.id === u.id)) // exclude current members
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.username} ({u.role.replace('WORKSPACE_', '')})</option>
                        ))
                      }
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Invite</button>
                  </div>
                </form>
              )}

              {/* Register User Form (Admin Only) */}
              {isAdmin && (
                <form onSubmit={handleCreateUser} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Register New Enterprise User</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="glass-input" 
                        placeholder="Username" 
                        required 
                        value={userForm.username} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                        style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      />
                      <input 
                        type="email" 
                        className="glass-input" 
                        placeholder="Email" 
                        required 
                        value={userForm.email} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        value={userForm.role} 
                        onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                        style={{ flexGrow: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        <option value="CONTRIBUTOR">Developer (Contributor)</option>
                        <option value="QUALITY_ASSURANCE">QA Auditor</option>
                        <option value="WORKSPACE_ADMIN">Workspace Admin</option>
                      </select>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Create User
                      </button>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                      * Default password will be: [username]123 (all lowercase)
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, members: { show: false } }))}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Task Card Dialog Modal */}
      {/* ---------------------------------------------------- */}
      {modals.task.show && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveTask} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                {modals.task.mode === 'create' ? 'Create Task Card' : modals.task.mode === 'edit' ? 'Edit Task Card' : 'View Task Card'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isAdmin && modals.task.mode === 'edit' && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} 
                    onClick={() => {
                      setModals(prev => ({ ...prev, task: { show: false } }));
                      handleDeleteTask(modals.task.data.id);
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Card</span>
                  </button>
                )}
                <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModals(prev => ({ ...prev, task: { show: false } }))} />
              </div>
            </div>
            <div className="modal-body">
              
              {/* Task Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Task Title</label>
                <input 
                  type="text" 
                  required
                  disabled={modals.task.mode === 'view'}
                  placeholder="e.g. Refactor API controllers" 
                  className="glass-input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Task Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  placeholder="Provide task scope details..." 
                  disabled={modals.task.mode === 'view'}
                  className="glass-input"
                  rows="4"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Priority & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    className="glass-input"
                    disabled={modals.task.mode === 'view'}
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="LOW">Low (Green)</option>
                    <option value="MEDIUM">Medium (Amber)</option>
                    <option value="HIGH">High (Crimson)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Due Date</label>
                  <input 
                    type="date" 
                    disabled={modals.task.mode === 'view'}
                    className="glass-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Task Assignee Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assignee (Resource)</label>
                <select 
                  className="glass-input"
                  disabled={modals.task.mode === 'view'}
                  value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {currentWorkspace && [currentWorkspace.creator, ...(currentWorkspace.assignedMembers || [])]
                    .filter(Boolean)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role.replace('WORKSPACE_', '').replace('_', ' ')})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Checklists & Comments Sections (Only when editing or viewing existing tasks) */}
              {modals.task.mode !== 'create' && modals.task.data && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                  
                  {/* Checklist (Subtasks) Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Task Checklist</span>
                      {activeTaskSubtasks.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {activeTaskSubtasks.filter(s => s.completed).length} of {activeTaskSubtasks.length} completed
                        </span>
                      )}
                    </div>
                    
                    {/* Checklist Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {activeTaskSubtasks.map(subtask => (
                        <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                          <input 
                            type="checkbox" 
                            checked={subtask.completed} 
                            onChange={() => handleToggleSubtask(subtask.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ 
                            fontSize: '0.85rem', 
                            flexGrow: 1, 
                            color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: subtask.completed ? 'line-through' : 'none'
                          }}>
                            {subtask.title}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--priority-high)', cursor: 'pointer', padding: 0 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {activeTaskSubtasks.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subtasks created yet.</span>
                      )}
                    </div>

                    {/* Add Subtask Form */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <input 
                        type="text" 
                        placeholder="Add checklist item..." 
                        className="glass-input" 
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        style={{ flexGrow: 1, padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={handleAddSubtask}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Discussion & Comments</span>
                    
                    {/* Comments Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                      {activeTaskComments.map(comment => (
                        <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', marginBottom: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                              {comment.author?.username}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                            {comment.text}
                          </span>
                        </div>
                      ))}
                      {activeTaskComments.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
                          No comments posted yet.
                        </span>
                      )}
                    </div>

                    {/* Write Comment Form */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        className="glass-input" 
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        style={{ flexGrow: 1, padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleAddComment}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        Send
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModals(prev => ({ ...prev, task: { show: false } }))}>
                {modals.task.mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modals.task.mode !== 'view' && (
                <button type="submit" className="btn btn-primary">Save Task Card</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Change Password Dialog Modal */}
      {/* ---------------------------------------------------- */}
      {changePasswordModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleChangePassword} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Change Password</h3>
              <X size={16} onClick={() => { setChangePasswordModal(false); setOtpSent(false); setOtpMessage(''); }} style={{ cursor: 'pointer', opacity: 0.7 }} />
            </div>
            
            {!otpSent ? (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem 1.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                    To update your password, we need to verify your identity.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    A 6-digit OTP code will be sent to your registered enterprise email: <br/>
                    <b style={{ color: 'var(--accent-secondary)' }}>{currentUser?.email}</b>
                  </p>
                  <button type="button" className="btn btn-primary" onClick={handleSendOtp} style={{ alignSelf: 'center', marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
                    Send OTP Code
                  </button>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setChangePasswordModal(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--accent-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {otpMessage}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      (For local testing, check your Spring Boot backend console logs to read the generated OTP)
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enter 6-Digit OTP</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={changePasswordForm.otp}
                      onChange={(e) => setChangePasswordForm(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>New Password</label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      required
                      placeholder="Enter new password..."
                      value={changePasswordForm.newPassword}
                      onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      required
                      placeholder="Confirm new password..."
                      value={changePasswordForm.confirmPassword}
                      onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setOtpSent(false); setOtpMessage(''); }}>Back</button>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

    </div>
  );
}

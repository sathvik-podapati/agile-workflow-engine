import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, Calendar, AlertCircle, Filter, 
  ArrowUpDown, CheckCircle, FolderPlus, Folder, 
  X, Loader2, Sparkles, UserCheck, Users, ShieldAlert, CheckSquare, Search, Bell, Activity, Inbox
} from 'lucide-react';

// ----------------------------------------------------
// Interactive Visual Analytics Glassmorphic SVG Components
// ----------------------------------------------------
function RadialProgressGauge({ percentage }) {
  const radius = 52;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="gaugeGradientAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8A33D" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(255, 255, 255, 0.08)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#gaugeGradientAmber)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out', strokeLinecap: 'round' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{percentage}%</div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</div>
      </div>
    </div>
  );
}

function StatusDonutChart({ completed, inProgress, backlog, total }) {
  if (!total || total === 0) total = 1;
  const pCompleted = (completed / total) * 100;
  const pInProgress = (inProgress / total) * 100;
  const pBacklog = (backlog / total) * 100;

  const radius = 45;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  const len1 = (pCompleted / 100) * circumference;
  const len2 = (pInProgress / 100) * circumference;
  const len3 = (pBacklog / 100) * circumference;

  const offset1 = 0;
  const offset2 = len1;
  const offset3 = len1 + len2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        {pCompleted > 0 && (
          <circle
            cx="60" cy="60" r={radius}
            fill="transparent"
            stroke="#4ADE80"
            strokeWidth={strokeWidth}
            strokeDasharray={`${len1} ${circumference - len1}`}
            strokeDashoffset={-offset1}
          />
        )}
        {pInProgress > 0 && (
          <circle
            cx="60" cy="60" r={radius}
            fill="transparent"
            stroke="#E8A33D"
            strokeWidth={strokeWidth}
            strokeDasharray={`${len2} ${circumference - len2}`}
            strokeDashoffset={-offset2}
          />
        )}
        {pBacklog > 0 && (
          <circle
            cx="60" cy="60" r={radius}
            fill="transparent"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeDasharray={`${len3} ${circumference - len3}`}
            strokeDashoffset={-offset3}
          />
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{completed} ({Math.round(pCompleted)}%)</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E8A33D' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>In Progress:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{inProgress} ({Math.round(pInProgress)}%)</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Backlog / To Do:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{backlog} ({Math.round(pBacklog)}%)</strong>
        </div>
      </div>
    </div>
  );
}

function BurndownCurveChart({ progressTrend, totalTasks }) {
  if (!progressTrend || progressTrend.length === 0) return null;
  const width = 450;
  const height = 180;
  const padding = 30;

  const maxVal = Math.max(totalTasks || 5, 5);

  const pointsActual = progressTrend.map((pt, idx) => {
    const x = padding + (idx / (progressTrend.length - 1)) * (width - 2 * padding);
    const y = height - padding - (pt.actualCompleted / maxVal) * (height - 2 * padding);
    return { x, y, val: pt.actualCompleted, day: pt.day };
  });

  const pointsTarget = progressTrend.map((pt, idx) => {
    const x = padding + (idx / (progressTrend.length - 1)) * (width - 2 * padding);
    const y = height - padding - (pt.targetCompleted / maxVal) * (height - 2 * padding);
    return { x, y, val: pt.targetCompleted, day: pt.day };
  });

  const pathActualD = pointsActual.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathActualD} L ${pointsActual[pointsActual.length - 1].x} ${height - padding} L ${pointsActual[0].x} ${height - padding} Z`;
  const pathTargetD = pointsTarget.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="areaGradientGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#E8A33D" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8A33D" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
        
        {/* Horizontal Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = height - padding - pct * (height - 2 * padding);
          return (
            <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          );
        })}

        {/* Area Fill */}
        <path d={areaD} fill="url(#areaGradientGlass)" />

        {/* Target Line */}
        <path d={pathTargetD} fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" />

        {/* Actual Progress Line */}
        <path d={pathActualD} fill="none" stroke="url(#lineGradientAmber)" strokeWidth="3" />

        {/* Data Points */}
        {pointsActual.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="5" fill="#E8A33D" stroke="#07090e" strokeWidth="2" />
            <text x={pt.x} y={height - 8} fill="var(--text-muted)" fontSize="10" textAnchor="middle">{pt.day}</text>
            <text x={pt.x} y={pt.y - 10} fill="#E8A33D" fontSize="10" fontWeight="700" textAnchor="middle">{pt.val}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ProgressBar({ value, max, color = '#E8A33D', label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pct}%</span>
        </div>
      )}
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }}></div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, accent = 'var(--text-primary)' }) {
  return (
    <div className="glass-panel" style={{
      padding: '1.2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>{value}</div>
      {subtext && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtext}</span>}
    </div>
  );
}


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
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', gitRepo: '', gitBranch: '', gitCommitHash: '' });
  const [inviteMemberId, setInviteMemberId] = useState('');
  const [userForm, setUserForm] = useState({ username: '', email: '', role: 'CONTRIBUTOR' });

  // View & Analytics States
  const [currentView, setCurrentView] = useState('board');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

  // Git Diff states
  const [gitDiffText, setGitDiffText] = useState('');
  const [isFetchingDiff, setIsFetchingDiff] = useState(false);
  const [showGitDiffPreview, setShowGitDiffPreview] = useState(false);

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

  // AI Integration States
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isAuditingTask, setIsAuditingTask] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState([]);
  const [descriptionTab, setDescriptionTab] = useState('write');

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
      try {
        const parsed = JSON.parse(saved);
        if (parsed.username && (parsed.username.includes("Sarah") || parsed.username.includes("David") || parsed.username.includes("Alice"))) {
          localStorage.removeItem("activeUser");
          setCurrentUser(null);
        } else {
          setCurrentUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem("activeUser");
        setCurrentUser(null);
      }
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
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `${window.location.hostname}:8085` : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws-updates`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        if (event.data === 'REFRESH') {
          if (currentWorkspace) {
            fetchColumns(currentWorkspace.id);
          }
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
      assigneeId: task.assigneeId || '',
      gitRepo: task.gitRepo || '',
      gitBranch: task.gitBranch || '',
      gitCommitHash: task.gitCommitHash || ''
    });
    
    setActiveTaskComments(task.comments || []);
    setActiveTaskSubtasks(task.subtasks || []);
    setNewCommentText('');
    setNewSubtaskTitle('');
    setPendingSubtasks([]);
    setDescriptionTab('write');
    setGitDiffText('');
    setShowGitDiffPreview(false);
    
    setModals(prev => ({ 
      ...prev, 
      task: { 
        show: true, 
        mode: 'edit', 
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

  const handleAiSuggestPlan = async () => {
    if (!taskForm.title.trim()) {
      showToast('Please enter a task title first to plan with AI', 'error');
      return;
    }
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/v1/ai/suggest-task', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: taskForm.title })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI request failed');

      setTaskForm(prev => ({ ...prev, description: data.description }));
      
      // If we are editing an existing task, create the subtasks directly in DB
      if (modals.task.mode === 'edit' && modals.task.data?.id) {
        const taskId = modals.task.data.id;
        const addedList = [];
        for (const subtaskTitle of data.subtasks) {
          const sRes = await fetch(`/api/v1/tasks/${taskId}/subtasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: subtaskTitle })
          });
          if (sRes.ok) {
            const savedSub = await sRes.json();
            addedList.push(savedSub);
          }
        }
        setActiveTaskSubtasks(prev => [...prev, ...addedList]);
        fetchFilteredTasks();
      } else {
        // In creation mode, queue them in pendingSubtasks state so they save on submit
        setPendingSubtasks(data.subtasks);
        // Also show them in the UI preview list by setting a mocked format temporarily
        setActiveTaskSubtasks(data.subtasks.map((title, i) => ({ id: `temp-${i}`, title, completed: false })));
      }

      showToast('AI suggestions successfully generated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAiAuditTask = async () => {
    if (!modals.task.data?.id) return;
    setIsAuditingTask(true);
    try {
      const res = await fetch('/api/v1/ai/audit-task', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ taskId: modals.task.data.id })
      });
      const commentData = await res.json();
      if (!res.ok) throw new Error(commentData.message || 'AI Audit failed');

      setActiveTaskComments(prev => [...prev, commentData]);
      fetchFilteredTasks();
      showToast('AI QA Audit complete! Review posted in Discussion Feed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAuditingTask(false);
    }
  };

  const handleFetchGitDiff = async () => {
    setIsFetchingDiff(true);
    try {
      const repoParam = encodeURIComponent(taskForm.gitRepo || '');
      const refParam = encodeURIComponent(taskForm.gitCommitHash || taskForm.gitBranch || '');
      const res = await fetch(`/api/v1/ai/diff?repo=${repoParam}&ref=${refParam}`);
      const text = await res.text();
      setGitDiffText(text);
      setShowGitDiffPreview(true);
    } catch (err) {
      showToast('Failed loading Git diff', 'error');
    } finally {
      setIsFetchingDiff(false);
    }
  };



  const fetchWorkspaceAnalytics = async (wsId) => {
    if (!wsId) return;
    setIsFetchingAnalytics(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${wsId}/analytics`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load workspace analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsFetchingAnalytics(false);
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

      // Persist any AI-suggested subtasks if creating a new task card
      if (method === 'POST' && pendingSubtasks.length > 0) {
        for (const subtaskTitle of pendingSubtasks) {
          await fetch(`/api/v1/tasks/${resJson.id}/subtasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: subtaskTitle })
          });
        }
        setPendingSubtasks([]);
      }

      showToast('Task card saved', 'success');
      setModals(prev => ({ ...prev, task: { show: false } }));
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', gitRepo: '', gitBranch: '', gitCommitHash: '' });
      if (currentWorkspace) {
        fetchColumns(currentWorkspace.id);
      }
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
      <div className="animated-fade" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '1.5rem' }}>
        
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
            <div style={{ background: 'var(--accent-primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',  }}>
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
                {users
                  .filter(u => u.username !== 'AI Auditor')
                  .filter(u => !u.deleted)
                  .map(u => (
                    <option key={u.id} value={u.username} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {u.username} ({u.role ? u.role.replace('WORKSPACE_', '').replace('_', ' ') : 'USER'})
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
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEMO CREDENTIALS</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Admin: <b>admin123</b></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Developer: <b>dev123</b></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>QA Auditor: <b>qa123</b></span>
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
          <div style={{ background: 'var(--accent-primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',  }}>
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
            <div style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#0a0a0a' }}>
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

          {/* View Switcher: Board vs Analytics */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', border: '1px solid var(--glass-border)' }}>
            <button 
              className={`btn ${currentView === 'board' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: 'none' }}
              onClick={() => setCurrentView('board')}
            >
              Kanban Board
            </button>
            <button 
              className={`btn ${currentView === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: 'none' }}
              onClick={() => {
                setCurrentView('analytics');
                if (currentWorkspace) fetchWorkspaceAnalytics(currentWorkspace.id);
              }}
            >
              Analytics & Velocity
            </button>
          </div>

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
            <Bell size={16} color={showNotifications ? '#0a0a0a' : 'var(--text-secondary)'} />
            {notifications.filter(n => !n.readStatus).length > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                background: 'var(--priority-high)', 
                color: '#fff', 
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
      <main style={{ flexGrow: 1, padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        {currentWorkspace ? (
          currentView === 'analytics' ? (
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Analytics Overview</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Team performance and sprint progress</p>
                </div>
                <button className="btn btn-secondary" onClick={() => fetchWorkspaceAnalytics(currentWorkspace.id)}>
                  Refresh
                </button>
              </div>

              {analyticsData ? (
                <>
                  {/* Executive Risk Alert & Forecast Banner */}
                  <div className="glass-panel" style={{ 
                    background: analyticsData.overdueTasks > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(232, 163, 61, 0.08)', 
                    borderColor: analyticsData.overdueTasks > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(232, 163, 61, 0.25)', 
                    padding: '0.85rem 1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Activity size={20} color={analyticsData.overdueTasks > 0 ? '#EF4444' : '#E8A33D'} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {analyticsData.bottleneckNotice || 'Sprint velocity is optimal'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
                      Forecast: <strong style={{ color: 'var(--accent-primary)' }}>{analyticsData.forecastEta}</strong>
                    </div>
                  </div>

                  {/* Top Visual Gauges & Donut Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                    {/* Radial Progress Ring Gauge */}
                    <div className="glass-panel" style={{ padding: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                      <RadialProgressGauge percentage={analyticsData.overallProgressRate} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Velocity Status</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: analyticsData.overallProgressRate > 70 ? '#4ADE80' : 'var(--accent-primary)' }}>
                          {analyticsData.overallProgressRate > 70 ? '🚀 High Velocity' : analyticsData.overallProgressRate > 30 ? '⚡ Steady Sprint' : '⏳ Initial Phase'}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{analyticsData.completedTasks} of {analyticsData.totalTasks} tasks verified</span>
                      </div>
                    </div>

                    {/* Status Distribution Donut Chart */}
                    <div className="glass-panel" style={{ padding: '1.4rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.8rem 0', color: 'var(--text-primary)' }}>📊 Task Status Distribution</h4>
                      <StatusDonutChart 
                        completed={analyticsData.completedTasks} 
                        inProgress={analyticsData.inProgressTasks} 
                        backlog={analyticsData.backlogTasks} 
                        total={analyticsData.totalTasks} 
                      />
                    </div>

                    {/* Executive KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <StatCard label="Completed" value={analyticsData.completedTasks} subtext="Closed & Verified" accent="#4ADE80" />
                      <StatCard label="In Progress" value={analyticsData.inProgressTasks} subtext="Active Work" accent="#E8A33D" />
                      <StatCard label="Backlog" value={analyticsData.backlogTasks} subtext="Queued" accent="#F59E0B" />
                      <StatCard label="Overdue" value={analyticsData.overdueTasks} subtext="Past Due Date" accent={analyticsData.overdueTasks > 0 ? '#EF4444' : '#4ADE80'} />
                    </div>
                  </div>

                  {/* Priority Spectrum & Team Workload */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.4rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.2rem 0' }}>🎯 Priority Breakdown</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <ProgressBar value={analyticsData.highPriorityCount} max={analyticsData.totalTasks} color="#EF4444" label={`High Priority · ${analyticsData.highPriorityCount} tasks`} />
                        <ProgressBar value={analyticsData.mediumPriorityCount} max={analyticsData.totalTasks} color="#F59E0B" label={`Medium Priority · ${analyticsData.mediumPriorityCount} tasks`} />
                        <ProgressBar value={analyticsData.lowPriorityCount} max={analyticsData.totalTasks} color="#6B7280" label={`Low Priority · ${analyticsData.lowPriorityCount} tasks`} />
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.4rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.2rem 0' }}>👥 Team Workload Capacity</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        {analyticsData.teamMemberProgress.map((member, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#07090e' }}>
                                  {member.username.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{member.username}</span>
                                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid var(--glass-border)', color: member.healthBadge === 'HIGH_LOAD' ? '#EF4444' : member.healthBadge === 'OPTIMAL' ? '#4ADE80' : 'var(--text-muted)', fontWeight: 600 }}>
                                  {member.healthBadge === 'HIGH_LOAD' ? 'High Load' : member.healthBadge === 'OPTIMAL' ? 'Optimal' : 'Available'}
                                </span>
                              </div>
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                                {member.completedTasks}/{member.assignedTasks}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, member.progressPercentage)}%`, height: '100%', background: member.progressPercentage === 100 ? '#4ADE80' : 'var(--accent-primary)', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SVG Bezier Sprint Burndown Trajectory */}
                  {analyticsData.progressTrend && analyticsData.progressTrend.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>📈 Sprint Task Completion Trajectory</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Pace vs Verified Actuals</span>
                      </div>
                      <BurndownCurveChart progressTrend={analyticsData.progressTrend} totalTasks={analyticsData.totalTasks} />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <p style={{ marginTop: '0.8rem' }}>Loading analytics...</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'stretch', overflow: 'hidden' }}>
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
                                  style={{ flex: 1, padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: '#4ADE80', color: '#0a0a0a', border: 'none' }}
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

                        {columnTasks.length === 0 && (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '2.5rem 1rem', 
                            border: '1px dashed rgba(255, 255, 255, 0.15)', 
                            borderRadius: '12px', 
                            color: 'var(--text-muted)', 
                            fontSize: '0.82rem', 
                            gap: '0.5rem', 
                            background: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(8px)',
                            textAlign: 'center',
                            margin: 'auto 0'
                          }}>
                            <Inbox size={22} style={{ opacity: 0.5, color: 'var(--accent-primary)' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No cards in this column</span>
                            <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>Drag task cards here to update status</span>
                          </div>
                        )}
                      </div>

                      {/* Add Task Card (Admin Only) */}
                      {isAdmin && (
                        <div style={{ padding: '0.8rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ 
                              width: '100%', 
                              borderStyle: 'dashed', 
                              borderColor: 'rgba(255, 255, 255, 0.18)',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '0.55rem', 
                              fontSize: '0.82rem',
                              borderRadius: '10px'
                            }}
                            onClick={() => {
                              setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', gitRepo: '', gitBranch: '', gitCommitHash: '' });
                              setGitDiffText('');
                              setShowGitDiffPreview(false);
                              setModals(prev => ({ ...prev, task: { show: true, mode: 'create', data: null, columnId: column.id } }));
                            }}
                          >
                            <Plus size={14} color="var(--accent-primary)" />
                            <span style={{ fontWeight: 600 }}>Add Task Card</span>
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
            </div>
          )
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
                        .filter(u => u.username !== 'AI Auditor')
                        .filter(u => !u.username.includes('mail_dev_'))
                        .filter(u => u.username !== 'user_reused')
                        .filter(u => u.username !== 'nani')
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Task Title</label>
                  {modals.task.mode !== 'view' && (
                    <button 
                      type="button" 
                      onClick={handleAiSuggestPlan}
                      disabled={isGeneratingPlan}
                      style={{ 
                        background: 'var(--accent-primary)', 
                        border: 'none', 
                        borderRadius: '6px', 
                        color: '#fff', 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        padding: '0.2rem 0.5rem', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: 'none'
                      }}
                    >
                      <Sparkles size={10} style={{ animation: isGeneratingPlan ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{isGeneratingPlan ? 'Planning...' : 'Suggest Plan with AI'}</span>
                    </button>
                  )}
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
                  {modals.task.mode !== 'view' && (
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '2px' }}>
                      <button 
                        type="button"
                        onClick={() => setDescriptionTab('write')}
                        style={{
                          background: descriptionTab === 'write' ? 'var(--accent-primary)' : 'transparent',
                          color: descriptionTab === 'write' ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        Write
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDescriptionTab('preview')}
                        style={{
                          background: descriptionTab === 'preview' ? 'var(--accent-primary)' : 'transparent',
                          color: descriptionTab === 'preview' ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>

                {modals.task.mode === 'view' ? (
                  <div className="glass-panel" style={{ 
                    padding: '0.8rem 1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255, 255, 255, 0.01)',
                    minHeight: '80px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {taskForm.description ? (
                      <MarkdownViewer text={taskForm.description} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No description provided for this task.
                      </span>
                    )}
                  </div>
                ) : descriptionTab === 'preview' ? (
                  <div className="glass-panel" style={{ 
                    padding: '0.8rem 1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255, 255, 255, 0.01)',
                    minHeight: '100px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {taskForm.description ? (
                      <MarkdownViewer text={taskForm.description} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nothing to preview. Type something in the "Write" tab first.
                      </span>
                    )}
                  </div>
                ) : (
                  <textarea 
                    placeholder="Provide task scope details (supports Markdown)..." 
                    className="glass-input"
                    rows="4"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ resize: 'none' }}
                  />
                )}
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
                    .filter(u => u.username !== 'AI Auditor')
                    .filter(u => !u.username.includes('mail_dev_'))
                    .filter(u => u.username !== 'user_reused')
                    .filter(u => u.username !== 'nani')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role.replace('WORKSPACE_', '').replace('_', ' ')})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Git Repository & Code Diff Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Git Code Context</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={handleFetchGitDiff}
                    disabled={isFetchingDiff}
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '4px', 
                      color: 'var(--text-primary)', 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      padding: '0.25rem 0.5rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>{isFetchingDiff ? 'Loading Diff...' : showGitDiffPreview ? 'Refresh Diff' : 'Inspect Code Diff'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem' }}>
                  <input 
                    type="text" 
                    disabled={modals.task.mode === 'view'}
                    placeholder="Git Repo (e.g. owner/repo or local path)..." 
                    className="glass-input"
                    value={taskForm.gitRepo}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, gitRepo: e.target.value }))}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <input 
                    type="text" 
                    disabled={modals.task.mode === 'view'}
                    placeholder="Branch / Commit SHA (e.g. main)..." 
                    className="glass-input"
                    value={taskForm.gitCommitHash}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, gitCommitHash: e.target.value }))}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>

                {/* Git Code Diff Inspector Container */}
                {showGitDiffPreview && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#8b949e', fontFamily: 'monospace' }}>
                        Source Diff Viewer ({taskForm.gitCommitHash || 'HEAD'})
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowGitDiffPreview(false)}
                        style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        Hide Diff
                      </button>
                    </div>
                    <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'Consolas, Monaco, monospace', color: '#c9d1d9', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {gitDiffText}
                    </pre>
                  </div>
                )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Discussion & Comments</span>
                      {(currentUser?.role === 'QUALITY_ASSURANCE' || currentUser?.role === 'WORKSPACE_ADMIN') && (
                        <button 
                          type="button" 
                          onClick={handleAiAuditTask}
                          disabled={isAuditingTask}
                          style={{ 
                            background: 'rgba(139, 92, 246, 0.1)', 
                            border: '1px solid var(--accent-secondary)', 
                            borderRadius: '6px', 
                            color: 'var(--accent-secondary)', 
                            fontSize: '0.72rem', 
                            fontWeight: 600, 
                            padding: '0.2rem 0.5rem', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Sparkles size={10} style={{ animation: isAuditingTask ? 'spin 1.5s linear infinite' : 'none' }} />
                          <span>{isAuditingTask ? 'Auditing...' : 'Run AI QA Audit'}</span>
                        </button>
                      )}
                    </div>
                    
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
                          <MarkdownViewer text={comment.text} />
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

// Custom Markdown Viewer component for professional markdown rendering in comments & descriptions
function MarkdownViewer({ text, style }) {
  if (!text) return null;

  // Process code blocks fenced by ```
  const parts = text.split(/```/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', ...style }}>
      {parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          // Inside a ```code block```
          const firstLineEnd = part.indexOf('\n');
          const codeContent = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1) : part;
          return (
            <pre key={pIdx} style={{ 
              background: '#0d1117', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '6px', 
              padding: '0.75rem', 
              fontSize: '0.78rem', 
              fontFamily: 'monospace', 
              color: '#e6edf3', 
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              margin: '0.4rem 0'
            }}>
              <code>{codeContent.trim()}</code>
            </pre>
          );
        }

        // Regular Markdown lines
        let normalizedText = part.replace(/([^\n])\s*(###|####|[-*]\s)/g, '$1\n$2');
        const lines = normalizedText.split('\n');

        return lines.map((line, idx) => {
          let trimmed = line.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('###')) {
            return (
              <h4 key={`${pIdx}-${idx}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '0.5rem', marginBottom: '0.15rem' }}>
                {renderBoldText(trimmed.replace(/^###\s*/, ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('####')) {
            return (
              <h5 key={`${pIdx}-${idx}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.1rem' }}>
                {renderBoldText(trimmed.replace(/^####\s*/, ''))}
              </h5>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={`${pIdx}-${idx}`} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '0.4rem', lineHeight: '1.4' }}>
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>•</span>
                <span>{renderBoldText(trimmed.replace(/^[-*]\s+/, ''))}</span>
              </div>
            );
          }
          return (
            <p key={`${pIdx}-${idx}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
              {renderBoldText(trimmed)}
            </p>
          );
        });
      })}
    </div>
  );
}

function renderBoldText(text) {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part}</strong>;
    }
    return part;
  });
}

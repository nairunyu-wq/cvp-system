// src/services/api.ts

// ============================================================================
// API Service Configuration
// ============================================================================
// This file serves as the central hub for all backend API interactions.
// 
// Backend Configuration:
// - CVP Management Backend (MySQL): http://localhost:8080/api
// - Image Processing Backend (Shibie): http://localhost:5000
// 
// To connect to real backends:
// 1. Set VITE_USE_MOCK_API=false in your .env file.
// 2. Set VITE_API_BASE_URL to your CVP backend URL (e.g., http://localhost:8080/api).
// 3. Set VITE_SHIBIE_API_BASE_URL to your Shibie backend URL (e.g., http://localhost:5000).
// 4. Ensure your backend endpoints match the paths defined in the fetchAPI function.

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SHIBIE_API_BASE_URL = import.meta.env.VITE_SHIBIE_API_BASE_URL || 'http://localhost:5000';

// --- Mock Data ---
const MOCK_USERS = [
  { username: 'admin', password: 'adminpassword', permissions: ['1.首页', '2.1卫星图检索', '2.2街景图检索', '3.历史记录', '4.智慧问答', '5.系统面板', '6.训练', '7.数据库查看', '8.用户信息管理'], sync: '2 mins ago', status: 'online', avatar: 'https://picsum.photos/seed/admin/100' },
  { username: 'user01', password: 'user123', permissions: ['1.首页', '2.1卫星图检索', '2.2街景图检索', '3.历史记录', '4.智慧问答'], sync: '14h ago', status: 'offline', avatar: 'https://picsum.photos/seed/user01/100' },
  { username: 'guest', password: 'guest123', permissions: ['1.首页'], sync: 'Now', status: 'locked', avatar: 'https://picsum.photos/seed/guest/100' },
];

const MOCK_FILES = [
  { name: '/datasets', size: '1.2 TB', items: '4 文件夹', type: 'folder' },
  { name: '/checkpoints', size: '256 GB', items: '12 文件', type: 'folder' },
  { name: '/logs', size: '12.4 MB', items: 'SYSTEM RUNTIME', type: 'folder' },
];

const MOCK_TRAINING_RECORDS = [
  { id: '#TR-90422', date: '2026-04-11 14:20', version: 'Zenith_v4.2.0', dataset: 'Nebula-Deep-Space-Scan-2026', accuracy: '99.84%', status: 'completed' },
  { id: '#TR-90418', date: '2026-04-10 09:15', version: 'Zenith_v4.1.8', dataset: 'Star-Chart-Reference-v9', accuracy: '98.12%', status: 'completed' },
  { id: '#TR-90415', date: '2026-04-08 23:45', version: 'Zenith_v4.1.0', dataset: 'Experimental-Ion-Cloud-Telemetry', accuracy: '42.03%', status: 'terminated' },
];

const MOCK_TRAINING_STATUS = {
  status: 'not_started',
  progress: 0,
  current_epoch: 0,
  total_epoch: 150,
  global_steps: 0,
  learning_rate: '0.0001',
  gpu_temp: 56,
  current_record_id: null,
  logs: ['[INFO] 训练任务未开始']
};

const MOCK_SYSTEM_LOGS = [
  { id: '1', username: 'USER_COORD_X01', time: '2026-04-11 10:42:05', action: '发起卫星图检索', image: 'https://picsum.photos/seed/sat1/100', status: 'success' },
  { id: '2', username: 'Standard_User', time: '2026-04-11 09:15:22', action: '发起街景图检索', image: 'https://picsum.photos/seed/street1/100', status: 'success' },
  { id: '3', username: 'Admin_User', time: '2026-04-11 08:30:00', action: '执行高精度特征匹配', image: 'https://picsum.photos/seed/match1/100', status: 'info' },
  { id: '4', username: 'Guest_992', time: '2026-04-11 07:45:11', action: '检索请求超时', image: 'https://picsum.photos/seed/error1/100', status: 'warning' },
];

const MOCK_CALENDAR_TASKS = [
  { id: 1, date: '2026-04-10', title: '系统例行维护与轨道校准', desc: '执行全网节点同步，校准低轨卫星群的姿态参数，预计耗时 45 分钟。' },
  { id: 2, date: '2026-04-12', title: '新增高分卫星数据接入', desc: '集成最新的高分辨率合成孔径雷达 (SAR) 数据源，提升夜间及恶劣天气下的检索精度。' },
  { id: 3, date: '2026-04-15', title: '全球地貌特征库更新', desc: '更新深度学习模型的特征向量库，包含新增的 200 万个街景锚点数据。' }
];

const MOCK_RESULTS = [
  { id: '1', location: 'Shanghai, Pudong', coords: '31.2304° N, 121.4737° E', similarity: 98.4, timestamp: '2023-11-24 14:30:12', image: 'https://picsum.photos/seed/shanghai/400/300' },
  { id: '2', location: 'Tokyo, Shibuya', coords: '35.6585° N, 139.7013° E', similarity: 82.1, timestamp: '2023-11-23 09:15:45', image: 'https://picsum.photos/seed/tokyo/400/300' },
  { id: '3', location: 'New York, Manhattan', coords: '40.7128° N, 74.0060° W', similarity: 72.3, timestamp: '2023-11-22 18:05:30', image: 'https://picsum.photos/seed/nyc/400/300' },
  { id: '4', location: 'London, Westminster', coords: '51.5074° N, 0.1278° W', similarity: 65.8, timestamp: '2023-11-21 11:22:18', image: 'https://picsum.photos/seed/london/400/300' },
  { id: '5', location: 'Paris, Eiffel', coords: '48.8584° N, 2.2945° E', similarity: 54.2, timestamp: '2023-11-20 16:45:00', image: 'https://picsum.photos/seed/paris/400/300' },
];

const MOCK_SYSTEM_INTRO = {
  title: 'GeoScout Pro',
  subtitle: '是一款专为计算机设计大赛打造的智能街景检索定位系统。',
  description: '系统集成了先进的深度学习特征提取算法，能够通过用户上传的街景图像，在海量全球卫星与街景数据库中进行高维特征比对，实现毫秒级的精准定位。',
  features: [
    '跨视角图像匹配： 克服视角差异，实现地面街景与高空卫星图的精准对应。',
    '三维地球可视化： 基于 WebGL 的高性能 3D 地球渲染，直观展示定位结果。',
    '实时轨道同步追踪： 模拟真实卫星过境，提供沉浸式的操作体验。',
    '智能 AI 辅助分析： 内置大语言模型，提供专业的地理空间数据解读与问答服务。'
  ]
};

// --- Helper for real API calls ---
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// --- API Service ---
export const api = {
  // Auth
  login: async (credentials: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const user = MOCK_USERS.find(u => u.username === credentials.username && u.password === credentials.password);
      if (user) return { user, token: 'mock-jwt-token' };
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        return { 
          user: { 
            username: 'admin', 
            password: 'admin', 
            permissions: ['1.首页', '2.1卫星图检索', '2.2街景图检索', '3.历史记录', '4.智慧问答', '5.系统面板', '6.训练', '7.数据库查看', '8.用户信息管理'], 
            sync: 'Just now', 
            status: 'online',
            avatar: 'https://picsum.photos/seed/admin/100' 
          },
          token: 'mock-admin-token' 
        };
      }
      throw new Error('用户名或密码错误');
    }
    return fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  },

  // Users
  getUsers: async () => {
    if (USE_MOCK) return [...MOCK_USERS];
    return fetchAPI('/users');
  },
  createUser: async (user: any) => {
    if (USE_MOCK) return { ...user, sync: 'Just now', avatar: `https://picsum.photos/seed/${user.username}/100` };
    return fetchAPI('/users', { method: 'POST', body: JSON.stringify(user) });
  },
  updateUser: async (username: string, user: any) => {
    if (USE_MOCK) return { ...user };
    return fetchAPI(`/users/${username}`, { method: 'PUT', body: JSON.stringify(user) });
  },
  deleteUser: async (username: string) => {
    if (USE_MOCK) return { success: true };
    return fetchAPI(`/users/${username}`, { method: 'DELETE' });
  },

  // Files
  getFiles: async () => {
    if (USE_MOCK) return [...MOCK_FILES];
    return fetchAPI('/files');
  },
  uploadFile: async (file: File) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        name: `/${file.name}`,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        items: 'NEW UPLOAD',
        type: 'file'
      };
    }
    const formData = new FormData();
    formData.append('file', file);
    return fetchAPI('/files/upload', { method: 'POST', body: formData });
  },
  deleteFile: async (fileName: string) => {
    if (USE_MOCK) return { success: true };
    return fetchAPI(`/files/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
  },

  // System & Admin
  getSystemLogs: async () => {
    if (USE_MOCK) return [...MOCK_SYSTEM_LOGS];
    return fetchAPI('/system/logs');
  },
  getTrainingRecords: async () => {
    if (USE_MOCK) return [...MOCK_TRAINING_RECORDS];
    return fetchAPI('/training/records');
  },
  getTrainingStatus: async () => {
    if (USE_MOCK) return { ...MOCK_TRAINING_STATUS };
    return fetchAPI('/training/status');
  },
  startTraining: async (payload?: any) => {
    if (USE_MOCK) return { ...MOCK_TRAINING_STATUS, status: 'in_progress', progress: 1 };
    return fetchAPI('/training/start', { method: 'POST', body: JSON.stringify(payload || {}) });
  },
  failTraining: async () => {
    if (USE_MOCK) return { ...MOCK_TRAINING_STATUS, status: 'failed' };
    return fetchAPI('/training/fail', { method: 'POST' });
  },
  getSystemIntro: async () => {
    if (USE_MOCK) return { ...MOCK_SYSTEM_INTRO };
    return fetchAPI('/system/intro');
  },
  updateSystemIntro: async (data: any) => {
    if (USE_MOCK) return { ...data };
    return fetchAPI('/system/intro', { method: 'PUT', body: JSON.stringify(data) });
  },
  
  // Calendar
  getCalendarTasks: async () => {
    if (USE_MOCK) return [...MOCK_CALENDAR_TASKS];
    return fetchAPI('/calendar/tasks');
  },
  saveCalendarTasks: async (tasks: any[]) => {
    if (USE_MOCK) return [...tasks];
    return fetchAPI('/calendar/tasks', { method: 'PUT', body: JSON.stringify(tasks) });
  },

  // Shibie Backend - Image Processing and Retrieval
  shibie: {
    // Health check
    health: async () => {
      if (USE_MOCK) {
        return { 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          system_version: 'v2.0-real-api',
          algorithm: '跨视角空间感知与协同定位',
          model_ready: true,
          device: 'cpu',
          database_size: 5,
          processing_state: false,
          database_ready: true
        };
      }
      const response = await fetch(`${SHIBIE_API_BASE_URL}/api/health`);
      return response.json();
    },

    // Model information
    modelInfo: async () => {
      if (USE_MOCK) {
        return {
          model_architecture: 'SimpleImageTranslator',
          feature_extractor: 'GlobalContextFeatureExtractor',
          input_size: '256x256',
          output_size: '256x256',
          device: 'cpu',
          parameters: 12345678,
          database_info: {
            total_items: 5,
            coverage_area: '纽约市真实地标',
            data_source: '真实街景数据库'
          }
        };
      }
      const response = await fetch(`${SHIBIE_API_BASE_URL}/api/model_info`);
      return response.json();
    },

    // Image conversion (satellite to streetview)
    convertImage: async (imageFile: File) => {
      if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Return a mock transformed image (using the same image for simplicity)
        return {
          success: true,
          transformed_image: await fileToBase64(imageFile),
          processing_time: '2.1s'
        };
      }
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await fetch(`${SHIBIE_API_BASE_URL}/api/convert`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      return response.json();
    },

    // Image retrieval
    retrieveImage: async (imageData: string, mode: 'satellite' | 'streetview' = 'satellite') => {
      if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
          success: true,
          results: MOCK_RESULTS.map((result, index) => ({
            id: result.id,
            lat: 40.7128 - index * 0.01,
            lng: -74.0060 + index * 0.01,
            landmark: result.location,
            similarity: result.similarity / 100,
            distance: (index + 1) * 100 + Math.random() * 50,
            image_url: result.image,
            metadata: {
              city: 'New York',
              region: 'Manhattan',
              data_source: '真实街景数据库',
              description: `${result.location} 街景图像`,
              coordinate_accuracy: '高精度',
              timestamp: result.timestamp
            }
          }))
        };
      }
      const response = await fetch(`${SHIBIE_API_BASE_URL}/api/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_data: imageData,
          mode: mode
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      return response.json();
    },

    // Reset processing state
    resetProcessing: async () => {
      if (USE_MOCK) {
        return { success: true, message: '处理状态已重置', current_processing: false };
      }
      const response = await fetch(`${SHIBIE_API_BASE_URL}/api/reset`, {
        method: 'POST'
      });
      return response.json();
    }
  }
};

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
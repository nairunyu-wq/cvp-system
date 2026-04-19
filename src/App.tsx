import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Satellite, 
  Map as StreetView, 
  History, 
  Brain, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  Radar, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  Send,
  ChevronRight,
  ChevronDown,
  Globe,
  MapPin,
  Activity,
  User,
  Utensils,
  Image,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Info,
  X,
  Target,
  Layers,
  ZoomIn,
  Shield,
  Users,
  Terminal,
  Folder,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import EarthScene from './components/EarthScene';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from './services/api';

// Leaflet地图库 - 使用CDN方式引入
// 在index.html中添加Leaflet的CDN链接

// 添加全局样式确保地图正确显示
const mapStyles = `
  .leaflet-container {
    width: 100% !important;
    height: 100% !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 1 !important;
  }
  
  .leaflet-pane {
    z-index: 1 !important;
  }
  
  .leaflet-tile-pane {
    z-index: 2 !important;
  }
  
  .leaflet-overlay-pane {
    z-index: 3 !important;
  }
  
  .leaflet-shadow-pane {
    z-index: 4 !important;
  }
  
  .leaflet-marker-pane {
    z-index: 5 !important;
  }
  
  .leaflet-tooltip-pane {
    z-index: 6 !important;
  }
  
  .leaflet-popup-pane {
    z-index: 7 !important;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mapStyles;
  document.head.appendChild(style);
}

const AVAILABLE_PERMISSIONS = [
  { id: '1.首页', label: '1.首页' },
  { id: '2.1卫星图检索', label: '2.1卫星图检索' },
  { id: '2.2街景图检索', label: '2.2街景图检索' },
  { id: '3.历史记录', label: '3.历史记录' },
  { id: '4.智慧问答', label: '4.智慧问答' },
  { id: '5.系统面板', label: '5.系统面板' },
  { id: '6.训练', label: '6.训练' },
  { id: '7.数据库查看', label: '7.数据库查看' },
  { id: '8.用户信息管理', label: '8.用户信息管理' }
];

// --- Types ---
type View = 'home' | 'satellite' | 'streetview' | 'history' | 'history-detail' | 'ai' | 'login' | 'settings' | 'admin';

interface SearchResult {
  id: string;
  location: string;
  coords: string;
  similarity: number;
  distance: string;
  timestamp: string;
  image: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TrainingRuntime {
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'terminated';
  progress: number;
  current_epoch: number;
  total_epoch: number;
  global_steps: number;
  learning_rate: string;
  gpu_temp: number;
  current_record_id?: string | null;
  logs: string[];
}

// --- Mock Data ---
const MOCK_RESULTS: SearchResult[] = [
  { id: '1', location: 'Shanghai, Pudong', coords: '31.2304° N, 121.4737° E', similarity: 98.4, distance: '12.5', timestamp: '2023-11-24 14:30:12', image: 'https://picsum.photos/seed/shanghai/400/300' },
  { id: '2', location: 'Tokyo, Shibuya', coords: '35.6585° N, 139.7013° E', similarity: 82.1, distance: '45.2', timestamp: '2023-11-23 09:15:45', image: 'https://picsum.photos/seed/tokyo/400/300' },
  { id: '3', location: 'New York, Manhattan', coords: '40.7128° N, 74.0060° W', similarity: 72.3, distance: '78.9', timestamp: '2023-11-22 18:05:30', image: 'https://picsum.photos/seed/nyc/400/300' },
  { id: '4', location: 'London, Westminster', coords: '51.5074° N, 0.1278° W', similarity: 65.8, distance: '123.4', timestamp: '2023-11-21 11:22:18', image: 'https://picsum.photos/seed/london/400/300' },
  { id: '5', location: 'Paris, Eiffel', coords: '48.8584° N, 2.2945° E', similarity: 54.2, distance: '167.8', timestamp: '2023-11-20 16:45:00', image: 'https://picsum.photos/seed/paris/400/300' },
];

// --- Components ---

// 2D地图组件 - 参考index.html实现
const Map2D = ({ targetCoords, results, isSearching }: { targetCoords: any, results: any[], isSearching: boolean }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // 等待Leaflet加载完成
    const checkLeaflet = setInterval(() => {
      if (typeof (window as any).L !== 'undefined') {
        clearInterval(checkLeaflet);
        
        // 初始化地图
        if (mapRef.current) {
          // 清除之前的地图实例
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          
          // 清除之前的标记
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];

          // 使用全局的L对象
          const L = (window as any).L;

          // 初始化Leaflet地图 - 参考index.html
          const map = L.map(mapRef.current, {
            center: [50.45, 30.52],
            zoom: 14,
            zoomControl: true,
            attributionControl: true
          });

          // 添加卫星图层 - 完全参考index.html
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
            maxZoom: 18
          }).addTo(map);

          // 添加标记点 - 完全参考index.html
          if (results.length > 0) {
            results.forEach((item, index) => {
              // 解析坐标
              const coords = item.coords.split(', ');
              const lat = parseFloat(coords[0].replace('° N', ''));
              const lng = parseFloat(coords[1].replace('° E', ''));
              
              // 确定图标类型
              let iconUrl, iconSize;
              if (index === 0) {
                iconUrl = 'https://cdn-icons-png.flaticon.com/512/684/684903.png';
                iconSize = [30, 50];
              } else if (index === 1) {
                iconUrl = 'https://cdn-icons-png.flaticon.com/512/684/684904.png';
                iconSize = [25, 41];
              } else {
                iconUrl = 'https://cdn-icons-png.flaticon.com/512/684/684902.png';
                iconSize = [20, 34];
              }
              
              const markerIcon = L.icon({ 
                iconUrl, 
                iconSize, 
                iconAnchor: [iconSize[0]/2, iconSize[1]] 
              });
              
              const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
              marker.bindPopup(`
                <b>结果${index+1}</b><br>
                相似度: ${item.similarity}%<br>
                坐标: ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
                距离: ${item.distance} 米
              `);
              
              markersRef.current.push(marker);
            });

            // 强制地图重新计算大小
            setTimeout(() => {
              map.invalidateSize();
              // 飞向最佳匹配点 - 参考index.html，使用17的缩放级别
              if (results.length > 0) {
                const firstResult = results[0];
                const coords = firstResult.coords.split(', ');
                const lat = parseFloat(coords[0].replace('° N', ''));
                const lng = parseFloat(coords[1].replace('° E', ''));
                map.setView([lat, lng], 17);
              }
            }, 100);
          }

          mapInstanceRef.current = map;
        }
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [results, isSearching]);

  // 监听targetCoords变化，实现点击结果卡片时地图跳转
  useEffect(() => {
    if (mapInstanceRef.current && targetCoords) {
      const map = mapInstanceRef.current;
      map.setView([targetCoords.lat, targetCoords.lon], 18);
      
      // 找到对应的标记并打开popup
      const markerIndex = markersRef.current.findIndex(marker => {
        const latLng = marker.getLatLng();
        return Math.abs(latLng.lat - targetCoords.lat) < 0.0001 && 
               Math.abs(latLng.lng - targetCoords.lon) < 0.0001;
      });
      
      if (markerIndex !== -1) {
        markersRef.current[markerIndex].openPopup();
      }
    }
  }, [targetCoords]);

  // 检索过程中显示加载动画
  if (isSearching) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0B0E14]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-blue-400 font-bold tracking-widest animate-pulse">INITIALIZING MAP...</p>
          <p className="text-xs text-slate-500 mt-2 font-mono">LOADING SATELLITE IMAGERY</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full" 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1
      }} 
    />
  );
};

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  submenu = false 
}: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  onClick?: () => void,
  submenu?: boolean
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white",
      submenu && "ml-4 text-sm py-2"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-blue-400" : "group-hover:text-blue-400")} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [currentView, setCurrentView] = useState<View>('home');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'content' | 'logs' | 'training_model' | 'training_logs' | 'training_detail' | 'database' | 'users'>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [isTrainingOpen, setIsTrainingOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [targetCoords, setTargetCoords] = useState<{lat: number, lon: number} | null>(null);
  const [expandedWidget, setExpandedWidget] = useState<'calendar' | 'intro' | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // 地图显示模式状态
  const [mapDisplayMode, setMapDisplayMode] = useState<'3d' | '2d'>('3d');
  const [userInfo, setUserInfo] = useState({
    name: 'Admin_User',
    role: 'Level 4 Access',
    email: 'admin@cvp.sys',
    avatar: 'https://picsum.photos/seed/user/100'
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '您好，我是空间感知助手，想了解哪里？' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [historyData, setHistoryData] = useState<SearchResult[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const settingsAvatarInputRef = useRef<HTMLInputElement>(null);

  // --- Login Carousel Data ---
  const [loginCarouselIndex, setLoginCarouselIndex] = useState(0);
  
  // Login image preview state
  const [loginImages, setLoginImages] = useState([
    '/1.jpg',
    '/2.jpg',
    '/3.jpg',
    '/4.jpg'
  ]);
  const [currentLoginImageIndex, setCurrentLoginImageIndex] = useState(0);
  
  const [trainingStatus, setTrainingStatus] = useState<'not_started' | 'started' | 'in_progress' | 'completed' | 'failed'>('not_started');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedTrainingRecord, setSelectedTrainingRecord] = useState<any>(null);
  const [trainingRuntime, setTrainingRuntime] = useState<TrainingRuntime>({
    status: 'not_started',
    progress: 0,
    current_epoch: 0,
    total_epoch: 150,
    global_steps: 0,
    learning_rate: '0.0001',
    gpu_temp: 55,
    current_record_id: null,
    logs: ['[INFO] 训练任务未开始']
  });
  const [isTrainingActionRunning, setIsTrainingActionRunning] = useState(false);

  // --- Editable Content State ---
  const [calendarTasks, setCalendarTasks] = useState<any[]>([]);
  const [systemIntro, setSystemIntro] = useState<any>({ title: '', subtitle: '', description: '', features: [] });
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [databaseFiles, setDatabaseFiles] = useState<any[]>([]);
  
  // Cartoon background state
  const [currentCartoonIndex, setCurrentCartoonIndex] = useState(0);
  const cartoonFiles = [
    '/cartoon.mp4'
  ];
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [actionNotice, setActionNotice] = useState<string>('');

  // Fetch initial data
  // Auto-play cartoon background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCartoonIndex((prev) => (prev + 1) % cartoonFiles.length);
    }, 30000); // 每30秒切换一次
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tasks, intro, logs, records, users, files, trainingStatusRes] = await Promise.all([
        api.getCalendarTasks(),
        api.getSystemIntro(),
        api.getSystemLogs(),
        api.getTrainingRecords(),
        api.getUsers(),
        api.getFiles(),
        api.getTrainingStatus()
      ]);
      setCalendarTasks(tasks);
      setSystemIntro(intro);
      setSystemLogs(logs);
      setTrainingRecords(records);
      setUsersList(users);
      setDatabaseFiles(files);
      setTrainingRuntime(trainingStatusRes);
      setTrainingStatus(trainingStatusRes.status === 'terminated' ? 'failed' : trainingStatusRes.status);
      setTrainingProgress(trainingStatusRes.progress || 0);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      loadData();
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchImageInputRef = useRef<HTMLInputElement>(null); // 检索界面的文件输入框

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newFile = await api.uploadFile(file);
        setDatabaseFiles([...databaseFiles, newFile]);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      await api.deleteFile(fileName);
      setDatabaseFiles(databaseFiles.filter(f => f.name !== fileName));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState<{username: string, password: string, permissions: string[], status: string}>({ username: '', password: '', permissions: [], status: 'online' });

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        const updated = await api.updateUser(editingUser.username, userForm);
        setUsersList(usersList.map(u => u.username === editingUser.username ? { ...updated, avatar: u.avatar, sync: u.sync } : u));
      } else {
        const created = await api.createUser(userForm);
        setUsersList([...usersList, created]);
      }
      setIsUserModalOpen(false);
    } catch (error) {
      console.error("Save user failed:", error);
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      await api.deleteUser(username);
      setUsersList(usersList.filter(u => u.username !== username));
    } catch (error) {
      console.error("Delete user failed:", error);
    }
  };

  const handleSaveContent = async () => {
    setIsSavingContent(true);
    setActionNotice('');
    try {
      const sanitizedFeatures = (systemIntro.features || [])
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);

      await Promise.all([
        api.updateSystemIntro({ ...systemIntro, features: sanitizedFeatures }),
        api.saveCalendarTasks(calendarTasks)
      ]);
      await loadData();
      setActionNotice('内容管理已保存到后端数据库。');
    } catch (error) {
      console.error("Save content failed:", error);
      setActionNotice('内容保存失败，请检查后端连接。');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.username) {
      setCurrentView('home');
      return;
    }

    setIsSavingProfile(true);
    try {
      const nextUser = await api.updateUser(currentUser.username, {
        status: currentUser.status || 'online',
        permissions: currentUser.permissions || [],
        avatar: userInfo.avatar
      });
      setCurrentUser({ ...currentUser, ...nextUser });
      setUsersList(usersList.map(u => u.username === currentUser.username ? { ...u, ...nextUser } : u));
      setCurrentView('home');
    } catch (error) {
      console.error("Save profile failed:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const refreshTrainingRuntime = async () => {
    try {
      const statusRes = await api.getTrainingStatus();
      setTrainingRuntime(statusRes);
      setTrainingStatus(statusRes.status === 'terminated' ? 'failed' : statusRes.status);
      setTrainingProgress(statusRes.progress || 0);
    } catch (error) {
      console.error("Load training status failed:", error);
    }
  };

  const handleStartTraining = async () => {
    setIsTrainingActionRunning(true);
    try {
      await api.startTraining();
      await Promise.all([refreshTrainingRuntime(), api.getTrainingRecords().then(setTrainingRecords)]);
    } catch (error) {
      console.error("Start training failed:", error);
    } finally {
      setIsTrainingActionRunning(false);
    }
  };

  const handleFailTraining = async () => {
    setIsTrainingActionRunning(true);
    try {
      await api.failTraining();
      await Promise.all([refreshTrainingRuntime(), api.getTrainingRecords().then(setTrainingRecords)]);
    } catch (error) {
      console.error("Fail training failed:", error);
    } finally {
      setIsTrainingActionRunning(false);
    }
  };

  const handleRefreshTrainingRecords = async () => {
    try {
      const records = await api.getTrainingRecords();
      setTrainingRecords(records);
      await refreshTrainingRuntime();
    } catch (error) {
      console.error("Refresh training records failed:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setLoginId('');
    setLoginPassword('');
    setCurrentUser(null);
  };

  const loginCarouselData = [
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJxAkUHKt7rV19XAdfMuu6rgTcVqvWQNJqzqhMNUq8D1Mb51N0L0t54Uihi5-IoHzPc9mVVJ9YQj1j3BUpNw_9F_H1cegIygR7X0FfRuSGMele1h1nVQ_TWgcr6dCCZVm4llsWyEIPyDH6U-xoKnd12mTWNA9O0T_qSYE9FVcSLLQUJh8ed-XJ2UPAbtR9zeoVsTbH1zetb4EDcbLEqdz3uEVb-oBP0ciSJh3tpRWFq9At44kOwxTU8gYtcJBcT6fiLBC2INTc4hyq',
      sector: 'Sector 7G-Alpha',
      title: 'Equatorial Positioning Feed',
      desc: 'Real-time atmospheric synchronization with orbital nodes. High-resolution multispectral imaging data stream active.'
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJIQwTVwQQzch-ylQWmfgKcUCuSrD3CGG2dms-wrFyBULfCfPnX5icY2jtkHwcfbqgR4kbBcbXS4CxYnDedS63M3-BOJ4F0kpDQkPtWCyfVqCICMvR7-WGO5Dg1kt-c8r059AcUfBQ9pbsNg-VzEtX9_dx7nT7GvoXz6kEuQEz4nHPEr_pqyGerQvUjDUW5J_69HixWIhoCAjvXiY21s6qFA684tHOXc2MQO0SZTTyN0L-eb0U4k-y5akdyy_PIB9284Xiuk9rCgbt',
      sector: 'Sector 4B-Mars',
      title: 'Martian Surface Recon',
      desc: 'Topographical analysis of Valles Marineris. Surface temp stabilized at -63°C.'
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-u-Fyvn-m8oSkkuM_f_tziCN_1hNoXMdO_aDjWzY0stjM1qqVQVsFY74_a2nMbIfzV06BklDuVj7BQAIBFxmLmA7NPaANgU0bv-yxXhmA77PCBAsXuV_42VBeo1b_LurnVgkK60a7A8z4QlkDgySC_fTFQq_S6r4XWLP1jkt_QwBkPGQqpPWVNeRw74HPxyUEQwaB_QdArw8nNDQfdsNcTPL6w2VMT0XxvA9nJAyVVb9sPR6-X3D7rDN7zk0GQvPqR7TEubkqVfTp',
      sector: 'Global Grid',
      title: 'Neural Network Topology',
      desc: 'Visualizing global data throughput and edge node connectivity across the Aetheris grid.'
    }
  ];

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshTrainingRuntime();
    const interval = setInterval(() => {
      refreshTrainingRuntime();
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn, currentView, adminTab]);

  // --- AI Logic ---
  const handleSendMessage = async () => {
    if (!inputValue.trim() && !chatImage) return;
    const newMessages = [...messages, { role: 'user', content: inputValue || '[图片]' } as ChatMessage];
    setMessages(newMessages);
    setInputValue('');
    const currentImage = chatImage;
    setChatImage(null);

    try {
      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        throw new Error('DeepSeek API密钥未配置');
      }
      
      let userMessage: string;
      
      if (currentImage) {
        userMessage = inputValue || "请描述这张图片";
      } else {
        userMessage = inputValue;
      }

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个专业的地理空间定位系统助手（CVP-SYSTEM）。你精通卫星图像分析、街景识别和全球地理坐标。请以专业、精准且友好的口吻回答用户的问题。如果用户询问位置，请尝试提供经纬度信息。"
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || '抱歉，我无法处理您的请求。';
      
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages([...newMessages, { role: 'assistant', content: '连接AI服务时出错，请稍后再试。' }]);
    }
  };

  // --- View Change Logic ---
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'satellite' || view === 'streetview') {
      setTargetCoords(null);
      setIsSearching(false);
      setSearchProgress(0);
    } else {
      // 离开检索界面时自动恢复3D地球到初始状态
      setMapDisplayMode('3d');
      setTargetCoords(null);
      setIsSearching(false);
      setSearchProgress(0);
    }
  };

  // --- Search Logic ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('文件上传:', file);
    if (file) {
      // 如果已经有上传的图片，先清除之前的检索结果
      if (uploadedImage) {
        console.log('清除之前的检索结果');
        setMapDisplayMode('3d');
        setTargetCoords(null);
        setSearchProgress(0);
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('文件读取完成:', event.target?.result);
        setUploadedImage(event.target?.result as string);
        // 重置检索状态，准备新的检索
        setIsSearching(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResultClick = (index: number) => {
    const result = historyData[index];
    if (result && mapDisplayMode === '2d') {
      // 解析坐标
      const coords = result.coords.split(', ');
      const lat = parseFloat(coords[0].replace('° N', ''));
      const lon = parseFloat(coords[1].replace('° E', ''));
      
      // 更新目标坐标
      setTargetCoords({ lat, lon });
      
      // 通知Map2D组件更新地图视图
      // 通过设置targetCoords触发地图更新
    }
  };

  const startSearch = async () => {
    if (!uploadedImage) return;
    
    // 开始检索时重置所有状态，支持多次检索
    setMapDisplayMode('2d');
    setIsSearching(true);
    setSearchProgress(0);
    setTargetCoords(null);
    
    try {
      // 模拟检索进度
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 调用真实的后端检索API
      const imageData = uploadedImage.split(',')[1]; // 去掉data:image前缀
      
      const response = await fetch('http://localhost:5000/api/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: imageData,
          mode: currentView === 'satellite' ? 'satellite' : 'streetview',
          top_k: 5
        })
      });

      if (!response.ok) {
        throw new Error(`检索失败: ${response.status}`);
      }

      const result = await response.json();
      
      // 清除进度模拟
      clearInterval(progressInterval);
      setSearchProgress(100);
      
      // 处理返回结果
      if (result.success && result.results && result.results.length > 0) {
        // 更新检索结果
        const realResults = result.results.map((item: any, index: number) => ({
          id: item.id || index.toString(),
          location: item.landmark || `位置 ${index + 1}`,
          coords: `${item.lat?.toFixed(4) || '0.0000'}° N, ${item.lng?.toFixed(4) || '0.0000'}° E`,
          similarity: Math.round((item.similarity || 0) * 100),
          distance: item.distance || (index * 100 + Math.random() * 50).toFixed(1),
          timestamp: new Date().toLocaleString('zh-CN'),
          image: item.image_url || 'https://picsum.photos/400/300'
        }));
        
        // 更新前端显示结果
        setHistoryData(realResults);
        
        // 设置目标坐标（取相似度最高的结果）
        const bestMatch = result.results[0];
        if (bestMatch.lat && bestMatch.lng) {
          setTimeout(() => {
            setTargetCoords({ lat: bestMatch.lat, lon: bestMatch.lng });
            setIsSearching(false);
            // 检索完成后保持2D地图显示，让用户看到结果
            // 不再自动切换回3D地球，只有在离开检索界面时才切换
          }, 500);
        }
      } else {
        throw new Error('未找到匹配结果');
      }
      
    } catch (error) {
      console.error('检索错误:', error);
      // 降级处理：使用模拟数据
      const fallbackInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 100) {
            clearInterval(fallbackInterval);
            setIsSearching(false);
            // 使用模拟城市数据
            const cities = [
              { lat: 39.9042, lon: 116.4074 }, // Beijing
              { lat: 40.7128, lon: -74.0060 }, // New York
              { lat: 51.5074, lon: -0.1278 },  // London
              { lat: 35.6762, lon: 139.6503 }  // Tokyo
            ];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            setTargetCoords(randomCity);
            
            // 生成模拟结果数据
            const mockResults = Array.from({ length: 5 }, (_, index) => ({
              id: index.toString(),
              location: `位置 ${index + 1}`,
              coords: `${(randomCity.lat + (Math.random() - 0.5) * 0.01).toFixed(4)}° N, ${(randomCity.lon + (Math.random() - 0.5) * 0.01).toFixed(4)}° E`,
              similarity: Math.round(95 - index * 5 - Math.random() * 3),
              distance: (index * 100 + Math.random() * 50).toFixed(1),
              timestamp: new Date().toLocaleString('zh-CN'),
              image: 'https://picsum.photos/400/300'
            }));
            setHistoryData(mockResults);
            
            // 检索完成后保持2D地图显示，让用户看到结果
            // 不再自动切换回3D地球，只有在离开检索界面时才切换
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }
  };

  // --- Dynamic Similarity Curve Data ---
  const similarityData = targetCoords && historyData.length > 0 
    ? historyData.slice(0, 5).map((res, index) => ({
        name: `Top ${index + 1}`,
        value: res.similarity
      }))
    : [{name: 'Top 1', value: 0}, {name: 'Top 2', value: 0}, {name: 'Top 3', value: 0}, {name: 'Top 4', value: 0}, {name: 'Top 5', value: 0}];

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await api.login({ username: loginId, password: loginPassword });
      const user = res.user;
      
      if (user) {
        if (res.token) {
          localStorage.setItem('token', res.token);
        }
        await loadData();
        
        const normalizedUser = {
          ...user,
          permissions: user.permissions || [],
          status: user.status || 'online',
          sync: user.sync || 'Just now'
        };
        
        setCurrentUser(normalizedUser);
        const isAdminRole = normalizedUser.permissions.some((p: string) => ['5.系统面板', '6.训练', '7.数据库查看', '8.用户信息管理'].includes(p));
        setUserRole(isAdminRole ? 'admin' : 'user');
        setCurrentView(normalizedUser.permissions.includes('5.系统面板') ? 'admin' : 'home');
        setUserInfo({
          name: normalizedUser.username,
          role: isAdminRole ? 'Administrator' : 'Standard User',
          email: `${normalizedUser.username}@cvp.sys`,
          avatar: normalizedUser.avatar || 'https://picsum.photos/seed/default/100'
        });
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      setLoginError(error.message || '连接认证服务器失败。');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const hasPerm = (perm: string) => currentUser?.permissions?.includes(perm);

  if (!isLoggedIn) {
    return (
      <div className="h-screen bg-[#0B0E14] text-slate-200 flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden">
        <div className="w-full max-w-7xl h-full mx-auto flex flex-col justify-between relative z-10 py-2">
          {/* Login Header */}
          <header className="flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold tracking-tighter text-blue-400 uppercase text-xl">Celestial Intelligence</span>
                <span className="text-slate-800 mx-1 text-xl font-light">|</span>
                <nav className="hidden lg:flex items-center gap-6">
                  <a className="text-slate-200 text-xs tracking-[0.3em] uppercase border-b-2 border-blue-500 pb-1 font-bold" href="#">Systems</a>
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-slate-500 text-[9px] tracking-[0.3em] uppercase font-bold">
                <span>Active Feed: Orbital_09</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              </div>
            </div>
          </header>

          {/* Login Content */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0 my-4">
            {/* Left: Gallery */}
            <div className="flex-grow flex flex-col gap-4 lg:w-[60%] min-h-0">
              {/* Large Preview Image */}
              <div className="relative flex-1 rounded-[2rem] overflow-hidden bg-slate-900/50 border border-white/10 backdrop-blur-2xl shadow-2xl group min-h-0">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentLoginImageIndex}
                    src={loginImages[currentLoginImageIndex]}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-30"></div>

                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => setCurrentLoginImageIndex((prev) => (prev - 1 + loginImages.length) % loginImages.length)}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-blue-500/40 hover:border-blue-500 transition-all"
                  >
                    <ChevronRight className="rotate-180 w-6 h-6" />
                  </button>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => setCurrentLoginImageIndex((prev) => (prev + 1) % loginImages.length)}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-blue-500/40 hover:border-blue-500 transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="absolute bottom-8 left-8 right-8 space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    System Preview
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium line-clamp-2">
                    CVP-SYSTEM 跨视角空间感知与协同定位系统
                  </p>
                </div>
              </div>

              {/* Thumbnail Preview */}
              <div className="grid grid-cols-3 gap-4 h-24 shrink-0">
                {loginImages.slice(1, 4).map((image, idx) => (
                  <div 
                    key={idx + 1}
                    onClick={() => setCurrentLoginImageIndex(idx + 1)}
                    className={cn(
                      "rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900/50 backdrop-blur-md relative group",
                      currentLoginImageIndex === idx + 1 ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                    )}
                  >
                    <img src={image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className={cn("absolute inset-0 bg-blue-500/20 transition-opacity", currentLoginImageIndex === idx + 1 ? "opacity-100" : "opacity-0 group-hover:opacity-100")}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:w-[35%] flex flex-col justify-center shrink-0">
              <div className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0 space-y-8">
                <div className="space-y-3">
                  <h1 className="text-4xl font-black tracking-tighter text-white leading-none">Command<br /><span className="text-blue-500">Authorization</span></h1>
                  <p className="text-slate-500 text-base tracking-wide max-w-md font-medium">Enter tactical credentials to access the orbital grid network.</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/50 rounded-br-2xl"></div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    {loginError && (
                      <div className="text-rose-500 text-xs font-bold tracking-widest uppercase text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                        {loginError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase ml-2">Satellite Identity</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <input 
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-4 pl-14 pr-5 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-base font-mono"
                          placeholder="USER_COORD_X01"
                          type="text"
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase ml-2">Encryption Key</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                          <Activity className="w-5 h-5" />
                        </div>
                        <input 
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-4 pl-14 pr-5 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-base font-mono"
                          placeholder="••••••••••••"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-5 rounded-xl text-white font-black tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-lg group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span>{isLoggingIn ? 'Authenticating...' : 'Initialize Uplink'}</span>
                      <Radar className={cn("w-6 h-6", isLoggingIn ? "animate-spin" : "group-hover:animate-spin-slow")} />
                    </button>
                  </form>
                </div>

                <footer className="space-y-4 pt-2 px-4">
                  <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    Security Clearance: Level 4 Required<br />
                    All transmissions are encrypted and monitored by Aetheris Zenith Intelligence.
                  </p>
                </footer>
              </div>
            </div>
          </div>

          {/* Login Footer */}
          <footer className="flex items-center justify-between px-4 pt-4 border-t border-white/5 shrink-0">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-white tracking-widest">01</span>
                <div className="w-24 h-[1px] bg-blue-500/50 relative">
                  <div className="absolute top-0 left-0 h-full bg-blue-500 w-1/4"></div>
                </div>
                <span className="text-xs font-black text-slate-600 tracking-widest">02</span>
                <span className="text-xs font-black text-slate-600 tracking-widest">03</span>
                <span className="text-xs font-black text-slate-600 tracking-widest">04</span>
              </div>
            </div>
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
              System Status: <span className="text-emerald-500">Nominal</span> // Latency: <span className="text-blue-400">14ms</span>
            </div>
          </footer>
        </div>

        {/* Background Pulses */}
        <div className="fixed top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="fixed bottom-1/4 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0E14] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161A21] border-r border-white/5 flex flex-col py-6 px-4 z-50 shadow-2xl">
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Globe className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-400 tracking-tighter">CVP-SYSTEM</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Celestial Navigator</p>
            <div className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
              userRole === 'admin' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            )}>
              {userRole === 'admin' ? 'Administrator' : 'Standard User'}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {hasPerm('1.首页') && (
            <SidebarItem 
              icon={Home} 
              label="首页" 
              active={currentView === 'home'} 
              onClick={() => setCurrentView('home')} 
            />
          )}
          
          {(hasPerm('2.1卫星图检索') || hasPerm('2.2街景图检索')) && (
            <div className="space-y-1">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5" />
                  <span className="font-medium">检索中心</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isSearchOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {hasPerm('2.1卫星图检索') && (
                      <SidebarItem 
                        icon={Satellite} 
                        label="卫星图检索" 
                        submenu 
                        active={currentView === 'satellite'} 
                        onClick={() => handleViewChange('satellite')} 
                      />
                    )}
                    {hasPerm('2.2街景图检索') && (
                      <SidebarItem 
                        icon={StreetView} 
                        label="街景图检索" 
                        submenu 
                        active={currentView === 'streetview'} 
                        onClick={() => handleViewChange('streetview')} 
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {hasPerm('3.历史记录') && (
            <SidebarItem 
              icon={History} 
              label="历史记录" 
              active={currentView === 'history' || currentView === 'history-detail'} 
              onClick={() => setCurrentView('history')} 
            />
          )}
          {hasPerm('4.智慧问答') && (
            <SidebarItem 
              icon={Brain} 
              label="智慧问答" 
              active={currentView === 'ai'} 
              onClick={() => setCurrentView('ai')} 
            />
          )}
          {hasPerm('5.系统面板') && (
            <SidebarItem 
              icon={Shield} 
              label="系统面板" 
              active={currentView === 'admin' && ['dashboard', 'content', 'logs'].includes(adminTab)} 
              onClick={() => { setCurrentView('admin'); setAdminTab('dashboard'); }} 
            />
          )}
          {hasPerm('6.训练') && (
            <div className="space-y-1">
              <button 
                onClick={() => setIsTrainingOpen(!isTrainingOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">训练</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isTrainingOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isTrainingOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <SidebarItem 
                      icon={Radar} 
                      label="模型训练" 
                      submenu 
                      active={currentView === 'admin' && adminTab === 'training_model'} 
                      onClick={() => { setCurrentView('admin'); setAdminTab('training_model'); }} 
                    />
                    <SidebarItem 
                      icon={History} 
                      label="训练日志" 
                      submenu 
                      active={currentView === 'admin' && adminTab === 'training_logs'} 
                      onClick={() => { setCurrentView('admin'); setAdminTab('training_logs'); }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {hasPerm('7.数据库查看') && (
            <SidebarItem 
              icon={Folder} 
              label="数据库查看" 
              active={currentView === 'admin' && adminTab === 'database'} 
              onClick={() => { setCurrentView('admin'); setAdminTab('database'); }} 
            />
          )}
          {hasPerm('8.用户信息管理') && (
            <SidebarItem 
              icon={Users} 
              label="用户信息管理" 
              active={currentView === 'admin' && adminTab === 'users'} 
              onClick={() => { setCurrentView('admin'); setAdminTab('users'); }} 
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-blue-500/30 space-y-2">
          <SidebarItem icon={Settings} label="设置" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:text-rose-300" />
            <span className="font-medium">退出系统</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-blue-500/30 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-blue-400 tracking-tight">
              {currentView === 'home' && '全球定位概览'}
              {currentView === 'satellite' && '卫星图检索分析终端'}
              {currentView === 'streetview' && '街景图检索分析终端'}
              {currentView === 'history' && '历史检索记录'}
              {currentView === 'history-detail' && '详情查看: 跨视角定位系统 (CVP-SYSTEM)'}
              {currentView === 'ai' && '智慧空间感知助手'}
              {currentView === 'settings' && '系统设置'}
              {currentView === 'admin' && '系统管理中心'}
            </h2>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <Activity className="w-3 h-3 text-emerald-500" />
              System Operational
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 hover:text-white transition-colors" onClick={loadData}>
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentView('settings')}>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white leading-tight">{userInfo.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{userInfo.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-blue-500/20 overflow-hidden">
                <img src={userInfo.avatar} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="sync">
            {currentView === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
              >
                {/* Cartoon Background */}
                <video 
                  key={currentCartoonIndex}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-100"
                >
                  <source src={cartoonFiles[currentCartoonIndex]} type="video/mp4" />
                </video>

                {/* Home Page Widgets (Top Right) */}
                <div className="absolute top-8 right-8 flex flex-col gap-6 z-20">
                  {/* Calendar Widget */}
                  <div 
                    onClick={() => setExpandedWidget('calendar')}
                    className="bg-[#0B0E14]/80 backdrop-blur-md border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors w-64 h-48 flex flex-col shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  >
                    <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4"/> 任务日历</h3>
                    <div className="flex-1 overflow-y-auto text-sm text-slate-300 space-y-2 pr-2 custom-scrollbar">
                      <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                        <div className="text-xs text-blue-400 font-mono">2026-04-10</div>
                        <div>系统例行维护与轨道校准</div>
                      </div>
                      <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                        <div className="text-xs text-blue-400 font-mono">2026-04-12</div>
                        <div>新增高分卫星数据接入</div>
                      </div>
                      <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                        <div className="text-xs text-blue-400 font-mono">2026-04-15</div>
                        <div>全球地貌特征库更新</div>
                      </div>
                    </div>
                  </div>

                  {/* Intro Widget */}
                  <div 
                    onClick={() => setExpandedWidget('intro')}
                    className="bg-[#0B0E14]/80 backdrop-blur-md border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors w-64 h-48 flex flex-col shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  >
                    <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2"><Info className="w-4 h-4"/> 系统介绍</h3>
                    <div className="flex-1 overflow-y-auto text-sm text-slate-300 pr-2 custom-scrollbar leading-relaxed">
                      GeoScout Pro 是一款专为计算机设计大赛打造的智能街景检索定位系统。
                      系统集成了先进的深度学习特征提取算法，能够通过用户上传的街景图像，在海量全球卫星与街景数据库中进行高维特征比对，实现毫秒级的精准定位。
                      核心功能包括：跨视角图像匹配、三维地球可视化、实时轨道同步追踪以及智能 AI 辅助分析。
                    </div>
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-12 pointer-events-none">
                  {/* Top Section */}
                  <div className="flex justify-between items-start w-full">
                    <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-4 py-2 rounded-lg pointer-events-auto">
                      <span className="text-blue-400 font-mono text-xs tracking-widest uppercase animate-pulse">Live Orbital Feed</span>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex flex-col md:flex-row justify-end items-end w-full gap-6 pointer-events-auto">
                    <button 
                      onClick={() => setCurrentView('satellite')}
                      className="group relative bg-blue-500/20 backdrop-blur-xl hover:bg-blue-500 text-white px-8 py-5 rounded-2xl flex items-center gap-4 font-bold transition-all duration-300 hover:scale-105 active:scale-95 border border-blue-400/50 hover:border-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                      <Radar className="w-6 h-6 group-hover:animate-spin-slow" />
                      <span className="tracking-[0.2em] text-lg">INITIALIZE TARGETING</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {(currentView === 'satellite' || currentView === 'streetview') && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 h-full flex flex-col gap-6"
              >
                {/* Control Bar */}
                <div className="bg-[#161A21]/50 backdrop-blur-md p-4 rounded-2xl border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      ref={searchImageInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      onClick={() => searchImageInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-blue-500/30"
                    >
                      <Plus className="w-5 h-5 text-blue-400" />
                      添加图片
                    </button>
                    {uploadedImage && (
                      <div className="h-12 w-12 rounded-lg overflow-hidden border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button 
                      onClick={startSearch}
                      disabled={isSearching || !uploadedImage}
                      className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all ml-2"
                    >
                      <Radar className={cn("w-5 h-5", isSearching && "animate-spin")} />
                      开始检索
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      console.log('清除上传，重置所有状态');
                      // 清除上传时重置所有状态
                      setUploadedImage(null);
                      setMapDisplayMode('3d');
                      setTargetCoords(null);
                      setIsSearching(false);
                      setSearchProgress(0);
                      setHistoryData([]);
                      // 重置文件输入框，允许再次选择文件
                      if (searchImageInputRef.current) {
                        searchImageInputRef.current.value = '';
                        console.log('文件输入框已重置');
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                    清除上传
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                  {/* Preview Area */}
                  <div className="col-span-8 bg-[#161A21]/30 rounded-3xl border border-blue-500/30 relative overflow-hidden flex flex-col" style={{ minHeight: '500px', height: '100%' }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_0%,#0B0E14_100%)] opacity-40 pointer-events-none" />
                    
                    {/* 3D Earth 或 2D Map */}
                    <div className="flex-1 relative w-full h-full min-h-0" style={{ zIndex: 2, overflow: 'hidden' }}>
                      <AnimatePresence mode="wait">
                      {mapDisplayMode === '3d' ? (
                        <motion.div
                          key="3d-earth"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.2 }}
                          transition={{ duration: 0.8 }}
                          className="w-full h-full"
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                          <EarthScene targetCoords={targetCoords} isSearching={isSearching} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="2d-map"
                          initial={{ opacity: 0, scale: 1.2 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.8 }}
                          className="w-full h-full"
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                          {/* 2D地图实现 - 参考ceshi.html */}
                          <Map2D targetCoords={targetCoords} results={historyData} isSearching={isSearching} />
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>

                    {/* Overlay UI */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {isSearching ? (
                        <div className="flex flex-col items-center gap-6 z-10 w-full max-w-md bg-black/40 p-8 rounded-2xl backdrop-blur-md border border-white/10">
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${searchProgress}%` }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-blue-400 font-bold tracking-widest animate-pulse">SCANNING SECTOR...</p>
                            <p className="text-xs text-slate-500 mt-2 font-mono">MATCHING PATTERNS: {searchProgress}%</p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Corner Metadata */}
                    <div className="absolute top-6 left-6 font-mono text-[10px] text-blue-500/50 pointer-events-none">
                      SECTOR: 7G-ALPHA<br />ALTITUDE: {targetCoords ? '2.5KM' : '432.1KM'}
                    </div>
                    <div className="absolute bottom-6 right-6 font-mono text-[10px] text-blue-500/50 text-right pointer-events-none">
                      LAT: {targetCoords ? `${targetCoords.lat}° N` : '31.2304° N'}<br />LONG: {targetCoords ? `${targetCoords.lon}° E` : '121.4737° E'}
                    </div>
                  </div>

                  {/* Results Sidebar */}
                  <div className="col-span-4 flex flex-col gap-6 min-h-0">
                    <div className="flex-1 bg-[#161A21]/50 rounded-3xl border border-blue-500/30 flex flex-col overflow-hidden">
                      <div className="p-5 border-b border-blue-500/30 flex justify-between items-center bg-slate-800/30">
                        <h3 className="text-sm font-bold text-blue-400 tracking-widest uppercase">检索结果 (TOP 5)</h3>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">LIVE</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {historyData.length > 0 ? (
                          historyData.map((res, i) => (
                            <motion.div 
                              key={res.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="p-3 rounded-xl bg-slate-800/50 border-l-4 border-blue-500 hover:border-orange-500 hover:bg-slate-800 transition-all cursor-pointer group"
                              onClick={() => handleResultClick(i)}
                            >
                              <div className="mb-2">
                                {uploadedImage && (
                                  <img 
                                    src={uploadedImage} 
                                    alt={`检索结果${i+1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                )}
                              </div>
                              <div className="text-green-400 font-bold text-sm mb-1">相似度: {res.similarity}%</div>
                              <div className="text-slate-500 text-xs mb-1">坐标: {res.coords}</div>
                              <div className="text-orange-500 text-xs">与查询图像距离: {res.distance} 米</div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center text-slate-500 text-sm py-8">
                            <p>暂无检索结果</p>
                            <p className="text-xs mt-2">请上传图片并开始检索</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Similarity Curve Chart */}
                    <div className="h-48 bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-5 flex flex-col">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">特征相似度收敛曲线</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={similarityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px' }}
                            itemStyle={{ color: '#60a5fa' }}
                          />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 h-full overflow-y-auto custom-scrollbar"
              >
                <div className="max-w-5xl mx-auto space-y-6">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">历史检索记录</h3>
                      <p className="text-slate-500 mt-2">查看并管理您的跨视角定位历史存档</p>
                    </div>
                    <button 
                      onClick={() => {
                        setHistoryData(prev => prev.filter(item => !selectedHistoryIds.includes(item.id)));
                        setSelectedHistoryIds([]);
                      }}
                      disabled={selectedHistoryIds.length === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-5 h-5" />
                      批量删除
                    </button>
                  </div>

                  <div className="space-y-4">
                    {historyData.length === 0 ? (
                      <div className="text-center py-20 text-slate-500">
                        暂无历史记录
                      </div>
                    ) : (
                      historyData.map((res) => (
                        <div key={res.id} className="group flex items-center gap-6 p-4 bg-slate-800/30 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedHistoryIds.includes(res.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHistoryIds(prev => [...prev, res.id]);
                              } else {
                                setSelectedHistoryIds(prev => prev.filter(id => id !== res.id));
                              }
                            }}
                            className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500/50 bg-slate-900/50"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="w-48 h-28 rounded-xl overflow-hidden bg-slate-900 border border-white/5 flex-shrink-0">
                          <img src={res.image} alt={res.location} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-8">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">地点</p>
                            <p className="font-bold text-white">{res.location}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">时间</p>
                            <p className="text-slate-300">{res.timestamp}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">相似度</p>
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-blue-400">{res.similarity}%</span>
                              <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${res.similarity}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView('history-detail');
                          }}
                          className="p-2 text-slate-500 hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>
                    )))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'history-detail' && (
              <motion.div 
                key="history-detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar"
              >
                {/* Back button header */}
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setCurrentView('history')} className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">历史记录</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                      <h2 className="text-lg font-bold text-blue-400 tracking-tight">详情查看: 跨视角定位系统 (CVP-SYSTEM)</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase mt-1">RECORD ID: #772-BX-2024</p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                  {/* Left: Satellite View */}
                  <section className="col-span-8 bg-[#161A21]/50 rounded-3xl border border-blue-500/30 relative overflow-hidden flex flex-col shadow-[0_0_20px_rgba(59,130,246,0.1)] group">
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-blue-500/20 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Satellite Live</span>
                      </div>
                      <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">40.7128° N, 74.0060° W</span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <button className="p-2 bg-black/40 backdrop-blur-md rounded-lg hover:bg-blue-500/20 transition-all text-white">
                        <Layers className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-black/40 backdrop-blur-md rounded-lg hover:bg-blue-500/20 transition-all text-white">
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-black/40 backdrop-blur-md rounded-lg hover:bg-blue-500/20 transition-all text-white">
                        <Target className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="w-full h-[500px] bg-black relative">
                      <img src="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-74.0160,40.7028,-73.9960,40.7228&bboxSR=4326&imageSR=4326&size=1024,1024&format=jpg&f=image" alt="Satellite map view" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
                      {/* Overlay Grid UI */}
                      <div className="absolute inset-0 pointer-events-none border-[20px] border-[#0B0E14]/40"></div>
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                      {/* Tactical Markers */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-blue-500/40 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                        <div className="absolute inset-0 border border-blue-500/20 animate-ping rounded-full"></div>
                      </div>
                    </div>
                    {/* Map Footer Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0E14] to-transparent flex justify-between items-end">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase mb-1">Elevation</p>
                          <p className="text-lg font-medium text-white">1,240m</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase mb-1">Tilt Angle</p>
                          <p className="text-lg font-medium text-white">0.0°</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500">HD Render Active</span>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                          <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                          <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                          <div className="w-1 h-3 bg-blue-500/30 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Right: Top 5 Results and Chart */}
                  <section className="col-span-4 flex flex-col gap-6 min-h-0">
                    <div className="flex-1 bg-[#161A21]/50 rounded-3xl border border-blue-500/30 flex flex-col overflow-hidden">
                      <div className="p-5 border-b border-blue-500/30 flex justify-between items-center bg-slate-800/30">
                        <h3 className="text-sm font-bold text-blue-400 tracking-widest uppercase flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          检索结果 Top 5
                        </h3>
                        <span className="text-[10px] text-slate-500">Total matches: 1,284</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {MOCK_RESULTS.map((res, i) => (
                          <div key={res.id} className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer group flex gap-4",
                            i === 0 ? "bg-slate-800/80 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden hover:scale-[1.02]" : "bg-[#161A21]/50 border-white/5 hover:bg-slate-800/50"
                          )}>
                            {i === 0 && (
                              <div className="absolute top-0 right-0 p-2">
                                <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">MATCH</span>
                              </div>
                            )}
                            <div className={cn("w-20 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/5 transition-opacity", i !== 0 && "opacity-60 group-hover:opacity-100")}>
                              <img src={res.image} alt={res.location} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-400 mb-1">{res.location}</p>
                              <div className="flex items-end gap-2 mb-2">
                                <span className={cn("text-2xl font-bold", i === 0 ? "text-white" : "text-slate-300")}>{res.similarity}</span>
                                <span className={cn("text-[10px] pb-1", i === 0 ? "text-blue-400" : "text-slate-500")}>% Similarity</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className={cn("h-full", i === 0 ? "bg-blue-500" : "bg-slate-600")} style={{ width: `${res.similarity}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: Precision Chart */}
                    <div className="h-48 bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-5 flex flex-col">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">特征相似度收敛曲线</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={similarityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px' }}
                            itemStyle={{ color: '#60a5fa' }}
                          />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 h-full overflow-y-auto custom-scrollbar"
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">系统设置 / 个人信息</h3>
                    <p className="text-slate-500 mt-2">管理您的账户信息与系统偏好</p>
                  </div>

                  <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8 space-y-8">
                    {/* Profile Section */}
                    <div className="flex items-start gap-8 pb-8 border-b border-white/5">
                      <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-blue-500/30 overflow-hidden relative group">
                        <img src={userInfo.avatar} alt="User" className="w-full h-full object-cover" />
                        <input 
                          type="file" 
                          ref={settingsAvatarInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setUserInfo(prev => ({ ...prev, avatar: event.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div 
                          onClick={() => settingsAvatarInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <span className="text-xs text-white font-medium">更换头像</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">权限等级</label>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-mono">
                            {userInfo.role}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">显示名称</label>
                          <input 
                            type="text" 
                            value={userInfo.name}
                            onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">联系邮箱</label>
                          <input 
                            type="email" 
                            value={userInfo.email}
                            onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                      <button 
                        onClick={() => setCurrentView('home')}
                        className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                      >
                        {isSavingProfile ? '保存中...' : '保存更改'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'admin' && userRole === 'admin' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 h-full overflow-y-auto custom-scrollbar"
              >
                <div className="max-w-6xl mx-auto space-y-8">
                  <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">管理员面板</h3>
                    <p className="text-slate-500 mt-2">系统监控与用户权限管理</p>
                  </div>

                  {/* --- Tabs --- */}
                  {hasPerm('5.系统面板') && ['dashboard', 'content', 'logs'].includes(adminTab) && (
                    <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
                      <button
                        onClick={() => setAdminTab('dashboard')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", adminTab === 'dashboard' ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}
                      >
                        系统概览
                      </button>
                      <button
                        onClick={() => setAdminTab('content')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", adminTab === 'content' ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}
                      >
                        内容管理
                      </button>
                      <button
                        onClick={() => setAdminTab('logs')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", adminTab === 'logs' ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}
                      >
                        系统日志
                      </button>
                    </div>
                  )}

                  {hasPerm('5.系统面板') && adminTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">活跃用户</h4>
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-4xl font-black text-white">1,204</div>
                        <div className="text-xs text-emerald-400 font-medium">+12% 较上周</div>
                      </div>
                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">系统负载</h4>
                          <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-4xl font-black text-white">42%</div>
                        <div className="text-xs text-blue-400 font-medium">运行正常</div>
                      </div>
                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">安全警报</h4>
                          <Shield className="w-5 h-5 text-rose-400" />
                        </div>
                        <div className="text-4xl font-black text-white">0</div>
                        <div className="text-xs text-slate-500 font-medium">无异常活动</div>
                      </div>
                    </div>
                  )}

                  {hasPerm('5.系统面板') && adminTab === 'content' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between bg-[#161A21]/50 rounded-2xl border border-blue-500/30 px-5 py-4">
                        <div className="text-sm text-slate-400">
                          修改任务日历或系统介绍后，请点击右侧保存到数据库。
                        </div>
                        <button
                          onClick={handleSaveContent}
                          disabled={isSavingContent}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all"
                        >
                          {isSavingContent ? '保存中...' : '保存内容'}
                        </button>
                      </div>
                      {actionNotice && (
                        <div className={cn(
                          "text-sm rounded-xl px-4 py-3 border",
                          actionNotice.includes('失败')
                            ? "text-rose-300 border-rose-500/30 bg-rose-500/10"
                            : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                        )}>
                          {actionNotice}
                        </div>
                      )}
                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-white">任务日历管理</h4>
                          <button 
                            onClick={() => setCalendarTasks([...calendarTasks, { id: Date.now(), date: '', title: '', desc: '' }])}
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4"/> 新增任务
                          </button>
                        </div>
                        <div className="space-y-4">
                          {calendarTasks.map(task => (
                            <div key={task.id} className="flex flex-col gap-3 p-5 bg-black/40 rounded-xl border border-white/5">
                              <div className="flex gap-4">
                                <input 
                                  value={task.date} 
                                  onChange={(e) => setCalendarTasks(calendarTasks.map(t => t.id === task.id ? { ...t, date: e.target.value } : t))}
                                  placeholder="YYYY-MM-DD"
                                  className="w-32 bg-transparent border-b border-white/10 text-blue-400 font-mono text-sm outline-none focus:border-blue-500 pb-1" 
                                />
                                <input 
                                  value={task.title} 
                                  onChange={(e) => setCalendarTasks(calendarTasks.map(t => t.id === task.id ? { ...t, title: e.target.value } : t))}
                                  placeholder="任务标题"
                                  className="flex-1 bg-transparent border-b border-white/10 text-white font-bold outline-none focus:border-blue-500 pb-1" 
                                />
                              </div>
                              <textarea 
                                value={task.desc} 
                                onChange={(e) => setCalendarTasks(calendarTasks.map(t => t.id === task.id ? { ...t, desc: e.target.value } : t))}
                                placeholder="任务描述"
                                className="w-full bg-transparent border-b border-white/10 text-slate-400 text-sm outline-none focus:border-blue-500 resize-none h-16 pb-1" 
                              />
                              <button 
                                onClick={() => setCalendarTasks(calendarTasks.filter(t => t.id !== task.id))}
                                className="self-end text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1 mt-2"
                              >
                                <Trash2 className="w-3 h-3"/> 删除
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                        <h4 className="text-lg font-bold text-white mb-6">系统介绍管理</h4>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">系统名称</label>
                            <input 
                              value={systemIntro.title} 
                              onChange={(e) => setSystemIntro({...systemIntro, title: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-bold" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">副标题</label>
                            <input 
                              value={systemIntro.subtitle} 
                              onChange={(e) => setSystemIntro({...systemIntro, subtitle: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">系统描述</label>
                            <textarea 
                              value={systemIntro.description} 
                              onChange={(e) => setSystemIntro({...systemIntro, description: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none h-24" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">核心功能 (每行一项)</label>
                            <textarea 
                              value={systemIntro.features.join('\n')} 
                              onChange={(e) => setSystemIntro({...systemIntro, features: e.target.value.split('\n')})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none h-40 leading-relaxed" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPerm('5.系统面板') && adminTab === 'logs' && (
                    <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                      <h4 className="text-lg font-bold text-white mb-6">用户检索日志</h4>
                      <div className="space-y-4">
                        {systemLogs.map((log) => (
                          <div key={log.id} className="flex items-center gap-6 text-sm border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <span className="text-slate-500 font-mono w-40 shrink-0">{log.time}</span>
                            <div className="flex items-center gap-3 w-48 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-slate-300 font-medium truncate">{log.username}</span>
                            </div>
                            <span className="text-slate-400 flex-1">{log.action}</span>
                            {log.image && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <img src={log.image} alt="检索图" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0 ml-4",
                              log.status === 'success' ? 'bg-emerald-500' : 
                              log.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            )} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasPerm('6.训练') && adminTab === 'training_model' && (
                    <div className="space-y-6">
                      {/* Progress Indicator */}
                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-white">当前训练任务: Aetheris-Cross-Link-V4</h4>
                            <p className="text-sm text-slate-400 mt-1">
                              状态: 
                              <span className={cn(
                                "ml-2 font-bold",
                                trainingStatus === 'not_started' ? "text-slate-400" :
                                trainingStatus === 'in_progress' ? "text-amber-400" :
                                trainingStatus === 'completed' ? "text-emerald-400" : "text-rose-400"
                              )}>
                                {trainingStatus === 'not_started' ? '未开始' :
                                 trainingStatus === 'in_progress' ? '进行中' :
                                 trainingStatus === 'completed' ? '已完成' : '已终止'}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {trainingStatus === 'not_started' ? (
                              <button 
                                onClick={handleStartTraining}
                                disabled={isTrainingActionRunning}
                                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-sm font-bold transition-all"
                              >
                                开始训练
                              </button>
                            ) : (
                              <button 
                                onClick={handleStartTraining}
                                disabled={isTrainingActionRunning}
                                className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-sm font-bold transition-all"
                              >
                                重新启动
                              </button>
                            )}
                            <button 
                              onClick={handleFailTraining}
                              disabled={isTrainingActionRunning || trainingStatus === 'not_started' || trainingStatus === 'completed'}
                              className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-sm font-bold transition-all"
                            >
                              终止训练
                            </button>
                          </div>
                        </div>
                        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden">
                          <motion.div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              trainingStatus === 'failed' ? "bg-rose-500" :
                              trainingStatus === 'completed' ? "bg-emerald-500" : "bg-blue-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${trainingProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-mono text-slate-500">
                          <span>0%</span>
                          <span>{trainingProgress}%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-[#161A21]/50 p-5 rounded-xl border border-blue-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">全局步数</span>
                            <Activity className="text-blue-400 w-4 h-4" />
                          </div>
                          <div className="text-2xl font-bold text-white">{trainingRuntime.global_steps.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                            实时同步
                          </div>
                        </div>
                        <div className="bg-[#161A21]/50 p-5 rounded-xl border border-blue-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">当前轮次</span>
                            <History className="text-blue-400 w-4 h-4" />
                          </div>
                          <div className="text-2xl font-bold text-white">{trainingRuntime.current_epoch} <span className="text-sm text-slate-500">/ {trainingRuntime.total_epoch}</span></div>
                          <div className="w-full bg-black/40 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${trainingProgress}%` }}></div>
                          </div>
                        </div>
                        <div className="bg-[#161A21]/50 p-5 rounded-xl border border-blue-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">学习率</span>
                            <Activity className="text-blue-400 w-4 h-4" />
                          </div>
                          <div className="text-2xl font-bold text-white">{trainingRuntime.learning_rate}</div>
                          <div className="text-[10px] text-slate-500 mt-1">余弦退火调度</div>
                        </div>
                        <div className="bg-[#161A21]/50 p-5 rounded-xl border border-blue-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">GPU 温度</span>
                            <Shield className="text-rose-400 w-4 h-4" />
                          </div>
                          <div className="text-2xl font-bold text-white">{trainingRuntime.gpu_temp}°C</div>
                          <div className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                            {trainingRuntime.gpu_temp >= 70 ? '高负载运行' : '运行稳定'}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <Terminal className="text-blue-400 w-5 h-5" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">训练终端输出</h3>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                          </div>
                        </div>
                        <div className="p-6 h-64 overflow-y-auto font-mono text-xs leading-relaxed text-slate-400 bg-black/40 rounded-xl custom-scrollbar">
                          {trainingRuntime.logs.map((line, idx) => (
                            <p key={`${idx}-${line}`}>{line}</p>
                          ))}
                          <p className="animate-pulse flex items-center gap-1 mt-2"><span className="text-blue-400">_</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPerm('6.训练') && adminTab === 'training_logs' && (
                    <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h4 className="text-xl font-bold text-white tracking-tight">训练记录</h4>
                          <p className="text-slate-500 text-sm mt-1">天体智能模型迭代的历史日志。</p>
                        </div>
                        <button onClick={handleRefreshTrainingRecords} className="px-6 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl font-bold transition-all text-sm border border-blue-500/20">
                          获取历史记录
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          <div className="col-span-2">训练ID</div>
                          <div className="col-span-2">日期与时间</div>
                          <div className="col-span-2">模型版本</div>
                          <div className="col-span-3">所用数据集</div>
                          <div className="col-span-1.5 text-right">准确率</div>
                          <div className="col-span-1.5 text-right">状态</div>
                        </div>
                        
                        {trainingRecords.map((record, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setSelectedTrainingRecord(record); setAdminTab('training_detail'); }}
                            className="grid grid-cols-12 items-center px-6 py-5 bg-black/40 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer"
                          >
                            <div className="col-span-2 font-bold text-sm text-white">{record.id}</div>
                            <div className="col-span-2 text-xs text-slate-400">{record.date}</div>
                            <div className="col-span-2">
                              <span className="bg-blue-500/10 px-2 py-1 rounded text-[10px] font-mono border border-blue-500/20 text-blue-400">{record.version}</span>
                            </div>
                            <div className="col-span-3 text-xs text-slate-400 truncate pr-4">{record.dataset}</div>
                            <div className={cn("col-span-1.5 text-right font-bold", record.status === 'completed' ? 'text-blue-400' : record.status === 'in_progress' ? 'text-amber-400' : 'text-rose-400')}>{record.accuracy}</div>
                            <div className="col-span-1.5 flex justify-end">
                              <span className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                record.status === 'completed'
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : record.status === 'in_progress'
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", record.status === 'completed' ? "bg-blue-400" : record.status === 'in_progress' ? "bg-amber-400" : "bg-rose-400")}></span>
                                {record.status === 'completed' ? '已完成' : record.status === 'in_progress' ? '进行中' : '已终止'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasPerm('6.训练') && adminTab === 'training_detail' && selectedTrainingRecord && (
                    <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                      <div className="flex items-center gap-4 mb-8">
                        <button 
                          onClick={() => setAdminTab('training_logs')}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                          <h4 className="text-xl font-bold text-white tracking-tight">训练详情: {selectedTrainingRecord.id}</h4>
                          <p className="text-slate-500 text-sm mt-1">模型版本: {selectedTrainingRecord.version}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                          <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">基本信息</h5>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">日期与时间</span><span className="text-white">{selectedTrainingRecord.date}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">数据集</span><span className="text-white">{selectedTrainingRecord.dataset}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">最终准确率</span><span className={cn("font-bold", selectedTrainingRecord.status === 'completed' ? 'text-blue-400' : selectedTrainingRecord.status === 'in_progress' ? 'text-amber-400' : 'text-rose-400')}>{selectedTrainingRecord.accuracy}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">状态</span><span className={selectedTrainingRecord.status === 'completed' ? 'text-blue-400' : selectedTrainingRecord.status === 'in_progress' ? 'text-amber-400' : 'text-rose-400'}>{selectedTrainingRecord.status === 'completed' ? '已完成' : selectedTrainingRecord.status === 'in_progress' ? '进行中' : '已终止'}</span></div>
                          </div>
                        </div>
                        <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                          <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">超参数配置</h5>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Batch Size</span><span className="text-white">256</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Learning Rate</span><span className="text-white">0.0001 (Cosine Annealing)</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Optimizer</span><span className="text-white">AdamW</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Weight Decay</span><span className="text-white">0.01</span></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                        <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">损失收敛趋势 (模拟)</h5>
                        <div className="h-48 flex items-end gap-2">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t-sm relative group">
                               <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all" style={{ height: `${Math.max(10, 100 - (i * 4) + (Math.random() * 10 - 5))}%` }}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPerm('7.数据库查看') && adminTab === 'database' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#161A21]/50 p-6 rounded-xl border border-blue-500/30">
                          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">总存储空间</p>
                          <h3 className="text-4xl font-bold mt-2 text-white">14.8 TB</h3>
                        </div>
                        <div className="bg-[#161A21]/50 p-6 rounded-xl border border-blue-500/30">
                          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">数据集总数</p>
                          <h3 className="text-4xl font-bold mt-2 text-white">142</h3>
                        </div>
                        <div className="bg-[#161A21]/50 p-6 rounded-xl border border-rose-500/30">
                          <p className="text-rose-500/70 text-sm uppercase tracking-widest font-bold">异常数据</p>
                          <h3 className="text-4xl font-bold mt-2 text-rose-400">0</h3>
                        </div>
                      </div>

                      <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-white">文件目录</h4>
                          <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors"><History className="w-5 h-5" /></button>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileUpload} 
                              className="hidden" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          {databaseFiles.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                  <Folder className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-white">{file.name}</div>
                                  <div className="text-xs text-slate-500">{file.size} • {file.items}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }}
                                  className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronDown className="w-5 h-5 text-slate-600 -rotate-90 group-hover:text-blue-400 transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPerm('8.用户信息管理') && adminTab === 'users' && (
                    <div className="bg-[#161A21]/50 rounded-3xl border border-blue-500/30 p-8 relative">
                      {isUserModalOpen && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
                          <div className="bg-[#161A21] p-8 rounded-2xl border border-blue-500/30 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">{editingUser ? '编辑用户' : '新增用户'}</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">用户名</label>
                                <input 
                                  type="text" 
                                  value={userForm.username}
                                  onChange={e => setUserForm({...userForm, username: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                  placeholder="输入用户名"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">密码</label>
                                <input 
                                  type="text" 
                                  value={userForm.password}
                                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                  placeholder="输入密码"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">权限分配</label>
                                <div className="grid grid-cols-2 gap-3 bg-black/40 p-4 rounded-xl border border-white/10">
                                  {AVAILABLE_PERMISSIONS.map(perm => (
                                    <label key={perm.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                                      <input 
                                        type="checkbox" 
                                        checked={userForm.permissions.includes(perm.id)}
                                        onChange={(e) => {
                                          const newPerms = e.target.checked 
                                            ? [...userForm.permissions, perm.id]
                                            : userForm.permissions.filter(p => p !== perm.id);
                                          setUserForm({...userForm, permissions: newPerms});
                                        }}
                                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                      />
                                      {perm.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">状态</label>
                                <select 
                                  value={userForm.status}
                                  onChange={e => setUserForm({...userForm, status: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                >
                                  <option value="online">在线</option>
                                  <option value="offline">休眠</option>
                                  <option value="locked">锁定</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                              <button 
                                onClick={() => setIsUserModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl font-bold transition-colors"
                              >
                                取消
                              </button>
                              <button 
                                onClick={handleSaveUser}
                                className="flex-1 px-4 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-xl font-bold transition-colors"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-white">用户信息管理</h4>
                        <button 
                          onClick={() => { setEditingUser(null); setUserForm({username:'', password:'', permissions:['1.首页', '2.1卫星图检索', '2.2街景图检索', '3.历史记录', '4.智慧问答'], status:'online'}); setIsUserModalOpen(true); }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" /> 新增用户
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-black/40 text-slate-500 text-xs uppercase tracking-widest">
                              <th className="px-6 py-4 font-bold rounded-tl-xl">用户名</th>
                              <th className="px-6 py-4 font-bold">密码</th>
                              <th className="px-6 py-4 font-bold">权限</th>
                              <th className="px-6 py-4 font-bold">最后同步</th>
                              <th className="px-6 py-4 font-bold">状态</th>
                              <th className="px-6 py-4 font-bold text-right rounded-tr-xl">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {usersList.map((user, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
                                    <div className="text-white font-bold">{user.username}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm font-mono">
                                  <div className="flex items-center justify-between group/pwd">
                                    <span>{showPasswords[user.username] ? user.password : '••••••••'}</span>
                                    <button 
                                      onClick={() => setShowPasswords(prev => ({...prev, [user.username]: !prev[user.username]}))}
                                      className="text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover/pwd:opacity-100"
                                    >
                                      {showPasswords[user.username] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1 max-w-[250px]">
                                   {user.permissions.map((p: string) => (
                                      <span key={p} className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm">{user.sync}</td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "flex items-center gap-1.5 text-xs font-bold",
                                    user.status === 'online' ? 'text-blue-400' : 
                                    user.status === 'offline' ? 'text-slate-500' : 'text-rose-400'
                                  )}>
                                    <span className={cn(
                                      "w-2 h-2 rounded-full",
                                      user.status === 'online' ? 'bg-blue-400 animate-pulse' : 
                                      user.status === 'offline' ? 'bg-slate-500' : 'bg-rose-400'
                                    )}></span>
                                    {user.status === 'online' ? '在线' : user.status === 'offline' ? '休眠' : '锁定'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => { setEditingUser(user); setUserForm(user); setIsUserModalOpen(true); }}
                                      className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(user.username)}
                                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col relative"
              >
                <section className="flex-1 flex flex-col items-center justify-center px-6 relative h-full">
                  {/* Background Decorative Elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]"></div>
                    <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px]"></div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="max-w-4xl w-full flex flex-col items-center gap-10 z-10">
                    {/* Hero Heading */}
                    <div className="text-center space-y-4">
                      <h2 className={cn(
                        "text-4xl md:text-5xl font-bold tracking-tight leading-tight transition-colors duration-500",
                        messages.length > 1 ? "text-blue-400" : "bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent"
                      )}>
                        {messages.length > 1 ? '正在为您检索...' : '您好，我是空间感知助手，想了解哪里？'}
                      </h2>
                      <p className="text-slate-500 text-sm tracking-widest uppercase opacity-60">Celestial Intelligence Agency • v2.4.0</p>
                    </div>

                    {/* Action Buttons: Bento/Glass Layout */}
                    {messages.length <= 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                        <button 
                          className="bg-[#161A21]/70 backdrop-blur-xl group flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.02] shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                          onClick={() => setInputValue('探索周边顶级风味')}
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                            <Utensils className="w-8 h-8" />
                          </div>
                          <span className="text-lg font-medium tracking-wide text-white">美食</span>
                          <span className="text-xs text-slate-500 mt-1 opacity-60">探索周边顶级风味</span>
                        </button>
                        <button 
                          className="bg-[#161A21]/70 backdrop-blur-xl group flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.02] shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                          onClick={() => setInputValue('视觉坐标锁定美景')}
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                            <Image className="w-8 h-8" />
                          </div>
                          <span className="text-lg font-medium tracking-wide text-white">风景</span>
                          <span className="text-xs text-slate-500 mt-1 opacity-60">视觉坐标锁定美景</span>
                        </button>
                        <button 
                          className="bg-[#161A21]/70 backdrop-blur-xl group flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.02] shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                          onClick={() => setInputValue('实时坐标点位检索')}
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                            <MapPin className="w-8 h-8" />
                          </div>
                          <span className="text-lg font-medium tracking-wide text-white">附近</span>
                          <span className="text-xs text-slate-500 mt-1 opacity-60">实时坐标点位检索</span>
                        </button>
                      </div>
                    )}

                    {/* Chat History */}
                    {messages.length > 1 && (
                      <div className="w-full max-w-3xl bg-[#161A21]/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {messages.slice(1).map((msg, i) => (
                          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                              msg.role === 'user' 
                                ? "bg-blue-500 text-white rounded-tr-none shadow-lg shadow-blue-500/10" 
                                : "bg-slate-800 text-slate-200 rounded-tl-none border border-white/5"
                            )}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Field: Floating Capsule */}
                    <div className="w-full max-w-2xl mt-4 group flex flex-col gap-2">
                      {chatImage && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-blue-500/30 self-end">
                          <img src={chatImage} alt="Upload preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setChatImage(null)}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-rose-500/50 transition-colors"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative flex items-center bg-black/60 backdrop-blur-2xl border border-white/10 group-focus-within:border-blue-500/50 rounded-full px-6 py-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:shadow-[0_0_25px_rgba(59,130,246,0.3)]">
                          <input 
                            type="file" 
                            ref={chatFileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setChatImage(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button 
                            onClick={() => chatFileInputRef.current?.click()}
                            className="text-slate-500 hover:text-blue-400 transition-colors mr-4"
                          >
                            <Image className="w-6 h-6" />
                          </button>
                          <input 
                            className="bg-transparent border-none focus:ring-0 w-full text-white placeholder:text-slate-500/60 outline-none" 
                            placeholder="输入坐标、地名或描述..." 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button 
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() && !chatImage}
                            className="ml-4 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="h-10 px-8 flex items-center justify-between bg-[#0B0E14] border-t border-white/5 text-[10px] text-slate-600 uppercase tracking-widest">
          <div className="flex gap-6">
            <span>CVP-SYSTEM v2.4.0</span>
            <span>Celestial Intelligence Agency</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-400 transition-colors">System Status</a>
          </div>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}} />
      {/* Expanded Widget Modal */}
      <AnimatePresence>
        {expandedWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
            onClick={() => setExpandedWidget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0B0E14] border border-blue-500/50 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar shadow-[0_0_50px_rgba(59,130,246,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                  {expandedWidget === 'calendar' ? <><Calendar className="w-6 h-6"/> 任务日历</> : <><Info className="w-6 h-6"/> 系统介绍</>}
                </h2>
                <button onClick={() => setExpandedWidget(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {expandedWidget === 'calendar' && (
                <div className="space-y-4 text-slate-300">
                  {calendarTasks.map(task => (
                    <div key={task.id} className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                      <div className="text-sm text-blue-400 font-mono mb-1">{task.date}</div>
                      <div className="font-medium text-lg">{task.title}</div>
                      <p className="text-sm text-slate-400 mt-2">{task.desc}</p>
                    </div>
                  ))}
                  {calendarTasks.length === 0 && (
                    <div className="text-center text-slate-500 py-8">暂无任务记录</div>
                  )}
                </div>
              )}

              {expandedWidget === 'intro' && (
                <div className="space-y-4 text-slate-300 leading-relaxed text-lg">
                  <p>
                    <strong className="text-white">{systemIntro.title}</strong> {systemIntro.subtitle}
                  </p>
                  <p>
                    {systemIntro.description}
                  </p>
                  <p>
                    <strong>核心功能包括：</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-400">
                   {systemIntro.features.map((feature: string, idx: number) => {
                      const [title, desc] = feature.split('：');
                      return (
                        <li key={idx}>
                          <span className="text-slate-200">{title}{desc ? '：' : ''}</span> {desc}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
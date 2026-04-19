# CVP-SYSTEM 前后端集成配置说明

## 系统架构

本系统采用前后端分离架构，包含以下组件：

### 前端
- **项目路径**: `cvp-system-_-celestial-navigator`
- **端口**: 3000
- **技术栈**: React + TypeScript + Vite + Three.js
- **功能**: 用户界面、3D地球可视化、图像检索交互

### 后端
1. **CVP管理后端**
   - **项目路径**: `shibie/web_system/cvp_server.py`
   - **端口**: 8080
   - **数据库**: MySQL (geoscout)
   - **功能**: 用户管理、文件管理、训练管理、系统配置

2. **图像处理后端**
   - **项目路径**: `shibie/web_system/app.py`
   - **端口**: 5000
   - **技术栈**: Flask + PyTorch
   - **功能**: 图像转换、图像检索、AI助手

## 环境配置

### 前端配置 (.env)

在 `cvp-system-_-celestial-navigator/.env` 文件中配置：

```env
# Gemini AI API密钥
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# 前端访问地址
APP_URL=http://localhost:3000

# API配置
# 设置为false使用真实后端API
VITE_USE_MOCK_API=false

# CVP管理后端地址
VITE_API_BASE_URL=http://localhost:8080/api

# 图像处理后端地址
VITE_SHIBIE_API_BASE_URL=http://localhost:5000
```

### 后端配置

#### CVP管理后端 (cvp_server.py)

环境变量配置 (`.env` 文件):

```env
# MySQL数据库连接
MYSQL_URI=mysql+pymysql://root:123456@127.0.0.1:3306/geoscout?charset=utf8mb4

# JWT密钥
JWT_SECRET=change-me-in-production-32chars-min

# JWT过期时间（小时）
JWT_EXPIRE_HOURS=24

# 上传文件目录
UPLOAD_DIR=./uploads

# CORS允许的源
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### 图像处理后端 (app.py)

在 `app.py` 文件中配置：

```python
# CORS配置 - 允许前端跨域访问
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

## API端点说明

### CVP管理后端 (端口 8080)

#### 认证相关
- `POST /api/auth/login` - 用户登录
- 返回: `{ user: {...}, token: "jwt_token" }`

#### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:username` - 更新用户
- `DELETE /api/users/:username` - 删除用户

#### 文件管理
- `GET /api/files` - 获取文件列表
- `POST /api/files/upload` - 上传文件
- `DELETE /api/files/:fileName` - 删除文件

#### 训练管理
- `GET /api/training/records` - 获取训练记录
- `GET /api/training/status` - 获取训练状态
- `POST /api/training/start` - 开始训练
- `POST /api/training/fail` - 终止训练

#### 系统管理
- `GET /api/system/logs` - 获取系统日志
- `GET /api/system/intro` - 获取系统介绍
- `PUT /api/system/intro` - 更新系统介绍
- `GET /api/calendar/tasks` - 获取日历任务
- `PUT /api/calendar/tasks` - 保存日历任务

### 图像处理后端 (端口 5000)

#### 健康检查
- `GET /api/health` - 健康检查
- 返回: `{ status: 'healthy', timestamp: '...', system_version: '...', ... }`

#### 模型信息
- `GET /api/model_info` - 获取模型信息
- 返回: `{ model_architecture: '...', feature_extractor: '...', ... }`

#### 图像处理
- `POST /api/convert` - 图像转换（卫星图转街景图）
- 请求: `FormData { image: File }`
- 返回: `{ success: true, transformed_image: "base64_image", processing_time: "2.1s" }`

#### 图像检索
- `POST /api/retrieve` - 图像检索
- 请求: `{ image_data: "base64_image", mode: "satellite" | "streetview" }`
- 返回: `{ success: true, results: [...], processing_time: "1.5s", ... }`

#### 状态管理
- `POST /api/reset` - 重置处理状态
- 返回: `{ success: true, message: '处理状态已重置', current_processing: false }`

## 启动步骤

### 1. 启动MySQL数据库

确保MySQL服务正在运行，并创建数据库：

```sql
CREATE DATABASE geoscout CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 启动CVP管理后端

```bash
cd D:\damo\code\shibie\web_system
python run.py
# 选择选项 4（启动 CVP 管理后端）
```

或直接启动：

```bash
python cvp_server.py
```

服务器将在 `http://localhost:8080` 启动

### 3. 启动图像处理后端

```bash
cd D:\damo\code\shibie\web_system
python app.py
```

服务器将在 `http://localhost:5000` 启动

### 4. 启动前端

```bash
cd d:\damo\code\cvp-system-_-celestial-navigator
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动

## 功能说明

### 前端功能
1. **首页** - 系统概览和导航
2. **卫星图检索** - 上传卫星图像进行跨视角检索
3. **街景图检索** - 上传街景图像进行检索
4. **历史记录** - 查看检索历史
5. **智慧问答** - AI助手对话
6. **系统面板** - 系统配置和管理
7. **训练** - 模型训练管理
8. **数据库查看** - 数据库内容查看
9. **用户信息管理** - 用户权限管理

### 后端功能
1. **图像转换** - 使用训练好的模型进行卫星图到街景图的转换
2. **图像检索** - 基于深度学习特征的跨视角图像检索
3. **用户管理** - 用户认证、权限管理
4. **文件管理** - 文件上传、下载、删除
5. **训练管理** - 训练任务管理、进度监控
6. **日志管理** - 系统日志记录和查询

## 数据流说明

### 卫星图检索流程

1. 用户上传卫星图像
2. 前端调用 `api.shibie.convertImage()` 将图像转换为街景图
3. 前端调用 `api.shibie.retrieveImage()` 进行图像检索
4. 后端返回匹配的街景图像和地理坐标
5. 前端在3D地球上显示检索结果

### 用户认证流程

1. 用户输入用户名和密码
2. 前端调用 `api.login()` 进行认证
3. 后端验证用户信息并返回JWT token
4. 前端将token存储在localStorage
5. 后续API请求携带token进行身份验证

## 故障排除

### 前端无法连接后端

1. 检查后端服务是否启动
2. 检查 `.env` 文件中的API地址配置
3. 检查CORS配置是否正确
4. 检查防火墙设置

### 图像处理失败

1. 检查图像处理后端是否启动
2. 检查模型文件是否存在
3. 检查GPU/CPU资源是否充足
4. 查看后端日志获取详细错误信息

### 数据库连接失败

1. 检查MySQL服务是否启动
2. 检查数据库连接字符串配置
3. 检查数据库用户名和密码
4. 检查数据库是否已创建

## 开发模式

### 使用Mock数据

在 `.env` 文件中设置：

```env
VITE_USE_MOCK_API=true
```

这样前端将使用内置的Mock数据，不需要启动后端服务。

### 真实后端模式

在 `.env` 文件中设置：

```env
VITE_USE_MOCK_API=false
```

这样前端将连接真实的后端服务。

## 安全建议

1. 生产环境修改JWT密钥
2. 生产环境修改数据库密码
3. 使用HTTPS协议
4. 限制CORS允许的源
5. 实施请求频率限制
6. 定期备份数据库
7. 更新依赖包到最新版本

## 性能优化

1. 启用前端代码分割
2. 使用CDN加速静态资源
3. 配置数据库索引
4. 启用后端缓存
5. 使用负载均衡
6. 优化图像压缩算法

## 联系支持

如有问题，请查看：
- 前端文档: `cvp-system-_-celestial-navigator/README.md`
- 后端文档: `shibie/web_system/CVP_MYSQL_API_接入说明.md`
- API文档: `shibie/web_system/api_smoke_test.py`
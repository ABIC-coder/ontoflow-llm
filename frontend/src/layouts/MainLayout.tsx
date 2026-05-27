import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Badge, Tooltip } from 'antd';
import {
  HomeOutlined,
  MessageOutlined,
  DatabaseOutlined,
  TableOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  MonitorOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  ExperimentOutlined,
  ToolOutlined,
  ApiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '系统总览',
  },
  {
    key: '/chat',
    icon: <MessageOutlined />,
    label: '智能对话',
  },
  { type: 'divider' as const },
  {
    key: 'business',
    label: '业务领域',
    type: 'group' as const,
    children: [
      { key: '/procurement', icon: <ShoppingCartOutlined />, label: '设备采购' },
      { key: '/testing', icon: <ExperimentOutlined />, label: '试验鉴定' },
      { key: '/maintenance', icon: <ToolOutlined />, label: '维修保障' },
    ],
  },
  { type: 'divider' as const },
  {
    key: 'data',
    label: '数据管理',
    type: 'group' as const,
    children: [
      { key: '/datasources', icon: <DatabaseOutlined />, label: '数据源' },
      { key: '/metadata', icon: <TableOutlined />, label: '元数据' },
      { key: '/ontology', icon: <ApartmentOutlined />, label: '本体模型' },
    ],
  },
  { type: 'divider' as const },
  {
    key: 'analysis',
    label: '分析视图',
    type: 'group' as const,
    children: [
      { key: '/graph', icon: <NodeIndexOutlined />, label: '知识图谱' },
      { key: '/twin', icon: <MonitorOutlined />, label: '设备孪生' },
      { key: '/risk', icon: <WarningOutlined />, label: '风险分析' },
    ],
  },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'warning'>('online');

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取页面标题
  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/': '系统总览',
      '/chat': '智能对话',
      '/procurement': '设备采购',
      '/testing': '试验鉴定',
      '/maintenance': '维修保障',
      '/datasources': '数据源管理',
      '/metadata': '元数据资产',
      '/ontology': '本体建模',
      '/graph': '知识图谱',
      '/twin': '设备孪生',
      '/risk': '风险分析',
    };
    return pathMap[location.pathname] || 'Mini OntoFlow';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        width={220}
        style={{
          background: '#0d1117',
          borderRight: '1px solid #1e3a5f',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 侧边栏顶部 */}
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #1e3a5f',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ApiOutlined style={{ fontSize: 20, color: '#00d4ff' }} />
            <div>
              <div style={{ 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: 14, 
                fontWeight: 600,
                color: '#e6edf3',
                letterSpacing: '0.5px'
              }}>
                ONTOFLOW
              </div>
              <div style={{ 
                fontSize: 10, 
                color: '#6e7681',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Data Intelligence
              </div>
            </div>
          </div>
          {/* 发光条 */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
            opacity: 0.6,
          }} />
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            background: 'transparent',
            padding: '8px 0',
          }}
        />

        {/* 侧边栏底部 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #1e3a5f',
          background: '#0d1117',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: systemStatus === 'online' ? '#00ff88' : '#ff4757',
                boxShadow: `0 0 8px ${systemStatus === 'online' ? '#00ff88' : '#ff4757'}`,
              }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>
                {systemStatus === 'online' ? '系统正常' : '系统异常'}
              </Text>
            </div>
            <Text style={{ 
              fontSize: 11, 
              color: '#6e7681',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              v2.0
            </Text>
          </div>
        </div>

        {/* 背景网格 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      </Sider>

      {/* 主内容区 */}
      <Layout>
        {/* 顶部栏 */}
        <Header
          style={{
            background: '#111827',
            padding: '0 24px',
            borderBottom: '1px solid #1e3a5f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            position: 'relative',
          }}
        >
          {/* 左侧：页面标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThunderboltOutlined style={{ fontSize: 16, color: '#00d4ff' }} />
            <Text style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#e6edf3',
              letterSpacing: '0.5px',
            }}>
              {getPageTitle()}
            </Text>
          </div>

          {/* 右侧：状态信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Tooltip title="数据源状态">
              <Badge status="success" text={
                <Text style={{ fontSize: 12, color: '#8b949e' }}>数据源在线</Text>
              } />
            </Tooltip>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#6e7681',
              padding: '4px 12px',
              background: '#0a0e14',
              borderRadius: 4,
              border: '1px solid #1e3a5f',
            }}>
              {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
          </div>

          {/* 底部装饰线 */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #1e3a5f, transparent)',
          }} />
        </Header>

        {/* 内容区 */}
        <Content
          style={{
            margin: 16,
            padding: 20,
            background: '#0a0e14',
            minHeight: 280,
            overflow: 'auto',
            borderRadius: 8,
            border: '1px solid #1e3a5f',
            position: 'relative',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {/* 内容区网格背景 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
            borderRadius: 8,
          }} />
          
          {/* 页面内容 */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

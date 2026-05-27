import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ExploreChat from './pages/ExploreChat';
import DataSources from './pages/DataSources';
import MetadataAssets from './pages/MetadataAssets';
import OntologyModeling from './pages/OntologyModeling';
import GraphView from './pages/GraphView';
import TwinDashboard from './pages/TwinDashboard';
import EquipmentRisk from './pages/EquipmentRisk';
import ProcurementPage from './pages/Procurement';
import TestingPage from './pages/Testing';
import MaintenancePage from './pages/Maintenance';
import './styles/global.css';

const { darkAlgorithm } = theme;

const App: React.FC = () => (
  <ConfigProvider
    theme={{
      algorithm: darkAlgorithm,
      token: {
        // 主色调：工业青色
        colorPrimary: '#00d4ff',
        colorBgBase: '#0a0e14',
        colorBgContainer: '#111827',
        colorBgElevated: '#1a2332',
        colorBgLayout: '#0d1117',
        colorBorder: '#1e3a5f',
        colorBorderSecondary: '#162b44',
        colorText: '#e6edf3',
        colorTextSecondary: '#8b949e',
        colorTextTertiary: '#6e7681',
        colorTextQuaternary: '#484f58',
        colorLink: '#00d4ff',
        colorLinkHover: '#33e0ff',
        colorSuccess: '#00ff88',
        colorWarning: '#ffaa00',
        colorError: '#ff4757',
        colorInfo: '#00d4ff',
        // 圆角
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        // 字体
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        fontSize: 13,
        fontSizeHeading1: 28,
        fontSizeHeading2: 22,
        fontSizeHeading3: 18,
        // 动画
        motionDurationSlow: '0.3s',
        motionDurationMid: '0.2s',
        motionDurationFast: '0.1s',
        // 阴影
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        boxShadowSecondary: '0 2px 12px rgba(0, 0, 0, 0.3)',
      },
      components: {
        Layout: {
          headerBg: '#111827',
          siderBg: '#0d1117',
          bodyBg: '#0a0e14',
          headerHeight: 56,
        },
        Menu: {
          darkItemBg: 'transparent',
          darkItemSelectedBg: 'rgba(0, 212, 255, 0.1)',
          darkItemHoverBg: 'rgba(0, 212, 255, 0.05)',
          darkItemSelectedColor: '#00d4ff',
          itemHeight: 44,
          iconSize: 16,
        },
        Card: {
          colorBgContainer: '#111827',
          colorBorderSecondary: '#1e3a5f',
        },
        Table: {
          colorBgContainer: '#111827',
          headerBg: '#1a2332',
          rowHoverBg: 'rgba(0, 212, 255, 0.05)',
        },
        Button: {
          primaryShadow: '0 2px 8px rgba(0, 212, 255, 0.3)',
        },
        Tag: {
          defaultBg: 'rgba(0, 212, 255, 0.1)',
        },
        Statistic: {
          titleFontSize: 12,
          contentFontSize: 20,
        },
      },
    }}
  >
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<ExploreChat />} />
          <Route path="datasources" element={<DataSources />} />
          <Route path="metadata" element={<MetadataAssets />} />
          <Route path="ontology" element={<OntologyModeling />} />
          <Route path="graph" element={<GraphView />} />
          <Route path="twin" element={<TwinDashboard />} />
          <Route path="risk" element={<EquipmentRisk />} />
          <Route path="procurement" element={<ProcurementPage />} />
          <Route path="testing" element={<TestingPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
);

export default App;

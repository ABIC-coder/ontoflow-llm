import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Alert, Spin, Typography, Tag, Divider, Progress } from 'antd';
import {
  DatabaseOutlined,
  TableOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  RobotOutlined,
  MonitorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShoppingCartOutlined,
  ExperimentOutlined,
  ToolOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import client from '../api/client';
import type { GraphStats } from '../types/graph';
import type { RiskSummary } from '../types/equipment';

const { Text } = Typography;

interface DashboardData {
  healthOk: boolean;
  datasourceCount: number;
  tableCount: number;
  graphStats: GraphStats | null;
  riskSummary: RiskSummary | null;
  lastLoadTime: string;
}

// 自定义统计卡片组件
const IndustrialStatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  suffix?: string;
}> = ({ title, value, icon, color, trend, suffix }) => (
  <div style={{
    background: '#111827',
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s',
    cursor: 'default',
  }}
  className="stat-card-hover"
  >
    {/* 顶部装饰线 */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    }} />
    
    {/* 背景图标 */}
    <div style={{
      position: 'absolute',
      right: -10,
      bottom: -10,
      fontSize: 64,
      opacity: 0.05,
      color: color,
    }}>
      {icon}
    </div>

    {/* 内容 */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        <Text style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </Text>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 28,
          fontWeight: 700,
          color: '#e6edf3',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {suffix && (
          <Text style={{ fontSize: 12, color: '#6e7681' }}>{suffix}</Text>
        )}
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 12,
            color: trend === 'up' ? '#00ff88' : trend === 'down' ? '#ff4757' : '#8b949e',
          }}>
            {trend === 'up' ? <ArrowUpOutlined /> : trend === 'down' ? <ArrowDownOutlined /> : null}
          </div>
        )}
      </div>
    </div>
  </div>
);

// 业务领域卡片
const DomainCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  count?: number;
}> = ({ title, icon, color, description, count }) => (
  <div style={{
    background: '#111827',
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    transition: 'all 0.3s',
    cursor: 'pointer',
  }}
  className="domain-card-hover"
  >
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 8,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      fontSize: 20,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{title}</Text>
      <Text style={{ fontSize: 12, color: '#6e7681', display: 'block' }}>{description}</Text>
    </div>
    {count !== undefined && (
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 18,
        fontWeight: 700,
        color: color,
      }}>
        {count}
      </div>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    healthOk: false,
    datasourceCount: 0,
    tableCount: 0,
    graphStats: null,
    riskSummary: null,
    lastLoadTime: '-',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const healthRes = await client.get('/api/health').catch(() => null);
        const healthOk = healthRes?.data?.status === 'ok';
        
        if (!healthOk) {
          setError('后端服务未连接');
          setLoading(false);
          return;
        }

        const [dsRes, tablesRes, statsRes, riskRes] = await Promise.allSettled([
          client.get('/api/datasources'),
          client.get('/api/metadata/tables'),
          client.get('/api/graph/stats'),
          client.get('/api/equipment/risk-summary'),
        ]);

        const datasourceCount = dsRes.status === 'fulfilled' ? (dsRes.value.data?.length ?? 0) : 0;
        const tableCount = tablesRes.status === 'fulfilled' ? (tablesRes.value.data?.length ?? 0) : 0;
        const graphStats = statsRes.status === 'fulfilled' ? statsRes.value.data : null;
        const riskSummary = riskRes.status === 'fulfilled' ? riskRes.value.data : null;

        setData({
          healthOk,
          datasourceCount,
          tableCount,
          graphStats,
          riskSummary,
          lastLoadTime: new Date().toLocaleString('zh-CN'),
        });
      } catch {
        setError('后端服务未连接，请先启动后端');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid #1e3a5f',
          borderTop: '3px solid #00d4ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <Text style={{ color: '#8b949e' }}>系统初始化中...</Text>
      </div>
    );
  }

  const riskLevel = data.riskSummary?.high_risk ?? 0;
  const riskColor = riskLevel > 0 ? '#ff4757' : '#00ff88';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* 页面头部 */}
      <div style={{
        marginBottom: 24,
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #111827, #1a2332)',
        borderRadius: 8,
        border: '1px solid #1e3a5f',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰元素 */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <DashboardOutlined style={{ fontSize: 24, color: '#00d4ff' }} />
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: '#e6edf3',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              ONTOFLOW
            </Text>
          </div>
          <Text style={{ fontSize: 14, color: '#8b949e' }}>
            设备全生命周期管理平台 · 采购管理 · 试验鉴定 · 维修保障 · 知识图谱 · 智能分析
          </Text>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message="系统连接异常"
          description={error}
          style={{ 
            marginBottom: 16,
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
          }}
          showIcon
        />
      )}

      {/* 核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <IndustrialStatCard
            title="系统状态"
            value={data.healthOk ? '在线' : '离线'}
            icon={data.healthOk ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            color={data.healthOk ? '#00ff88' : '#ff4757'}
          />
        </Col>
        <Col span={6}>
          <IndustrialStatCard
            title="图谱节点"
            value={data.graphStats?.node_count ?? 0}
            icon={<NodeIndexOutlined />}
            color="#00d4ff"
            suffix="nodes"
          />
        </Col>
        <Col span={6}>
          <IndustrialStatCard
            title="图谱关系"
            value={data.graphStats?.edge_count ?? 0}
            icon={<ApartmentOutlined />}
            color="#a855f7"
            suffix="edges"
          />
        </Col>
        <Col span={6}>
          <IndustrialStatCard
            title="风险设备"
            value={riskLevel}
            icon={<WarningOutlined />}
            color={riskColor}
            trend={riskLevel > 0 ? 'up' : 'stable'}
          />
        </Col>
      </Row>

      {/* 业务领域 */}
      <div style={{ marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 12, 
          color: '#8b949e', 
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 12,
          display: 'block',
        }}>
          业务领域
        </Text>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <DomainCard
              title="设备采购"
              icon={<ShoppingCartOutlined />}
              color="#00d4ff"
              description="采购计划 · 招标项目 · 合同管理"
              count={data.riskSummary?.total_equipment}
            />
          </Col>
          <Col span={8}>
            <DomainCard
              title="试验鉴定"
              icon={<ExperimentOutlined />}
              color="#00ff88"
              description="试验项目 · 数据采集 · 鉴定结论"
            />
          </Col>
          <Col span={8}>
            <DomainCard
              title="维修保障"
              icon={<ToolOutlined />}
              color="#ff8c00"
              description="维修计划 · 工单管理 · 备件保障"
            />
          </Col>
        </Row>
      </div>

      {/* 图谱实体分布 */}
      {data.graphStats && data.graphStats.entity_types && (
        <div style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 12, 
            color: '#8b949e', 
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 12,
            display: 'block',
          }}>
            图谱实体分布
          </Text>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
          }}>
            <Row gutter={[12, 12]}>
              {Object.entries(data.graphStats.entity_types).map(([type, count]) => (
                <Col key={type} span={4}>
                  <div style={{
                    textAlign: 'center',
                    padding: '12px 8px',
                    background: '#0a0e14',
                    borderRadius: 6,
                    border: '1px solid #162b44',
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#00d4ff',
                    }}>
                      {count}
                    </div>
                    <Text style={{ fontSize: 11, color: '#6e7681' }}>{type}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      )}

      {/* 高风险设备预警 */}
      {data.riskSummary && data.riskSummary.high_risk_equipment.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 12, 
            color: '#ff4757', 
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 12,
            display: 'block',
          }}>
            ⚠ 高风险设备预警
          </Text>
          <div style={{
            background: 'rgba(255, 71, 87, 0.05)',
            border: '1px solid rgba(255, 71, 87, 0.2)',
            borderRadius: 8,
            padding: '16px',
          }}>
            <Row gutter={[12, 12]}>
              {data.riskSummary.high_risk_equipment.map(eq => (
                <Col key={eq.id} span={6}>
                  <div style={{
                    padding: '12px',
                    background: '#111827',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 71, 87, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <WarningOutlined style={{ color: '#ff4757', fontSize: 16 }} />
                    <div>
                      <Text style={{ fontSize: 13, color: '#e6edf3', display: 'block' }}>{eq.name}</Text>
                      <Text style={{ 
                        fontSize: 11, 
                        color: '#ff4757',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        风险分数: {eq.score}
                      </Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      )}

      {/* 系统架构 */}
      <div>
        <Text style={{ 
          fontSize: 12, 
          color: '#8b949e', 
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 12,
          display: 'block',
        }}>
          数据处理流程
        </Text>
        <div style={{
          background: '#111827',
          border: '1px solid #1e3a5f',
          borderRadius: 8,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { icon: <DatabaseOutlined />, label: '数据源', color: '#00d4ff' },
              { icon: <TableOutlined />, label: '元数据', color: '#a855f7' },
              { icon: <ApartmentOutlined />, label: '本体', color: '#ff8c00' },
              { icon: <NodeIndexOutlined />, label: '图谱', color: '#00ff88' },
              { icon: <RobotOutlined />, label: 'Agent', color: '#ff4757' },
              { icon: <MonitorOutlined />, label: '应用', color: '#00d4ff' },
            ].map((step, index) => (
              <React.Fragment key={step.label}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                    fontSize: 20,
                  }}>
                    {step.icon}
                  </div>
                  <Text style={{ fontSize: 12, color: '#8b949e' }}>{step.label}</Text>
                </div>
                {index < 5 && (
                  <div style={{
                    flex: 1,
                    height: 1,
                    background: 'linear-gradient(90deg, #1e3a5f, #00d4ff30, #1e3a5f)',
                    margin: '0 8px',
                    marginBottom: 20,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div style={{ 
        marginTop: 24,
        padding: '12px 16px',
        background: '#111827',
        borderRadius: 6,
        border: '1px solid #1e3a5f',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 11, color: '#6e7681' }}>
          数据源: {data.datasourceCount} | 表: {data.tableCount} | 节点: {data.graphStats?.node_count ?? 0}
        </Text>
        <Text style={{ 
          fontSize: 11, 
          color: '#6e7681',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          最后更新: {data.lastLoadTime}
        </Text>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Tabs, Spin, Alert, Typography, Row, Col, Drawer, Button, Descriptions } from 'antd';
import { 
  ToolOutlined, 
  FileTextOutlined, 
  BugOutlined, 
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '../components/PageHeader';
import RiskTag from '../components/RiskTag';
import {
  getMaintenancePlans,
  getMaintenanceOrders,
  getMaintenanceOrderDetail,
  getFailureModes,
  getSpareParts,
  getSupportResources
} from '../api/maintenance';
import type {
  FailureMode,
  MaintenancePlan,
  MaintenanceOrder,
  MaintenanceOrderDetail,
  SparePart,
  SupportResource
} from '../types/maintenance';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  '已完成': { color: '#00ff88', label: '已完成' },
  '进行中': { color: '#00d4ff', label: '进行中' },
  '待执行': { color: '#8b949e', label: '待执行' },
  '待处理': { color: '#ff8c00', label: '待处理' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  '紧急': { color: '#ff4757', label: '紧急' },
  '重要': { color: '#ff8c00', label: '重要' },
  '普通': { color: '#00d4ff', label: '普通' },
};

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  '高': { color: '#ff4757', label: '高' },
  '中': { color: '#ff8c00', label: '中' },
  '低': { color: '#00ff88', label: '低' },
};

const MaintenancePage: React.FC = () => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrderDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, o, f, s, r] = await Promise.all([
          getMaintenancePlans(),
          getMaintenanceOrders(),
          getFailureModes(),
          getSpareParts(),
          getSupportResources()
        ]);
        setPlans(p);
        setOrders(o);
        setFailureModes(f);
        setSpareParts(s);
        setResources(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleViewDetail = async (orderId: number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getMaintenanceOrderDetail(orderId);
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

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
        <div className="loading-spinner" />
        <Text style={{ color: '#8b949e' }}>加载维修数据...</Text>
      </div>
    );
  }

  const lowStockParts = spareParts.filter(p => p.stock_qty < p.min_stock);
  const highSeverityOrders = orders.filter(o => o.severity === '高');
  const completedOrders = orders.filter(o => o.status === '已完成');
  const totalCost = orders.reduce((sum, o) => sum + (o.cost || 0), 0);

  const planColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { title: '计划名称', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { 
      title: '计划类型', 
      dataIndex: 'plan_type', 
      key: 'plan_type',
      render: (v: string) => (
        <Tag style={{ 
          background: 'rgba(168, 85, 247, 0.1)', 
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: '#a855f7',
        }}>
          {v}
        </Tag>
      )
    },
    { title: '计划日期', dataIndex: 'planned_date', key: 'planned_date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (v: string) => {
        const config = STATUS_CONFIG[v] || { color: '#8b949e', label: v };
        return (
          <Tag style={{
            background: `${config.color}15`,
            border: `1px solid ${config.color}40`,
            color: config.color,
          }}>
            {config.label}
          </Tag>
        );
      }
    },
    { 
      title: '优先级', 
      dataIndex: 'priority', 
      key: 'priority',
      render: (v: string) => {
        const config = PRIORITY_CONFIG[v] || { color: '#8b949e', label: v };
        return (
          <Tag style={{
            background: `${config.color}15`,
            border: `1px solid ${config.color}40`,
            color: config.color,
          }}>
            {config.label}
          </Tag>
        );
      }
    },
  ];

  const orderColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { 
      title: '工单号', 
      dataIndex: 'order_no', 
      key: 'order_no',
      render: (v: string) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff' }}>{v}</Text>
      )
    },
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { title: '故障描述', dataIndex: 'fault_desc', key: 'fault_desc', ellipsis: true },
    { title: '故障模式', dataIndex: 'failure_mode_name', key: 'failure_mode_name' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (v: string) => {
        const config = STATUS_CONFIG[v] || { color: '#8b949e', label: v };
        return (
          <Tag style={{
            background: `${config.color}15`,
            border: `1px solid ${config.color}40`,
            color: config.color,
          }}>
            {config.label}
          </Tag>
        );
      }
    },
    { 
      title: '严重程度', 
      dataIndex: 'severity', 
      key: 'severity',
      render: (v: string) => {
        const config = SEVERITY_CONFIG[v] || { color: '#8b949e', label: v };
        return (
          <Tag style={{
            background: `${config.color}15`,
            border: `1px solid ${config.color}40`,
            color: config.color,
          }}>
            {config.label}
          </Tag>
        );
      }
    },
    { 
      title: '费用', 
      dataIndex: 'cost', 
      key: 'cost',
      render: (v: number) => v ? (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00ff88' }}>
          ¥{v.toLocaleString()}
        </Text>
      ) : '-'
    },
    {
      title: '操作', 
      key: 'action', 
      width: 80,
      render: (_: unknown, record: MaintenanceOrder) => (
        <Button 
          type="link" 
          size="small"
          style={{ color: '#00d4ff' }}
          onClick={() => handleViewDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  const failureModeColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { title: '故障模式', dataIndex: 'mode_name', key: 'mode_name' },
    { 
      title: '类别', 
      dataIndex: 'category', 
      key: 'category',
      render: (v: string) => (
        <Tag style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
        }}>
          {v}
        </Tag>
      )
    },
    { 
      title: '严重程度', 
      dataIndex: 'severity_level', 
      key: 'severity_level',
      render: (v: string) => {
        const config = SEVERITY_CONFIG[v] || { color: '#8b949e', label: v };
        return (
          <Tag style={{
            background: `${config.color}15`,
            border: `1px solid ${config.color}40`,
            color: config.color,
          }}>
            {config.label}
          </Tag>
        );
      }
    },
    { title: '检测方法', dataIndex: 'detection_method', key: 'detection_method' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  ];

  const sparePartColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { title: '备件名称', dataIndex: 'part_name', key: 'part_name' },
    { 
      title: '备件编号', 
      dataIndex: 'part_no', 
      key: 'part_no',
      render: (v: string) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a855f7' }}>{v}</Text>
      )
    },
    { 
      title: '类别', 
      dataIndex: 'category', 
      key: 'category',
      render: (v: string) => (
        <Tag style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
        }}>
          {v}
        </Tag>
      )
    },
    {
      title: '库存数量', 
      dataIndex: 'stock_qty', 
      key: 'stock_qty',
      render: (v: number, record: SparePart) => (
        <Text style={{ 
          fontFamily: "'JetBrains Mono', monospace", 
          color: v < record.min_stock ? '#ff4757' : '#00ff88',
        }}>
          {v} / {record.min_stock}
        </Text>
      )
    },
    { 
      title: '单价', 
      dataIndex: 'unit_price', 
      key: 'unit_price',
      render: (v: number) => v ? (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8b949e' }}>
          ¥{v.toLocaleString()}
        </Text>
      ) : '-'
    },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    {
      title: '状态', 
      key: 'stock_status',
      render: (_: unknown, record: SparePart) => (
        record.stock_qty < record.min_stock ? (
          <Tag style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            color: '#ff4757',
          }}>
            库存不足
          </Tag>
        ) : (
          <Tag style={{
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            color: '#00ff88',
          }}>
            正常
          </Tag>
        )
      )
    },
  ];

  const resourceColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { title: '资源名称', dataIndex: 'resource_name', key: 'resource_name' },
    { 
      title: '资源类型', 
      dataIndex: 'resource_type', 
      key: 'resource_type',
      render: (v: string) => (
        <Tag style={{ 
          background: 'rgba(168, 85, 247, 0.1)', 
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: '#a855f7',
        }}>
          {v}
        </Tag>
      )
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (v: string) => (
        <Tag style={{
          background: v === '可用' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 140, 0, 0.1)',
          border: `1px solid ${v === '可用' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 140, 0, 0.3)'}`,
          color: v === '可用' ? '#00ff88' : '#ff8c00',
        }}>
          {v}
        </Tag>
      )
    },
    { title: '位置', dataIndex: 'location_name', key: 'location_name' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHeader 
        title="设备维修保障管理" 
        subtitle="维修计划 · 维修工单 · 故障模式 · 备件管理 · 保障资源"
        icon={<ToolOutlined />}
      />
      
      {error && (
        <Alert
          type="error"
          message="数据加载异常"
          description={error}
          style={{ 
            marginBottom: 16,
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
          }}
          showIcon
        />
      )}

      {lowStockParts.length > 0 && (
        <Alert
          type="warning"
          message={`${lowStockParts.length} 种备件库存不足`}
          description={lowStockParts.map(p => `${p.part_name}(${p.part_no}): ${p.stock_qty}/${p.min_stock}`).join('、')}
          style={{ 
            marginBottom: 16,
            background: 'rgba(255, 140, 0, 0.1)',
            border: '1px solid rgba(255, 140, 0, 0.3)',
          }}
          showIcon
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ToolOutlined style={{ color: '#00d4ff' }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>维修工单</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 20, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {orders.length}
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircleOutlined style={{ color: '#00ff88' }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>已完成</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 20, 
              fontWeight: 700,
              color: '#00ff88',
            }}>
              {completedOrders.length}
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #ff4757, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <WarningOutlined style={{ color: '#ff4757' }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>高严重度</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 20, 
              fontWeight: 700,
              color: '#ff4757',
            }}>
              {highSeverityOrders.length}
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BugOutlined style={{ color: '#a855f7' }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>故障模式</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 20, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {failureModes.length}
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #ff8c00, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <InboxOutlined style={{ color: '#ff8c00' }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>备件种类</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 20, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {spareParts.length}
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileTextOutlined style={{ color: '#00ff88' }} />
              <Text style={{ fontSize: 11, color: '#8b949e' }}>维修费用</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 16, 
              fontWeight: 700,
              color: '#00ff88',
            }}>
              ¥{totalCost.toLocaleString()}
            </div>
          </div>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Tabs
        defaultActiveKey="orders"
        items={[
          {
            key: 'orders',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ToolOutlined />
                维修工单
                <Tag style={{ 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#00d4ff',
                  marginLeft: 4,
                }}>
                  {orders.length}
                </Tag>
              </span>
            ),
            children: (
              <div style={{
                background: '#111827',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: '16px',
              }}>
                <Table 
                  columns={orderColumns} 
                  dataSource={orders} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'plans',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileTextOutlined />
                维修计划
                <Tag style={{ 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#a855f7',
                  marginLeft: 4,
                }}>
                  {plans.length}
                </Tag>
              </span>
            ),
            children: (
              <div style={{
                background: '#111827',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: '16px',
              }}>
                <Table 
                  columns={planColumns} 
                  dataSource={plans} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'failureModes',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BugOutlined />
                故障模式
                <Tag style={{ 
                  background: 'rgba(255, 71, 87, 0.1)', 
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  color: '#ff4757',
                  marginLeft: 4,
                }}>
                  {failureModes.length}
                </Tag>
              </span>
            ),
            children: (
              <div style={{
                background: '#111827',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: '16px',
              }}>
                <Table 
                  columns={failureModeColumns} 
                  dataSource={failureModes} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'spareParts',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <InboxOutlined />
                备件管理
                <Tag style={{ 
                  background: 'rgba(255, 140, 0, 0.1)', 
                  border: '1px solid rgba(255, 140, 0, 0.3)',
                  color: '#ff8c00',
                  marginLeft: 4,
                }}>
                  {spareParts.length}
                </Tag>
              </span>
            ),
            children: (
              <div style={{
                background: '#111827',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: '16px',
              }}>
                <Table 
                  columns={sparePartColumns} 
                  dataSource={spareParts} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'resources',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleOutlined />
                保障资源
                <Tag style={{ 
                  background: 'rgba(0, 255, 136, 0.1)', 
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  color: '#00ff88',
                  marginLeft: 4,
                }}>
                  {resources.length}
                </Tag>
              </span>
            ),
            children: (
              <div style={{
                background: '#111827',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: '16px',
              }}>
                <Table 
                  columns={resourceColumns} 
                  dataSource={resources} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
        ]}
      />

      {/* 详情抽屉 */}
      <Drawer
        title={
          <span style={{ color: '#e6edf3' }}>维修工单详情</span>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        styles={{
          header: { background: '#111827', borderBottom: '1px solid #1e3a5f' },
          body: { background: '#0a0e14' },
        }}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="loading-spinner" />
          </div>
        ) : selectedOrder ? (
          <div>
            <Descriptions 
              column={1} 
              size="small" 
              bordered
              style={{ marginBottom: 16 }}
              labelStyle={{ background: '#111827', color: '#8b949e' }}
              contentStyle={{ background: '#0a0e14', color: '#e6edf3' }}
            >
              <Descriptions.Item label="工单号">
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff' }}>
                  {selectedOrder.order.order_no}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="设备">{selectedOrder.order.equipment_name}</Descriptions.Item>
              <Descriptions.Item label="故障模式">{selectedOrder.order.failure_mode_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="故障描述">{selectedOrder.order.fault_desc}</Descriptions.Item>
              <Descriptions.Item label="维修措施">{selectedOrder.order.repair_action}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedOrder.order.start_time}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{selectedOrder.order.end_time || '进行中'}</Descriptions.Item>
              <Descriptions.Item label="操作员">{selectedOrder.order.operator}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag style={{
                  background: `${STATUS_CONFIG[selectedOrder.order.status]?.color || '#8b949e'}15`,
                  border: `1px solid ${STATUS_CONFIG[selectedOrder.order.status]?.color || '#8b949e'}40`,
                  color: STATUS_CONFIG[selectedOrder.order.status]?.color || '#8b949e',
                }}>
                  {STATUS_CONFIG[selectedOrder.order.status]?.label || selectedOrder.order.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag style={{
                  background: `${SEVERITY_CONFIG[selectedOrder.order.severity]?.color || '#8b949e'}15`,
                  border: `1px solid ${SEVERITY_CONFIG[selectedOrder.order.severity]?.color || '#8b949e'}40`,
                  color: SEVERITY_CONFIG[selectedOrder.order.severity]?.color || '#8b949e',
                }}>
                  {SEVERITY_CONFIG[selectedOrder.order.severity]?.label || selectedOrder.order.severity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="费用">
                {selectedOrder.order.cost ? (
                  <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00ff88' }}>
                    ¥{selectedOrder.order.cost.toLocaleString()}
                  </Text>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.spare_usages.length > 0 && (
              <div>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#8b949e', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 8,
                  display: 'block',
                }}>
                  使用备件
                </Text>
                <Table
                  columns={[
                    { title: '备件名称', dataIndex: 'part_name', key: 'part_name' },
                    { title: '备件编号', dataIndex: 'part_no', key: 'part_no' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '使用时间', dataIndex: 'usage_time', key: 'usage_time' },
                  ]}
                  dataSource={selectedOrder.spare_usages}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </div>
            )}
          </div>
        ) : (
          <Text style={{ color: '#6e7681' }}>加载失败</Text>
        )}
      </Drawer>
    </div>
  );
};

export default MaintenancePage;

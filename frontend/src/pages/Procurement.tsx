import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Tabs, Spin, Alert, Typography, Row, Col, Statistic } from 'antd';
import { 
  ShoppingCartOutlined, 
  FileTextOutlined, 
  AuditOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import PageHeader from '../components/PageHeader';
import {
  getProcurementPlans,
  getTenderProjects,
  getPurchaseContracts,
  getAcceptanceRecords
} from '../api/procurement';
import type {
  ProcurementPlan,
  TenderProject,
  PurchaseContract,
  AcceptanceRecord
} from '../types/procurement';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  '已执行': { color: '#00ff88', label: '已执行' },
  '已完成': { color: '#00ff88', label: '已完成' },
  '执行中': { color: '#00d4ff', label: '执行中' },
  '待审批': { color: '#ff8c00', label: '待审批' },
  '审批中': { color: '#ff8c00', label: '审批中' },
  '准备中': { color: '#8b949e', label: '准备中' },
  '进行中': { color: '#00d4ff', label: '进行中' },
};

const RESULT_CONFIG: Record<string, { color: string; label: string }> = {
  '合格': { color: '#00ff88', label: '合格' },
  '通过': { color: '#00ff88', label: '通过' },
  '不通过': { color: '#ff4757', label: '不通过' },
  '待验收': { color: '#ff8c00', label: '待验收' },
};

const ProcurementPage: React.FC = () => {
  const [plans, setPlans] = useState<ProcurementPlan[]>([]);
  const [tenders, setTenders] = useState<TenderProject[]>([]);
  const [contracts, setContracts] = useState<PurchaseContract[]>([]);
  const [acceptances, setAcceptances] = useState<AcceptanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, t, c, a] = await Promise.all([
          getProcurementPlans(),
          getTenderProjects(),
          getPurchaseContracts(),
          getAcceptanceRecords()
        ]);
        setPlans(p);
        setTenders(t);
        setContracts(c);
        setAcceptances(a);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
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
        <div className="loading-spinner" />
        <Text style={{ color: '#8b949e' }}>加载采购数据...</Text>
      </div>
    );
  }

  const totalBudget = plans.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
  const totalContractAmount = contracts.reduce((sum, c) => sum + (c.amount || 0), 0);

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
    { 
      title: '年度', 
      dataIndex: 'plan_year', 
      key: 'plan_year', 
      width: 80,
      render: (v: number) => (
        <Tag style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {v}
        </Tag>
      )
    },
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { 
      title: '预算金额', 
      dataIndex: 'budget_amount', 
      key: 'budget_amount',
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00ff88' }}>
          ¥{v?.toLocaleString()}
        </Text>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
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
    { title: '审批人', dataIndex: 'approver', key: 'approver' },
  ];

  const tenderColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '关联计划', dataIndex: 'plan_name', key: 'plan_name' },
    { 
      title: '招标方式', 
      dataIndex: 'tender_method', 
      key: 'tender_method',
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
    { title: '发布日期', dataIndex: 'publish_date', key: 'publish_date' },
    { title: '投标截止', dataIndex: 'bid_deadline', key: 'bid_deadline' },
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
    { title: '中标供应商', dataIndex: 'winner_supplier_name', key: 'winner_supplier_name' },
  ];

  const contractColumns = [
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
      title: '合同编号', 
      dataIndex: 'contract_no', 
      key: 'contract_no',
      render: (v: string) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff' }}>{v}</Text>
      )
    },
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { 
      title: '金额', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00ff88' }}>
          ¥{v?.toLocaleString()}
        </Text>
      )
    },
    { title: '签订日期', dataIndex: 'sign_date', key: 'sign_date' },
    { title: '交付日期', dataIndex: 'delivery_date', key: 'delivery_date' },
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
  ];

  const acceptanceColumns = [
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
      title: '验收编号', 
      dataIndex: 'acceptance_no', 
      key: 'acceptance_no',
      render: (v: string) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a855f7' }}>{v}</Text>
      )
    },
    { title: '合同编号', dataIndex: 'contract_no', key: 'contract_no' },
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { title: '验收日期', dataIndex: 'acceptance_date', key: 'acceptance_date' },
    { 
      title: '结果', 
      dataIndex: 'result', 
      key: 'result',
      render: (v: string) => {
        const config = RESULT_CONFIG[v] || { color: '#8b949e', label: v };
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
    { title: '验收人', dataIndex: 'inspector', key: 'inspector' },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHeader 
        title="设备采购管理" 
        subtitle="采购计划 · 招标项目 · 采购合同 · 验收记录"
        icon={<ShoppingCartOutlined />}
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

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
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
              <FileTextOutlined style={{ color: '#00d4ff' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>采购计划</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {plans.length}
            </div>
          </div>
        </Col>
        <Col span={6}>
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
              <AuditOutlined style={{ color: '#a855f7' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>招标项目</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {tenders.length}
            </div>
          </div>
        </Col>
        <Col span={6}>
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
              <DollarOutlined style={{ color: '#00ff88' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>合同总额</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 20, 
              fontWeight: 700,
              color: '#00ff88',
            }}>
              ¥{totalContractAmount.toLocaleString()}
            </div>
          </div>
        </Col>
        <Col span={6}>
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
              <CheckCircleOutlined style={{ color: '#ff8c00' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>验收记录</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {acceptances.length}
            </div>
          </div>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Tabs
        defaultActiveKey="plans"
        items={[
          {
            key: 'plans',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileTextOutlined />
                采购计划
                <Tag style={{ 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#00d4ff',
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
            key: 'tenders',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AuditOutlined />
                招标项目
                <Tag style={{ 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#a855f7',
                  marginLeft: 4,
                }}>
                  {tenders.length}
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
                  columns={tenderColumns} 
                  dataSource={tenders} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'contracts',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarOutlined />
                采购合同
                <Tag style={{ 
                  background: 'rgba(0, 255, 136, 0.1)', 
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  color: '#00ff88',
                  marginLeft: 4,
                }}>
                  {contracts.length}
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
                  columns={contractColumns} 
                  dataSource={contracts} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'acceptances',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleOutlined />
                验收记录
                <Tag style={{ 
                  background: 'rgba(255, 140, 0, 0.1)', 
                  border: '1px solid rgba(255, 140, 0, 0.3)',
                  color: '#ff8c00',
                  marginLeft: 4,
                }}>
                  {acceptances.length}
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
                  columns={acceptanceColumns} 
                  dataSource={acceptances} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
        ]}
      />
    </div>
  );
};

export default ProcurementPage;

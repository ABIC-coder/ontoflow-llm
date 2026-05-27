import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Tabs, Spin, Alert, Typography, Row, Col, Drawer, Button, Descriptions } from 'antd';
import { 
  ExperimentOutlined, 
  FileTextOutlined, 
  LineChartOutlined, 
  CheckCircleOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '../components/PageHeader';
import {
  getTestProjects,
  getTestProjectDetail,
  getTestData,
  getAppraisalConclusions
} from '../api/testing';
import type {
  TestProject,
  TestData,
  AppraisalConclusion,
  TestProjectDetail
} from '../types/testing';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  '已完成': { color: '#00ff88', label: '已完成' },
  '进行中': { color: '#00d4ff', label: '进行中' },
  '计划中': { color: '#8b949e', label: '计划中' },
};

const RESULT_CONFIG: Record<string, { color: string; label: string }> = {
  '通过': { color: '#00ff88', label: '通过' },
  '不通过': { color: '#ff4757', label: '不通过' },
};

const TestingPage: React.FC = () => {
  const [projects, setProjects] = useState<TestProject[]>([]);
  const [testData, setTestData] = useState<TestData[]>([]);
  const [conclusions, setConclusions] = useState<AppraisalConclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState<TestProjectDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, d, c] = await Promise.all([
          getTestProjects(),
          getTestData(),
          getAppraisalConclusions()
        ]);
        setProjects(p);
        setTestData(d);
        setConclusions(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleViewDetail = async (projectId: number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getTestProjectDetail(projectId);
      setSelectedProject(detail);
    } catch {
      setSelectedProject(null);
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
        <Text style={{ color: '#8b949e' }}>加载试验数据...</Text>
      </div>
    );
  }

  const passedTests = testData.filter(d => d.pass_flag === 1).length;
  const failedTests = testData.filter(d => d.pass_flag === 0).length;
  const passRate = testData.length > 0 ? Math.round((passedTests / testData.length) * 100) : 0;

  const projectColumns = [
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
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { 
      title: '试验类型', 
      dataIndex: 'test_type', 
      key: 'test_type',
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
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date' },
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
      title: '结论', 
      dataIndex: 'conclusion', 
      key: 'conclusion',
      render: (v: string) => {
        if (!v) return '-';
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
    { title: '试验员', dataIndex: 'tester', key: 'tester' },
    {
      title: '操作', 
      key: 'action', 
      width: 80,
      render: (_: unknown, record: TestProject) => (
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

  const dataColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 60,
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6e7681' }}>{v}</Text>
      )
    },
    { title: '试验项目', dataIndex: 'project_name', key: 'project_name' },
    { title: '试验项', dataIndex: 'test_item', key: 'test_item' },
    { 
      title: '实测值', 
      dataIndex: 'measured_value', 
      key: 'measured_value',
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff' }}>{v}</Text>
      )
    },
    { 
      title: '期望值', 
      dataIndex: 'expected_value', 
      key: 'expected_value',
      render: (v: number) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8b949e' }}>{v}</Text>
      )
    },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    {
      title: '是否通过', 
      dataIndex: 'pass_flag', 
      key: 'pass_flag',
      render: (v: number) => (
        <Tag style={{
          background: v ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 71, 87, 0.1)',
          border: `1px solid ${v ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 71, 87, 0.3)'}`,
          color: v ? '#00ff88' : '#ff4757',
        }}>
          {v ? '通过' : '未通过'}
        </Tag>
      )
    },
    { title: '试验时间', dataIndex: 'test_time', key: 'test_time' },
    { title: '操作员', dataIndex: 'operator', key: 'operator' },
  ];

  const conclusionColumns = [
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
      title: '结论编号', 
      dataIndex: 'conclusion_no', 
      key: 'conclusion_no',
      render: (v: string) => (
        <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a855f7' }}>{v}</Text>
      )
    },
    { title: '试验项目', dataIndex: 'project_name', key: 'project_name' },
    { title: '设备', dataIndex: 'equipment_name', key: 'equipment_name' },
    { title: '鉴定日期', dataIndex: 'appraisal_date', key: 'appraisal_date' },
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
    { title: '专家', dataIndex: 'experts', key: 'experts', ellipsis: true },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHeader 
        title="试验鉴定管理" 
        subtitle="试验项目 · 试验数据 · 鉴定结论"
        icon={<ExperimentOutlined />}
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
              background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ExperimentOutlined style={{ color: '#a855f7' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>试验项目</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {projects.length}
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
              background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <LineChartOutlined style={{ color: '#00d4ff' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>试验数据</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {testData.length}
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
              <CheckCircleOutlined style={{ color: '#00ff88' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>通过率</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: passRate >= 80 ? '#00ff88' : passRate >= 60 ? '#ff8c00' : '#ff4757',
            }}>
              {passRate}%
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
              <FileTextOutlined style={{ color: '#ff8c00' }} />
              <Text style={{ fontSize: 12, color: '#8b949e' }}>鉴定结论</Text>
            </div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#e6edf3',
            }}>
              {conclusions.length}
            </div>
          </div>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Tabs
        defaultActiveKey="projects"
        items={[
          {
            key: 'projects',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExperimentOutlined />
                试验项目
                <Tag style={{ 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#a855f7',
                  marginLeft: 4,
                }}>
                  {projects.length}
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
                  columns={projectColumns} 
                  dataSource={projects} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'data',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LineChartOutlined />
                试验数据
                <Tag style={{ 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#00d4ff',
                  marginLeft: 4,
                }}>
                  {testData.length}
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
                  columns={dataColumns} 
                  dataSource={testData} 
                  rowKey="id" 
                  size="small" 
                  pagination={false}
                />
              </div>
            )
          },
          {
            key: 'conclusions',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleOutlined />
                鉴定结论
                <Tag style={{ 
                  background: 'rgba(255, 140, 0, 0.1)', 
                  border: '1px solid rgba(255, 140, 0, 0.3)',
                  color: '#ff8c00',
                  marginLeft: 4,
                }}>
                  {conclusions.length}
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
                  columns={conclusionColumns} 
                  dataSource={conclusions} 
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
          <span style={{ color: '#e6edf3' }}>试验项目详情</span>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={600}
        styles={{
          header: { background: '#111827', borderBottom: '1px solid #1e3a5f' },
          body: { background: '#0a0e14' },
        }}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="loading-spinner" />
          </div>
        ) : selectedProject ? (
          <div>
            <Descriptions 
              column={2} 
              size="small" 
              bordered
              style={{ marginBottom: 16 }}
              labelStyle={{ background: '#111827', color: '#8b949e' }}
              contentStyle={{ background: '#0a0e14', color: '#e6edf3' }}
            >
              <Descriptions.Item label="项目名称" span={2}>{selectedProject.project.project_name}</Descriptions.Item>
              <Descriptions.Item label="设备">{selectedProject.project.equipment_name}</Descriptions.Item>
              <Descriptions.Item label="试验类型">{selectedProject.project.test_type}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{selectedProject.project.start_date}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{selectedProject.project.end_date}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag style={{
                  background: `${STATUS_CONFIG[selectedProject.project.status]?.color || '#8b949e'}15`,
                  border: `1px solid ${STATUS_CONFIG[selectedProject.project.status]?.color || '#8b949e'}40`,
                  color: STATUS_CONFIG[selectedProject.project.status]?.color || '#8b949e',
                }}>
                  {STATUS_CONFIG[selectedProject.project.status]?.label || selectedProject.project.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结论">{selectedProject.project.conclusion || '-'}</Descriptions.Item>
              <Descriptions.Item label="试验员" span={2}>{selectedProject.project.tester}</Descriptions.Item>
            </Descriptions>

            {selectedProject.test_data.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#8b949e', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 8,
                  display: 'block',
                }}>
                  试验数据
                </Text>
                <Table
                  columns={dataColumns.filter(c => c.key !== 'project_name')}
                  dataSource={selectedProject.test_data}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              </div>
            )}

            {selectedProject.conclusions.length > 0 && (
              <div>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#8b949e', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 8,
                  display: 'block',
                }}>
                  鉴定结论
                </Text>
                {selectedProject.conclusions.map(c => (
                  <div key={c.id} style={{
                    background: '#111827',
                    border: '1px solid #1e3a5f',
                    borderRadius: 8,
                    padding: '16px',
                    marginBottom: 8,
                  }}>
                    <Descriptions column={1} size="small" bordered
                      labelStyle={{ background: '#0a0e14', color: '#8b949e' }}
                      contentStyle={{ background: '#111827', color: '#e6edf3' }}
                    >
                      <Descriptions.Item label="结论编号">{c.conclusion_no}</Descriptions.Item>
                      <Descriptions.Item label="结果">
                        <Tag style={{
                          background: `${RESULT_CONFIG[c.result]?.color || '#8b949e'}15`,
                          border: `1px solid ${RESULT_CONFIG[c.result]?.color || '#8b949e'}40`,
                          color: RESULT_CONFIG[c.result]?.color || '#8b949e',
                        }}>
                          {RESULT_CONFIG[c.result]?.label || c.result}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="专家">{c.experts}</Descriptions.Item>
                      <Descriptions.Item label="备注">{c.remarks}</Descriptions.Item>
                    </Descriptions>
                  </div>
                ))}
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

export default TestingPage;

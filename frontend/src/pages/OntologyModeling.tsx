import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Button, Spin, Alert, Typography, Descriptions } from 'antd';
import { ReloadOutlined, ApartmentOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader';
import JsonViewer from '../components/JsonViewer';
import { getOntologySchema, reloadOntologySchema } from '../api/ontology';
import type { OntologySchemaResponse, OntologyEntity, OntologyRelation } from '../types/ontology';

const ENTITY_COLORS: Record<string, string> = {
  Equipment: '#00d4ff',
  Manufacturer: '#ff8c00',
  Location: '#00ff88',
  MaintenanceRecord: '#a855f7',
  Supplier: '#ff4757',
  PurchaseContract: '#00d4ff',
  ProcurementPlan: '#00d4ff',
  TenderProject: '#a855f7',
  AcceptanceRecord: '#ff8c00',
  TestProject: '#00ff88',
  TestPlan: '#00ff88',
  TestData: '#00ff88',
  AppraisalConclusion: '#00ff88',
  FailureMode: '#ff4757',
  MaintenancePlan: '#ff8c00',
  MaintenanceOrder: '#ff8c00',
  SparePart: '#a855f7',
  SupportResource: '#a855f7',
};

const RELATION_COLORS: Record<string, string> = {
  PRODUCED_BY: '#00d4ff',
  LOCATED_IN: '#00ff88',
  HAS_MAINTENANCE: '#ff8c00',
  SUPPLIED_BY: '#ff4757',
  HAS_CONTRACT: '#a855f7',
  SIGNED_CONTRACT: '#a855f7',
  PLANS_TO_BUY: '#00d4ff',
  BASED_ON: '#00d4ff',
  FOR_EQUIPMENT: '#00d4ff',
  ACCEPTS: '#ff8c00',
  TESTS: '#00ff88',
  BELONGS_TO: '#00ff88',
  GENERATED_BY: '#00ff88',
  CONCLUDES: '#00ff88',
  MAINTAINS: '#ff8c00',
  REPAIRS: '#ff8c00',
  EXECUTES: '#ff8c00',
  CAUSED_BY: '#ff4757',
  USES_SPARE: '#a855f7',
  HAS_FAILURE_MODE: '#ff4757',
  SUPPORTS: '#a855f7',
  CONTAINS: '#8b949e',
};

const OntologyModeling: React.FC = () => {
  const [schema, setSchema] = useState<OntologySchemaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloading, setReloading] = useState(false);

  const fetchSchema = async () => {
    try {
      const data = await getOntologySchema();
      setSchema(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchema(); }, []);

  const handleReload = async () => {
    setReloading(true);
    try {
      const data = await reloadOntologySchema();
      setSchema(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重载失败');
    } finally {
      setReloading(false);
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
        <Typography.Text style={{ color: '#8b949e' }}>加载本体模型...</Typography.Text>
      </div>
    );
  }

  const entities: OntologyEntity[] = schema?.schema?.entities || [];
  const relations: OntologyRelation[] = schema?.schema?.relations || [];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHeader 
        title="本体建模" 
        subtitle="查看本体 Schema 中的实体与关系定义"
        icon={<ApartmentOutlined />}
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

      {/* Schema信息 */}
      <div style={{
        marginBottom: 16,
        padding: '16px 20px',
        background: '#111827',
        borderRadius: 8,
        border: '1px solid #1e3a5f',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Descriptions size="small" column={2}
          labelStyle={{ color: '#8b949e' }}
          contentStyle={{ color: '#e6edf3' }}
        >
          <Descriptions.Item label="Schema 名称">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff' }}>
              {schema?.name || '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {schema?.created_at || '-'}
            </span>
          </Descriptions.Item>
        </Descriptions>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleReload} 
          loading={reloading}
          style={{
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            color: '#00d4ff',
          }}
        >
          重新加载 Schema
        </Button>
      </div>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>实体类型</div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#00d4ff',
            }}>
              {entities.length}
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
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>关系类型</div>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 24, 
              fontWeight: 700,
              color: '#a855f7',
            }}>
              {relations.length}
            </div>
          </div>
        </Col>
      </Row>

      {/* 实体和关系 */}
      <Row gutter={16}>
        <Col span={12}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
          }}>
            <div style={{ 
              fontSize: 12, 
              color: '#8b949e', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 16,
            }}>
              实体类型
            </div>
            {entities.length === 0 ? (
              <Typography.Text style={{ color: '#6e7681' }}>暂无实体定义</Typography.Text>
            ) : (
              entities.map((ent) => (
                <div key={ent.name} style={{
                  background: '#0a0e14',
                  border: '1px solid #1e3a5f',
                  borderRadius: 6,
                  padding: '12px',
                  marginBottom: 8,
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 8 
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: ENTITY_COLORS[ent.type || ent.name] || '#8b949e',
                      boxShadow: `0 0 8px ${ENTITY_COLORS[ent.type || ent.name] || '#8b949e'}`,
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: ENTITY_COLORS[ent.type || ent.name] || '#e6edf3',
                    }}>
                      {ent.type || ent.name}
                    </span>
                    {ent.label && (
                      <span style={{ fontSize: 12, color: '#6e7681' }}>
                        ({ent.label})
                      </span>
                    )}
                  </div>
                  {ent.properties && ent.properties.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {ent.properties.map((p) => (
                        <Tag key={p} style={{
                          background: 'rgba(0, 212, 255, 0.05)',
                          border: '1px solid #1e3a5f',
                          color: '#8b949e',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          margin: 0,
                        }}>
                          {p}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#6e7681' }}>无属性定义</span>
                  )}
                </div>
              ))
            )}
          </div>
        </Col>
        <Col span={12}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '16px',
          }}>
            <div style={{ 
              fontSize: 12, 
              color: '#8b949e', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 16,
            }}>
              关系类型
            </div>
            {relations.length === 0 ? (
              <Typography.Text style={{ color: '#6e7681' }}>暂无关系定义</Typography.Text>
            ) : (
              relations.map((rel, idx) => (
                <div key={idx} style={{
                  background: '#0a0e14',
                  border: '1px solid #1e3a5f',
                  borderRadius: 6,
                  padding: '12px',
                  marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${ENTITY_COLORS[rel.source] || '#8b949e'}15`,
                      border: `1px solid ${ENTITY_COLORS[rel.source] || '#8b949e'}40`,
                      color: ENTITY_COLORS[rel.source] || '#8b949e',
                    }}>
                      {rel.source}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${RELATION_COLORS[rel.label || rel.name] || '#8b949e'}15`,
                      border: `1px solid ${RELATION_COLORS[rel.label || rel.name] || '#8b949e'}40`,
                      color: RELATION_COLORS[rel.label || rel.name] || '#8b949e',
                    }}>
                      {rel.label || rel.name}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${ENTITY_COLORS[rel.target] || '#8b949e'}15`,
                      border: `1px solid ${ENTITY_COLORS[rel.target] || '#8b949e'}40`,
                      color: ENTITY_COLORS[rel.target] || '#8b949e',
                    }}>
                      {rel.target}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Col>
      </Row>

      {/* 原始JSON */}
      <div style={{ marginTop: 16 }}>
        <JsonViewer data={schema?.schema || {}} title="原始 Schema JSON" />
      </div>
    </div>
  );
};

export default OntologyModeling;

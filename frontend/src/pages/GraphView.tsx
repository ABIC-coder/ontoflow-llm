import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Input, Drawer, Descriptions, Tag, Spin, Alert, Typography, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import GraphCanvas from '../components/GraphCanvas';
import { getGraphStats, getGraphNodes, getGraphEdges, getEntity, getEntityNeighbors, searchGraph } from '../api/graph';
import type { GraphStats, GraphNode, GraphEdge } from '../types/graph';

const TYPE_COLORS: Record<string, string> = {
  Equipment: '#1a3a5c', Manufacturer: '#e67e22', Location: '#27ae60',
  MaintenanceRecord: '#8e44ad', Supplier: '#c0392b', PurchaseContract: '#2980b9',
};

const GraphView: React.FC = () => {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [neighbors, setNeighbors] = useState<GraphNode[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [neighborLoading, setNeighborLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, n, e] = await Promise.all([
          getGraphStats(),
          getGraphNodes(),
          getGraphEdges(),
        ]);
        setStats(s);
        setNodes(n);
        setEdges(e);
        setAllNodes(n);
        setAllEdges(e);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleNodeClick = useCallback(async (nodeId: number) => {
    setDrawerOpen(true);
    setNeighborLoading(true);
    try {
      const [entityRes, neighborsRes] = await Promise.all([
        getEntity(nodeId),
        getEntityNeighbors(nodeId),
      ]);
      setSelectedNode(entityRes);
      setNeighbors(neighborsRes?.nodes || []);
    } catch {
      setSelectedNode(null);
      setNeighbors([]);
    } finally {
      setNeighborLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const results = await searchGraph(searchKeyword.trim());
      if (results.length > 0) {
        const foundIds = new Set(results.map((n) => n.id));
        const relatedEdges = allEdges.filter(
          (e) => foundIds.has(e.source_node_id) && foundIds.has(e.target_node_id),
        );
        setNodes(results);
        setEdges(relatedEdges);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setSearchKeyword('');
    setNodes(allNodes);
    setEdges(allEdges);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <PageHeader title="图谱视图" subtitle="可视化展示知识图谱节点与关系" />
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={4}><StatCard title="节点数" value={stats.node_count} /></Col>
          <Col span={4}><StatCard title="关系数" value={stats.edge_count} /></Col>
          {Object.entries(stats.entity_types).map(([type, count]) => (
            <Col span={4} key={type}>
              <StatCard title={type} value={count} />
            </Col>
          ))}
        </Row>
      )}

      <Card size="small" style={{ marginBottom: 12 }}>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="输入关键词搜索节点"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch} loading={searching}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <Card size="small">
        <div style={{ marginBottom: 8 }}>
          <Space wrap>
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <Tag key={type} color={color}>{type}</Tag>
            ))}
          </Space>
        </div>
        <GraphCanvas nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
      </Card>

      <Drawer
        title="节点详情"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
      >
        {selectedNode ? (
          <Spin spinning={neighborLoading}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="ID">{selectedNode.id}</Descriptions.Item>
              <Descriptions.Item label="标签">{selectedNode.label}</Descriptions.Item>
              <Descriptions.Item label="实体类型">
                <Tag color={TYPE_COLORS[selectedNode.entity_type] || 'default'}>
                  {selectedNode.entity_type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源表">{selectedNode.source_table || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源ID">{selectedNode.source_id ?? '-'}</Descriptions.Item>
            </Descriptions>
            {selectedNode.properties_json && (
              <Card title="属性" size="small" style={{ marginTop: 12 }}>
                <pre style={{ fontSize: 12, margin: 0, maxHeight: 200, overflow: 'auto' }}>
                  {typeof selectedNode.properties_json === 'string'
                    ? JSON.stringify(JSON.parse(selectedNode.properties_json), null, 2)
                    : JSON.stringify(selectedNode.properties_json, null, 2)}
                </pre>
              </Card>
            )}
            <Card title="一跳邻居" size="small" style={{ marginTop: 12 }}>
              {neighbors.length === 0 ? (
                <Typography.Text type="secondary">无邻居节点</Typography.Text>
              ) : (
                neighbors.map((n) => (
                  <Tag
                    key={n.id}
                    color={TYPE_COLORS[n.entity_type] || 'default'}
                    style={{ marginBottom: 4, cursor: 'pointer' }}
                    onClick={() => handleNodeClick(n.id)}
                  >
                    {n.label} ({n.entity_type})
                  </Tag>
                ))
              )}
            </Card>
          </Spin>
        ) : (
          <Typography.Text type="secondary">未选择节点</Typography.Text>
        )}
      </Drawer>
    </div>
  );
};

export default GraphView;

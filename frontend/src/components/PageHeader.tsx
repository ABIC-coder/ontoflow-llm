import React from 'react';
import { Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon }) => (
  <div style={{ 
    marginBottom: 24,
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #111827, #1a2332)',
    borderRadius: 8,
    border: '1px solid #1e3a5f',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* 顶部装饰线 */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
    }} />
    
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: 'rgba(0, 212, 255, 0.1)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00d4ff',
        fontSize: 18,
      }}>
        {icon || <ThunderboltOutlined />}
      </div>
      <div>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          color: '#e6edf3',
          display: 'block',
          lineHeight: 1.2,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: '#6e7681' }}>
            {subtitle}
          </Text>
        )}
      </div>
    </div>
  </div>
);

export default PageHeader;

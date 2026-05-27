import React from 'react';
import { Tag } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface RiskTagProps {
  level: string;
  showIcon?: boolean;
}

const RISK_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  '高': { 
    color: '#ff4757', 
    icon: <WarningOutlined />, 
    label: '高风险' 
  },
  '中': { 
    color: '#ff8c00', 
    icon: <ExclamationCircleOutlined />, 
    label: '中风险' 
  },
  '低': { 
    color: '#00ff88', 
    icon: <CheckCircleOutlined />, 
    label: '低风险' 
  },
};

const RiskTag: React.FC<RiskTagProps> = ({ level, showIcon = true }) => {
  const config = RISK_CONFIG[level] || RISK_CONFIG['低'];
  
  return (
    <Tag
      style={{
        background: `${config.color}15`,
        border: `1px solid ${config.color}40`,
        color: config.color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
      }}
    >
      {showIcon && config.icon}
      {config.label}
    </Tag>
  );
};

export default RiskTag;

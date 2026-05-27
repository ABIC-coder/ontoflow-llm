import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  valueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  prefix, 
  suffix, 
  valueStyle,
  icon,
  color = '#00d4ff'
}) => (
  <div style={{
    background: '#111827',
    border: '1px solid #1e3a5f',
    borderRadius: 8,
    padding: '16px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s',
  }}
  className="stat-card-hover"
  >
    {/* 顶部装饰线 */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    }} />
    
    {/* 背景图标 */}
    {icon && (
      <div style={{
        position: 'absolute',
        right: -5,
        bottom: -5,
        fontSize: 48,
        opacity: 0.05,
        color: color,
      }}>
        {icon}
      </div>
    )}

    {/* 内容 */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Text style={{ 
        fontSize: 11, 
        color: '#8b949e', 
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'block',
        marginBottom: 8,
      }}>
        {title}
      </Text>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {prefix && (
          <span style={{ color: color, fontSize: 16 }}>{prefix}</span>
        )}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: '#e6edf3',
          lineHeight: 1,
          ...valueStyle,
        }}>
          {value}
        </span>
        {suffix && (
          <Text style={{ fontSize: 11, color: '#6e7681' }}>{suffix}</Text>
        )}
      </div>
    </div>
  </div>
);

export default StatCard;

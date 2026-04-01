import React from 'react';

export default function Skeleton({
  width = '100%',
  height = 12,
  radius = 12,
  style,
  className = '',
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'rgba(17, 24, 39, 0.06)',
        ...style,
      }}
    />
  );
}

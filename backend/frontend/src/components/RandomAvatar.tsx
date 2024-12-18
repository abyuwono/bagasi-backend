import React from 'react';
import { Avatar, SvgIcon } from '@mui/material';

const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9B59B6', // Purple
  '#3498DB', // Light Blue
  '#E67E22', // Orange
  '#1ABC9C', // Turquoise
];

const shapes = [
  'M10,30 Q20,5 30,30 L30,50 L10,50 Z', // Mountain
  'M10,30 L30,30 L20,10 Z', // Triangle
  'M15,20 A15,15 0 1,0 30,35 Q22.5,45 15,35 Z', // Heart
  'M10,20 H30 V40 H10 Z', // Square
  'M20,10 L30,30 L20,50 L10,30 Z', // Diamond
];

const patterns = [
  'M5,5 l2,2 l-2,2 l-2,-2 Z', // Small squares
  'M2,2 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0', // Dots
  'M0,10 l10,-10 l10,10 l-10,10 Z', // Zigzag
  'M0,0 l5,10 l5,-10', // Chevron
  'M0,0 h10 v10 h-10 Z', // Grid
];

interface RandomAvatarProps {
  seed: string;
  size?: number;
}

const RandomAvatar: React.FC<RandomAvatarProps> = ({ seed, size = 56 }) => {
  // Generate deterministic random numbers based on seed
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const getRandomItem = (array: any[], seed: string) => {
    const hash = Math.abs(hashCode(seed));
    return array[hash % array.length];
  };

  const backgroundColor = getRandomItem(colors, seed);
  const mainShape = getRandomItem(shapes, seed + '1');
  const pattern = getRandomItem(patterns, seed + '2');

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: 'transparent',
      }}
    >
      <SvgIcon
        sx={{
          width: '100%',
          height: '100%',
        }}
        viewBox="0 0 40 60"
      >
        {/* Background */}
        <rect width="40" height="60" fill={backgroundColor} />
        
        {/* Main Shape */}
        <path
          d={mainShape}
          fill={getRandomItem(colors, seed + '3')}
          opacity="0.7"
        />
        
        {/* Pattern */}
        <pattern
          id={`pattern-${seed}`}
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d={pattern}
            fill={getRandomItem(colors, seed + '4')}
            opacity="0.3"
          />
        </pattern>
        <rect
          width="40"
          height="60"
          fill={`url(#pattern-${seed})`}
        />
      </SvgIcon>
    </Avatar>
  );
};

export default RandomAvatar;

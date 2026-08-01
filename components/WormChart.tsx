'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BallEvent } from '@/lib/db';

interface WormChartProps {
  balls: BallEvent[];
}

export default function WormChart({ balls }: WormChartProps) {
  let cumulativeScore = 0;
  const data = balls.map((ball, index) => {
    cumulativeScore += (ball.batsmanRuns + ball.extrasRuns);
    return {
      ballIndex: index + 1,
      over: `${ball.overNumber}.${ball.ballNumber}`,
      score: cumulativeScore,
      isWicket: ball.isWicket,
    };
  });

  const chartData = [{ ballIndex: 0, over: '0.0', score: 0, isWicket: false }, ...data];

  return (
    <div className="worm-chart-container">
      <div className="chart-header">
        <span>Run Progression (Worm)</span>
      </div>
      <div style={{ width: '100%', height: 140 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <XAxis dataKey="over" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC' }}
              formatter={(value: any) => [`Score: ${value}`, 'Total']}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
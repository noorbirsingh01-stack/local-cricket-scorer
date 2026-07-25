"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BallEvent } from '../lib/db';

interface WormChartProps {
  balls: BallEvent[];
  innings: number;
}

export default function WormChart({ balls, innings }: WormChartProps) {
  const currentInningsBalls = balls.filter(b => b.innings === innings);
  let cumulativeRuns = 0;
  const data = currentInningsBalls.map((ball, index) => {
    const runThisBall = (ball.batsmanRuns || 0) + (ball.extrasRuns || 0);
    cumulativeRuns += runThisBall;

    const overNum = Math.floor(index / 6);
    const ballNum = (index % 6) + 1;
    
    return {
      ballIndex: index + 1,
      label: `${overNum}.${ballNum}`,
      runs: cumulativeRuns,
      isWicket: ball.isWicket
    };
  });

  const chartData = [{ ballIndex: 0, label: '0.0', runs: 0, isWicket: false }, ...data];

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isWicket) {
      return (
        <circle cx={cx} cy={cy} r={4} fill="#EF4444" stroke="none" key={payload.ballIndex} />
      );
    }
    return null; 
  };

  return (
    <div className="worm-chart-wrapper">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
          <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
            itemStyle={{ color: '#F59E0B', fontWeight: '600' }}
            labelStyle={{ color: '#94A3B8', marginBottom: '2px' }}
          />
          <Line
            type="monotone"
            dataKey="runs"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={renderCustomDot}
            activeDot={{ r: 5, fill: '#3B82F6', stroke: 'none' }}
            animationDuration={400}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
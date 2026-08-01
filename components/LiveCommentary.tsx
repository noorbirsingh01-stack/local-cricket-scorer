'use client';

import React from 'react';

interface CommentaryItem {
  id: string;
  text: string;
  timestamp: string;
}

interface LiveCommentaryProps {
  commentaries: CommentaryItem[];
}

export default function LiveCommentary({ commentaries }: LiveCommentaryProps) {
  return (
    <div className="commentary-feed glass-card">
      <div className="commentary-header">
        <h3>AI Match Feed</h3>
        <span className="live-dot"></span>
      </div>
      <div className="commentary-list">
        {commentaries.length === 0 ? (
          <p className="no-commentary">Commentary stream will appear here as balls are scored...</p>
        ) : (
          commentaries.map((item) => (
            <div key={item.id} className="commentary-item">
              <span className="commentary-time">{item.timestamp}</span>
              <p>{item.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
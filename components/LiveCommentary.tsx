"use client";
import React from 'react';

interface CommentaryItem {
  id: string;
  over: string;
  text: string;
  time: string;
}

interface LiveCommentaryProps {
  feed: CommentaryItem[];
}

export default function LiveCommentary({ feed }: LiveCommentaryProps) {
  return (
    <div className="commentary-container">
      <div className="commentary-list">
        {feed.length === 0 ? (
          <p className="empty-text">Awaiting first delivery...</p>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="commentary-row animate-fade-in">
              <div className="commentary-over">{item.over}</div>
              <div className="commentary-details">
                <p className="commentary-text">{item.text}</p>
                <span className="commentary-time">{item.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
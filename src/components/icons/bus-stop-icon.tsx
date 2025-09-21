import React from 'react';

const BusStopIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M13 3H8.603c-1.323.004-2.607.541-3.535 1.469a5 5 0 0 0-1.465 3.534V16" />
    <path d="M8 16V8" />
    <path d="M18 16V3h-5" />
    <path d="M4 16h16" />
    <path d="M16.5 16a2.5 2.5 0 0 0 0-5h-5a2.5 2.5 0 0 0 0 5h5z" />
  </svg>
);

export default BusStopIcon;

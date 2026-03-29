import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[linear-gradient(180deg,#0d2238_0%,#09192a_54%,#06111b_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,174,94,0.14),transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(221,177,97,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(221,177,97,0.12) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[rgba(201,156,74,0.12)] blur-[110px]" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[rgba(30,60,96,0.35)] blur-[120px]" />
    </div>
  );
};

export default Background;

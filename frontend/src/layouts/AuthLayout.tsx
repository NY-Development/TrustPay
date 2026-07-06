import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex items-center justify-center antialiased">
      {/* Ambient background decoration details */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#eaedff] blur-[120px] opacity-60"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#dae2fd] blur-[100px] opacity-40"></div>
      </div>
      
      <main className="w-full relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

import React from 'react';
import type { Role } from '../../store/useAuthStore';

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  role: Exclude<Role, null>;
  onClick: (role: Exclude<Role, null>) => void;
}

export function RoleCard({ icon, title, subtitle, role, onClick }: RoleCardProps) {
  return (
    <button
      onClick={() => onClick(role)}
      className="
        w-full text-left
        bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm
        transition-all duration-200 cursor-pointer
        hover:border-[#14C9A0] hover:shadow-md hover:-translate-y-0.5
        focus:outline-none focus:border-[#14C9A0] focus:ring-2 focus:ring-[#14C9A0]/20
        group
      "
    >
      <div className="flex items-start gap-4">
        {/* Icon Badge */}
        <div className="
          flex-shrink-0 w-12 h-12 rounded-xl
          bg-[#14C9A0]/10
          flex items-center justify-center
          text-[#14C9A0]
          group-hover:bg-[#14C9A0]/20 transition-colors duration-200
        ">
          {icon}
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[#111827] text-base font-bold mb-1 tracking-tight">
            {title}
          </div>
          <div className="text-gray-500 text-sm leading-snug">
            {subtitle}
          </div>
        </div>
        {/* Arrow */}
        <div className="
          flex-shrink-0 self-center
          text-gray-300 group-hover:text-[#14C9A0]
          transition-colors duration-200 translate-x-0
          group-hover:translate-x-0.5
        ">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

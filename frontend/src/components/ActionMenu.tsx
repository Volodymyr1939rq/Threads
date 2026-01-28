import React from "react";
import type { LucideIcon } from "lucide-react";

export interface MenuItem{
    label:string;
    icon:LucideIcon;
    isDestructive?:boolean;
    onClick?:()=>void;
}

export type MenuGroup=MenuItem[]

interface ActionMenuProps{
    groups:MenuGroup[]
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ groups }) => {
  return (
    <div className="w-[250px] bg-[#262626] rounded-2xl overflow-hidden  border border-[#333]/30">
      {groups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          <div className="flex flex-col">
            {group.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={item.onClick}
                className={`
                  flex items-center justify-between px-4 py-1.5 mx-1 my-1.5 rounded-xl hover:bg-[#333333] cursor-pointer transition-colors group
                  ${item.isDestructive ? 'text-[#FF3040]' : 'text-[#F3F5F7]'}
                `}
              >
                <span className="flex-1 truncate mr-2 text-left">{item.label}</span>
                <item.icon className="w-[22px] h-[22px] stroke-2 shrink-0" />
              </button>
            ))}
          </div>
          {groupIndex < groups.length - 1 && (
            <div className="h-px bg-[#333] my-2 w-full" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
import React, { useEffect, useRef } from "react";
import { getMyPostConfig, getOtherPostConfig } from "./MyPostMenuConfig";
import { ActionMenu } from "./ActionMenu";

interface PostOptionalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onDelete?: () => void;
  postId: string;
}

export const PostOptionsModal: React.FC<PostOptionalMenuProps> = ({
  isOpen,
  onClose,
  isOwner,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const handleDelete = () => {
    onClose();
    if (onDelete) onDelete();
  };

  const handleIsOpen = () => {
    onClose();
  };

  const MenuGroups = isOwner
    ? getMyPostConfig(handleDelete, handleIsOpen)
    : getOtherPostConfig(handleIsOpen);

  return (
   
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()} 
      className="absolute top-12 right-0 z-50  rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
    >
      <ActionMenu groups={MenuGroups} />
    </div>
  );
};
import { 
    Archive,
    BellOff,
    Bookmark,
    ChevronRight,
    EyeOff,
    HeartOff,
    LinkIcon,
    MessageCircle,
    MessageSquareWarning,
    Pin,
    Trash2,
    UserMinus,
    UserX } from "lucide-react";
import type { MenuGroup } from "./ActionMenu";

type ActionHandler=()=>void;

export const getMyPostConfig=(onDelete:ActionHandler,dummyAction:ActionHandler):MenuGroup[] =>[
    [
        {label:'Прикріпити у профіль',icon:Pin,onClick:dummyAction},
        {label:'Хто може відповідати',icon:MessageCircle,onClick:dummyAction}
    ],
    [
        {label:'Архівувати',icon:Archive,onClick:dummyAction},
        {label:'Приховати кількість лайків',icon:HeartOff,onClick:dummyAction}
    ],
    [
        {label:'Видалити',icon:Trash2,isDestructive:true,onClick:onDelete},
        {label:'Копіювати посилання',icon:LinkIcon,onClick:dummyAction}
    ]
];

export const getOtherPostConfig=(dummyAction:ActionHandler):MenuGroup[]=>[
    [
        {label:'Додати в стрічку',icon:ChevronRight,onClick:dummyAction}
    ],
    [
        {label:'Зберегти',icon:Bookmark,onClick:dummyAction},
        {label:'Не цікавить',icon:EyeOff,onClick:dummyAction}
    ],
    [
        { label: 'Вимкнути сповіщення', icon: BellOff, onClick: dummyAction },
        { label: 'Обмежити', icon: UserMinus, onClick: dummyAction },
        { label: 'Заблокувати', icon: UserX, isDestructive: true, onClick: dummyAction },
        { label: 'Поскаржитися', icon: MessageSquareWarning, isDestructive: true, onClick: dummyAction }
    ],
    [
        { label: 'Копіювати посилання', icon: LinkIcon, onClick: dummyAction }
    ]
]
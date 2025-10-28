/**
 * 聊天相关常量数据
 */

// 快捷功能选项
export const QUICK_ACTIONS = [
  { id: 'route', label: '路线规划', icon: '🗺️' },
  { id: 'location', label: '智能找点', icon: '📍' },
  { id: 'image', label: '拍图提问', icon: '📷' },
  { id: 'voice', label: '语音讲解', icon: '🎙️' },
];

// 默认欢迎消息
export const WELCOME_MESSAGE = {
  text: '你好！我是香港浸会大学智能助手。我可以帮你查询图书馆开放时间、校园路线导航、食堂推荐等信息。请问有什么可以帮到你的？',
  type: 'ai',
};

// 每个功能对应的使用引导
export const ACTION_GUIDES = {
  route: {
    title: '关于「路线规划」你可以这么问我：',
    examples: [
      '查询香港浸会大学图书馆位置',
      '香港浸会大学教学楼有哪些？',
    ],
  },
  location: {
    title: '关于「智能找点」你可以这么问我：',
    examples: [
      '查询香港浸会大学图书馆位置',
      '香港浸会大学教学楼有哪些？',
    ],
  },
  image: {
    title: '关于「拍图提问」你可以这么问我：',
    examples: [
      '查询香港浸会大学图书馆位置',
      '香港浸会大学教学楼有哪些？',
    ],
  },
  voice: {
    title: '关于「语音讲解」你可以这么问我：',
    examples: [
      '查询香港浸会大学图书馆位置',
      '香港浸会大学教学楼有哪些？',
    ],
  },
};

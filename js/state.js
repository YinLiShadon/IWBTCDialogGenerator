// 全局应用状态
// 注意：所有变量保持全局可见，与原单文件实现一致

// 对话与消息
let conversations = [];
let currentConversationId = null;

// 角色
let presetRoles = [];
let customRoles = [];
let presetRoleCustomNames = {};

// 自己配置（头像/名称/头衔）
let selfConfig = { name: '我', avatar: '', title: { text: '', color: '#FF6B6B' } };

// 输入区
let selectedFiles = [];
let currentSenderValue = 'self';

// 撤销 / 重做
let deletedMessages = [];
let redoMessages = [];

// 消息选择模式
let messageSelectionMode = false;
let selectedMessages = new Set();

// 文字格式状态
const textFormatState = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    mosaic: false,
    color: null
};

// 颜色选择器状态
let currentPickerColor = '#FFFFFF';
let currentHue = 0;       // 0-360
let currentSat = 0;       // 0-100
let currentVal = 100;     // 0-100
let pickerEventsBound = false;
let svDragging = false;
let hueDragging = false;

// 头衔：模板表 + 全局开关
// key: 'self' / 'preset_<originalName>' / 'custom_<roleId>'
// value: { text, color }
let senderTitles = {};
let titlesEnabled = true;

// 编辑中暂存
let editSelfAvatarData = null;
let editingCustomRoleId = null;
let editCustomRoleAvatarData = null;
let editingPresetRoleOriginalName = null;

// 临时编辑的 title (用于编辑模态框)
let editingTitle = { text: '', color: '#FF6B6B' };

// 移动端触摸时间记录
let lastTouchTime = 0;

// 文件预览缓存（File -> objectURL）
const filePreviewCache = new Map();

// 导出图片状态（exportAspectRatio 初始值在 main.js 中根据 isMobileDevice() 设置）
let exportAspectRatio = '16:9';
let pendingCanvas = null;
let pendingCanvases = [];

// 自定义确认对话框回调
let confirmDialogCallback = null;

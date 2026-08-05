// 全局配置常量

// 预设基础色（赤 棕 橙 黄 绿 青 蓝 紫 粉 白 灰 黑）— 使用真正的颜色
const PRESET_COLORS = ['#FF0000', '#8B4513', '#FFA500', '#FFFF00', '#008000', '#00CED1', '#0000FF', '#800080', '#FF69B4', '#FFFFFF', '#808080', '#000000'];

// 硬编码的角色文件夹与文件清单（作为 fetch 失败时的 fallback）
const PRESET_ROLES_FALLBACK = {
    'IC玩家': ['AikesiX.png'],
    '游戏角色': [
        'Kid.png', '兔兔.png', '冰雪散人.png', '剑客散人.png', '圣诞散人.png',
        '夏日水果.png', '小刺.png', '小机器人.png', '小狼(旧).png', '小狼.png',
        '小草.png', '小鞭炮.png', '幽灵Kid.png', '探险者散人.png', '散人.png',
        '散娘.png', '水果猫.png', '特若.png', '猫耳散人.png', '福散.png',
        '窗花散人.png', '纯色Kid.png', '纯色散人.png', '线条Kid.png', '线条散人.png',
        '蜗牛小G.png', '雪花散人.png'
    ]
};

// 当前版本号（显示在关于/页脚/导出）
const APP_VERSION = '2026.07.22a';

// 游戏英文名（固定）
const GAME_EN_NAME = 'I wanna be the Creator';

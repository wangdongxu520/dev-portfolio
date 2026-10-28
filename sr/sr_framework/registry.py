"""极简注册表（对齐 BasicSR 的 ARCH_REGISTRY / MODEL_REGISTRY 用法）。

用法：
    @ARCH_REGISTRY.register()            # 注册名 = 类名
    @ARCH_REGISTRY.register(suffix='x')  # 注册名 = 类名 + suffix
    ARCH_REGISTRY.build({'type': 'RRDBNet', ...params})   # 配置驱动实例化

build 同时兼容两类对象：
  - 网络类（Arch）：__init__ 接收显式参数 -> 解包 **opt
  - 模型类（Model）：__init__(self, opt) 接收整体配置 -> 传整个 dict
"""


import inspect


class Registry:
    def __init__(self, name):
        self._name = name
        self._obj_map = {}

    def register(self, cls=None, suffix=''):
        def _register(c):
            key = c.__name__ if not suffix else f'{c.__name__}{suffix}'
            self._obj_map[key] = c
            return c

        if cls is not None:
            return _register(cls)
        return _register

    def get(self, key):
        return self._obj_map[key]

    def build(self, opt):
        """配置驱动实例化：从 dict 中取出 type，其余按构造签名传入。"""
        opt = dict(opt)  # 不污染原始配置
        type_name = opt.pop('type')
        cls = self._obj_map[type_name]
        # 模型类首参为 opt（整体配置），网络类为显式参数 -> 解包
        try:
            params = inspect.signature(cls.__init__).parameters
            names = list(params.keys())
            if len(names) >= 2 and names[1] == 'opt':
                return cls(opt)
        except (ValueError, TypeError):
            pass
        return cls(**opt)

    @property
    def names(self):
        return list(self._obj_map.keys())


# 全局注册表
ARCH_REGISTRY = Registry('arch')    # 网络（生成器 / 判别器）
MODEL_REGISTRY = Registry('model')  # 训练 / 推理模型

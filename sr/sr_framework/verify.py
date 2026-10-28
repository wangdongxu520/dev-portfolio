"""合并框架自检：不依赖真实 torch，用桩模块验证「YAML 配置 -> 注册表 -> 正确网络/模型类 -> 构造参数」链路。

证明三仓库已通过 配置驱动 + 注册表 + 继承 正确合并。
真实训练/推理仍需安装 torch 与 pyyaml。
"""
import sys
import os
import types

# 让 sr_framework 作为顶层包可导入（脚本位于 sr/sr_framework/ 下）
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ---------- 极简 torch 桩 ----------
class _Module:
    def __init__(self, *a, **k):
        self._children = []
        self._sd = {}

    def add_module(self, n, m):
        self._children.append(m)

    def modules(self):
        return [self] + self._children

    def to(self, *a, **k):
        return self

    def train(self):
        return self

    def eval(self):
        return self

    def load_state_dict(self, sd, strict=True):
        self._sd = sd

    def state_dict(self):
        return self._sd


class _Param:
    def __init__(self):
        self.data = 0.0


class _Conv2d(_Module):
    def __init__(self, *a, **k):
        super().__init__()
        self.weight = _Param()
        self.bias = None


class _LeakyReLU(_Module):
    pass


class _ReLU(_Module):
    pass


class _PReLU(_Module):
    pass


class _BatchNorm2d(_Module):
    pass


class _PixelShuffle(_Module):
    pass


class _Linear(_Module):
    pass


class _ModuleList(_Module):
    def __init__(self, items=None):
        super().__init__()
        self._items = list(items or [])

    def append(self, m):
        self._items.append(m)


class _Sequential(_Module):
    def __init__(self, *layers):
        super().__init__()
        self._children = list(layers)


_fake_nn = types.ModuleType('torch.nn')
_fake_nn.Module = _Module
_fake_nn.Conv2d = _Conv2d
_fake_nn.LeakyReLU = _LeakyReLU
_fake_nn.ReLU = _ReLU
_fake_nn.PReLU = _PReLU
_fake_nn.BatchNorm2d = _BatchNorm2d
_fake_nn.PixelShuffle = _PixelShuffle
_fake_nn.Linear = _Linear
_fake_nn.ModuleList = _ModuleList
_fake_nn.Sequential = _Sequential
_fake_nn.functional = types.ModuleType('torch.nn.functional')
_fake_nn.functional.interpolate = lambda *a, **k: None
_fake_nn.utils = types.ModuleType('torch.nn.utils')
_fake_nn.utils.spectral_norm = lambda m, **k: m
_fake_nn.init = types.ModuleType('torch.nn.init')
_fake_nn.init.kaiming_normal_ = lambda *a, **k: None

_fake_torch = types.ModuleType('torch')
_fake_torch.nn = _fake_nn
_fake_torch.device = lambda *a, **k: ('cpu', a, k)
_fake_torch.cuda = types.ModuleType('torch.cuda')
_fake_torch.cuda.is_available = lambda: False
_fake_torch.load = lambda p, **k: {'params': {}}
_fake_torch.cat = lambda *a, **k: None
sys.modules['torch'] = _fake_torch
sys.modules['torch.nn'] = _fake_nn
sys.modules['torch.nn.functional'] = _fake_nn.functional
sys.modules['torch.nn.utils'] = _fake_nn.utils
sys.modules['torch.nn.init'] = _fake_nn.init
sys.modules['torch.cuda'] = _fake_torch.cuda


class _NOTGrad:
    def __call__(self, func=None):
        # 同时支持装饰器 @torch.no_grad() 与 with torch.no_grad():
        if func is not None:
            return func
        return self

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


_fake_torch.no_grad = _NOTGrad()

# ---------- 正式验证 ----------
from sr_framework.registry import ARCH_REGISTRY, MODEL_REGISTRY
from sr_framework.archs import RRDBNet, SRVGGNetCompact, UNetDiscriminatorSN, VGGStyleDiscriminator
from sr_framework.models import SRModel, ESRGANModel, RealESRGANModel


def main():
    ok = True
    # 1) 注册表收集
    arch_names = ARCH_REGISTRY.names
    model_names = MODEL_REGISTRY.names
    print('已注册网络:', arch_names)
    print('已注册模型:', model_names)
    for need in ['RRDBNet', 'SRVGGNetCompact', 'UNetDiscriminatorSN', 'VGGStyleDiscriminator']:
        assert need in arch_names, f'缺少网络 {need}'
    for need in ['SRModel', 'ESRGANModel', 'RealESRGANModel']:
        assert need in model_names, f'缺少模型 {need}'

    # 2) 配置驱动构建网络（模拟 YAML 里的 network_g）
    rrdb = ARCH_REGISTRY.build({'type': 'RRDBNet', 'num_in_ch': 3, 'num_out_ch': 3,
                               'scale': 4, 'num_feat': 64, 'num_block': 23, 'num_grow_ch': 32})
    assert isinstance(rrdb, RRDBNet), 'RRDBNet 实例化失败'
    assert rrdb.scale == 4 and rrdb.opt['num_block'] == 23, '构造参数未传入'
    print('✓ RRDBNet 由配置构建，参数生效: scale=%s num_block=%s' % (rrdb.scale, rrdb.opt['num_block']))

    srvgg = ARCH_REGISTRY.build({'type': 'SRVGGNetCompact', 'upscale': 4, 'num_conv': 16, 'act_type': 'prelu'})
    assert isinstance(srvgg, SRVGGNetCompact) and srvgg.upscale == 4, 'SRVGGNetCompact 构建失败'
    print('✓ SRVGGNetCompact 由配置构建: upscale=%s' % srvgg.upscale)

    # 3) 配置驱动构建模型（模拟 YAML 里的 model + network_*）
    esrgan = MODEL_REGISTRY.build({'type': 'ESRGANModel',
                                   'scale': 4, 'network_g': {'type': 'RRDBNet', 'num_in_ch': 3, 'num_out_ch': 3, 'scale': 4, 'num_feat': 64, 'num_block': 23, 'num_grow_ch': 32},
                                   'network_d': {'type': 'UNetDiscriminatorSN', 'num_in_ch': 3, 'num_feat': 64, 'skip_connection': True}})
    assert isinstance(esrgan, ESRGANModel), 'ESRGANModel 构建失败'
    assert isinstance(esrgan.net_g, RRDBNet) and isinstance(esrgan.net_d, UNetDiscriminatorSN), 'net_g/net_d 类型错误'
    print('✓ ESRGANModel 由配置构建（继承 SRModel），net_g=%s net_d=%s' % (esrgan.net_g.__class__.__name__, esrgan.net_d.__class__.__name__))

    realesr = MODEL_REGISTRY.build({'type': 'RealESRGANModel', 'scale': 4,
                                    'network_g': {'type': 'RRDBNet', 'num_in_ch': 3, 'num_out_ch': 3, 'scale': 4, 'num_feat': 64, 'num_block': 23, 'num_grow_ch': 32},
                                    'network_d': {'type': 'UNetDiscriminatorSN', 'num_in_ch': 3, 'num_feat': 64}})
    assert isinstance(realesr, RealESRGANModel), 'RealESRGANModel 构建失败（继承链中断）'
    print('✓ RealESRGANModel 继承链完整（SRModel->ESRGANModel->RealESRGANModel）')

    print('\n所有合并链路校验通过 ✅')
    return ok


if __name__ == '__main__':
    main()

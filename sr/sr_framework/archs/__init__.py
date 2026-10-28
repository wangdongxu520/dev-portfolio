"""导入即注册：保证 ARCH_REGISTRY 在 build 前已收集所有网络。"""
from ..registry import ARCH_REGISTRY
from .rrdbnet_arch import RRDBNet
from .srvgg_arch import SRVGGNetCompact
from .discriminator_arch import UNetDiscriminatorSN, VGGStyleDiscriminator

__all__ = ['ARCH_REGISTRY', 'RRDBNet', 'SRVGGNetCompact',
           'UNetDiscriminatorSN', 'VGGStyleDiscriminator']

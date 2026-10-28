"""SRVGGNetCompact —— 轻量超分网络（realesr-general-x4v3 用）。

合并说明：
  - BasicSR      ：basicsr/archs/srvgg_arch.py（注册名带 suffix='basicsr'）
  - Real-ESRGAN ：realesrgan/archs/srvgg_arch.py（注册名默认 'SRVGGNetCompact'）
二者网络体完全一致，仅注册名不同 → 合并为单一实现，注册名用默认 'SRVGGNetCompact'，
删除 Real-ESRGAN 那份重复文件（sr/Real-ESRGAN 仅作历史参考）。
"""
from torch import nn as nn
from torch.nn import functional as F

from ..registry import ARCH_REGISTRY
from .base_arch import BaseArch


@ARCH_REGISTRY.register()
class SRVGGNetCompact(BaseArch):
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, upscale=4, act_type='prelu'):
        super().__init__(num_in_ch=num_in_ch, num_out_ch=num_out_ch, num_feat=num_feat,
                         num_conv=num_conv, upscale=upscale, act_type=act_type)
        self.upscale = upscale
        self.upsampler = nn.PixelShuffle(upscale)
        self.body = nn.ModuleList()
        self.body.append(nn.Conv2d(num_in_ch, num_feat, 3, 1, 1))
        self.body.append(self._act(act_type, num_feat))
        for _ in range(num_conv):
            self.body.append(nn.Conv2d(num_feat, num_feat, 3, 1, 1))
            self.body.append(self._act(act_type, num_feat))
        self.body.append(nn.Conv2d(num_feat, num_out_ch * upscale * upscale, 3, 1, 1))

    @staticmethod
    def _act(act_type, num_feat):
        if act_type == 'relu':
            return nn.ReLU(inplace=True)
        elif act_type == 'prelu':
            return nn.PReLU(num_parameters=num_feat)
        elif act_type == 'leakyrelu':
            return nn.LeakyReLU(negative_slope=0.1, inplace=True)
        raise ValueError(f'unknown act_type: {act_type}')

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        out = self.upsampler(out)
        base = F.interpolate(x, scale_factor=self.upscale, mode='nearest')
        out += base
        return out

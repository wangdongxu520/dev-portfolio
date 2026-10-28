"""判别器。

合并说明（BasicSR 是超集，Real-ESRGAN 是其子集）：
  - BasicSR 提供 UNetDiscriminatorSN + VGGStyleDiscriminator
  - Real-ESRGAN 只用了 UNetDiscriminatorSN
合并后统一从本文件取，覆盖 GAN / Perceptual 所需判别器。
"""
import torch
from torch import nn as nn
from torch.nn import functional as F

from ..registry import ARCH_REGISTRY
from .base_arch import BaseArch


@ARCH_REGISTRY.register()
class UNetDiscriminatorSN(BaseArch):
    """Spectral-normalized UNet 判别器（Real-ESRGAN 默认 D）。

    输入经 1x1 卷积得到 skip 分支，与最终 logit 相加（原始 Real-ESRGAN 实现）。
    """

    def __init__(self, num_in_ch=3, num_feat=64, skip_connection=True):
        super().__init__(num_in_ch=num_in_ch, num_feat=num_feat, skip_connection=skip_connection)
        norm = spectral_norm
        self.skip_connection = skip_connection
        self.conv0 = nn.Conv2d(num_in_ch, num_feat, 3, 1, 1)
        self.conv1 = norm(nn.Conv2d(num_feat, num_feat, 4, 2, 1))
        self.conv2 = norm(nn.Conv2d(num_feat, num_feat * 2, 4, 2, 1))
        self.conv3 = norm(nn.Conv2d(num_feat * 2, num_feat * 4, 4, 2, 1))
        self.conv4 = norm(nn.Conv2d(num_feat * 4, num_feat * 8, 4, 2, 1))
        self.conv5 = norm(nn.Conv2d(num_feat * 8, num_feat * 8, 4, 2, 1))
        self.conv_last = norm(nn.Conv2d(num_feat * 8, 1, 4, 1, 0))
        self.act = nn.LeakyReLU(negative_slope=0.2, inplace=True)
        if skip_connection:
            self.conv1x1 = nn.Conv2d(num_in_ch, num_feat, 1, 1, 0)

    def forward(self, x):
        x = self.act(self.conv0(x))
        x = self.act(self.conv1(x))
        x = self.act(self.conv2(x))
        x = self.act(self.conv3(x))
        x = self.act(self.conv4(x))
        x = self.act(self.conv5(x))
        out = self.conv_last(x)
        if self.skip_connection:
            out = out + self.conv1x1(x)  # skip：输入经 1x1 卷积后的分支
        return out


@ARCH_REGISTRY.register()
class VGGStyleDiscriminator(BaseArch):
    """VGG 风格判别器（SRGAN / ESRGAN 早期用，BasicSR 提供）。"""

    def __init__(self, num_in_ch=3, num_feat=64, input_size=128):
        super().__init__(num_in_ch=num_in_ch, num_feat=num_feat, input_size=input_size)
        assert input_size in (128, 256)
        self.input_size = input_size
        self.conv0_0 = nn.Conv2d(num_in_ch, num_feat, 3, 1, 1, bias=True)
        self.conv0_1 = nn.Conv2d(num_feat, num_feat, 4, 2, 1, bias=False)
        self.bn0_1 = nn.BatchNorm2d(num_feat, affine=True)
        self.conv1_0 = nn.Conv2d(num_feat, num_feat * 2, 3, 1, 1, bias=False)
        self.bn1_0 = nn.BatchNorm2d(num_feat * 2, affine=True)
        self.conv1_1 = nn.Conv2d(num_feat * 2, num_feat * 2, 4, 2, 1, bias=False)
        self.bn1_1 = nn.BatchNorm2d(num_feat * 2, affine=True)
        self.conv2_0 = nn.Conv2d(num_feat * 2, num_feat * 4, 3, 1, 1, bias=False)
        self.bn2_0 = nn.BatchNorm2d(num_feat * 4, affine=True)
        self.conv2_1 = nn.Conv2d(num_feat * 4, num_feat * 4, 4, 2, 1, bias=False)
        self.bn2_1 = nn.BatchNorm2d(num_feat * 4, affine=True)
        self.conv3_0 = nn.Conv2d(num_feat * 4, num_feat * 8, 3, 1, 1, bias=False)
        self.bn3_0 = nn.BatchNorm2d(num_feat * 8, affine=True)
        self.conv3_1 = nn.Conv2d(num_feat * 8, num_feat * 8, 4, 2, 1, bias=False)
        self.bn3_1 = nn.BatchNorm2d(num_feat * 8, affine=True)
        self.conv4_0 = nn.Conv2d(num_feat * 8, num_feat * 8, 3, 1, 1, bias=False)
        self.bn4_0 = nn.BatchNorm2d(num_feat * 8, affine=True)
        self.conv4_1 = nn.Conv2d(num_feat * 8, num_feat * 8, 4, 2, 1, bias=False)
        self.bn4_1 = nn.BatchNorm2d(num_feat * 8, affine=True)
        self.linear1 = nn.Linear(num_feat * 8 * 4 * 4, num_feat * 8, bias=False) if input_size == 128 \
            else nn.Linear(num_feat * 8 * 8 * 8, num_feat * 8, bias=False)
        self.linear2 = nn.Linear(num_feat * 8, 1, bias=False)
        self.act = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        x = self.act(self.conv0_0(x))
        x = self.act(self.bn0_1(self.conv0_1(x)))
        x = self.act(self.bn1_0(self.conv1_0(x)))
        x = self.act(self.bn1_1(self.conv1_1(x)))
        x = self.act(self.bn2_0(self.conv2_0(x)))
        x = self.act(self.bn2_1(self.conv2_1(x)))
        x = self.act(self.bn3_0(self.conv3_0(x)))
        x = self.act(self.bn3_1(self.conv3_1(x)))
        x = self.act(self.bn4_0(self.conv4_0(x)))
        x = self.act(self.bn4_1(self.conv4_1(x)))
        x = x.view(x.size(0), -1)
        x = self.act(self.linear1(x))
        x = self.linear2(x)
        return x


def spectral_norm(module, mode=True):
    if not mode:
        return module
    try:
        return torch.nn.utils.spectral_norm(module)
    except Exception:
        return module

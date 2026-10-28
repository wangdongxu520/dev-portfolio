"""ESRGAN 模型：在 SRModel 基础上增加判别器 + 对抗/感知损失。

对应 ESRGAN 原始仓库（GAN）与 BasicSR SRGANModel；Real-ESRGAN 在其之上再叠加退化。
继承关系：SRModel -> ESRGANModel -> RealESRGANModel。
"""
import torch
from torch import nn as nn

from ..registry import MODEL_REGISTRY
from .sr_model import SRModel


@MODEL_REGISTRY.register()
class ESRGANModel(SRModel):
    def __init__(self, opt):
        super().__init__(opt)
        self._build_net_d()  # 判别器也走配置：opt['network_d']
        self.net_g.train()
        if self.net_d is not None:
            self.net_d.train()

    def optimize_parameters(self, current_iter):
        # 真实实现：G 生成 -> D 判别 -> 计算 gan + perceptual + pixel 损失 -> 反向
        # 这里仅给出骨架，强调「继承 + 配置驱动」的合并方式
        raise NotImplementedError('ESRGANModel.optimize_parameters 需实现 G/D 对抗与感知损失')

    @torch.no_grad()
    def test(self):
        self.net_g.eval()
        self.output = self.net_g(self.lq)

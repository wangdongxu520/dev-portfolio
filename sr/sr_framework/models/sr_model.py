"""纯超分模型（无 GAN）：对应 ESRGAN 原始仓库的 test.py / BasicSR SRModel。"""
import torch
from torch import nn as nn

from ..registry import MODEL_REGISTRY
from .base_model import BaseModel


@MODEL_REGISTRY.register()
class SRModel(BaseModel):
    def __init__(self, opt):
        super().__init__(opt)
        self._build_net_g()

    def feed_data(self, data):
        self.lq = data['lq'].to(self.device)
        self.gt = data.get('gt')
        if self.gt is not None:
            self.gt = self.gt.to(self.device)

    @torch.no_grad()
    def test(self):
        self.net_g.eval()
        self.output = self.net_g(self.lq)

    def optimize_parameters(self, current_iter):
        # 子类（如 ESRGANModel）重写；纯 SR 至少要有 L1/L2 监督
        raise NotImplementedError('SRModel.optimize_parameters 需子类实现损失与优化器')

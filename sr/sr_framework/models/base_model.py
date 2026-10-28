"""模型基类。

合并思路：三个仓库各自写了一份训练/推理脚本（ESRGAN/test.py、Real-ESRGAN/train.py …），
网络构建、feed_data、save/load 全是重复样板。统一到 BaseModel 后：
  - 网络由 opt['network_g'] / opt['network_d'] 经注册表自动构建（配置驱动）
  - feed_data / test / save / load 公共逻辑只写一次
  - 具体模型（SR / ESRGAN / RealESRGAN）继承后只补自己的优化/损失逻辑
"""
import os

import torch
from torch import nn as nn

from ..registry import MODEL_REGISTRY, ARCH_REGISTRY


class BaseModel:
    def __init__(self, opt):
        self.opt = opt
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.scale = opt.get('scale', 4)
        self.net_g = None
        self.net_d = None
        self.optimizers = []
        self.log_dict = {}

    # —— 网络构建（配置驱动）——
    def _build_net_g(self):
        net_opt = dict(self.opt['network_g'])
        self.net_g = ARCH_REGISTRY.build(net_opt).to(self.device)

    def _build_net_d(self):
        if 'network_d' in self.opt:
            net_opt = dict(self.opt['network_d'])
            self.net_d = ARCH_REGISTRY.build(net_opt).to(self.device)

    # —— 公共数据 / 推理接口 ——
    def feed_data(self, data):
        self.data = data

    def test(self):
        raise NotImplementedError

    def optimize_parameters(self, current_iter):
        raise NotImplementedError

    # —— 公共权重存取 ——
    def load_network(self, net, load_path, strict=True):
        if not load_path:
            return
        ckpt = torch.load(load_path, map_location='cpu')
        state = ckpt.get('params', ckpt)
        net.load_state_dict(state, strict=strict)

    def save_network(self, net, net_label, iter_label):
        torch.save({'params': net.state_dict()}, f'{net_label}_{iter_label}.pth')

    def get_current_log(self):
        return self.log_dict

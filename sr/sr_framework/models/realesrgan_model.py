"""RealESRGAN 模型：在 ESRGANModel 基础上增加真实退化建模。

对应 xinntao/Real-ESRGAN 的退化 pipeline（模糊/下采样/噪声/压缩），用于训练数据合成。
继承关系：SRModel -> ESRGANModel -> RealESRGANModel。
"""
import torch
from torch import nn as nn

from ..registry import MODEL_REGISTRY
from .esrgan_model import ESRGANModel


@MODEL_REGISTRY.register()
class RealESRGANModel(ESRGANModel):
    def __init__(self, opt):
        super().__init__(opt)
        # 真实退化建模（模糊核 / resize / 噪声 / JPEG）由 opt['degradation'] 配置
        self.degradation_opt = opt.get('degradation', {})

    def synthesize_lq(self, gt):
        """按配置退化生成 LQ，是 Real-ESRGAN 相对 ESRGAN 的关键增量。"""
        # 真实实现调用 basicsr 的 circular_lowpass_kernel / random_mixed_kernels
        # 此处给出接口占位，强调「在父类基础上只加差异部分」
        return gt

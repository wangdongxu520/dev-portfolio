"""所有网络的基类。

合并思路：三个仓库里 RRDBNet / SRVGGNet / Discriminator 都各自重复了一堆
torch.nn 样板代码。统一到 BaseArch 后，子类只写自己的结构与 forward，
公共初始化（设备搬运、权重初始化入口）交给基类。
"""
import torch
from torch import nn as nn


class BaseArch(nn.Module):
    def __init__(self, **kwargs):
        super().__init__()
        self.opt = kwargs  # 记录构造参数，便于 save/print

    def init_weights(self, scale=1):
        """默认 Kaiming 初始化，子类可按需在 __init__ 末尾调用。"""
        default_init_weights(self.modules(), scale=scale)

    def to(self, *args, **kwargs):
        return super().to(*args, **kwargs)

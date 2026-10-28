"""导入即注册。"""
from ..registry import MODEL_REGISTRY
from .base_model import BaseModel
from .sr_model import SRModel
from .esrgan_model import ESRGANModel
from .realesrgan_model import RealESRGANModel

__all__ = ['MODEL_REGISTRY', 'BaseModel', 'SRModel', 'ESRGANModel', 'RealESRGANModel']

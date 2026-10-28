"""训练入口：读取 YAML，经注册表构建模型，开始训练。

合并后的统一入口——无论 SR / ESRGAN / RealESRGAN，都走同一个 train.py，
区别只在 YAML 里 model 与 network_* 的 type 与参数（配置驱动）。
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import yaml

from sr_framework.models import MODEL_REGISTRY


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-opt', type=str, required=True, help='训练配置 YAML')
    args = parser.parse_args()

    with open(args.opt, 'r', encoding='utf-8') as f:
        opt = yaml.safe_load(f)

    model_type = opt['model']
    model = MODEL_REGISTRY.build({'type': model_type, **{k: v for k, v in opt.items() if k != 'model'}})
    print(f'[train] model = {model_type}  -> 实例: {model.__class__.__name__}')
    print(f'[train] network_g = {opt["network_g"]["type"]}  ->  {model.net_g.__class__.__name__}')
    if model.net_d is not None:
        print(f'[train] network_d = {opt["network_d"]["type"]}  ->  {model.net_d.__class__.__name__}')
    # 实际训练循环在此扩展（data loader / loss / optimizer / iteration）


if __name__ == '__main__':
    main()

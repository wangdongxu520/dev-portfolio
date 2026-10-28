"""推理入口：读取 YAML 构建模型，加载权重，对单图/目录超分。

与 train.py 同理，统一入口 + 配置驱动。
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import yaml

from sr_framework.models import MODEL_REGISTRY


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-opt', type=str, required=True, help='推理配置 YAML')
    parser.add_argument('-i', type=str, default='inputs', help='输入图像或目录')
    parser.add_argument('-o', type=str, default='results', help='输出目录')
    parser.add_argument('--load_path', type=str, default=None, help='生成器权重 .pth')
    args = parser.parse_args()

    with open(args.opt, 'r', encoding='utf-8') as f:
        opt = yaml.safe_load(f)

    model = MODEL_REGISTRY.build({'type': opt['model'], **{k: v for k, v in opt.items() if k != 'model'}})
    if args.load_path:
        model.load_network(model.net_g, args.load_path)
    print(f'[infer] 已构建 {model.__class__.__name__}（net_g={model.net_g.__class__.__name__}）')
    print(f'[infer] 输入: {args.i}  输出: {args.o}  （实际推理循环在此扩展）')


if __name__ == '__main__':
    main()

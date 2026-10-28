"""网络公共工具（取自 BasicSR，合并后单一来源）。"""
import torch


def default_init_weights(module_list, scale=1, bias_fill=0, mean=0, std=0.01):
    if not isinstance(module_list, list):
        module_list = [module_list]
    for module in module_list:
        for m in module.modules():
            if isinstance(m, torch.nn.Conv2d):
                torch.nn.init.kaiming_normal_(m.weight, a=0, mode='fan_in', nonlinearity='relu')
                m.weight.data *= scale
                if m.bias is not None:
                    m.bias.data.fill_(bias_fill)
            elif isinstance(m, torch.nn.Linear):
                torch.nn.init.kaiming_normal_(m.weight, a=0, mode='fan_in', nonlinearity='relu')
                m.weight.data *= scale
                if m.bias is not None:
                    m.bias.data.fill_(bias_fill)


def make_layer(basic_block, num_basic_block, **kwarg):
    layers = []
    for _ in range(num_basic_block):
        layers.append(basic_block(**kwarg))
    return torch.nn.Sequential(*layers)


def pixel_unshuffle(x, scale):
    b, c, hh, ww = x.size()
    out_channel = c * (scale ** 2)
    assert hh % scale == 0 and ww % scale == 0
    h = hh // scale
    w = ww // scale
    x_view = x.view(b, c, h, scale, w, scale)
    return x_view.permute(0, 1, 3, 5, 2, 4).contiguous().view(b, out_channel, h, w)

#!/usr/bin/python3
from bcc import BPF

b = BPF(src_file="xdp_sample.bpf.c")

fx = b.load_func("ping", BPF.XDP)
b.attach_xdp("eth0", fx, 0)
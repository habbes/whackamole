

## eBPF setup

### Resources
- [Learning eBPF](https://www.oreilly.com/library/view/learning-ebpf/9781098135119/) book by Liz Rice
- [Repository of sample code from the book](https://github.com/lizrice/learning-ebpf)
- [eBPF website](https://ebpf.io/)
- [BPF Compiler Collection (BCC)](https://github.com/iovisor/bcc)

### Setting up development environment

You can follow the instructions from Liz Rice's [sample code repository](https://github.com/lizrice/learning-ebpf)

Alternatively you can install the tools manually.
- Install BCC (needed to run the Python examples). [Find instructions for your OS](https://github.com/iovisor/bcc/blob/master/INSTALL.md)
- Install `clang` compiler or [LLVM](https://llvm.org/)
- Install [`libbpf`](https://github.com/libbpf/libbpf) (needed to compile the C examples)

I went with the following options for my local setup:
- Install Ubuntu Desktop 22.04 on a virtual machine (using VMWare Workstation Player)
- Installed bcc tools using: `sudo apt-get install bpfcc-tools linux-headers-$(uname -r)`
    - Note: The bcc install instructions for Ubuntu warn that packages may be out of date and you should build from source to get the most up-to-date version. But I wasted a lot of time debugging compiler errors when I built from source that I prefered to risk it with the package manager.
- Installed clang using: `sudo apt install clang` (probably redundant since I also installed llvm)
- Installed llvm using `sudp apt install llvm`
- Installed libbpf using `sudo apt install libbpf-dev`
    - If building from source instead of a package manager, may also need to install `libelf-dev` and/or other dependencies
- Installed `bpftool` by building from source:
    - Cloned the repo in my home directory: `git clone --recurse-submodules https://github.com/libbpf/bpftool.git`
    - Then `cd bpftool/src`
    - Then `make install`

## agent and whackamole setup

Create virtual environment:

```
python3 -m venv .venv
```

Activate the virtual environment:

```
source .venv/bin/activate
```

Install dependencies:

```
pip install -r requirements.txt
```

## Run the agent as root

Run the agent as a server. The `agent.py` needs elevated priveleges
because it interacts with eBPF (and possibly other system resources)

```
sudo python3 agent.py
```

This will listen to requests on port 6700


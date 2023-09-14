#!/usr/bin/python
from bcc import BPF, ct
from time import sleep

program = r"""
// BCC macro to create a hash table map
BPF_HASH(comm_table);


int network_filter(void *ctx)
{
    u64 flag_index = 0;
    u64 should_drop_packet = 0;
    u64 *p_value;


    // BCC lets use convenient syntax like method calls
    // that do not exist in C proper
    // lookups find the value with key flag_index and
    // returns a pointer to the value
    p_value = comm_table.lookup(&flag_index);

    if (p_value != 0) {
        should_drop_packet = *p_value;
    }
    
    if (should_drop_packet > 0) {
        return XDP_DROP;
    }

    return XDP_PASS;
}
"""

b = BPF(text=program)

xdp = b.load_func("network_filter", BPF.XDP)
comm_table = b["comm_table"]


class Controller:
    def __init__(self, xdp_prog, xdp_map):
        self.attached_interfaces = set()
        self.xdp_prog = xdp_prog
        self.xdp_map = xdp_map
    
    def attach_to_inteface(self, interface):
        self.attached_interfaces.add(interface)
        BPF.attach_xdp(interface, self.xdp_prog)
    
    def drop_packets(self, interface):
        if interface not in self.attached_interfaces:
            self.attach_to_inteface(interface)

        self.xdp_map[ct.c_int(0)] = ct.c_int(1)
    
    def resume_packets(self, interface):
        if interface not in self.attached_interfaces:
            self.attach_to_inteface(interface)

        self.xdp_map[ct.c_int(0)] = ct.c_int(0)


controller = Controller(xdp, comm_table)


class CommandHandler:
    def __init__(self, controller: Controller):
        self.controller = controller
    
    def handle_command(self, command, args):
        if command == 'drop_packets':
            self.drop_packets(*args)
        elif command == 'resume_packets':
            self.resume_packets(*args)
        else:
            raise Exception("Unknown command")

    def drop_packets(self, interface):
        self.controller.drop_packets(interface)
    
    def resume_packets(self, interface):
        self.controller.resume_packets(interface)


handler = CommandHandler(controller)

while True:
    raw_command = input("> ")
    parts = raw_command.split()
    command, args = parts[0], parts[1:]
    if command == 'exit':
        break

    handler.handle_command(command, args)
    # try:
    #     handler.handle_command(command, args)
    # except Exception as e:
    #     print("Error occured:", e)
        





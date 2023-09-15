import requests
import json
import time
import psutil

class Whackamole():
    def __init__(self, agent_url: str='http://localhost:6700'):
        self.agent = Agent(agent_url)
    
    def network(self, interface: str):
        return NetInterface(self, interface)

    def process(self, pid=None, port=None):
        return Process(self, pid=pid, port=port)


class Process():
    def __init__(self, wm: Whackamole, pid=None, port=None):
        self.wm = wm
        self.pid = pid
        self.port = port

        if self.pid is None and self.port is None:
            raise Exception("You need to provide either the pid or port")
        
        self.try_to_get_pid()
        
    def kill(self):
        self.try_to_get_pid()
        if self.pid is None:
            raise Exception("pid required to terminate the process")
        self.wm.agent.kill_process(self.pid)
    
    def try_to_get_pid(self):
        if self.pid is None:
            self.pid = find_pid_by_port(self.port)

    

class NetInterface():
    def __init__(self, wm: Whackamole, name: str):
        self.wm = wm
        self.name = name
    
    def drop_packets(self, duration=None):
        self.wm.agent.drop_packets(self.name)
        if duration is not None:
            time.sleep(duration)
            self.resume_packets()
    
    def resume_packets(self):
        self.wm.agent.resume_packets(self.name)


class Agent():
    def __init__(self, url: str):
        self.url = url
    
    def drop_packets(self, interface: str):
        self.make_post('drop_packets', {
            'interface': interface
        })
    
    def resume_packets(self, interface: str):
        self.make_post('resume_packets', {
            'interface': interface
        })
    
    def kill_process(self, pid):
        self.make_post('kill_process', {
            'pid': pid
        })
    
    def make_post(self, endpoint: str, data):
        headers = {'Content-Type': 'application/json'}
        url = f"{self.url}/{endpoint}"

        response = requests.post(url, json=data)

        if response.status_code == 400:
            response_data = response.json()
            raise Exception(response_data['error'])
        elif response.status_code != 200:
            raise Exception(response.text)
        
        return response.json()

def find_pid_by_port(port):
    for conn in psutil.net_connections(kind='inet'):
        if conn.laddr.port == port:
            return conn.pid
    
    return None
# Sample scenario test

In the sample, we are going to test whether nginx successfully detects that a node
is unhealthy (based on our configuration) and stop sending requests to that node
for a period of time to give it time to recover.

## Start web servers

Start web servers on ports 3000 and 3001

```sh
node server 3000 Server1
```

```bash
node server 3001 Server2
```

## Start proxies

Proxy 1 with the following configuration
- listens to web requests on port 5000
- listens to controller commands on port 8000
- forwards requests to Server1 on localhost:3000

```sh
cd .. # move to project root
node proxy 5000 8000 localhost:3000
```

Proxy 2 with the following configuration:
- listens to web requests on port 5001
- listens to controller commands on port 8001
- forwards requests to Server2 on localhost:3001

```sh
cd .. # move to project root
node proxy 5001 8001 localhost:3001
```

## Configure nginx reverse proxy and load balance

This scenario assumes you have nginx server running (on port 80)
and it sends requests to Server1 and Server2 through the proxies.
Nginx is configured to detect when a node is slow or timing out,
and remove it from the load balancing pool for 30s.

Here's sample configuration to achieve that (e.g. put it in `/etc/nginx/nginx.conf`)

```nginx
events {}

http {
    upstream backend {
        server localhost:5000 max_fails=2 fail_timeout=30s;
        server localhost:5001 max_fails=2 fail_timeout=30s;
    }

    server {
       listen 80;


       location / {
           proxy_pass http://backend;
           proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
           proxy_connect_timeout 1s;
           proxy_send_timeout 2s;
           proxy_read_timeout 2s;
       }
    }
}

```

Verify that the config is valid:

```sh
sudo nginx -t
```

Don't forget to restart nginx to activate the config:

```sh
sudo systemctl restart nginx
```

Make requests to the nginx. Based on the responses we can
see that it's using a round-robin approach to distributed
requests to the two backend servers:

```sh
$ curl http://localhost
Hello World from server 'Server1'
$ curl http://localhost
Hello World from server 'Server2'
$ curl http://localhost
Hello World from server 'Server1'
$ curl http://localhost
Hello World from server 'Server2'
```

## Start the controller and connect to the two proxies

```sh
cd .. // move to project root

node controller
```

Here's a sample session that demonstrates
how to use the controller to delay responses from Server1 by 3s. This
delay rule will be put in effect for a period of 30s after which
it will be removed and responses will be back to normal.

```
> connect node1 localhost:8000
> delay node1 30 3
```

Now, let's make multiple requests. Since we've configured Nginx to
mark the node as unhealthy if it times out twice, let's make at least 4 requests
to `http://localhost`.

```sh
$ curl http://localhost
Hello World from server 'Server1'
$ curl http://localhost
Hello World from server 'Server2'
$ curl http://localhost
Hello World from server 'Server1'
$ curl http://localhost
Hello World from server 'Server2'
```

After those 4 requests, it should stop sending requests to Server1. So all responses
should come from Server 2:

```sh
$ curl http://localhost
Hello World from server 'Server2'
$ curl http://localhost
Hello World from server 'Server2'
$ curl http://localhost
Hello World from server 'Server2'
$ curl http://localhost
Hello World from server 'Server2'
```

After about a minute. Things should go back to normal and you should be able to see responses
from both servers.

```sh
$ curl http://localhost
Hello World from server 'Server1'
$ curl http://localhost
Hello World from server 'Server2'
$ curl http://localhost
Hello World from server 'Server1'
$ curl http://localhost
Hello World from server 'Server2'
```
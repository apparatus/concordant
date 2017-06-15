# Concordant
Concordant is a DNS resolver module for those involved in microservice development. For best results concordant should be used with the Fuge microservice shell and Kubernetes.

If you're using this module, and need help, you can:

- Post a [github issue][https://github.com/apparatus/concordant/issues],
- Reach out on twitter to @pelger

## Install
To install Concordant use npm:

```sh
$ npm install --save concordant
```

## Overview
Service discovery is a key problem to address when developing a microservice system. Typically there will be many services and pieces of infrastructure such as databases and queueing systems that need to be located and consumed. Usually the local development topology will be significantly different from the production environment which will be different again from any QA or staging environment.

The traditional approach to solving these issues is to supply a configuration file and to use this to connect services with well known port numbers.

Concordant takes a different approach. When a specific environment variable is set (DNS_HOST) concordant will perform service discovery lookups against this host directly. If not defined it will use the system configured DNS resolution. This is useful because it means that we can run a simple DNS server in development that mimics how our production environment behaves. This significantly reduces configuration overhead and friction.

Concordant performs DNS based SRV and A record lookups in order to determine the port number and IP address for a given service. It uses the following simple algorithm:

* if the environment variable DNS_HOST is set then perform lookups directly against this host
* otherwise use the system DNS configuration to perform lookups
* For each lookup first perform an SRV query to obtain a port number and CNAME record
* To complete the lookup perform an A query against the CNAME record to determine an IP address

## Kubernetes DNS and Fuge
Kubernetes supplies DNS records of the following form for service discovery:

* SRV `_my-port-name._my-port-protocol.my-svc.my-namespace.svc.cluster.local`
* A `my-svc.my-namespace.svc.cluster.local`

So a consumer of a service need only know the service and port name in order to discover a service within a given namespace. Concordant will perform these queries. For example, given that we have a redis container in our system with service name `redis` and port name `main` in namespace `mynamespace`, we can use concordant as follows:

```javascript
var redis = require('redis')
var concordant = require('concordant')()

concordant.dns.resolve('_main._tcp.redis.mynamespace.svc.cluster.local', function (err, results) {
  if (err) { return cb(err) }
    var client = redis.createClient({host: results[0].host, port: results[0].port})    

    // do stuff with redis...

  })
})
```

The fuge development shell will supply the exact same DNS records. Code that uses concordant for discovery will run unchanged in a development or production environment. i.e. the above sample will run unchanged in the Fuge development shell and within a Kubernetes environment.

## Usage
Require the module and call `dns.resolve`. Callback contains an array of results or err. Results in the form:

```javascript
[{host: '1.2.3.4', port: 1234},
 {host: '1.2.3.5', port: 1235}]
```

Example:

```javascript
var concordant = require('concordant')()

concordant.dns.resolve('full.service.domain.name', function (err, results) {
  if (err) { return cb(err) }

    // connect to results[0].host results[0].port and do stuff...

  })
})
```

## Environment Variables
Concordant uses the following environment variables:

* DNS_HOST - the DNS host to perform lookup against. If not set use the system supplied DNS configuration
* DNS_PORT - the DNS port to use. Defaults to 50353 if DNS_HOST is set, otherwise uses the system supplied DNS configuration


## Contributing
The [apparatus team][] encourage open participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in touch.

## License
Copyright the apparatus team 2016, Licensed under [MIT][].

[MIT]: ./LICENSE
[github issue]: https://github.com/apparatus/concordant/issues/new
[apparatus team]: https://github.com/apparatus

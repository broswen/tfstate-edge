# Serverless Terraform HTTP Backend

This project is a fully serverless [Terraform HTTP Backend](https://www.terraform.io/language/settings/backends/http) created with Cloudflare Workers, KV, Durable Objects, and R2.


![diagram](./tfstate-edge.drawio.png)

### Usage
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/broswen/tfstate-edge)

Manually create a user by adding a JSON document in the KVNamespace bound to `KEYS`. The key is the username and the value is a JSON document describing the user information.
```json
{
  "username": "username",
  "password": "password",
  "projects": ["project-name"]
}
```

Configure Terraform to use an HTTP backend with the configured username and password. The backend address is the worker hostname with the project name as the path.
```hcl
terraform {
  backend "http" {
    address = "https://my-subdomain.workers.dev/project-name"
    lock_address = "https://my-subdomain.workers.dev/project-name"
    unlock_address = "https://my-subdomain.workers.dev/project-name"
    username = "username"
    password = "password"
  }
}
```

### Development

```shell
# Install dependencies
$ yarn install
# Start local development server with live reload
$ yarn dev
# Run tests
$ yarn test
# Run code linting
$ yarn lint
# Update packages
$ yarn update-interactive
```

### TODO
- [ ] fix tests when Miniflare supports R2
- [x] project scoped permissions

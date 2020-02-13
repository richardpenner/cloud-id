# cloud-id
`cloud-id` is a simple CLI utility to lookup cloud providers. It currently supports Amazon AWS, Google Cloud Platform and Microsoft Azure. PRs welcome.

`cloud-id` downloads the latest IP ranges from Amazon, Google and Microsoft. This data is not cached locally, so batch looks (via the file command) are more efficient.

Installation:
```
npm install -g cloud-id
```
Usage:
```
cloud-id <command>

Commands:
  cloud-id file <filename>  lookup hosts in specified file
  cloud-id host <hostname>  lookup specified hostname

Options:
  --help     Show help
  --json     Formats output as json
  --csv      Formats the output as CSV
  --human    Format the output for human reading (tabs)
  --version  Show version number
  ```

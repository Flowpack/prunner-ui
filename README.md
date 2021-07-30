# Pipeline Runner - UI

**An embeddable task / pipeline runner with a HTTP API.**

**For a full introduction, see the [README of the prunner repo](https://github.com/Flowpack/prunner)**.

## Components

### [prunner](https://github.com/Flowpack/prunner)

A single process, written in go, that provides the REST API, pipeline runner and persistence.
It needs to be started in the background for integration into other applications.

### [prunner-ui](https://github.com/Flowpack/prunner-ui) (this repository)

A minimalistic React UI to start and view pipelines, jobs and task details.

### [Flowpack.Prunner](https://github.com/Flowpack/Flowpack.Prunner)

A Neos/Flow PHP package providing a backend module for the current pipeline state, and a PHP API.

## Development

### Requirements

* Node.js (>= 12)
* Yarn

### Running locally

```bash
yarn install
SNOWPACK_PUBLIC_API_AUTH_TOKEN=[Example JWT token] yarn start
```

The UI should now be accessible at http://localhost:8080/.

### Building for prod

```bash
yarn install
yarn build
```

## License

MIT - see [LICENSE](LICENSE).
# UCSC Selector

UCSC Genome Browser selector chrome extension

### Install

```sh
npm i
npm run build
```

Then, add it in `chrome://extensions`



### Build & Development

The extension popup is built with React, and requires rebuilding when the code
changes.

```sh
npm run build
```

During development, it is convenient to let this command run: 

```sh
nodemon -w src --exec 'npm run build'
```

(will rebuild everytime the front-end changes. Requires nodemon, installable
through `npm i -g nodemon`)


### Other

Chrome might complaing about the extension containing `.pem` files, but those
are really just test files contained in node_modules. Remove that warning by
running `find -name '*.pem' | xargs -I {} rm {}`.

# Development

```bash
1. npm install
2. npm run build:dev
3. cd dist && yarn link

// might want to remove existing yarn link globally beforehand
rm -rf ~/.config/yarn/link/ng-universal
```

```bash
// application project
1. yarn link @ynnck/ng-universal
2. yarn
```


- package.json is needed in dist
- node_modules inside dist folder are being installed by application project's yarn install


# Publish
```bash
// needs to be logged in
npm login
cd dist && npm publish
```

# angularbknd-sdk
Backand SDK for Angular

Install:
`npm install`
`bower install`

Build:
`grunt`

Register on bower (only once at first time - done):  
`bower register angularbknd-sdk https://github.com/backand/angularbknd-sdk.git`

To upgrade version:

1. Update the code of `backand.js`
2. Update the `bower.json` version
  * Check dependencies versions, if need to be upgraded
  * minor releases for bug fixes
  * major releases for changes in the API signature
3. Update the `package.json` version
4. Run `grunt` to build the min files
5. Update Changelog with the new release changes
6. Commit your changes `git commit -am "Made some awesome new changes, now its even awesome"`
7. Tag the commit `git tag -a 1.6.1 -m "Release version 1.6.1"`
8. Push to GitHub `git push origin master --tags`. To delete existing tag `git tag -d 1.6.1` and clear bower cache.
9. Create new folder in S3 bucket with the name of the version and upload the 2 files
10. Update documentation to point to the new release

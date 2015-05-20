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
<ol>
<li>Update the code of backand.js</li>
<li>Update the bower.json version</li>
  * Check dependencies versions, if need to be upgraded
  * minor releases for bug fixes
  * major releases for changes in the API signature
<li>Update the package.json version</li>
<li>Commit your changes
<p>`git commit -am "Made some awesome new changes, now its even awesomer"`<p>
</li>
<li>Tag the commit
<p>`git tag -a v0.0.2 -m "Release version 0.0.2"`</p>
</li>
<li>Push to GitHub
<p>`git push origin master --tags`</p>
</li>
</ol>

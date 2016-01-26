# cocoon-sdk

The Cocoon SDK is the easiest way to integrate your app with the Cocoon Cloud Compiler. It enables authentication with Cocoon credentials and allows to create, update and compile HTML5 projects in the cloud programmatically.

##Setup your project

You need to create a ClientID in order to use this SDK with your application.

##Usage

Include the [`CocoonSDK library`](dist/cocoon.sdk.js) in your Web Application or NodeJS application

```
<script src="scripts/cocoon.sdk.js"></script>
```

Initialize the APIClient

```js
var client = new CocoonSDK.APIClient({clientId:"MY_CLIENT_ID"});
```

Log In into Cocoon

```js
client.logIn({}, function(token, error) {
    if (error) {
        alert("Error: " + JSON.stringify(error));
        return
    }
    loginSucceeded();
});
```

Some API Examples

```js
//list all projects
client.project.list(function(projects, error){

});


//Create a new project by uploading a zip file
client.project.createFromZipUpload(file, function(project, error) {

});

//Create a new project from a repository
client.project.createFromRepository({url:"MY_GITHUB_URL"}, function(project, error) {

});

//Create a new project from a public zip url
client.project.createFromPublicZip("PUBLIC_ZIP_URL", function(project, error) {

});

//Fetch or save the project Config XML
project.getConfigXml(function(xml, error) {

}
project.putConfigXml(textarea.value, function(error) {

});

//Compile project
project.compile(function(error){

});

//Compile DeveloperApp
project.compileDevApp(function(error){

});

//Check if a project is compiling
project.isCompiling();

//Get download link for a platform 
project.getDownloadLink('ios');

//Get project compilations data
for (var i = 0; i < project.compilations.length; ++i) {
    var compilation = project.compilations[o];
    console.log(compilation.platform);
    console.log(compilation.getStatus());
    (...)
}

//Upload a new zip for a project
project.uploadZip(file, function(error){

})

//Refresh compilation status changes
project.refreshUntilCompleted(function(completed){

});

```


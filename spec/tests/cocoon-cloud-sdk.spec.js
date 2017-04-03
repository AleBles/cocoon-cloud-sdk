"use strict";

const cocoonSDK = require("../../out");
const grantType = require("../../out/lib/enums/e-grant-type").GrantType;
const fs = require("fs");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

// To test locally
// const USERNAME = "USERNAME";
// const PASSWORD = "PASSWORD";
// const CLIENT_ID = "CLIENT_ID";
// const CLIENT_SECRET = "CLIENT_SECRET";

// To test with Travis
const USERNAME = process.env.COCOON_TEST_USERNAME;
const PASSWORD = process.env.COCOON_TEST_PASSWORD;
const CLIENT_ID = process.env.COCOON_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.COCOON_SDK_CLIENT_SECRET;

describe("A spec for the Cocoon SDK", () => {
	let oAuth;
	beforeAll(() => {
		oAuth = new cocoonSDK.OAuth(grantType.Password, CLIENT_ID, CLIENT_SECRET);
	});

	it("should allow a user to log in", (done) => {
		oAuth.tokenExchangePassword(USERNAME, PASSWORD)
		.then((response) => {
			cocoonSDK.CocoonAPI.setupAPIAccess(response.body.access_token, response.body.refresh_token,
				response.body.expires_in);
			done();
		})
		.catch((error) => {
			done.fail(error);
		});
	});

	it("should allow a user to log out", (done) => {
		oAuth.logout()
		.then(() => {
			cocoonSDK.CocoonAPI.closeAPIAccess();
			done();
		})
		.catch((error) => {
			done.fail(error);
		});
	});

	describe("when the user is authenticated", () => {
		let oAuth;
		beforeAll((done) => {
			oAuth = new cocoonSDK.OAuth(grantType.Password, CLIENT_ID, CLIENT_SECRET);
			if (!cocoonSDK.CocoonAPI.checkAPIAccess()) {
				oAuth.tokenExchangePassword(USERNAME, PASSWORD)
				.then((response) => {
					cocoonSDK.CocoonAPI.setupAPIAccess(response.body.access_token, response.body.refresh_token,
						response.body.expires_in);
					done();
				})
				.catch((error) => {
					done.fail(error);
				});
			} else {
				done();
			}
		});

		afterAll((done) => {
			oAuth.logout()
			.then(() => {
				cocoonSDK.CocoonAPI.closeAPIAccess();
				done();
			})
			.catch((error) => {
				done.fail(error);
			});
		});

		it("should be able to fetch the projects list", (done) => {
			cocoonSDK.ProjectAPI.list((projectDataList, error) => {
				if (!error) {
					expect(projectDataList).toBeDefined();
					const projectList = [];
					for (let projectData of projectDataList) {
						projectList.push(new cocoonSDK.Project(projectData));
					}
					for (let project of projectList) {
						expect(project.id).toBeDefined();
						expect(project.name).toBeDefined();
						expect(project.bundleID).toBeDefined();
						expect(project.version).toBeDefined();
						expect(project.origin).toBeDefined();
						expect(project.dateCompiled).toBeDefined();
						expect(project.dateCreated).toBeDefined();
						expect(project.dateUpdated).toBeDefined();
						expect(project.sourceURL).toBeDefined();
						expect(project.configURL).toBeDefined();
						Object.keys(project.compilations).forEach((platform) => {
							expect(project.compilations[platform].platform).toBe(platform);
							expect(project.compilations[platform].status).toBeDefined();
						});
					}
					done();
				} else {
					done.fail(error);
				}
			});
		}, 60000);

		it("should be able to fetch the signing keys list", (done) => {
			cocoonSDK.SigningKeyAPI.list((signingKeyDataObj, error) => {
				if (!error) {
					expect(signingKeyDataObj).toBeDefined();
					const signingKeyList = [];
					Object.keys(signingKeyDataObj).forEach((platform) => {
						for (let signingKeyData of signingKeyDataObj[platform]) {
							signingKeyList.push(new cocoonSDK.SigningKey(signingKeyData, platform));
						}
					});
					for (let signingKey of signingKeyList) {
						expect(signingKey.id).toBeDefined();
						expect(signingKey.name).toBeDefined();
						expect(signingKey.platform).toBeDefined();
					}
					done();
				} else {
					done.fail(error);
				}
			});
		});

		it("should be able to get the user information", (done) => {
			cocoonSDK.UserAPI.get((userData, error) => {
				if (!error) {
					expect(userData).toBeDefined();
					const user = new cocoonSDK.User(userData);
					expect(user.userName).toBeDefined();
					expect(user.name).toBeDefined();
					expect(user.lastName).toBeDefined();
					expect(user.email).toBeDefined();
					expect(user.eula).toBeDefined();
					expect(user.plan).toBeDefined();
					expect(user.platforms).toBeDefined();
					done();
				} else {
					done.fail(error);
				}
			});
		});

		it("should be able to get the project templates", (done) => {
			cocoonSDK.CocoonAPI.getCocoonTemplates((templates, error) => {
				if (!error) {
					expect(templates.length).toBeGreaterThan(0);
					for (let template of templates) {
						expect(template.name).toBeDefined();
						expect(template.description).toBeDefined();
						expect(template.image_url).toBeDefined();
						expect(template.github_url).toBeDefined();
						expect(template.orientation).toBeDefined();
						expect(template.environment).toBeDefined();
					}
					done();
				} else {
					done.fail(error);
				}
			});
		});

		it("should be able to get the cocoon versions", (done) => {
			cocoonSDK.CocoonAPI.getCocoonVersions((versions, error) => {
				if (!error) {
					expect(versions.length).toBeGreaterThan(0);
					for (let version of versions) {
						expect(version.name).toBeDefined();
						expect(version.default).toBeDefined();
						expect(version.platforms).toBeDefined();
					}
					done();
				} else {
					done.fail(error);
				}
			});
		});

		describe("and a project has been fetched", () => {
			let project;
			beforeAll((done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example/source.zip"));
				cocoonSDK.ProjectAPI.createFromZipUpload(zipFile, (projectData, error) => {
					if (!error) {
						project = new cocoonSDK.Project(projectData);
						done();
					} else {
						done.fail(error);
					}
				});
			});

			beforeEach((done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example/source.zip"));
				project.updateZip(zipFile, (error) => {
					if (!error) {
						done();
					} else {
						done.fail(error);
					}
				});
			});

			afterAll((done) => {
				project.delete((error) => {
					if (!error) {
						project = null;
						done();
					} else {
						done.fail(error);
					}
				});
			});

			it("should be able to upload a project", (done) => {
				expect(project.id).toBeDefined();
				expect(project.name).toBe("HelloCordova");
				expect(project.bundleID).toBe("io.cordova.hellocordova");
				expect(project.version).toBe("1.0.0");
				expect(project.origin).toBeDefined();
				expect(project.dateCompiled).toBeDefined();
				expect(project.dateCreated).toBeDefined();
				expect(project.dateUpdated).toBeDefined();
				expect(project.sourceURL).toBeDefined();
				expect(project.configURL).toBeDefined();
				Object.keys(project.compilations).forEach((platform) => {
					expect(project.compilations[platform].platform).toBeDefined();
					expect(project.compilations[platform].status).toBeDefined();
				});
				project.getConfigXML((xmlSugar, error) => {
					if (!error) {
						expect(project.name).toBe(xmlSugar.getName());
						expect(project.bundleID).toBe(xmlSugar.getBundleId());
						expect(project.version).toBe(xmlSugar.getVersion());
						done();
					} else {
						done.fail(error);
					}
				});
			});

			it("should be able to update the zip file", (done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example2/source.zip"));
				project.updateZip(zipFile, (error) => {
					if (!error) {
						expect(project.name).toBe("HelloCocoon");
						expect(project.bundleID).toBe("io.cocoon.hellococoon");
						expect(project.version).toBe("2.0.0");
						project.getConfigXML((xmlSugar, error) => {
							if (!error) {
								expect(project.name).toBe(xmlSugar.getName());
								expect(project.bundleID).toBe(xmlSugar.getBundleId());
								expect(project.version).toBe(xmlSugar.getVersion());
								done();
							} else {
								done.fail(error);
							}
						});
					} else {
						done.fail(error);
					}
				});
			});

			it("should be able to update the config file", (done) => {
				let configXml = fs.readFileSync(__dirname.replace("tests", "assets/example2/config.xml"), "utf8");
				project.updateConfigXml(configXml, (error) => {
					if (!error) {
						expect(project.name).toBe("HelloCocoon");
						expect(project.bundleID).toBe("io.cocoon.hellococoon");
						expect(project.version).toBe("2.0.0");
						project.getConfigXML((xmlSugar, error) => {
							if (!error) {
								expect(project.name).toBe(xmlSugar.getName());
								expect(project.bundleID).toBe(xmlSugar.getBundleId());
								expect(project.version).toBe(xmlSugar.getVersion());
								done();
							} else {
								done.fail(error);
							}
						});
					} else {
						done.fail(error);
					}
				});
			});
		});

		describe("and a signing key has been fetched", () => {
			let signingKey;
			beforeAll((done) => {
				let keystoreFile = fs.createReadStream(__dirname.replace("tests", "assets/example.keystore"));
				cocoonSDK.SigningKeyAPI.createAndroid("Test Name", "Test Alias", keystoreFile,
					"testKeystorePassword", "testCertificatePassword", (signingKeyData, error) => {
						if (!error) {
							signingKey = new cocoonSDK.SigningKey(signingKeyData, "android");
							done();
						} else {
							done.fail(error);
						}
					});
			});

			afterAll((done) => {
				signingKey.delete((error) => {
					if (!error) {
						signingKey = null;
						done();
					} else {
						done.fail(error);
					}
				});
			});

			it("should be able to upload a signing key", () => {
				expect(signingKey.id).toBeDefined();
				expect(signingKey.name).toBe("Test Name");
				expect(signingKey.platform).toBe("android");
			});
		});

		describe("and a project & signing key have been fetched", () => {
			let project;
			let signingKey;
			beforeAll((done) => {
				let zipFile = fs.createReadStream(__dirname.replace("tests", "assets/example/source.zip"));
				cocoonSDK.ProjectAPI.createFromZipUpload(zipFile, (projectData, error) => {
					if (!error) {
						project = new cocoonSDK.Project(projectData);
						let keystoreFile = fs.createReadStream(__dirname.replace("tests", "assets/example.keystore"));
						cocoonSDK.SigningKeyAPI.createAndroid("Test Name", "Test Alias", keystoreFile,
							"testKeystorePassword", "testCertificatePassword", (signingKeyData, error) => {
								if (!error) {
									signingKey = new cocoonSDK.SigningKey(signingKeyData, "android");
									done();
								} else {
									done.fail(error);
								}
							});
					} else {
						done.fail(error);
					}
				});
			});

			afterAll((done) => {
				project.delete((projectError) => {
					if (!projectError) {
						project = null;
						signingKey.delete((signingKeyError) => {
							if (!signingKeyError) {
								signingKey = null;
								done();
							} else {
								done.fail(signingKeyError);
							}
						});
					} else {
						done.fail(projectError);
					}
				});
			});

			it("should be able to assign the key to the project", (done) => {
				project.assignSigningKey(signingKey, (error) => {
					if (!error) {
						expect(project.keys[signingKey.platform]).toBe(signingKey);
						done();
					} else {
						done.fail(error);
					}
				});
			});
		});
	});
});
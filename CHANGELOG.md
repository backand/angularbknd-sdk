<a name="1.8.10"></a>

### 1.8.11 (2016-09-30)

#### Features

* Add automatic sign in to the socialSignin(). This option allow in the social sign-in to force Backand to signup
user if they are not.

### 1.8.10 (2016-09-26)

#### Features

* Change socket URL to a new DNS


### 1.8.9 (2016-08-20)

#### Features

* Fix Facebook inApp login


### 1.8.2 (2015-11-19)

#### Features

* Add support for socket.io to get evenyts in real-time
* **runSocket** Default false. Need to set to true to enable socket.io communications
* **socketLogin** Need to be called to in order to establish connection to socket.io server - managed by the SDK internally
* **on** listen on an action in order to het the data from the server side

### 1.8.1 (2015-11-11)

#### Features

* **callSignupOnSingInSocialError** The default is true. This allow to make only one call with social signin. In case the user is not sign up the SDK catch the error and call the sign up internally.
* Fix issue with Facebook social login on Mobile devices

### 1.8.0 (2015-09-17)


#### Features

* **manageHttpInterceptor:** in config stage, tells Backand to manage all necessary authorization and authentication tokens for each request made to Backand
* **isManagingHttpInterceptor:** returns whether Backand manages all necessary authorization and authentication tokens for each request made to Backand
* **manageRefreshToken:** in config stage, tells Backand to manage re-authenticating using a refresh token when the session has expired
* **isManagingRefreshToken:** returns whether Backand manages re-authenticating using a refresh token when the session has expired
* **runSigninAfterSignup:** tells Backand to perform signing in after a user signs up
* **EVENTS:** broadcasting EVENTS.SIGNIN, EVENTS.SIGNOUT, EVENTS.SIGNUP
* **signup:** added parameter for additional data to be sent to Backand
* **socialSignin:** added parameter for configuring sign in pop-up window spec
* **socialSignup:**
  * added parameter for configuring sign in pop-up window spec
  * added parameter for additional data to be sent to Backand


#### Breaking Changes

* **getTokenName:** deprecated
* **setTokenName:** deprecated
* **manageDefaultHeaders:** deprecated, manageHttpInterceptor replaces the functionality
* **isManagingDefaultHeaders:** deprecated, isManagingHttpInterceptor replaces the functionality
* **signin:** removed parameter 'appName'. To set the application name, use setAppName()
* **signup:** removed parameter 'appName'. To set the application name, use setAppName()
* **requestResetPassword:** removed parameter 'appName'. To set the application name, use setAppName()




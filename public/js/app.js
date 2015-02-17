(function() {
  'use strict';
  // app.js
  angular.module('unboxApp', ['auth0', 'angular-storage', 'angular-jwt'])
  .config(function(authProvider, $httpProvider, jwtInterceptorProvider) {
    // We're annotating this function so that the `store` is injected correctly when this file is minified
    jwtInterceptorProvider.tokenGetter = ['store', function(store) {
      // Return the saved token
      return store.get('token');
    }];
    $httpProvider.interceptors.push('jwtInterceptor');
  })
  .config(function (authProvider) {
    authProvider.init(AUTH0_CONFIG);
  })
  .run(function(auth) {
    // This hooks all auth events to check everything as soon as the app starts
    auth.hookEvents();
  })
  .controller('unboxAppLoginController', function(auth, store, $location, $scope) {
    $scope.login = function() {
      auth.signin({}, function(profile, token) {
        // Success callback
        store.set('profile', profile);
        store.set('token', token);
        $location.path('/');

      }, function() {
        // Error callback
        console.log('Error from auth.signin')
      });
    };
    $scope.logout = function() {
      auth.signout();
      store.remove('profile');
      store.remove('token');
    };
    $scope.auth = auth;
  })
  .controller('unboxAppUserController', function($http, $scope, auth) {
    $scope.auth = auth;
    $scope.products = {products: []};
    function syncProducts() {
      $http.get('/api/products')
          .success(function (data, status, headers, config) {
            console.log(data);
            $scope.products.products = data.products;
          })
          .error(function (data, status, headers, config) {
            console.log('Error loading products ' + status);
          });
    }
    syncProducts();

    $scope.addingProduct = false;
    $scope.selectedModel = null;
    $scope.models = null;
    $scope.addProduct = function() {
      $scope.addingProduct = true;
      $http.get('/api/models')
        .success(function(data, status, headers, config) {
          $scope.models = data.models;
        })
        .error(function(data, status, headers, config) {
          var msg = 'Error loading models' + status;
          console.log(msg);
        });
    };
    $scope.selectProductToAdd = function(model) {
      $scope.selectedModel = model;
    };
    $scope.serialNumberToAdd = '';
    $scope.addProductBySerialNumber = function(model) {
      console.log(model, $scope.serialNumberToAdd);
      var product = {
        sn: $scope.serialNumberToAdd,
        vendor: model.vendor,
        model: model.name,
        type: 'vendor'
      };
      console.log(JSON.stringify(product));
      var req = {
        method: 'POST',
        url: '/api/products',
        headers: {
          'Content-Type': 'application/json'
        },
        data: product
      };
      $http(req)
        .success(function(data, status, headers, config) {
          $scope.addingProduct = false;
          syncProducts();
          console.log(data);
        })
        .error(function(data, status, headers, config) {
          var msg = 'Error creating product (HTTP ' + status + ') ' + data;
          $scope.error = msg;
          console.log(msg)
        });
    };
  })
  .run(function($rootScope, auth, store, jwtHelper, $location) {
    // This events gets triggered on refresh or URL change
    $rootScope.$on('$locationChangeStart', function() {
      if (!auth.isAuthenticated) {
        var token = store.get('token');
        if (token) {
          if (!jwtHelper.isTokenExpired(token)) {
            auth.authenticate(store.get('profile'), token);
          } else {
            // Either show Login page or use the refresh token to get a new idToken
            $location.path('/');
          }
        }
      }
    });
  });
})();

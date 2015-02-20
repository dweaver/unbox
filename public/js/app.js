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
  .controller('unboxAppUserController', function($http, $scope, $q, auth) {
    $scope.auth = auth;
    $scope.errorMessage = '';
    $scope.models = null;
    $scope.products = null;

    function syncProducts() {
      $q.all([
          $http.get('/api/models'),
          $http.get('/api/products')
      ]).then(function(responses) {
        var modelsResponse = responses[0];
        var productsResponse = responses[1];

        if (modelsResponse.status !== 200 || productsResponse.status !== 200) {
          $scope.errorMessage = "Error getting models and products.";
          console.log('Error. models status: ' + modelsResponse.status +
          ' products status: ' + productsResponse.status);
          console.log(responses);
        } else {
          $scope.models = {models: modelsResponse.data.models};

          // set model on each product
          _.each(productsResponse.data.products, function(prod) {
            prod.modelObj = _.find($scope.models.models, function(model) {
              return model.name === prod.model;
            })
          });

          $scope.products = {products: productsResponse.data.products};
        }
      });
    }
    syncProducts();

    $scope.addingProduct = false;
    $scope.selectedModel = null;
    $scope.addProduct = function() {
      $scope.addingProduct = true;
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
          $('#addProductModal').modal('hide');
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

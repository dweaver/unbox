(function() {
  'use strict';
  // app.js
  angular.module('unboxApp', ['auth0', 'angular-storage', 'angular-jwt', 'ui.bootstrap'])
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
  .factory('UnboxService', function($q, $http) {
    return {
      /**
       * Get models for this subdomain and this user's products.
       * @returns {promise}
       */
      syncProductsAndModels: function() {
        var deferred = $q.defer();

        // load models and products in parallel
        $q.all([
          $http.get('/api/models'),
          $http.get('/api/products?latest=true')
        ]).then(function (responses) {
          var models = responses[0].data.models;
          var products = responses[1].data.products

          // set model on each product for convenience
          _.each(products, function (product) {
            product.modelObj = _.find(models, function (model) {
              return model.name === product.model;
            })
          });
          console.log('products--', products);
          deferred.resolve({products: products, models: models});
        }, function errorCallback(err) {
          console.log(err);
          var msg = 'Error loading models and products. ' + err.status + ' ' + err.data;
          deferred.reject(msg)
        });

        return deferred.promise;
      },
      addProduct: function(product) {
        var deferred = $q.defer();
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
            deferred.resolve();
          })
          .error(function(data, status, headers, config) {
            deferred.reject({status: status, message: data});
          });
        return deferred.promise;
      }
    }
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
  .controller('unboxAppUserController', function(UnboxService, $scope, $q, auth, $modal, $log) {
    $scope.auth = auth;
    $scope.errorMessage = '';
    $scope.models = null;
    $scope.products = null;

    $scope.syncProducts = function() {
      UnboxService.syncProductsAndModels()
          .then(function(data) {
            $scope.models = {models: data.models};
            $scope.products = {products: data.products};
          },
          function(err) {
            $scope.errorMessage = err;
          });
    };
    $scope.syncProducts();
    $scope.showData = function(device) {
      $('#dataModal').modal('show');
    };

    // things for handling registering a new device
    $scope.addProduct = function() {
      var modalInstance = $modal.open({
        templateUrl: 'addProductModal.html',
        controller: 'AddProductModalInstanceCtrl',
        //size: size,
        resolve: {
          models: function() { return $scope.models; },
          products: function() { return $scope.products; }
        }
      });

      modalInstance.result.then(function (result) {
        var product = {
          sn: result.serialNumberToAdd,
          vendor: result.selectedModel.vendor,
          model: result.selectedModel.name,
          type: 'vendor'
        };
        UnboxService.addProduct(product)
            .then(function() {
              $scope.syncProducts();
            },
            function(err) {
              var msg = 'Error creating product (HTTP ' + err.status + ') ' + err.message;
              $scope.error = msg;
              console.log(msg)
            });
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };
  })
  .controller('DemoModalCtrl', function ($scope, $modal, $log) {
    $scope.items = ['item1', 'item2', 'item3'];

    $scope.open = function (size) {

      var modalInstance = $modal.open({
        templateUrl: 'demoModalContent.html',
        controller: 'DemoModalInstanceCtrl',
        size: size,
        resolve: {
          items: function () {
            return $scope.items;
          }
        }
      });

      modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };
  })
  .controller('DemoModalInstanceCtrl', function ($scope, $modalInstance, items) {
    $scope.items = items;
    $scope.selected = {
      item: $scope.items[0]
    };

    $scope.ok = function () {
      $modalInstance.close($scope.selected.item);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  })
  .controller('AddProductModalInstanceCtrl', function ($scope, $modalInstance, models, products) {
    $scope.models = models;
    $scope.products = products;

    $scope.selectedModel = null;
    $scope.serialNumberToAdd = '';

    $scope.selectModel = function(model) {
      console.log(model);
      $scope.selectedModel = model;
    };

    $scope.ok = function () {
      $modalInstance.close({
        selectedModel: $scope.selectedModel,
        serialNumberToAdd: $scope.serialNumberToAdd
      });
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
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
